//////////////////////////////////////////////////////
//  松本市タウンスニーカー用オブジェクト、変数定義  //
//////////////////////////////////////////////////////

// 現在地ボタンアイコンファイル
const myLocationButtonIconFile = "../mylocation.png";
// 現在地マーカーファイル
const myLocationMarkerFile = "../marker_mylocation.png";
// ステーション位置ファイル
const stationLocationFile = "bus_stop.csv";
// ステーションアイコンファイル
const stationIconFile = "icon_busstop.png";
// デフォルトのマップ中央座標
const myLatLng = {
    lat: 36.2507,
    lng: 137.98234
};
// デフォルトのズームレベル
const defaultZoom = 12;
// アイコンファイル
const iconFiles = [//       運行中                 運休中
{
    false: "icon_bus1.png",
    true: "icon_bus0.png"
}, // iconIndex = 0
{
    false: "icon_bus2.png",
    true: "icon_bus0.png"
}, // iconIndex = 1
{
    false: "icon_bus3.png",
    true: "icon_bus0.png"
}// iconIndex = 2
];
const iconFilesSmapho = [//       運行中                 運休中
{
    false: "icon_smapho1.png",
    true: "icon_smapho0.png"
}, // iconIndex = 0
{
    false: "icon_smapho2.png",
    true: "icon_smapho0.png"
}, // iconIndex = 1
{
    false: "icon_smapho3.png",
    true: "icon_smapho0.png"
}// iconIndex = 2
];
// 車両アイコンのデフォルト座標
const homeLatLng = {
    lat: 36.2223,
    lng: 137.9696
};

// 車両情報
const carInfo = {
    "01fxpg4pxz0s6a3zaey0g9xrp8": {
        name: "17613 (228)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx5nbamqpknwpcg27t6cj2": {
        name: "17612 (237)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx60zjgpx7k9p3p9bg46t5": {
        name: "20621 (239)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx65xc766k2yef80jfvev0": {
        name: "11020 (240)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx6d5zmp04rdfc5newb81z": {
        name: "18616 (241)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx8vht0zx7qc64r3hzt38q": {
        name: "24531 (242)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx91nfetmqyf3zwr1ydsae": {
        name: "20622 (243)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx96zq4z5rq291q3kyxwws": {
        name: "24529 (244)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx9n5k5sy1p60z23bqxcra": {
        name: "18617 (247)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnxa772pny2cxsz5926tq15": {
        name: "16514 (250)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnxaxdhmme84fcxjr44q3an": {
        name: "10577 (251)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnxb9hh5btsnaavzbyjvkby": {
        name: "20523 (253)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnxbnzh9jj0vzf5p6wbxchb": {
        name: "24320 (255)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xkyt6bsyv2efzrvxggrt4d": {
        name: "10611 (304)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xbmfca2t4hfp8wqm7ajdhp": {
        name: "23527 (313)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xbma2v47ndspkeb23zk2cd": {
        name: "04487 (314)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xkyyyppwvw29cfk3r46va0": {
        name: "03474 (334)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92ht495n0n9f0ebwy8ebxhz": {
        name: "18521 (337)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92hv090508an64sqzn7v32g": {
        name: "05479 (338)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92r9hn4d4evtm80r6aq1xwd": {
        name: "10200 (340)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xbmkp7k4d345pqfeav99b7": {
        name: "10101 (341)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92cvwpxmnx3234yh6mv11er": {
        name: "23525 (342)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xbmrb51r58hvwme9tpkv63": {
        name: "01436 (343)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92cvb2195keg0y83ex546aw": {
        name: "01447 (344)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92cvgcefpwzw613d1vpne23": {
        name: "15513 (345)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92cv6qd8t6x3qar0hw0099g": {
        name: "13505 (346)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92ra07155cmy2y33g2c970x": {
        name: "23528 (347)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92ctzqcp5wy3w9b2rt3vxmg": {
        name: "18618 (348)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xkye0k0bw7xpf2z2xkm95q": {
        name: "30312 (349)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xbkwvmsngcwz5zxdswqfss": {
        name: "03469 (350)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xkz7e18r6h3h9zv86r266n": {
        name: "01446 (352)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xkzdcrpvav3r8yb5w4vsnq": {
        name: "19522 (353)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xbm39hr84vcs8hf61qspnx": {
        name: "21524 (354)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92raeje5t3jczbgzvqprtdm": {
        name: "06443 (355)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92r9s2znsdyhf23cajkfzad": {
        name: "04515 (356)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92cvqj8md0pq5711z8najmn": {
        name: "02444 (357)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92htmxjgsfmg7z05w5gmwcx": {
        name: "23526 (358)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92htvkr4qxh3ww1kw3vh2d4": {
        name: "05484 (359)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92ht9bp8x670q7ks9n2qzsc": {
        name: "01437 (360)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92htfa61nhbzrhm1qps05y7": {
        name: "10900 (361)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92ra7t86gv2460w8x5p770r": {
        name: "24319 (362)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h9fjkmyet9zsk1kya1s01hew": {
        name: "04486 (363)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h92r9ckpgf44fsvxa1fhhrkn": {
        name: "11010 (364)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h9fjjx93a1ykm8rqcz2vvnky": {
        name: "26330 (365)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h9fjk2bjtbjx8vkkd72rws52": {
        name: "03457 (368)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h9fjkbg5fgpfa6ba7sjwj0a8": {
        name: "03459 (369)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h9fjk6v4tt7293cf96ne31ca": {
        name: "03460 (370)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h9fjkgd3c5g4j9snbym7ekxz": {
        name: "17517 (371)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    // 380QR-372 車両10611に搭載していたが、車両長期修理のため応急的に車両10070に移設
    "01h9hjgnd77wpad2xcj7f9acad": {
        name: "10070 (372)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h9hjgtvg1nbpajv8aspjq6s4": {
        name: "24322 (373)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h9hjgzb4vmpks1mxp735m25z": {
        name: "99502 (374)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h9hjh3xhgfssndntkvw597sj": {
        name: "03467 (375)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01j1rwvmymc263xz4yanpcahbd": {
        name: "17614 (376)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01j7mcnsnwkv2hqypdg9zybene": {
        name: "03456 (381)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01hcxxmemd8ezmr3hwbca6z3rh": {
        name: "24530 (416)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01hcxxn7yx9fw2b36sw0rrpwg1": {
        name: "14508 (417)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01hcxxnh7ynyjhc8s2a66zmzv7": {
        name: "21623 (418)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01j7n23x7n5a1j3t11mmd2fwt2": {
        name: "02445 (466)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },

    "01fsnxb4qss2mpwk6rjxgnpnep": {
        name: "BUS16 (252)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx9s3fgz6r0z66mg2vgjbw": {
        name: "予備機 (248)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01hcxxnz8jepjznxd4ec597tfb": {
        name: "予備機 (420)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnxa0tkbyk1p9835th0r96y": {
        name: "撤去品 (249)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsnx9bw1r165d06kcw2gx6rd": {
        name: "18618撤去品 (245)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01gpzghq2nw3wp9jrpqcwn97k8": {
        name: "17614撤去品 (272)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01h8xkyms0cpbzev3ad6knsv8c": {
        name: "03458撤去品 (351)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fzc3zmt9gc321795490aghhm": {
        name: "照会端末 (S15)",
        iconFiles: iconFilesSmapho,
        anchX: 16,
        anchY: 32,
        statmsk: 248,
        fixed: false
    },
    "01fsxhvxk4q0fxkbvqjm6c5jj3": {
        name: "携帯端末 (S01)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fsv38n9fnzxkkv3zhzvggd7r": {
        name: "携帯端末 (S02)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fzc3zw0dvgvk19mxjnd2x42v": {
        name: "携帯端末 (S16)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
    "01fzfdxnt534jwtb6ax6286yap": {
        name: "携帯端末 (S17)",
        iconFiles: iconFiles,
        anchX: 16,
        anchY: 32,
        statmsk: 255,
        fixed: false
    },
};

var busIconList = {

    "01436":"icons/bus.png",
    "01437":"icons/bus.png",
    "01446":"icons/bus.png",
    "01447":"icons/bus.png",
    "02444":"icons/bus.png",
    "02445":"icons/bus.png",
    "03456":"icons/bus.png",
    "03457":"icons/bus.png",
    "03459":"icons/bus.png",
    "03460":"icons/bus.png",
    "03467":"icons/ergabus.png",
    "03469":"icons/ergabus.png",
    "03474":"icons/ergabus.png",
    "04486":"icons/bus.png",
    "04487":"icons/bus.png",
    "04515":"icons/ergabus.png",
    "05479":"icons/bus.png",
    "05484":"icons/bus.png",
    "06443":"icons/ergabus.png",
    "10070":"icons/bus.png",
    "10101":"icons/bus.png",
    "10200":"icons/bus.png",
    "10577":"icons/bus.png",
    "10611":"icons/bus.png",
    "10900":"icons/bus.png",
    "11010":"icons/ergabus.png",
    "11020":"icons/icon_bus1.png",
    "13505":"icons/ergabus.png",
    "14508":"icons/ergabus.png",
    "15513":"icons/ergabus.png",
    "16514":"icons/ergabus.png",
    "17517":"icons/newerga.png",
    "17612":"icons/icon_bus1.png",
    "17613":"icons/icon_bus1.png",
    "17614":"icons/icon_bus1.png",
    "18521":"icons/newerga.png",
    "18616":"icons/icon_bus1.png",
    "18617":"icons/icon_bus1.png",
    "18618":"icons/icon_bus1.png",
    "19522":"icons/newerga.png",
    "20523":"icons/icon_bus1.png",
    "20621":"icons/icon_bus1.png",
    "20622":"icons/icon_bus1.png",
    "21524":"icons/newerga.png",
    "21623":"icons/icon_bus1.png",
    "23525":"icons/newerga.png",
    "23526":"icons/newerga.png",
    "23527":"icons/newerga.png",
    "23528":"icons/newerga.png",
    "24319":"icons/newerga.png",
    "24320":"icons/newerga.png",
    "24322":"icons/bus.png",
    "24529":"icons/newerga.png",
    "24530":"icons/newerga.png",
    "24531":"icons/newerga.png",
    "26330":"icons/bus.png",
    "30312":"icons/bus.png",
    "99502":"icons/journey.png"
    




    // 追加していく
    // "車番":"画像パス"

};
// 路線情報
const routeInfo = {
    "01h9j04qf5pfg6za7eg0c4wqea": {
        index: 10,
        name: "信大横田循環線",
        up: "",
        down: ""
    },
    "01h9j06f82mw3wvnddsbs4z7fs": {
        index: 11,
        name: "横田信大循環線",
        up: "",
        down: ""
    },
    "01h9j07mcq8yvmvcepyyetchhh": {
        index: 20,
        name: "浅間線",
        up: "松本駅お城口行き",
        down: "浅間温泉行き"
    },
    "01h9j099yhcqm8h414kwmenm5p": {
        index: 30,
        name: "新浅間線",
        up: "松本バスターミナル行き",
        down: "浅間温泉行き"
    },
    "01h9j0aq0jnyqd6bnce5tdshsx": {
        index: 40,
        name: "美ケ原温泉線",
        up: "松本バスターミナル行き",
        down: "美ケ原温泉行き"
    },
    "01h9j0bk8t8qxpk23m4bqmeaqf": {
        index: 50,
        name: "北市内線",
        up: "西まわり",
        down: "東まわり"
    },
    "01h9j0cgk3qvw6t8j9z5kp50bg": {
        index: 60,
        name: "岡田線",
        up: "松本バスターミナル行き",
        down: "山城口行き"
    },
    "01h9j0dfrkbgq5srqsstmb87zr": {
        index: 70,
        name: "アルプス公園線",
        up: "松本バスターミナル行き",
        down: "アルプス公園行き"
    },
    "01h9j0eaxbqfgeapy0wcyff5cg": {
        index: 80,
        name: "鹿教湯温泉線",
        up: "松本バスターミナル行き",
        down: "鹿教湯温泉上行き"
    },
    "01h9j0f842rq9nvmc1f0hr615a": {
        index: 90,
        name: "空港今井線",
        up: "松本バスターミナル行き",
        down: "信州まつもと空港方面行き"
    },
    "01h9j0g3wfs5j4jnfm0w3q0mq9": {
        index: 100,
        name: "大久保工場団地線・神林線",
        up: "松本バスターミナル行き",
        down: "管理会館前行き"
    },
    "01h9pfrv7rm8dwfb97y4nptdxv": {
        index: 101,
        name: "大久保工場団地線・神林線",
        up: "松本バスターミナル行き",
        down: "管理会館前行き"
    },
    "01h9j0h2f2zey9px0ek9brh1m6": {
        index: 120,
        name: "山形線",
        up: "松本バスターミナル行き",
        down: "山形方面行き"
    },
    "01h9j0hym391fkbt20ffchkame": {
        index: 130,
        name: "寿台線",
        up: "松本バスターミナル行き",
        down: "村井駅方面行き"
    },
    "01h9j0jyc4x4nrc0y859nxpkhy": {
        index: 140,
        name: "松原線",
        up: "松本バスターミナル行き",
        down: "棚峯行き"
    },
    "01h9j0kxkm4x90ffdxsk0mbznh": {
        index: 150,
        name: "内田線",
        up: "松本バスターミナル行き",
        down: "倉村行き"
    },
    "01gtk2gfphyzgzm7mb0pwn8eqp": {
        index: 160,
        name: "並柳団地線",
        up: "松本バスターミナル行き",
        down: "並柳団地南行き"
    },
    "01ha922g5tvbnnkmmcvna9524w": {
        index: 161,
        name: "並柳団地線",
        up: "松本バスターミナル行き",
        down: "並柳団地南行き"
    },
    "01h9j0msfjw147rc5ky4thtrt7": {
        index: 170,
        name: "四賀線",
        up: "松本バスターミナル行き",
        down: "四賀支所行き"
    },
    "01fsp3daby2y055rwgx9w1nk5j": {
        index: 180,
        name: "TS北コース",
        up: "",
        down: ""
    },
    "01fsp3dym3e1mhg5wpze8ykbmn": {
        index: 181,
        name: "TS東コース",
        up: "",
        down: ""
    },
    "01fsp3ee248pz8pgmaq32x639a": {
        index: 182,
        name: "TS南コース",
        up: "",
        down: ""
    },
    "01gtx3caern3gv4z2rhkzba9f4": {
        index: 190,
        name: "合庁ライナー",
        up: "松本駅アルプス口行き",
        down: "合同庁舎行き"
    },
    "01ft4y663269mwmtjft8bb2gc6": {
        index: 200,
        name: "南部循環線",
        up: "",
        down: ""
    },
    "01kkdhrxy2vtnqs4dzedzdkf2e": {
        index: 900,
        name: "第一高校スクール",
        up: "",
        down: "松本第一高校行き"
    },
};

//////////////////////////////////////////////
//  松本市タウンスニーカー用車両名生成処理  //
//////////////////////////////////////////////
function createCarName(device, routeName, updown) {
    // <-- 従来の乗り物マップとの互換性を維持するための処理
    // (新乗り物マップへの移行が完了したら削除)
    if (typeof device !== "string")
        device = device.device;
    // -->

    var str;
    if (dispCarCode) {
        // 車両名 [路線名 行き先]
        str = carInfo[device].name + " [" + routeName;
        if ((routeName.length > 0) && (updown.length > 0))
            str += " ";
        // 路線名、行き先ともに設定されている場合のセパレータ
        str += updown + "]";
    } else {
        // [路線名] 行き先名
        if (routeName.length > 0) {
            // 路線名が設定されている場合 : [路線名] 行き先名
            str = "[" + routeName + "] " + updown;
        } else {
            // 路線名が設定されていない場合 : 行き先名
            str = updown;
        }
    }
    return str;
}
;
console.log("routeInfo読み込みOK");
console.log(busIconList);