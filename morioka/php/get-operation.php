<?php

header(
"Content-Type: application/json; charset=utf-8"
);


$file="../data/operation.json";


if(!file_exists($file)){

    echo json_encode([]);

    exit;

}


echo file_get_contents($file);


?>