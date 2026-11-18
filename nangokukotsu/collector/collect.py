#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PINA 車両運用ログ収集
- data/selected-routes.json の路線を取得
- 鹿児島交通・南国交通のみ対象
- 同じ路線の継続反応は記録しない
- 路線変更は連続2回確認後に、最初に検出した時刻で記録
- 30分以上反応が途切れた後は、同じ路線でも再記録
- 日付が変わった後の初回検出も記録
"""

import csv
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parents[1]
ROUTES_FILE = ROOT / "data" / "selected-routes.json"
VEHICLES_FILE = ROOT / "data" / "vehicles.json"
STATE_FILE = ROOT / "collector" / "state.json"
LOG_DIR = ROOT / "logs"

API_URL = "https://sena.unitrand.net/app/sena/api_v1.5/pina_base_api.php"
UUID = "BBA12210-3A11-4F25-A49F-06CF81FFE7CB"
POLL_INTERVAL_MINUTES = 15
OFFLINE_THRESHOLD_SECONDS = 30 * 60
ROUTE_CONFIRM_COUNT = 2
MAX_WORKERS = 8
TIMEOUT_SECONDS = 30
MAX_RETRIES = 3

JST = timezone(timedelta(hours=9))
COMPANY_LABELS = {
    "jp_kagoshima_kagoshimakotsu": "鹿児島交通",
    "jp_kagoshima_nangokukotsu": "南国交通",
}
TARGET_COMPANIES = set(COMPANY_LABELS)


def load_json(path, fallback):
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def utc_now():
    return datetime.now(timezone.utc)


def iso_utc(value):
    return value.astimezone(timezone.utc).isoformat(timespec="seconds")


def parse_iso(value):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (ValueError, TypeError):
        return None


def request_route(route):
    route_id = str(route.get("routeId") or "").strip()
    company_id = str(route.get("companyId") or "jp_kagoshima_kagoshimakotsu").strip()
    if not route_id or company_id not in TARGET_COMPANIES:
        return []

    form = {
        "app_code": "PINA",
        "ids": route_id,
        "operation": "location",
        "country": "ja-JP",
        "ver": "3.0.7",
        "count": "1",
        "uuid": UUID,
        "company_ids": company_id,
    }
    body = urlencode(form).encode("utf-8")
    request = Request(
        API_URL,
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (compatible; KagoshimaBusOperationLogger/1.0)",
            "Accept": "*/*",
        },
        method="POST",
    )

    for attempt in range(MAX_RETRIES):
        try:
            with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
                payload = json.loads(response.read().decode("utf-8"))
            if not isinstance(payload, list):
                raise ValueError("PINA API response is not an array")

            found = []
            for result in payload:
                items = result.get("list") or []
                if not isinstance(items, list):
                    continue
                actual_route_id = str(result.get("id") or route_id)
                route_name = (
                    route.get("routeName")
                    or result.get("name")
                    or result.get("disp_name")
                    or "名称不明"
                )
                for item in items:
                    pts = str(item.get("pts") or "").split(",")
                    if len(pts) < 3:
                        continue
                    try:
                        lat = float(pts[1])
                        lon = float(pts[2])
                    except (ValueError, TypeError):
                        continue
                    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                        continue
                    vehicle_id = str(item.get("id") or "").strip()
                    if not vehicle_id:
                        continue
                    found.append({
                        "companyId": company_id,
                        "busId": vehicle_id,
                        "routeId": actual_route_id,
                        "routeName": str(route_name).strip(),
                        "apiTimestamp": pts[0],
                        "number": str(item.get("number") or ""),
                    })
            return found
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == MAX_RETRIES - 1:
                raise
            time.sleep(2 ** attempt)
        except (URLError, TimeoutError, json.JSONDecodeError, ValueError):
            if attempt == MAX_RETRIES - 1:
                raise
            time.sleep(2 ** attempt)

    return []


def fetch_all_buses(routes):
    results = []
    errors = []
    valid_routes = [
        r for r in routes
        if str(r.get("routeId") or "").strip()
        and str(r.get("companyId") or "jp_kagoshima_kagoshimakotsu") in TARGET_COMPANIES
    ]
    print(f"対象路線: {len(valid_routes)}")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(request_route, route): route for route in valid_routes}
        for future in as_completed(futures):
            route = futures[future]
            try:
                results.extend(future.result())
            except Exception as exc:
                errors.append((route.get("routeId"), str(exc)))
                print(f"[WARN] 路線取得失敗 {route.get('routeId')}: {exc}")

    # 同一車両が複数路線の応答に含まれた場合は、同一ポーリング内で1件にまとめる。
    # API応答時刻が数値の場合は新しい時刻を優先し、判定不能なら最後に取得した候補を使う。
    unique = {}
    for bus in results:
        key = f"{bus['companyId']}:{bus['busId']}"
        old = unique.get(key)
        if old is None:
            unique[key] = bus
        else:
            try:
                new_ts = float(bus.get("apiTimestamp") or 0)
                old_ts = float(old.get("apiTimestamp") or 0)
            except (ValueError, TypeError):
                new_ts, old_ts = 0, 0
            if new_ts >= old_ts:
                unique[key] = bus

    print(f"検出車両: {len(unique)} / 取得エラー路線: {len(errors)}")
    return list(unique.values())


def append_event(bus, event_time, vehicles):
    local_time = event_time.astimezone(JST)
    date_text = local_time.strftime("%Y-%m-%d")
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = LOG_DIR / f"{date_text}.csv"

    info = vehicles.get(str(bus["busId"]), {})
    if not isinstance(info, dict):
        info = {}
    plate = str(info.get("plateNo") or "").strip()
    if not plate:
        plate = str(bus.get("number") or "").strip()

    new_file = not csv_path.exists() or csv_path.stat().st_size == 0
    with csv_path.open("a", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        if new_file:
            writer.writerow([
                "datetime", "company", "busId", "plateNo", "routeId", "routeName"
            ])
        writer.writerow([
            local_time.strftime("%Y-%m-%d %H:%M:%S"),
            COMPANY_LABELS.get(bus["companyId"], bus["companyId"]),
            bus["busId"],
            plate,
            bus["routeId"],
            bus["routeName"],
        ])

    print(
        f"[LOG] {local_time:%H:%M:%S} "
        f"{COMPANY_LABELS.get(bus['companyId'], bus['companyId'])} "
        f"{plate or bus['busId']} {bus['routeName']}"
    )


def process_bus(bus, states, vehicles, now):
    key = f"{bus['companyId']}:{bus['busId']}"
    state = states.setdefault(key, {})
    route_id = bus["routeId"]
    now_iso = iso_utc(now)
    now_date_jst = now.astimezone(JST).date().isoformat()

    last_seen = parse_iso(state.get("last_seen_at"))
    last_record_date = state.get("last_record_date")
    last_route_id = state.get("last_route_id")

    # 初めて検出した車両、または日付が変わった後の初回検出
    if not last_route_id or last_record_date != now_date_jst:
        append_event(bus, now, vehicles)
        state.update({
            "last_route_id": route_id,
            "last_route_name": bus["routeName"],
            "last_seen_at": now_iso,
            "last_record_date": now_date_jst,
            "candidate_route_id": None,
            "candidate_count": 0,
            "candidate_first_seen_at": None,
        })
        return

    # 30分以上反応が途切れていた場合は、同一路線でも再記録する。
    if last_seen is None or (now - last_seen).total_seconds() >= OFFLINE_THRESHOLD_SECONDS:
        append_event(bus, now, vehicles)
        state.update({
            "last_route_id": route_id,
            "last_route_name": bus["routeName"],
            "last_seen_at": now_iso,
            "last_record_date": now_date_jst,
            "candidate_route_id": None,
            "candidate_count": 0,
            "candidate_first_seen_at": None,
        })
        return

    # 同じ路線の継続反応。時刻だけ更新し、CSVには追加しない。
    if route_id == last_route_id:
        state.update({
            "last_seen_at": now_iso,
            "candidate_route_id": None,
            "candidate_count": 0,
            "candidate_first_seen_at": None,
        })
        return

    # 路線変更候補。連続2回確認できたら、最初に検出した時刻で記録する。
    if state.get("candidate_route_id") == route_id:
        count = int(state.get("candidate_count") or 0) + 1
        first_seen = parse_iso(state.get("candidate_first_seen_at")) or now
        state.update({
            "candidate_count": count,
            "last_seen_at": now_iso,
        })
        if count >= ROUTE_CONFIRM_COUNT:
            append_event(bus, first_seen, vehicles)
            state.update({
                "last_route_id": route_id,
                "last_route_name": bus["routeName"],
                "last_record_date": first_seen.astimezone(JST).date().isoformat(),
                "candidate_route_id": None,
                "candidate_count": 0,
                "candidate_first_seen_at": None,
            })
    else:
        state.update({
            "candidate_route_id": route_id,
            "candidate_route_name": bus["routeName"],
            "candidate_count": 1,
            "candidate_first_seen_at": now_iso,
            "last_seen_at": now_iso,
        })


def main():
    if not ROUTES_FILE.exists():
        print(f"[ERROR] 路線ファイルがありません: {ROUTES_FILE}")
        sys.exit(1)

    routes = load_json(ROUTES_FILE, [])
    vehicles = load_json(VEHICLES_FILE, {})
    state_data = load_json(STATE_FILE, {"vehicles": {}})

    if not isinstance(routes, list):
        raise ValueError("data/selected-routes.json は配列形式である必要があります")
    if not isinstance(vehicles, dict):
        vehicles = {}
    if not isinstance(state_data, dict):
        state_data = {"vehicles": {}}

    states = state_data.setdefault("vehicles", {})
    now = utc_now()
    buses = fetch_all_buses(routes)

    for bus in buses:
        process_bus(bus, states, vehicles, now)

    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_file = STATE_FILE.with_suffix(".tmp")
    temp_file.write_text(
        json.dumps(state_data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temp_file.replace(STATE_FILE)

    print(f"完了: {len(buses)}台を確認 / {now.astimezone(JST):%Y-%m-%d %H:%M:%S} JST")


if __name__ == "__main__":
    main()
