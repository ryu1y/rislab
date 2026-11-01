
"use strict";

const API_URL = "https://sena.unitrand.net/app/sena/api_v1.5/pina_base_api.php";

const DEFAULT_COMPANY_ID = "jp_kagoshima_kagoshimakotsu";

const COMPANY_LABELS = {
  "jp_kagoshima_kagoshimakotsu": "鹿児島交通",
  "jp_kagoshima_nangokukotsu": "南国交通",
  "jp_kagoshima_kagoshimacity_bus": "鹿児島市営バス",
  "jp_kagoshima_jrkyushubus": "JR九州バス"
};

// 会社別デフォルト画像
const DEFAULT_BUS_ICONS = {
  "jp_kagoshima_kagoshimakotsu":
    "img/bus/kagoshima_default.png",

  "jp_kagoshima_nangokukotsu":
    "img/bus/nangoku_default.png",

  "jp_kagoshima_kagoshimacity_bus":
    "img/bus/city_default.png",

  "jp_kagoshima_jrkyushubus":
    "img/bus/jr_default.png"
};

// 共通予備画像
const COMMON_BUS_ICON = "img/bus/bus.png";

const UUID = "BBA12210-3A11-4F25-A49F-06CF81FFE7CB";
const POLL_MS = 60000;

const map = L.map("map").setView([31.5968, 130.5571], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const markers = new Map();

let allBuses = [];
let vehicles = {};
let isLoading = false;

const $ = id => document.getElementById(id);

const searchInput = $("searchInput");
const connectionStatus = $("connectionStatus");
const busCount = $("busCount");
const routeCount = $("routeCount");
const lastUpdated = $("lastUpdated");
const message = $("message");
const refreshButton = $("refreshButton");

const companyCheckboxes = [
  ...document.querySelectorAll(".company-checkbox")
];

function selectedCompanyIds() {
  return new Set(
    companyCheckboxes
      .filter(el => el.checked)
      .map(el => el.value)
  );
}

// HTMLエスケープ
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

// メッセージ表示
function showMessage(text) {
  message.textContent = text;
  message.classList.add("visible");
}

function hideMessage() {
  message.textContent = "";
  message.classList.remove("visible");
}

// JSON読み込み
async function loadJson(path, fallback) {
  try {
    const response = await fetch(
      `${path}?_=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.warn(`${path} の読み込みに失敗:`, error);
    return fallback;
  }
}

// 車両情報取得
function getVehicleInfo(id) {
  return vehicles[String(id)] || {};
}

// 会社名取得
function getCompanyName(bus) {
  const info = getVehicleInfo(bus.id);

  return (
    info.company ||
    COMPANY_LABELS[bus.companyId] ||
    bus.companyId ||
    "不明"
  );
}

// ナンバー取得
function plateLabel(bus) {

  // 鹿児島市営バスはPINAのnumberを使用
  if (bus.companyId === "jp_kagoshima_kagoshimacity_bus") {

    const match = String(bus.number || "").match(/\d{4}/);

    return match ? match[0] : "未登録";
  }

  // ほかの3社はvehicles.jsonを使用
  const info = getVehicleInfo(bus.id);

  return String(info.plateNo || "").trim() || "未登録";
}

// 会社別デフォルト画像取得
function getDefaultBusIcon(bus) {
  return (
    DEFAULT_BUS_ICONS[bus.companyId] ||
    COMMON_BUS_ICON
  );
}

// 車両画像取得
function vehicleImage(bus) {
  const info = getVehicleInfo(bus.id);

  // 個別登録画像があれば優先
  const registeredIcon = String(info.icon || "").trim();

  if (registeredIcon) {
    return registeredIcon;
  }

  // 未登録なら会社別画像
  return getDefaultBusIcon(bus);
}

// 画像読み込み失敗時の処理
function handleBusImageError(img) {

  // 会社別画像または個別画像が失敗した場合
  // まず会社別デフォルト画像に切り替える
  if (
    img.dataset.fallback &&
    img.dataset.fallbackUsed !== "1"
  ) {
    img.dataset.fallbackUsed = "1";
    img.src = img.dataset.fallback;
    return;
  }

  // 会社別画像も失敗した場合は絵文字にする
  img.onerror = null;
  img.style.display = "none";

  const fallback = img.nextElementSibling;

  if (fallback) {
    fallback.style.display = "block";
  }
}

// 車両マーカー作成
function makeIcon(bus) {

  const label = escapeHtml(plateLabel(bus));

  const info = getVehicleInfo(bus.id);

  const registeredIcon = String(info.icon || "").trim();

  const defaultIcon = getDefaultBusIcon(bus);

  const image = vehicleImage(bus);

  const fallbackImage = registeredIcon
    ? defaultIcon
    : COMMON_BUS_ICON;

  const iconHtml = `
    <img
      src="${escapeHtml(image)}"
      data-fallback="${escapeHtml(fallbackImage)}"
      data-fallback-used="0"
      onerror="handleBusImageError(this)"
      alt="バス"
    >
    <span class="bus-fallback" style="display:none;">🚌</span>
  `;

  return L.divIcon({
    className: "bus-marker-wrap",

    html: `
      <div class="bus-marker">
        <div class="bus-icon">
          ${iconHtml}
        </div>
        <div class="bus-number">${label}</div>
      </div>
    `,

    iconSize: [50, 30],
    iconAnchor: [45, 29],
    popupAnchor: [0, -28]
  });
}

// マーカー識別キー
function getMarkerKey(bus) {
  return `${bus.companyId}:${bus.id}`;
}

// ポップアップ作成
function makePopup(bus) {

  const info = getVehicleInfo(bus.id);

  const plate = escapeHtml(plateLabel(bus));
  const company = escapeHtml(getCompanyName(bus));
  const model = escapeHtml(info.model || "未登録");
  const office = escapeHtml(info.office || "未登録");

  return `
    <div class="popup-info">

      <div class="popup-title">
        ナンバー：${plate}
      </div>

      <div>
        <strong>会社：</strong>${company}
      </div>

      <div>
        <strong>路線：</strong>
        ${escapeHtml(bus.routeName || "路線情報なし")}
      </div>

      <div>
        <strong>型式：</strong>${model}
      </div>

      <div>
        <strong>所属：</strong>${office}
      </div>

      <div>
        <strong>ID：</strong>${escapeHtml(bus.id || "不明")}
      </div>

      <div>
        <strong>位置時刻：</strong>
        ${escapeHtml(bus.timestamp || "不明")}
      </div>

      <div>
        <strong>遅延：</strong>
        ${bus.lag == null ? "不明" : escapeHtml(bus.lag) + "分"}
      </div>

    </div>
  `;
}

// 検索用情報
function matchesSearch(bus, keyword) {

  if (!keyword) return true;

  const info = getVehicleInfo(bus.id);

  return [
    plateLabel(bus),
    getCompanyName(bus),
    info.model,
    info.office,
    info.fleetNo,
    bus.id,
    bus.routeName,
    bus.routeId,
    bus.type
  ]
    .join(" ")
    .toLowerCase()
    .includes(keyword);
}

// 検索処理
function applySearch() {

  const keyword = searchInput.value.trim().toLowerCase();

  let visible = 0;
  const matched = [];

  const enabledCompanies = selectedCompanyIds();

  for (const bus of allBuses) {

    const marker = markers.get(getMarkerKey(bus));

    if (!marker) continue;

    if (
      enabledCompanies.has(bus.companyId) &&
      matchesSearch(bus, keyword)
    ) {

      if (!map.hasLayer(marker)) {
        marker.addTo(map);
      }

      visible++;

      if (keyword) {
        matched.push(marker);
      }

    } else {

      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    }
  }

  busCount.textContent = String(visible);

  if (keyword && matched.length === 0) {
    showMessage("該当する車両がありません。");
  } else {
    hideMessage();
  }

  if (keyword && matched.length === 1) {

    map.setView(matched[0].getLatLng(), 16);
    matched[0].openPopup();

  } else if (keyword && matched.length > 1) {

    map.fitBounds(
      L.latLngBounds(matched.map(m => m.getLatLng())),
      {
        padding: [30, 30],
        maxZoom: 15
      }
    );
  }
}

// PINA位置情報取得
async function fetchRouteBuses(routes) {

  const output = [];

  let checked = 0;
  let errors = 0;

  for (let i = 0; i < routes.length; i += 8) {

    const batch = routes.slice(i, i + 8);

    const settled = await Promise.allSettled(
      batch.map(async route => {

        const routeId = String(route.routeId || "").trim();

        if (!routeId) return [];

        const companyId = String(
          route.companyId || DEFAULT_COMPANY_ID
        );

        const params = new URLSearchParams({

          app_code: "PINA",
          ids: routeId,
          operation: "location",
          country: "ja-JP",
          ver: "3.0.7",
          count: "1",
          uuid: UUID,
          company_ids: companyId

        });

        const response = await fetch(API_URL, {

          method: "POST",

          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },

          body: params.toString()

        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("API応答が配列ではありません");
        }

        return data.flatMap(routeResult => {

          if (!Array.isArray(routeResult.list)) {
            return [];
          }

          const routeName =
            route.routeName ||
            routeResult.name ||
            routeResult.disp_name ||
            "名称不明";

          return routeResult.list.flatMap(item => {

            const pts = String(item.pts || "").split(",");

            const lat = Number(pts[1]);
            const lon = Number(pts[2]);

            if (
              pts.length < 3 ||
              !Number.isFinite(lat) ||
              !Number.isFinite(lon) ||
              lat < -90 ||
              lat > 90 ||
              lon < -180 ||
              lon > 180
            ) {
              return [];
            }

            return [{
              id: String(item.id || ""),
              routeId: String(routeResult.id || routeId),
              companyId,
              routeName,
              timestamp: pts[0],
              latitude: lat,
              longitude: lon,
              lag: item.lag ?? null,
              type: item.type || "",
              number: item.number || ""
            }];
          });
        });
      })
    );

    checked += batch.filter(
      r => String(r.routeId || "").trim()
    ).length;

    for (const item of settled) {

      if (item.status === "fulfilled") {

        output.push(...item.value);

      } else {

        errors++;

        console.warn(
          "路線取得失敗:",
          item.reason
        );
      }
    }
  }

  return {
    buses: output,
    checkedRoutes: checked,
    totalRoutes: routes.filter(
      r => String(r.routeId || "").trim()
    ).length,
    errorCount: errors
  };
}

// 車両データ更新
async function loadBusData() {

  if (isLoading) return;

  isLoading = true;

  refreshButton.disabled = true;
  connectionStatus.textContent = "取得中...";

  try {

    const [routes, vehicleData] = await Promise.all([

      loadJson("data/selected-routes.json", []),

      loadJson("data/vehicles.json", {})

    ]);

    vehicles =
      vehicleData &&
      typeof vehicleData === "object" &&
      !Array.isArray(vehicleData)
        ? vehicleData
        : {};

    if (!Array.isArray(routes) || routes.length === 0) {

      throw new Error(
        "data/selected-routes.json に路線が登録されていません"
      );
    }

    const enabledCompanies = selectedCompanyIds();

    const activeRoutes = routes.filter(route =>
      enabledCompanies.has(
        String(route.companyId || DEFAULT_COMPANY_ID)
      )
    );

    const data = await fetchRouteBuses(activeRoutes);

    allBuses = data.buses;

    const current = new Set();

    for (const bus of allBuses) {

      if (!bus.id) continue;

      const key = getMarkerKey(bus);

      current.add(key);

      let marker = markers.get(key);

      if (!marker) {

        marker = L.marker(
          [bus.latitude, bus.longitude],
          { icon: makeIcon(bus) }
        ).addTo(map);

        markers.set(key, marker);

      } else {

        marker.setLatLng([
          bus.latitude,
          bus.longitude
        ]);

        marker.setIcon(makeIcon(bus));

        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
      }

      marker.bindPopup(makePopup(bus));
    }

    // APIから消えた車両のマーカーを削除
    for (const [key, marker] of markers) {

      if (!current.has(key)) {

        map.removeLayer(marker);
        markers.delete(key);
      }
    }

    applySearch();

    routeCount.textContent =
      `${data.checkedRoutes}/${data.totalRoutes}`;

    lastUpdated.textContent =
      new Date().toLocaleTimeString("ja-JP");

    connectionStatus.textContent =
      `接続中${data.errorCount ? `（エラー ${data.errorCount}）` : ""}`;

    if (!allBuses.length) {

      showMessage(
        "車両位置がありません。路線IDやAPI応答を確認してください。"
      );

    } else if (data.errorCount) {

      showMessage(
        `${data.errorCount}路線で取得エラーがありました。`
      );
    }

    console.log("更新結果", data);

  } catch (error) {

    console.error(error);

    connectionStatus.textContent = "接続エラー";

    showMessage(
      `取得できませんでした：${error.message}`
    );

  } finally {

    isLoading = false;
    refreshButton.disabled = false;
  }
}

// イベント設定
$("searchButton").addEventListener(
  "click",
  applySearch
);

searchInput.addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      applySearch();
    }
  }
);

$("clearButton").addEventListener(
  "click",
  () => {
    searchInput.value = "";
    applySearch();
  }
);

refreshButton.addEventListener(
  "click",
  loadBusData
);

companyCheckboxes.forEach(checkbox => {
  checkbox.addEventListener("change", loadBusData);
});

// 初回取得
loadBusData();

// 60秒ごとに更新
setInterval(loadBusData, POLL_MS);
