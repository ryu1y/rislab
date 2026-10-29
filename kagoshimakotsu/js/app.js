"use strict";

const API_URL = "https://sena.unitrand.net/app/sena/api_v1.5/pina_base_api.php";
const COMPANY_ID = "jp_kagoshima_kagoshimakotsu";
const UUID = "BBA12210-3A11-4F25-A49F-06CF81FFE7CB";
const POLL_MS = 60000;
const HISTORY_KEY = "kagoshimakotsu-position-history-v1";
const HISTORY_MAX_POINTS = 240;

const map = L.map("map").setView([31.5968, 130.5571], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const markers = new Map();
let allBuses = [];
let vehicles = {};
let routeGeometry = {};
let isLoading = false;
let selectedVehicleId = null;
let pastLine = null;
let futureLine = null;

const $ = id => document.getElementById(id);
const searchInput = $("searchInput");
const connectionStatus = $("connectionStatus");
const busCount = $("busCount");
const routeCount = $("routeCount");
const lastUpdated = $("lastUpdated");
const message = $("message");
const refreshButton = $("refreshButton");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
function showMessage(text) {
  message.textContent = text;
  message.classList.add("visible");
}
function hideMessage() {
  message.textContent = "";
  message.classList.remove("visible");
}
async function loadJson(path, fallback) {
  try {
    const response = await fetch(`${path}?_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`${path} の読み込みに失敗:`, error);
    return fallback;
  }
}
function getVehicleInfo(id) {
  return vehicles[String(id)] || {};
}
function plateLabel(bus) {
  const info = getVehicleInfo(bus.id);
  return String(info.plateNo || "").trim() || "未登録";
}
function makeIcon(bus) {
  const label = escapeHtml(plateLabel(bus));
  return L.divIcon({
    className: "bus-marker-wrap",
    html: `<div class="bus-marker"><div class="bus-icon">🚌</div><div class="bus-number">${label}</div></div>`,
    iconSize: [90, 52],
    iconAnchor: [45, 29],
    popupAnchor: [0, -28]
  });
}
function makePopup(bus) {
  const info = getVehicleInfo(bus.id);
  const plate = escapeHtml(info.plateNo || "未登録");
  const model = escapeHtml(info.model || "未登録");
  const office = escapeHtml(info.office || "未登録");
  return `<div class="popup-info">
    <div class="popup-title">ナンバー：${plate}</div>
    <div><strong>路線：</strong>${escapeHtml(bus.routeName || "路線情報なし")}</div>
    <div><strong>型式：</strong>${model}</div>
    <div><strong>所属：</strong>${office}</div>
    <div><strong>ID：</strong>${escapeHtml(bus.id || "不明")}</div>
    <div><strong>位置時刻：</strong>${escapeHtml(bus.timestamp || "不明")}</div>
    <div><strong>遅延：</strong>${bus.lag == null ? "不明" : escapeHtml(bus.lag) + "分"}</div>
    <div style="margin-top:7px"><button type="button" onclick="window.showVehicleRoute('${encodeURIComponent(bus.id)}')">走行ルートを表示</button></div>
  </div>`;
}
function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}"); }
  catch { return {}; }
}
function recordHistory(buses) {
  const history = readHistory();
  const now = Date.now();
  for (const bus of buses) {
    if (!bus.id || !Number.isFinite(bus.latitude) || !Number.isFinite(bus.longitude)) continue;
    if (!Array.isArray(history[bus.id])) history[bus.id] = [];
    const points = history[bus.id];
    const last = points[points.length - 1];
    if (last && now - last.t < 15000) continue;
    points.push({ t: now, lat: bus.latitude, lon: bus.longitude, routeId: bus.routeId });
    if (points.length > HISTORY_MAX_POINTS) points.splice(0, points.length - HISTORY_MAX_POINTS);
  }
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }
  catch (error) { console.warn("走行履歴を保存できません:", error); }
}
function clearRouteLines() {
  if (pastLine) map.removeLayer(pastLine);
  if (futureLine) map.removeLayer(futureLine);
  pastLine = null;
  futureLine = null;
}
window.showVehicleRoute = function(encodedId) {
  const id = decodeURIComponent(encodedId);
  selectedVehicleId = id;
  clearRouteLines();
  const history = readHistory();
  const points = (history[id] || []).map(p => [p.lat, p.lon]);
  if (points.length >= 2) {
    pastLine = L.polyline(points, { color: "#b9d8f5", weight: 6, opacity: 0.95 }).addTo(map);
  }
  const bus = allBuses.find(b => b.id === id);
  const geometry = bus ? routeGeometry[bus.routeId] : null;
  if (Array.isArray(geometry) && geometry.length >= 2) {
    futureLine = L.polyline(geometry, { color: "#1677ff", weight: 5, opacity: 0.95 }).addTo(map);
  }
  if (bus) map.panTo([bus.latitude, bus.longitude]);
  if (points.length < 2 && !futureLine) {
    showMessage("現在この機能は準備中です");
  } else {
    hideMessage();
  }
};
function matchesSearch(bus, keyword) {
  if (!keyword) return true;
  const info = getVehicleInfo(bus.id);
  return [
    plateLabel(bus), info.model, info.office, info.fleetNo,
    bus.id, bus.routeName, bus.routeId, bus.type
  ].join(" ").toLowerCase().includes(keyword);
}
function applySearch() {
  const keyword = searchInput.value.trim().toLowerCase();
  let visible = 0;
  const matched = [];
  for (const bus of allBuses) {
    const marker = markers.get(bus.id);
    if (!marker) continue;
    if (matchesSearch(bus, keyword)) {
      if (!map.hasLayer(marker)) marker.addTo(map);
      visible++;
      if (keyword) matched.push(marker);
    } else if (map.hasLayer(marker)) {
      map.removeLayer(marker);
    }
  }
  busCount.textContent = String(visible);
  if (keyword && matched.length === 0) showMessage("該当する車両がありません。");
  else hideMessage();
  if (keyword && matched.length === 1) {
    map.setView(matched[0].getLatLng(), 16);
    matched[0].openPopup();
  } else if (keyword && matched.length > 1) {
    map.fitBounds(L.latLngBounds(matched.map(m => m.getLatLng())), { padding: [30, 30], maxZoom: 15 });
  }
}
async function fetchRouteBuses(routes) {
  const output = [];
  let checked = 0;
  let errors = 0;
  for (let i = 0; i < routes.length; i += 8) {
    const batch = routes.slice(i, i + 8);
    const settled = await Promise.allSettled(batch.map(async route => {
      const routeId = String(route.routeId || "").trim();
      if (!routeId) return [];
      const params = new URLSearchParams({
        app_code: "PINA", ids: routeId, operation: "location",
        country: "ja-JP", ver: "3.0.7", count: "1",
        uuid: UUID, company_ids: COMPANY_ID
      });
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("API応答が配列ではありません");
      return data.flatMap(routeResult => {
        if (!Array.isArray(routeResult.list)) return [];
        const routeName = route.routeName || routeResult.name || routeResult.disp_name || "名称不明";
        return routeResult.list.flatMap(item => {
          const pts = String(item.pts || "").split(",");
          const lat = Number(pts[1]), lon = Number(pts[2]);
          if (pts.length < 3 || !Number.isFinite(lat) || !Number.isFinite(lon) ||
              lat < -90 || lat > 90 || lon < -180 || lon > 180) return [];
          return [{
            id: String(item.id || ""), routeId: String(routeResult.id || routeId),
            routeName, timestamp: pts[0], latitude: lat, longitude: lon,
            lag: item.lag ?? null, type: item.type || "", number: item.number || ""
          }];
        });
      });
    }));
    checked += batch.filter(r => String(r.routeId || "").trim()).length;
    for (const item of settled) {
      if (item.status === "fulfilled") output.push(...item.value);
      else { errors++; console.warn("路線取得失敗:", item.reason); }
    }
  }
  return { buses: output, checkedRoutes: checked, totalRoutes: routes.filter(r => String(r.routeId || "").trim()).length, errorCount: errors };
}
async function loadBusData() {
  if (isLoading) return;
  isLoading = true;
  refreshButton.disabled = true;
  connectionStatus.textContent = "取得中...";
  try {
    const [routes, vehicleData, geometry] = await Promise.all([
      loadJson("data/selected-routes.json", []),
      loadJson("data/vehicles.json", {}),
      loadJson("data/routes-geometry.json", {})
    ]);
    vehicles = vehicleData && typeof vehicleData === "object" && !Array.isArray(vehicleData) ? vehicleData : {};
    routeGeometry = geometry && typeof geometry === "object" ? geometry : {};
    if (!Array.isArray(routes) || routes.length === 0) {
      throw new Error("data/selected-routes.json に路線が登録されていません");
    }
    const data = await fetchRouteBuses(routes);
    allBuses = data.buses;
    recordHistory(allBuses);
    const current = new Set();
    for (const bus of allBuses) {
      if (!bus.id) continue;
      current.add(bus.id);
      let marker = markers.get(bus.id);
      if (!marker) {
        marker = L.marker([bus.latitude, bus.longitude], { icon: makeIcon(bus) }).addTo(map);
        markers.set(bus.id, marker);
        marker.on("popupopen", () => { selectedVehicleId = bus.id; });
      } else {
        marker.setLatLng([bus.latitude, bus.longitude]);
        marker.setIcon(makeIcon(bus));
        if (!map.hasLayer(marker)) marker.addTo(map);
      }
      marker.bindPopup(makePopup(bus));
    }
    for (const [id, marker] of markers) {
      if (!current.has(id)) {
        map.removeLayer(marker);
        markers.delete(id);
      }
    }
    applySearch();
    routeCount.textContent = `${data.checkedRoutes}/${data.totalRoutes}`;
    busCount.textContent = String(allBuses.length);
    lastUpdated.textContent = new Date().toLocaleTimeString("ja-JP");
    connectionStatus.textContent = `接続中${data.errorCount ? `（エラー ${data.errorCount}）` : ""}`;
    if (!allBuses.length) showMessage("車両位置がありません。路線IDやAPI応答を確認してください。");
    else if (data.errorCount) showMessage(`${data.errorCount}路線で取得エラーがありました。`);
    console.log("更新結果", data);
    if (selectedVehicleId) window.showVehicleRoute(encodeURIComponent(selectedVehicleId));
  } catch (error) {
    console.error(error);
    connectionStatus.textContent = "接続エラー";
    showMessage(`取得できませんでした：${error.message}`);
  } finally {
    isLoading = false;
    refreshButton.disabled = false;
  }
}
$("searchButton").addEventListener("click", applySearch);
searchInput.addEventListener("keydown", event => { if (event.key === "Enter") applySearch(); });
$("clearButton").addEventListener("click", () => { searchInput.value = ""; applySearch(); });
refreshButton.addEventListener("click", loadBusData);
loadBusData();
setInterval(loadBusData, POLL_MS);
