
<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$cacheFile = __DIR__ . '/../cache/vehicles.json';
$cacheDir = dirname($cacheFile);
$cacheSeconds = 25;

if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0775, true);
}

// 直近の取得結果があれば再利用
if (
    file_exists($cacheFile) &&
    time() - filemtime($cacheFile) < $cacheSeconds
) {
    readfile($cacheFile);
    exit;
}

$searchUrl = 'https://sena.unitrand.net/app/sena/api_v1.5/pina_search.php';

$params = [
    'app_code'   => 'PINA',
    'country'    => 'ja-JP',
    'company_id' => 'jp_kagoshima_kagoshimacity_bus',
    'ver'        => '3.0.7',
    'operation'  => 'get_route',
    'uuid'       => 'BBA12210-3A11-4F25-A49F-06CF81FFE7CB',
    'lon'        => '139.7089117280501',
    'lat'        => '35.59321026561992',
];

$ch = curl_init($searchUrl);

curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query($params),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: */*',
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

curl_close($ch);

if ($response === false || $httpCode !== 200) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'error' => '路線一覧の取得に失敗しました',
        'httpCode' => $httpCode,
        'curlError' => $curlError,
        'response' => $response,
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$routes = json_decode($response, true);

if (!is_array($routes)) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'error' => '路線一覧のJSON解析に失敗しました',
        'response' => mb_substr($response, 0, 1000),
    ], JSON_UNESCAPED_UNICODE);

    exit;
}
$routes = [];

foreach ($routesData as $id => $route) {
    if (isset($route['name'])) {
        $routes[] = [
            'id' => (string)$id,
            'name' => $route['name']
        ];
    }
}

$multi = curl_multi_init();
$pending = $routes;
$handles = [];
$vehicles = [];
$errors = 0;
$limit = 6;

$makeHandle = function ($route) use ($baseUrl) {
    $ch = curl_init(
        $baseUrl . 'pina_base_api.php'
    );

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'app_code' => 'PINA',
            'ids' => $route['id'],
            'operation' => 'location',
            'country' => 'ja-JP',
            'ver' => '3.0.7',
            'count' => '1',
            'uuid' => 'BBA12210-3A11-4F25-A49F-06CF81FFE7CB',
            'company_ids' => 'jp_kagoshima_kagoshimacity'
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: */*',
            'Accept-Language: ja'
        ]
    ]);

    return $ch;
};

do {
    while (count($handles) < $limit && count($pending) > 0) {
        $route = array_shift($pending);
        $ch = $makeHandle($route);

        $key = (int)$ch;
        $handles[$key] = [
            'handle' => $ch,
            'route' => $route
        ];

        curl_multi_add_handle($multi, $ch);
    }

    do {
        $status = curl_multi_exec($multi, $running);
    } while ($status === CURLM_CALL_MULTI_PERFORM);

    while ($info = curl_multi_info_read($multi)) {
        $ch = $info['handle'];
        $key = (int)$ch;
        $route = $handles[$key]['route'];

        $body = curl_multi_getcontent($ch);
        $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $data = json_decode($body, true);

        if (
            $info['result'] === CURLE_OK &&
            $httpStatus >= 200 &&
            $httpStatus < 300 &&
            is_array($data)
        ) {
            foreach ($data as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $name = $item['disp_name']
                    ?? $item['name']
                    ?? $route['name'];

                foreach (($item['list'] ?? []) as $vehicle) {
                    if (empty($vehicle['id']) || empty($vehicle['pts'])) {
                        continue;
                    }

                    $vehicle['routeName'] = $name;
                    $vehicle['routeId'] = $route['id'];

                    // 同じ車両が複数路線に現れた場合は1台にまとめる
                    $vehicles[(string)$vehicle['id']] = $vehicle;
                }
            }
        } else {
            $errors++;
        }

        curl_multi_remove_handle($multi, $ch);
        curl_close($ch);
        unset($handles[$key]);
    }

    if ($running && count($handles) > 0) {
        curl_multi_select($multi, 1.0);
    }
} while (count($pending) > 0 || count($handles) > 0);

curl_multi_close($multi);

$result = [
    'updatedAt' => date('c'),
    'routeCount' => count($routes),
    'vehicleCount' => count($vehicles),
    'failedRoutes' => $errors,
    'vehicles' => array_values($vehicles)
];

$json = json_encode(
    $result,
    JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
);

if ($json === false) {
    http_response_code(500);
    echo json_encode(['error' => 'JSON生成に失敗しました']);
    exit;
}

file_put_contents($cacheFile, $json, LOCK_EX);
echo $json;
