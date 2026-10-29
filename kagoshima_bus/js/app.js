
"use strict";

// 鹿児島市中心部を初期表示
const map = L.map("map").setView([31.5968, 130.5571], 13);

// OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// 車両IDとマーカーの対応表
const vehicleMarkers = new Map();

// 車両登録情報
let vehicleRegistry = {};
let vehicleRegistryLoaded = false;

let allBuses = [];
let totalRouteCount = 0;
let isLoading = false;

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const clearButton = document.getElementById("clearButton");
const refreshButton = document.getElementById("refreshButton");

const connectionStatus = document.getElementById("connectionStatus");
const busCountElement = document.getElementById("busCount");
const routeCountElement = document.getElementById("routeCount");
const lastUpdatedElement = document.getElementById("lastUpdated");
const messageElement = document.getElementById("message");

// HTML表示用の文字列をエスケープ
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// 車両登録情報JSONを読み込む
async function loadVehicleRegistry() {
  try {
    const response = await fetch(
      `data/vehicles.json?_=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (
      data === null ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error("vehicles.json の形式が正しくありません");
    }

    vehicleRegistry = data;
    vehicleRegistryLoaded = true;

    console.log(
      "車両登録情報を読み込みました:",
      Object.keys(vehicleRegistry).length,
      "台"
    );
  } catch (error) {
    console.error("車両登録情報の読み込みに失敗:", error);

    vehicleRegistry = {};
    vehicleRegistryLoaded = true;
  }
}

// 車両IDから登録情報を取得
function getVehicleInfo(vehicleId) {
  return vehicleRegistry[String(vehicleId)] || {};
}

// 登録車両か判定
function isRegisteredVehicle(bus) {
  const info = getVehicleInfo(bus.id);
  return String(info.plateNo ?? "").trim() !== "";
}

// ナンバー表示
function getPlateNo(bus) {
  const info = getVehicleInfo(bus.id);

  if (!String(info.plateNo ?? "").trim()) {
    return "未登録";
  }

  return String(info.plateNo);
}

// 車両アイコン
function createBusIcon(bus) {
  const label = escapeHtml(getPlateNo(bus));

  return L.divIcon({
    className: "bus-marker-wrap",
    html: `
      <div class="bus-marker">
        <div class="bus-icon">🚌</div>
        <div class="bus-number">${label}</div>
      </div>
    `,
    iconSize: [100, 56],
    iconAnchor: [50, 30],
    popupAnchor: [0, -29]
  });
}


function createPopup(bus) {
  const info = getVehicleInfo(bus.id);

  const plateNo = String(info.plateNo ?? "").trim()
    ? escapeHtml(info.plateNo)
    : "未登録";

  const model = String(info.model ?? "").trim()
    ? escapeHtml(info.model)
    : "未登録";

  const office = String(info.office ?? "").trim()
    ? escapeHtml(info.office)
    : "未登録";

  const route = escapeHtml(bus.routeName || "路線情報なし");
  const vehicleId = escapeHtml(bus.id || "不明");

  return `
    <div class="popup-title">ナンバー：${plateNo}</div>
    <div><strong>路線：</strong>${route}</div>
    <div><strong>型式：</strong>${model}</div>
    <div><strong>所属：</strong>${office}</div>
    <div><strong>ID：</strong>${vehicleId}</div>
  `;
}

// 画面上のメッセージ
function showMessage(message) {
  messageElement.textContent = message;
  messageElement.classList.add("visible");
}

function hideMessage() {
  messageElement.textContent = "";
  messageElement.classList.remove("visible");
}

// 検索条件に合う車両か判定
function matchesSearch(bus, keyword) {
  if (!keyword) return true;

  const info = getVehicleInfo(bus.id);

  const searchableText = [
    getPlateNo(bus),
    info.model,
    info.fleetNo,
    info.company,
    bus.id,
    bus.routeName,
    bus.routeId,
    bus.type
  ].join(" ").toLowerCase();

  return searchableText.includes(keyword);
}

// 検索結果を地図に反映
function applySearch() {
  const keyword = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;
  const matchedMarkers = [];

  for (const bus of allBuses) {
    const marker = vehicleMarkers.get(String(bus.id));
    if (!marker) continue;

    if (matchesSearch(bus, keyword)) {
      if (!map.hasLayer(marker)) {
        marker.addTo(map);
      }

      visibleCount++;

      if (keyword) {
        matchedMarkers.push(marker);
      }
    } else {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    }
  }

  busCountElement.textContent = String(visibleCount);

  if (keyword && matchedMarkers.length === 0) {
    showMessage(
      "該当する車両が見つかりません。ナンバーや路線名を確認してください。"
    );
  } else {
    hideMessage();
  }

  if (keyword && matchedMarkers.length === 1) {
    map.setView(matchedMarkers[0].getLatLng(), 16);
    matchedMarkers[0].openPopup();
  } else if (keyword && matchedMarkers.length > 1) {
    const bounds = L.latLngBounds(
      matchedMarkers.map(marker => marker.getLatLng())
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 16
    });
  }
}

// 車両位置情報を取得
async function loadBusData() {
  if (isLoading) return;

  isLoading = true;
  refreshButton.disabled = true;
  connectionStatus.textContent = "データ取得中...";

  try {
    // 毎回最新の車両登録情報を読み込む
    await loadVehicleRegistry();

    const response = await fetch(
      `php/get-buses.php?_=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.buses)) {
      throw new Error("JSONに buses 配列がありません。");
    }

    totalRouteCount = Number(data.totalRoutes) || 0;
    routeCountElement.textContent = String(totalRouteCount);

    // APIの車両情報を画面用の形式に変換
    const receivedBuses = data.buses.map(bus => ({
      id: String(bus.vehicleId ?? ""),
      routeName: bus.routeName || "",
      routeId: bus.routeId || "",
      latitude: Number(bus.latitude),
      longitude: Number(bus.longitude),
      lag: bus.lag,
      type: bus.type || "",
      datetime: bus.timestamp || ""
    }));

    const currentIds = new Set();
    const validBuses = [];

    for (const bus of receivedBuses) {
      const id = bus.id;
      const lat = bus.latitude;
      const lon = bus.longitude;

      if (
        !id ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < 20 || lat > 46 ||
        lon < 122 || lon > 154
      ) {
        continue;
      }

      currentIds.add(id);
      validBuses.push(bus);

      let marker = vehicleMarkers.get(id);

      if (!marker) {
        marker = L.marker([lat, lon], {
          icon: createBusIcon(bus)
        });

        vehicleMarkers.set(id, marker);
      } else {
        marker.setLatLng([lat, lon]);
        marker.setIcon(createBusIcon(bus));
      }

      marker.bindPopup(createPopup(bus));
    }

    allBuses = validBuses;

    // 今回の応答に含まれない車両を削除
    for (const [id, marker] of vehicleMarkers.entries()) {
      if (!currentIds.has(id)) {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }

        vehicleMarkers.delete(id);
      }
    }

    // 検索条件を維持して表示を更新
    applySearch();

    const now = new Date();
    lastUpdatedElement.textContent =
      now.toLocaleTimeString("ja-JP");

    connectionStatus.textContent =
      `接続中（${data.checkedRoutes ?? 0}/${totalRouteCount} 路線確認）`;

    if (allBuses.length === 0) {
      showMessage("現在、表示できる車両位置情報がありません。");
    } else if (Number(data.errorCount) > 0) {
      showMessage(
        `更新完了。ただし ${data.errorCount} 路線で取得エラーがありました。`
      );
    }

    console.log("車両情報を更新しました", {
      checkedRoutes: data.checkedRoutes,
      totalRoutes: totalRouteCount,
      errorCount: data.errorCount,
      vehicleCount: allBuses.length,
      registeredVehicleCount: Object.keys(vehicleRegistry).length,
      updatedAt: now.toISOString()
    });

  } catch (error) {
    console.error("車両情報の取得に失敗しました:", error);
    connectionStatus.textContent = "接続エラー";

    showMessage(
      "車両情報を取得できませんでした。php/get-buses.php の応答を確認してください。"
    );
  } finally {
    isLoading = false;
    refreshButton.disabled = false;
  }
}

// 検索ボタン
searchButton.addEventListener("click", applySearch);

// Enterキーでも検索
searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    applySearch();
  }
});

// 全車両を表示
clearButton.addEventListener("click", () => {
  searchInput.value = "";
  applySearch();
});

// 手動更新
refreshButton.addEventListener("click", loadBusData);

// 初回取得
loadBusData();

// 60秒ごとに自動更新
setInterval(loadBusData, 60000);
