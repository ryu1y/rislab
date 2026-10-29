
<?php
header('Content-Type: application/json; charset=utf-8');

$url = 'https://sena.unitrand.net/app/sena/api_v1.5/pina_base_api.php';

$params = [
    'app_code'    => 'PINA',
    'ids' => '00000060469759',
    'operation'   => 'location',
    'country'     => 'ja-JP',
    'ver'         => '3.0.7',
    'count'       => '1',
    'uuid'        => 'BBA12210-3A11-4F25-A49F-06CF81FFE7CB',
    'company_ids' => 'jp_kagoshima_kagoshimakotsu'
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
    echo json_encode(['error' => 'APIへの接続に失敗しました'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo $response;
