<?php

header("Content-Type: text/plain; charset=UTF-8");

header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");


$url="https://dashboard.wakoticket.net/information/alpicokotsu/latlon.csv";

echo file_get_contents($url);

?>