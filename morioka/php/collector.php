<?php

date_default_timezone_set("Asia/Tokyo");


//=====================================
// API
//=====================================

$apiUrl =
    "https://morioka-area.busyohou.jp/api/v2/busstop/buses/position";


//=====================================
// 曜日区分
//=====================================

$w = date("w");

if ($w == 6) {

    $dayType = "saturday";

} elseif ($w == 0) {

    $dayType = "holiday";

} else {

    $dayType = "weekday";

}


//=====================================
// 保存先
//=====================================

$dir =
    __DIR__
    . "/../data/bus_log/"
    . $dayType;


if (!is_dir($dir)) {

    if (!mkdir($dir, 0777, true)) {

        die("保存フォルダ作成失敗");

    }

}


$file =
    $dir
    . "/"
    . date("Y-m-d")
    . ".jsonl";


//=====================================
// API取得
//=====================================

$ch = curl_init($apiUrl);

curl_setopt(
    $ch,
    CURLOPT_RETURNTRANSFER,
    true
);

curl_setopt(
    $ch,
    CURLOPT_TIMEOUT,
    30
);

curl_setopt(
    $ch,
    CURLOPT_SSL_VERIFYPEER,
    true
);

curl_setopt(
    $ch,
    CURLOPT_HTTPHEADER,
    [
        "Accept: application/json"
    ]
);


$response =
    curl_exec($ch);


if ($response === false) {

    die(
        "CURL ERROR: "
        . curl_error($ch)
    );

}


$httpCode =
    curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );


curl_close($ch);


//=====================================
// HTTP確認
//=====================================

if ($httpCode != 200) {

    die(
        "HTTP ERROR: "
        . $httpCode
    );

}


//=====================================
// JSON解析
//=====================================

$data =
    json_decode(
        $response,
        true
    );


if (!is_array($data)) {

    die(
        "JSON ERROR: "
        . json_last_error_msg()
    );

}


//=====================================
// 取得時刻
//=====================================

$now =
    date("Y-m-d H:i:s");


//=====================================
// ログ作成
//=====================================

$lines = [];

$count = 0;


foreach ($data as $bus) {


    // BusIdがないデータは無視

    if (!isset($bus["BusId"])) {

        continue;

    }


    $log = [

        "time" =>
            $now,

        "busId" =>
            $bus["BusId"],

        "routeId" =>
            $bus["RouteId"] ?? "",

        "sujiId" =>
            $bus["SujiId"] ?? "",

        "sequence" =>
            $bus["SequenceInSuji"] ?? 0,

        "busStopId" =>
            $bus["BusStopId"] ?? "",

        "latitude" =>
            $bus["Latitude"] ?? null,

        "longitude" =>
            $bus["Longitude"] ?? null,

        "delay" =>
            $bus["ArriveDelaySecond"] ?? 0

    ];


    // 1台＝1行

    $lines[] =
        json_encode(
            $log,
            JSON_UNESCAPED_UNICODE
            |
            JSON_UNESCAPED_SLASHES
        );


    $count++;

}


//=====================================
// ファイルへ追記
//=====================================

if (count($lines) > 0) {


    $text =
        implode(
            "\n",
            $lines
        )
        . "\n";


    $result =
        file_put_contents(
            $file,
            $text,
            FILE_APPEND | LOCK_EX
        );


    if ($result === false) {

        die(
            "ログ書き込み失敗"
        );

    }

} else {

    $result = 0;

}


//=====================================
// 結果表示
//=====================================

echo
"保存成功\n";

echo
"日時: "
. $now
. "\n";

echo
"区分: "
. $dayType
. "\n";

echo
"取得車両数: "
. $count
. "\n";

echo
"書込サイズ: "
. $result
. " bytes\n";

echo
"ファイル: "
. $file
. "\n";

?>