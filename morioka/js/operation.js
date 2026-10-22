let operations=[];



//===========================
// 読み込み
//===========================

fetch(
"php/get-operation.php"
)

.then(r=>r.json())

.then(data=>{


    operations=data;


});



//===========================
// 検索
//===========================

function searchBus(){


let id=
Number(
document.getElementById("busId").value
);



let bus=
operations.find(
b=>b.busId===id
);



let div=
document.getElementById("result");



div.innerHTML="";



if(!bus){


div.innerHTML=
"車両データなし";


return;

}




let html="";


html+=
"<h3>BusId : "
+bus.busId+
"</h3>";



bus.trips.forEach(
(trip,index)=>{


html+=`

<div class="trip">


<div class="route">

${index+1}便　
系統 ${trip.system}

</div>



<p>

${trip.routeName}

</p>



<p class="time">

${trip.startTime}

</p>


<p>

${trip.startPlace}

<br>

↓

<br>

${trip.endPlace}

</p>



<p>

${trip.headsign}

</p>



</div>


`;


});



div.innerHTML=html;


}