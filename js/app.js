// 山梨地域バスロケーション：リアルタイム表示のみ（PHP・ログ保存なし）
const API_BASE = "https://api.buskita.com";
const SITE_ID = 12;
const SHIZUOKA_SITE_ID = 4;
const UPDATE_INTERVAL = 30000; // 30秒ごとに更新

const map = L.map("map").setView([35.6639, 138.5683], 12);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);
const busLayer = L.layerGroup().addTo(map);
const stopLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);
let routeRequestId = 0;
const markers = {};
const vehicleMap = {};

async function loadVehicleMaster() {
  try {
    const r = await fetch("data/vehicle.csv");
    if (!r.ok) throw new Error("vehicle.csv HTTP " + r.status);
    const lines = (await r.text()).replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    lines.slice(1).forEach(line => {
      const c = line.split(",");
      if (c.length < 9 || !c[0]) return;
      vehicleMap[c[0]] = {uid:c[0], fleetNo:c[1], plateNo:c[2], office:c[3],
        company:c[4], icon:c[5], enabled:c[6] === "1", carType:c[7],model:c[8]};
    });
  } catch(e) { console.warn("車両マスタ読込失敗", e); }
}

async function postApi(path, payload) {
  const response = await fetch(API_BASE + path, {
    method: "POST",
    headers: {"Content-Type":"application/json", "Accept":"application/json"},
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(path + " HTTP " + response.status);
  return response.json();
}

async function loadBusData() {
  const status = document.getElementById("updateTime");
  status.textContent = "更新：取得中…";
  try {
    const [yamanashiData,shizuokaData] = await Promise.all([
    postApi("/get-buses", {siteId:SITE_ID}),
    postApi("/get-buses", {siteId:SHIZUOKA_SITE_ID})
    ]);
    if (!Array.isArray(yamanashiData.buses)) {throw new Error("API応答に 山梨側のbuses がありません");}
    
    if (!Array.isArray(shizuokaData.buses)) {throw new Error("API応答に 静岡側のbuses がありません");}
    
    const allBuses=[
          ...yamanashiData.buses.map(bus=>({...bus,_region:"yamanashi"})),
          ...shizuokaData.buses.map(bus=>({...bus,_region:"shizuoka"}))
        ];

    drawBuses(allBuses);
    document.getElementById("busCount").textContent = "表示車両数：" + Object.keys(markers).length + "台";
    status.textContent = "更新：" + new Date().toLocaleTimeString("ja-JP");
    console.log("山梨側",yamanashiData.buses.length,"台");
    console.log("静岡側",shizuokaData.buses.length,"台");
  } catch(e) {
    console.error("リアルタイムバス取得失敗", e);
    status.textContent = "取得失敗：APIのCORS設定・通信状況を確認してください";
  }
}

async function loadShizuokaBusData() {
  try {
    const data = await postApi("/get-buses", {siteId:SHIZUOKA_SITE_ID});
    if (!Array.isArray(data.buses)) {throw new Error("静岡のAPI応答に buses がありません");
      
  } 
    console.log("静岡車両数",data.buses.length);
    console.log("静岡車両データ",data.buses);
}catch(e) {
    console.error("静岡バス取得失敗", e);
  }
}

function drawBuses(buses) {
  busLayer.clearLayers();
  Object.keys(markers).forEach(k => delete markers[k]);
  buses.forEach(bus => {
    const pos = bus.position || {};
    const lat = Number(pos.latitude), lng = Number(pos.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const uid = String(bus.device_uid || "");
    const v = vehicleMap[uid] || null;
    if (v && !v.enabled) return;
    const fleetNo = v ? (v.fleetNo || "未登録") : "未登録";
    const plateNo = v ? (v.plateNo || "----") : "----";
    const iconFile = v && v.icon ? v.icon : "ymk_lv.png";
    const delay = formatDelay(bus.delayMinutes);
    const icon = L.divIcon({
      html: `
        <div class="bus-icon">
          <img
            src="img/${escapeAttr(iconFile)}"
            style="display:block;width:40px;height:40px;margin:0 auto;position:static;"
          >
          <div
            class="bus-number"
            style="position:relative;top:0px;"
          >${escapeHtml(fleetNo)}</div>
          <div class="bus-delay">${escapeHtml(delay)}</div>
        </div>
      `,
      className: "",
      iconSize: [60, 80],
      iconAnchor: [30, 30]
    });

    const marker = L.marker([lat,lng], {icon}).addTo(busLayer);
    marker.on("click", () => showBusRoute(bus));
    const route = (bus.routeNames && (bus.routeNames["1"] || bus.routeNames[1])) || "不明";
    marker.bindPopup(`<b>${escapeHtml(fleetNo)}</b><br>ナンバー：${escapeHtml(plateNo)}<br>営業所：${escapeHtml(v ? v.office : "未登録")}<br>会社：${escapeHtml(v ? v.company : (bus.companyNo || "-"))}<br>車種：${escapeHtml(v ? v.carType : "未登録")}<br>路線：${escapeHtml(route)}<br>遅れ：${escapeHtml(delay)}<br>UID：${escapeHtml(uid)}`);
    markers[uid] = marker;
  });
}

function formatDelay(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "定刻";
  return n > 0 ? "+" + n + "分" : n + "分";
}


/* =====================================
   バスの走行経路を取得・表示
===================================== */

// 現地の日付を YYYY-MM-DD 形式で取得
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function showBusRoute(bus) {
  // 前に表示していた経路を消す
  routeLayer.clearLayers();

  // 連続クリック時に古い通信結果が表示されないようにする
  const requestId = ++routeRequestId;

  if (bus.workNo == null || bus.workNo === "") {
    console.warn("この車両にはworkNoがありません", bus);
    return;
  }

  try {
    const data = await postApi("/get-map-route-points", {
      workNo: Number(bus.workNo),
      date: getLocalDateString()
    });

    // 別のバスが選択されていたら古い結果は描画しない
    if (requestId !== routeRequestId) return;

    if (!Array.isArray(data.connectors)) {
      throw new Error("経路データにconnectorsがありません");
    }

    const points = data.connectors
      .map(point => ({
        lat: Number(point.latitude),
        lng: Number(point.longitude),
        arrived: point.arrived === true
      }))
      .filter(point =>
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lng)
      );

    if (points.length < 2) {
      console.warn("経路を描画するための座標が不足しています");
      return;
    }

    // 最後に通過済みとなっている停留所を探す
    let lastArrivedIndex = -1;

    points.forEach((point, index) => {
      if (point.arrived) {
        lastArrivedIndex = index;
      }
    });

    // 通過済み区間：通過済み停留所を順につなぐ
    const passedPoints = points
      .slice(0, lastArrivedIndex + 1)
      .map(point => [point.lat, point.lng]);

    // これからの区間：最後の通過済み停留所から先をつなぐ
    const futureStartIndex = Math.max(0, lastArrivedIndex);
    const futurePoints = points
      .slice(futureStartIndex)
      .map(point => [point.lat, point.lng]);

    // 通過済み：薄い青
    if (passedPoints.length >= 2) {
      L.polyline(passedPoints, {
        color: "#64B5F6",
        weight: 6,
        opacity: 0.55,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(routeLayer);
    }

    // これから走る区間：濃い青
    if (futurePoints.length >= 2) {
      L.polyline(futurePoints, {
        color: "#1565C0",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(routeLayer);
    }

    console.log(
      "経路を表示しました",
      "workNo:", data.workNo,
      "停留所数:", points.length,
      "通過済み:", lastArrivedIndex + 1
    );

  } catch (error) {
    if (requestId !== routeRequestId) return;
    console.error("走行経路の取得に失敗しました", error);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function escapeAttr(value) { return String(value ?? "").replace(/[^a-zA-Z0-9_.-]/g, ""); }

document.getElementById("searchButton").addEventListener("click", searchBus);
document.getElementById("searchBox").addEventListener("keydown", e => {if(e.key === "Enter") searchBus();});
document.getElementById("clearButton").addEventListener("click", () => {
  document.getElementById("searchBox").value = "";
  map.setView([35.6639,138.5683],12);
  Object.values(markers).forEach(m => m.closePopup());
});
function searchBus() {
  const key = document.getElementById("searchBox").value.trim().toUpperCase();
  if (!key) return;
  const entry = Object.entries(vehicleMap).find(([uid,v]) =>
    String(v.fleetNo).toUpperCase() === key || String(v.plateNo).toUpperCase() === key);
  if (!entry) { alert("車両マスタに登録されていません。"); return; }
  const marker = markers[entry[0]];
  if (!marker) { alert("この車両は現在のリアルタイムデータにありません。"); return; }
  map.setView(marker.getLatLng(),17);
  marker.openPopup();
}

window.addEventListener("load", async () => {
  await loadVehicleMaster();
  await loadBusData();
  await loadShizuokaBusData();
  setInterval(()=>{
    loadBusData();
    loadShizuokaBusData();
  }, UPDATE_INTERVAL);
});
