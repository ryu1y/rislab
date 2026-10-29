
<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$url = 'https://sena.unitrand.net/app/sena/api_v1.5/pina_search.php';

$params = [
    'app_code'   => 'PINA',
    'country'    => 'ja-JP',
    'company_id' => 'jp_kagoshima_kagoshimakotsu',
    'ver'        => '3.0.7',
    'operation'  => 'get_route',
    'uuid'       => 'BBA12210-3A11-4F25-A49F-06CF81FFE7CB',
    'lon'        => '139.7088927137102',
    'lat'        => '35.59325222551839'
];

$options = [
    'http' => [
        'method' => 'POST',
        'header' =>
            "Content-Type: application/x-www-form-urlencoded\r\n" .
            "Accept: */*\r\n" .
            "User-Agent: PINA/3.0.7\r\n",
        'content' => http_build_query($params),
        'timeout' => 20,
        'ignore_errors' => true
    ]
];

$context = stream_context_create($options);
$response = @file_get_contents($url, false, $context);

if ($response === false) {
    http_response_code(502);
    echo json_encode([
        'error' => '路線一覧APIへの接続に失敗しました'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode($response, true);

if (!is_array($data)) {
    http_response_code(502);
    echo json_encode([
        'error' => '路線一覧のJSONを解析できません',
        'response' => $response
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$routes = [];

foreach ($data as $routeId => $info) {
    if (!is_array($info)) {
        continue;
    }

    $routes[] = [
        'routeId'   => (string)$routeId,
        'routeName' => $info['name'] ?? '名称不明',
        'sortIndex' => $info['sort_index'] ?? null
    ];
}

echo json_encode([
    'routeCount' => count($routes),
    'routes' => $routes
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
