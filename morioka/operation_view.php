<?php

date_default_timezone_set("Asia/Tokyo");

header("Content-Type: text/html; charset=UTF-8");


// ==================================================
// 日付
// ==================================================

$date = $_GET["date"] ?? date("Y-m-d");


// 日付形式チェック

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {

    $date = date("Y-m-d");

}


// ==================================================
// ファイル
// ==================================================

$weekdayFile =
    __DIR__ .
    "/data/get_log/weekday/" .
    $date .
    ".json";

$saturdayFile =
    __DIR__ .
    "/data/get_log/saturday/" .
    $date .
    ".json";

$holidayFile =
    __DIR__ .
    "/data/get_log/holiday/" .
    $date .
    ".json";


// ==================================================
// 読み込むファイル
// ==================================================
//
// holidayを最優先
//
// 例:
// 2026-08-14 が平日でも
//
// holiday/2026-08-14.json
//
// があればholidayを使用
// ==================================================

$logFile = "";
$dayType = "";


// ① holiday

if (file_exists($holidayFile)) {

    $logFile = $holidayFile;

    $dayType = "holiday";

}


// ② saturday

elseif (file_exists($saturdayFile)) {

    $logFile = $saturdayFile;

    $dayType = "saturday";

}


// ③ weekday

elseif (file_exists($weekdayFile)) {

    $logFile = $weekdayFile;

    $dayType = "weekday";

}


// ==================================================
// データ読み込み
// ==================================================

$data = [];

$errorMessage = "";


if ($logFile === "") {

    $errorMessage =
        "この日の仕業データがありません。";

}

else {

    $json =
        file_get_contents($logFile);


    if ($json === false) {

        $errorMessage =
            "ファイルを読み込めません。";

    }

    else {

        $data =
            json_decode(
                $json,
                true
            );


        if (
            json_last_error() !== JSON_ERROR_NONE
            ||
            !is_array($data)
        ) {

            $errorMessage =
                "仕業データの読み込みに失敗しました。";

            $data = [];

        }

    }

}


// ==================================================
// 曜日表示
// ==================================================

if ($dayType === "weekday") {

    $dayTypeName = "平日";

}

elseif ($dayType === "saturday") {

    $dayTypeName = "土曜";

}

elseif ($dayType === "holiday") {

    $dayTypeName = "日曜・祝日";

}

else {

    $dayTypeName = "不明";

}

?>

<!DOCTYPE html>

<html lang="ja">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>仕業を見る</title>


<style>

body {

    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    margin: 0;

    padding: 20px;

    background: #f5f5f5;

}


/* ================================
   タイトル
================================ */

h1 {

    margin: 0 0 10px 0;

    font-size: 24px;

}


/* ================================
   日付
================================ */

.date {

    margin-bottom: 20px;

    font-size: 16px;

}


.day-type {

    display: inline-block;

    margin-left: 8px;

    padding: 4px 10px;

    background: #e5e5e5;

    border-radius: 5px;

    font-size: 14px;

}


/* ================================
   使用ファイル
================================ */

.file {

    margin-bottom: 20px;

    padding: 10px;

    background: #fff8e1;

    border-radius: 6px;

    font-size: 13px;

    word-break: break-all;

}


/* ================================
   バス
================================ */

.bus {

    background: white;

    margin-bottom: 15px;

    padding: 15px;

    border-radius: 8px;

    box-shadow:
        0 1px 4px
        rgba(0,0,0,0.15);

}


/* ================================
   BUS ID
================================ */

.busid {

    font-size: 20px;

    font-weight: bold;

    margin-bottom: 10px;

}


/* ================================
   便
================================ */

.trip {

    display: flex;

    padding: 8px 0;

    border-top:
        1px solid #ddd;

    gap: 10px;

}


/* ================================
   時刻
================================ */

.time {

    width: 55px;

    flex-shrink: 0;

    font-weight: bold;

}


/* ================================
   路線
================================ */

.route {

    flex: 1;

}


/* ================================
   エラー
================================ */

.error {

    padding: 15px;

    background: #fff3f3;

    color: #c00000;

    border-radius: 8px;

}


/* ================================
   戻る
================================ */

.back {

    margin-top: 20px;

}


button {

    padding: 8px 15px;

    font-size: 15px;

    cursor: pointer;

}

</style>

</head>


<body>


<h1>
    仕業を見る
</h1>


<div class="date">

    <?= htmlspecialchars($date) ?>

    <span class="day-type">

        <?= htmlspecialchars($dayTypeName) ?>

    </span>

</div>


<?php if ($logFile !== ""): ?>

<div class="file">

    使用ファイル：

    <?= htmlspecialchars(
        str_replace(
            __DIR__ . "/",
            "",
            $logFile
        )
    ) ?>

</div>

<?php endif; ?>


<?php if ($errorMessage !== ""): ?>


<div class="error">

    <?= htmlspecialchars(
        $errorMessage
    ) ?>

</div>


<?php else: ?>


<?php foreach ($data as $bus): ?>


<div class="bus">


    <!-- BUS ID -->

    <div class="busid">

        BUS ID:

        <?= htmlspecialchars(
            $bus["busId"] ?? ""
        ) ?>

    </div>


    <!-- 仕業 -->

    <?php foreach (
        $bus["trips"] ?? []
        as $trip
    ): ?>


    <div class="trip">


        <div class="time">

            <?= htmlspecialchars(
                $trip["departureTime"] ?? ""
            ) ?>

        </div>


        <div class="route">

            <?= htmlspecialchars(
                $trip["routeName"] ?? ""
            ) ?>

        </div>


    </div>


    <?php endforeach; ?>


</div>


<?php endforeach; ?>


<?php if (empty($data)): ?>


<div class="error">

    この日の仕業データがありません。

</div>


<?php endif; ?>


<?php endif; ?>


<div class="back">

    <button
        onclick="history.back()"
    >

        戻る

    </button>

</div>


</body>

</html>