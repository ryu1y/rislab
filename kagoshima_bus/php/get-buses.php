
<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$baseUrl = 'https://sena.unitrand.net/app/sena/api_v1.5/pina_base_api.php';
$configFile = __DIR__ . '/../data/selected-routes.json';
$cacheFile = __DIR__ . '/../data/cache-buses.json';

$timeoutSeconds = 8;
$connectTimeoutSeconds = 4;
$parallelLimit = 8;
$cacheSeconds = 10;

// JSON出力
function outputJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
    );
    exit;
}

// 設定ファイルの確認
if (!file_exists($configFile)) {
    outputJson([
        'error' => '路線設定ファイルがありません',
        'file' => $configFile
    ], 500);
}

$configText = file_get_contents($configFile);
$selectedRoutes = json_decode($configText, true);

if (!is_array($selectedRoutes)) {
    outputJson([
        'error' => 'selected-routes.json のJSON形式が正しくありません',
        'detail' => json_last_error_msg()
    ], 500);
}

// 10秒以内のキャッシュがあれば再利用
if (file_exists($cacheFile)) {
    $cachedText = file_get_contents($cacheFile);
    $cached = json_decode($cachedText, true);

    if (
        is_array($cached) &&
        isset($cached['savedAt'], $cached['payload']) &&
        time() - (int)$cached['savedAt'] < $cacheSeconds
    ) {
        header('X-Bus-Cache: HIT');
        outputJson($cached['payload']);
    }
}

header('X-Bus-Cache: MISS');

// cURLが使えるか確認
if (!function_exists('curl_init') || !function_exists('curl_multi_init')) {
    outputJson([
        'error' => 'PHPのcURL拡張が無効です',
        'detail' => 'XAMPPのphp.iniでextension=curlを有効にしてください'
    ], 500);
}

// 有効な路線だけを取り出す
$routes = [];

foreach ($selectedRoutes as $route) {
    if (!is_array($route)) {
        continue;
    }

    $routeId = trim((string)($route['routeId'] ?? ''));

    if ($routeId === '') {
        continue;
    }

    $routes[] = [
        'routeId' => $routeId,
        'routeName' => $route['routeName'] ?? null
    ];
}

$buses = [];
$errors = 0;
$checkedRoutes = 0;

// 8路線ずつ並列取得
foreach (array_chunk($routes, $parallelLimit) as $batch) {
    $multiHandle = curl_multi_init();
    $handles = [];

    foreach ($batch as $route) {
        $params = [
            'app_code'    => 'PINA',
            'ids'         => $route['routeId'],
            'operation'   => 'location',
            'country'     => 'ja-JP',
            'ver'         => '3.0.7',
            'count'       => '1',
            'uuid'        => 'BBA12210-3A11-4F25-A49F-06CF81FFE7CB',
            'company_ids' => 'jp_kagoshima_kagoshimakotsu'
        ];

        $ch = curl_init($baseUrl);

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($params),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: */*',
                'User-Agent: PINA/3.0.7'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => $connectTimeoutSeconds,
            CURLOPT_TIMEOUT => $timeoutSeconds,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2
        ]);

        curl_multi_add_handle($multiHandle, $ch);

        $handles[] = [
            'handle' => $ch,
            'route' => $route
        ];
    }

    // 全リクエストを並行して実行
    $running = null;

    do {
        $multiResult = curl_multi_exec($multiHandle, $running);

        if ($running > 0) {
            $selected = curl_multi_select($multiHandle, 1.0);

            if ($selected === -1) {
                usleep(100000);
            }
        }
    } while ($running > 0 && $multiResult === CURLM_OK);

    // 応答を解析
    foreach ($handles as $entry) {
        $ch = $entry['handle'];
        $route = $entry['route'];

        $response = curl_multi_getcontent($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_errno($ch);

        $checkedRoutes++;

        if ($curlError !== 0 || $httpCode < 200 || $httpCode >= 300) {
            $errors++;
            curl_multi_remove_handle($multiHandle, $ch);
            curl_close($ch);
            continue;
        }

        $data = json_decode($response, true);

        if (!is_array($data)) {
            $errors++;
            curl_multi_remove_handle($multiHandle, $ch);
            curl_close($ch);
            continue;
        }

        foreach ($data as $routeResult) {
            if (!is_array($routeResult)) {
                continue;
            }

            $items = $routeResult['list'] ?? [];

            if (!is_array($items)) {
                continue;
            }

            foreach ($items as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $pts = explode(',', (string)($item['pts'] ?? ''));

                if (
                    count($pts) < 3 ||
                    !is_numeric($pts[1]) ||
                    !is_numeric($pts[2])
                ) {
                    continue;
                }

                $latitude = (float)$pts[1];
                $longitude = (float)$pts[2];

                if (
                    $latitude < -90 || $latitude > 90 ||
                    $longitude < -180 || $longitude > 180
                ) {
                    continue;
                }

                $apiRouteName = $routeResult['name'] ?? null;
                $customRouteName = $route['routeName'];

                $routeName = is_string($customRouteName)
                    && trim($customRouteName) !== ''
                    ? $customRouteName
                    : ($apiRouteName ?? '名称不明');

                $buses[] = [
                    'vehicleId' => $item['id'] ?? '',
                    'routeId' => $routeResult['id'] ?? $route['routeId'],
                    'routeName' => $routeName,
                    'timestamp' => $pts[0],
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'lag' => $item['lag'] ?? null,
                    'type' => $item['type'] ?? '',
                    'number' => $item['number'] ?? ''
                ];
            }
        }

        curl_multi_remove_handle($multiHandle, $ch);
        curl_close($ch);
    }

    curl_multi_close($multiHandle);
}

// 結果をまとめる
$result = [
    'checkedRoutes' => $checkedRoutes,
    'totalRoutes' => count($routes),
    'errorCount' => $errors,
    'buses' => $buses
];

// エラーのない結果だけをキャッシュ
if ($errors === 0) {
    $cacheData = [
        'savedAt' => time(),
        'payload' => $result
    ];

    @file_put_contents(
        $cacheFile,
        json_encode($cacheData, JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
}

outputJson($result);
