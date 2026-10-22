/////////////////////////////////////////////////////
// アルピコ交通 バスロケーション
// app.js
/////////////////////////////////////////////////////

//==============================
// 地図初期化
//==============================

const map = L.map("map").setView([36.2308,137.9718],12);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{
    attribution:"© OpenStreetMap contributors",
    maxZoom:19
}).addTo(map);

setTimeout(()=>{
    map.invalidateSize();
},100);


//==============================
// アイコン
//==============================

/*const busIcon=L.icon({

    iconUrl:"icons/bus.png",

    iconSize:[30,30],

    iconAnchor:[4,5],

    popupAnchor:[10,10]

});
*/
const stopIcon=L.icon({

    iconUrl:"icons/busstop.png",

    iconSize:[22,22],

    iconAnchor:[11,22]

});


//==============================
// 保存用
//==============================

const markers={};

const stopMarkers=[];

let busData=[];

let stopData=[];


//==============================
// 更新時刻
//==============================

function updateClock(){

    document.getElementById("updateTime").innerHTML=

    "更新 "

    +

    new Date().toLocaleTimeString();

}


//==============================
// 車両番号取得
//==============================

function getBusNumber(id){

    if(carInfo[id]){

        return carInfo[id].name.split(" ")[0];

    }

    return id;

}


//==============================
// 路線名取得
//==============================

function getRouteName(routeId){

    if(routeInfo[routeId]){

        return routeInfo[routeId].name;

    }

    return "";

}


//==============================
// 行先取得
//==============================

function getDestination(routeId,updown){

    if(!routeInfo[routeId]) return "";

    if(updown==0){

        return routeInfo[routeId].up;

    }

    return routeInfo[routeId].down;

}
/////////////////////////////////////////////////////
// 停留所読込
/////////////////////////////////////////////////////

async function loadBusStops(){

    try{

        const response = await fetch("stop.php");

        const csv = await response.text();

        const lines = csv.trim().split("\n");

        for(let i=1;i<lines.length;i++){

            const cols = lines[i].split(",");

            if(cols.length<4) continue;

            const stopId=cols[0];

            const stopName=cols[1];

            const lat=parseFloat(cols[2]);

            const lng=parseFloat(cols[3]);

            if(isNaN(lat)||isNaN(lng)) continue;

            const marker=L.marker([lat,lng],{

                icon:stopIcon

            }).addTo(map);

            marker.bindPopup(

                "<b>"+stopName+"</b><br>停留所ID："+stopId

            );

            stopMarkers.push(marker);

            stopData.push({

                id:stopId,

                name:stopName,

                lat:lat,

                lng:lng,

                marker:marker

            });

        }

        console.log("停留所読込："+stopData.length+"件");

    }catch(e){

        console.error(e);

    }

}
/////////////////////////////////////////////////////
// 停留所検索
/////////////////////////////////////////////////////

function findStop(name){

    for(const stop of stopData){

        if(stop.name.indexOf(name)>=0){

            map.setView([stop.lat,stop.lng],17);

            stop.marker.openPopup();

            return;

        }

    }

}
/////////////////////////////////////////////////////
// 停留所表示ON/OFF
/////////////////////////////////////////////////////

function showStops(flag){

    stopMarkers.forEach(marker=>{

        if(flag){

            marker.addTo(map);

        }else{

            map.removeLayer(marker);

        }

    });

}
loadBusStops();
/////////////////////////////////////////////////////
// バス位置情報読込
/////////////////////////////////////////////////////

async function loadBusData(){

    try{

        const response=await fetch("bus.php?time=" + Date.now());

        const csv=await response.text();

        const lines=csv.trim().split("\n");

        busData=[];

        for(const line of lines){

            const cols=line.split(",");

            if(cols.length<4) continue;

            const id=cols[0];

            const time=cols[1];

            const lat=parseFloat(cols[2]);

            const lng=parseFloat(cols[3]);

            const status=cols[4]||"";

            const updown=cols[5]||0;

            const routeId=cols[6]||"";

            if(isNaN(lat)||isNaN(lng)) continue;

            busData.push({

                id,

                time,

                lat,

                lng,

                status,

                updown,

                routeId

            });

        }
        
        busData = getLatestBusData(busData);

        sortBus();
        drawBus();

        updateClock();

    }

    catch(e){

        console.error(e);

    }

}
function getLatestBusData(data){

    const latest = {};

    data.forEach(bus=>{

        if(!latest[bus.id]){

            latest[bus.id] = bus;

        }
        else{

            const oldTime = new Date(latest[bus.id].time);
            const newTime = new Date(bus.time);

            if(newTime > oldTime){

                latest[bus.id] = bus;

            }

        }

    });

    return Object.values(latest);

}
/////////////////////////////////////////////////////
// バス描画
/////////////////////////////////////////////////////

function drawBus(){
   
    const list=document.getElementById("busList");

    list.innerHTML="";

    busData.forEach(bus=>{

        const number = getBusNumber(bus.id);
        
        // carInfoに存在しない車両は非表示
        if (!carInfo[bus.id]) {
        return;
        }
        
        
        // 「予備機」「BUS16」「撤去品」「携帯端末」など5桁以外は非表示
        if (!/^\d{5}$/.test(number)) {
        return;
        }
        
    

        const route=getRouteName(bus.routeId);

        const dest=getDestination(bus.routeId,bus.updown);

        const html = `
<div class="bus-marker">
    <img class="bus-image" src="${getBusIcon(number)}">
    <div class="bus-number">${number}</div>
</div>
`;

        const icon=L.divIcon({

            className:"",

            html:html,

            iconSize:[30,45],

            iconAnchor:[20,45]//サイズ

        });

        if(markers[bus.id]){

            markers[bus.id].setLatLng([bus.lat,bus.lng]);

            markers[bus.id].setIcon(icon);

        }

        else{

            markers[bus.id]=L.marker([bus.lat,bus.lng],{

                icon:icon

            }).addTo(map);

            markers[bus.id].bindPopup("");

        }

        updatePopup(bus);

        createBusList(bus);

    });

}
/////////////////////////////////////////////////////
// ポップアップ更新
/////////////////////////////////////////////////////

function updatePopup(bus){

    const number=getBusNumber(bus.id);

    const route=getRouteName(bus.routeId);

    const dest=getDestination(bus.routeId,bus.updown);

    markers[bus.id].setPopupContent(

`

<b>車両番号</b><br>

${number}

<hr>

<b>車両ID</b><br>

${bus.id}

<hr>

<b>路線</b><br>

${route}

<hr>

<b>行先</b><br>

${dest}

<hr>

<b>更新</b><br>

${bus.time}

`

);

}
/////////////////////////////////////////////////////
// 車両一覧作成
/////////////////////////////////////////////////////

function createBusList(bus){

    const list=document.getElementById("busList");

    const number=getBusNumber(bus.id);

    const route=getRouteName(bus.routeId);

    const dest=getDestination(bus.routeId,bus.updown);

    const div=document.createElement("div");

    div.className="busItem";

    div.dataset.id = bus.id;

    div.innerHTML=`

<div class="busNumber">

${number}

</div>

<div class="busRoute">

${route}

</div>

<div class="busRoute">

${dest}

</div>

<div class="busTime">

${bus.time}

</div>

`;

    div.onclick=function(){

        map.setView([bus.lat,bus.lng],16);

        markers[bus.id].openPopup();

    };

    list.appendChild(div);

}
/////////////////////////////////////////////////////
// 車両検索
/////////////////////////////////////////////////////

function searchBus(){

    const keyword=document
        .getElementById("search")
        .value
        .toLowerCase();


    const items=document.querySelectorAll(".busItem");


    items.forEach((item)=>{

        const id=item.dataset.id;

        const bus=busData.find(b=>b.id===id);

        if(!bus) return;


        const number=getBusNumber(bus.id);


        if(
            number.toLowerCase().includes(keyword)
            ||
            bus.id.toLowerCase().includes(keyword)
        ){

            item.style.display="block";


            // ★該当バスへ移動
            if(keyword !== ""){

                map.setView(
                    [bus.lat,bus.lng],
                    17
                );


                if(markers[bus.id]){

                    markers[bus.id].openPopup();

                }

            }


        }
        else{

            item.style.display="none";

        }


    });


    // 停留所検索
    for(const stop of stopData){

        if(stop.name.toLowerCase().includes(keyword)){

            map.setView(
                [stop.lat,stop.lng],
                17
            );

            stop.marker.openPopup();

            break;

        }

    }

}
/////////////////////////////////////////////////////
// 検索イベント
/////////////////////////////////////////////////////

document
.getElementById("search")
.addEventListener("keyup",searchBus);
/////////////////////////////////////////////////////
// 自動更新
/////////////////////////////////////////////////////

loadBusStops();
loadBusData();

setInterval(loadBusData, 10000);

/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
// 路線一覧作成
/////////////////////////////////////////////////////

function createRouteList(){

    const list=document.getElementById("routeList");

    list.innerHTML="";

    Object.keys(routeInfo).forEach(routeId=>{

        const route=routeInfo[routeId];

        const div=document.createElement("div");

        div.className="routeItem";

        div.innerHTML=`
<label>

<input
type="checkbox"
checked
data-route="${routeId}">

${route.index}　${route.name}

</label>
`;

        list.appendChild(div);

    });

}
/////////////////////////////////////////////////////
// 路線表示切替
/////////////////////////////////////////////////////

document.addEventListener("change",function(e){

    if(!e.target.dataset.route) return;

    const routeId=e.target.dataset.route;

    const visible=e.target.checked;

    busData.forEach(bus=>{

        if(bus.routeId!==routeId) return;

        if(markers[bus.id]){

            if(visible){

                markers[bus.id].addTo(map);

            }else{

                map.removeLayer(markers[bus.id]);

            }

        }

    });

});
/////////////////////////////////////////////////////
// アイコン選択
/////////////////////////////////////////////////////

function getBusIcon(number){

    if(busIconList[number]){

        return busIconList[number];

    }


    // 登録されていない車両
    return "icons/bus.png";

}
/////////////////////////////////////////////////////
// 現在地
/////////////////////////////////////////////////////

function myLocation(){

    navigator.geolocation.getCurrentPosition(function(pos){

        map.setView([

            pos.coords.latitude,

            pos.coords.longitude

        ],16);

        L.marker([

            pos.coords.latitude,

            pos.coords.longitude

        ]).addTo(map)

        .bindPopup("現在地")

        .openPopup();

    });

}
document
.getElementById("gpsButton")
.onclick=myLocation;

createRouteList();
function sortBus(){

    busData.sort(function(a,b){

        return getBusNumber(a.id)

        .localeCompare(

            getBusNumber(b.id)

        );

    });

}
