<?php

date_default_timezone_set("Asia/Tokyo");

header("Content-Type: application/json; charset=UTF-8");


// ==================================================
// 選択された日付・曜日区分を取得
// ==================================================

$date = $_GET["date"] ?? $_POST["date"] ?? "";
$dayType = $_GET["dayType"] ?? $_POST["dayType"] ?? "";


// ==================================================
// 入力チェック
// ==================================================

if ($date === "") {

    echo json_encode([
        "success" => false,
        "message" => "日付が指定されていません"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


if ($dayType === "") {

    echo json_encode([
        "success" => false,
        "message" => "曜日区分が指定されていません"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// 許可する曜日区分

$allowedDayTypes = [
    "weekday",
    "saturday",
    "holiday"
];


if (!in_array($dayType, $allowedDayTypes, true)) {

    echo json_encode([
        "success" => false,
        "message" => "曜日区分が不正です"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// ==================================================
// 日付チェック
// ==================================================

$d = DateTime::createFromFormat(
    "Y-m-d",
    $date
);


if (
    !$d ||
    $d->format("Y-m-d") !== $date
) {

    echo json_encode([
        "success" => false,
        "message" => "日付の形式が不正です"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// ==================================================
// ログファイル
// ==================================================

$logFile =
    __DIR__
    . "/../data/bus_log/"
    . $dayType
    . "/"
    . $date
    . ".jsonl";


// ==================================================
// routes.json
// ==================================================

$routeFile =
    __DIR__
    . "/../data/routes.json";


// ==================================================
// 出力先
//
// 選択した日の仕業を保存
// ==================================================

$outputDir =
    __DIR__
    . "/../data/get_log/"
    . $dayType;


if (!is_dir($outputDir)) {

    mkdir(
        $outputDir,
        0777,
        true
    );

}


$outputFile =
    $outputDir
    . "/"
    . $date
    . ".json";


// ==================================================
// ログファイル確認
// ==================================================

if (!file_exists($logFile)) {

    echo json_encode([

        "success" => false,

        "message" =>
            "指定された日のログファイルがありません",

        "file" =>
            $logFile,

        "date" =>
            $date,

        "dayType" =>
            $dayType

    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    exit;
}


// ==================================================
// routes.json確認
// ==================================================

if (!file_exists($routeFile)) {

    echo json_encode([

        "success" => false,

        "message" =>
            "routes.json がありません",

        "file" =>
            $routeFile

    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    exit;
}


// ==================================================
// routes.json読み込み
// ==================================================

$routes = json_decode(
    file_get_contents($routeFile),
    true
);


if (!is_array($routes)) {

    echo json_encode([

        "success" => false,

        "message" =>
            "routes.json の読み込みに失敗しました"

    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// ==================================================
// routeId → 路線情報
// ==================================================

$routeMap = [];


foreach ($routes as $route) {

    if (!isset($route["Id"])) {
        continue;
    }

    $routeMap[$route["Id"]] = $route;
}


// ==================================================
// JSONL読み込み
// ==================================================

$logs = [];


$fp = fopen(
    $logFile,
    "r"
);


if (!$fp) {

    echo json_encode([

        "success" => false,

        "message" =>
            "ログファイルを開けません"

    ], JSON_UNESCAPED_UNICODE);

    exit;
}


while (
    ($line = fgets($fp))
    !== false
) {

    $line = trim($line);


    if ($line === "") {
        continue;
    }


    $data = json_decode(
        $line,
        true
    );


    if (!is_array($data)) {
        continue;
    }


    // 必須項目

    if (
        !isset($data["busId"]) ||
        !isset($data["routeId"]) ||
        !isset($data["sujiId"]) ||
        !isset($data["time"])
    ) {

        continue;
    }


    $logs[] = $data;
}


fclose($fp);


// ==================================================
// ログなし
// ==================================================

if (count($logs) === 0) {

    echo json_encode([

        "success" => false,

        "message" =>
            "指定された日の有効なログがありません",

        "file" =>
            $logFile

    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// ==================================================
// バスIDごとに分類
// ==================================================

$busLogs = [];


foreach ($logs as $log) {

    $busId =
        (string)$log["busId"];


    if (
        !isset(
            $busLogs[$busId]
        )
    ) {

        $busLogs[$busId] = [];

    }


    $busLogs[$busId][] =
        $log;
}


// ==================================================
// 仕業生成
// ==================================================

$result = [];


foreach (
    $busLogs
    as $busId => $records
) {


    // 時刻順

    usort(
        $records,
        function ($a, $b) {

            return strcmp(
                $a["time"],
                $b["time"]
            );

        }
    );


    $trips = [];


    // 同じsujiIdは1回だけ

    $usedSuji = [];


    $operationNo = 1;


    foreach (
        $records
        as $r
    ) {


        $sujiId =
            (string)$r["sujiId"];


        // ------------------------------------------
        // 同じ便はスキップ
        // ------------------------------------------

        if (
            isset(
                $usedSuji[$sujiId]
            )
        ) {

            continue;

        }


        $usedSuji[$sujiId] = true;


        // ------------------------------------------
        // 路線情報
        // ------------------------------------------

        $routeId =
            $r["routeId"];


        $routeName = "";
        $headsign = "";


        if (
            isset(
                $routeMap[$routeId]
            )
        ) {

            $route =
                $routeMap[$routeId];


            $routeName =
                $route["Name"] ?? "";


            $headsign =
                $route["Headsign"] ?? "";

        }


        // ------------------------------------------
        // 発車時刻
        //
        // 例
        // 00304-00006-001-1030
        //                 ↓
        //               10:30
        // ------------------------------------------

        $departureTime = "";


        if (
            preg_match(
                "/-(\d{4})$/",
                $sujiId,
                $m
            )
        ) {

            $hh =
                substr(
                    $m[1],
                    0,
                    2
                );


            $mm =
                substr(
                    $m[1],
                    2,
                    2
                );


            $departureTime =
                $hh
                . ":"
                . $mm;

        }


        // ------------------------------------------
        // 仕業1便
        // ------------------------------------------

        $trips[] = [

            "operationNo" =>
                $operationNo,

            "busId" =>
                (int)$busId,

            "routeId" =>
                $routeId,

            "sujiId" =>
                $sujiId,

            "departureTime" =>
                $departureTime,

            "routeName" =>
                $routeName,

            "headsign" =>
                $headsign

        ];


        $operationNo++;

    }


    // ------------------------------------------
    // バス単位
    // ------------------------------------------

    $result[] = [

        "busId" =>
            (int)$busId,

        "tripCount" =>
            count($trips),

        "trips" =>
            $trips

    ];

}


// ==================================================
// JSON生成
// ==================================================

$json = json_encode(

    $result,

    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES |
    JSON_PRETTY_PRINT

);


if ($json === false) {

    echo json_encode([

        "success" => false,

        "message" =>
            "JSON生成に失敗しました"

    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// ==================================================
// 保存
// ==================================================

if (
    file_put_contents(
        $outputFile,
        $json,
        LOCK_EX
    ) === false
) {

    echo json_encode([

        "success" => false,

        "message" =>
            "仕業ファイルの保存に失敗しました",

        "file" =>
            $outputFile

    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// ==================================================
// 完了
// ==================================================

$operationCount = 0;


foreach (
    $result
    as $bus
) {

    $operationCount +=
        $bus["tripCount"];

}


echo json_encode([

    "success" =>
        true,

    "message" =>
        "仕業生成完了",

    "date" =>
        $date,

    "dayType" =>
        $dayType,

    "busCount" =>
        count($result),

    "operationCount" =>
        $operationCount,

    "input" =>
        $logFile,

    "output" =>
        $outputFile

], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

?>