<?php

header("Content-Type: text/plain; charset=UTF-8");

$url = "https://dashboard.wakoticket.net/information/alpicokotsu/bus_stop.csv";

echo file_get_contents($url);

?>