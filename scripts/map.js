/**
 * Created by PederGB on 30.03.2017.
 */

// ---------------------------------------- OIL INFO BOX CODE --------------------------------------- \\
// getting "dataOil" json object
var request = new XMLHttpRequest();
request.open("GET", "../data/dataOil.json", false);
request.send(null);
var data = JSON.parse(request.responseText);

//function for creating info boxes
function makeOilBox(content, type, lat, long) {
    var color;
    if (type == "GAS")color = "red";
    else if (type == "OIL")color = "black";
    else color = "gray";
    var marker = new google.maps.Marker({
        position: {lat: lat, lng: long},
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 2.5,
            strokeColor: color
        },
        map: map
    });
    infoMarkers.push(marker);


    var infowindow = new google.maps.InfoWindow({
        content: content + "<br>" + type + "<br>" + "Lat: " + lat + ", Long: " + long,
        dist: 40001,
        type: type
});
    infoWindows.push(infowindow);

    marker.addListener('click', function () {
        infowindow.open(map, marker);
        openBoxes.unshift(infowindow);
        if (!isMultipleTextboxes){
            for (var i = 1; i < openBoxes.length; i++){
                openBoxes[i].close();
                openBoxes.splice(i);
            }
        }
    });
}
// ---------------------------------------- ............ --------------------------------------- \\
// closing all boxes when map is clicked
//TODO small bug: if infowindow is closed by click on the same marker and then trying to reopen by clicking marker again
var openBoxes = [];
google.maps.event.addListener(map, 'click', function() {
    for (var i = 0; i < openBoxes.length; i++){
        openBoxes[i].close(); //closing infobox
        if(!isMultipleTextboxes) openBoxes.splice(i); //removing infobox from openBoxes list
    }
});
// --------------------------- Showing and hiding markers/info windows -------------------------- \\
function sortAwayOil(){
    for (var i = 0; i < infoWindows.length; i++){
        if (infoWindows[i].type == "OIL") {
            infoMarkers[i].setMap(null);
        }
    }
}
function sortInOil() {
    for (var i = 0; i < infoWindows.length; i++){
        if (infoWindows[i].type == "OIL") {
            infoMarkers[i].setMap(map);
        }
    }
}

function sortAwayGas(){
    for (var i = 0; i < infoWindows.length; i++){
        if (infoWindows[i].type == "GAS") {
            infoMarkers[i].setMap(null);
        }
    }
}
function sortInGas() {
    for (var i = 0; i < infoWindows.length; i++){
        if (infoWindows[i].type == "GAS") {
            infoMarkers[i].setMap(map);
        }
    }
}

function sortAwayOther(){
    for (var i = 0; i < infoWindows.length; i++){
        if ((infoWindows[i].type != "GAS") && (infoWindows[i].type != "OIL")){
            infoMarkers[i].setMap(null);
        }
    }
}
function sortInOther() {
    for (var i = 0; i < infoWindows.length; i++){
        if ((infoWindows[i].type != "GAS") && (infoWindows[i].type != "OIL")) {
            infoMarkers[i].setMap(map);
        }
    }
}
// ---------------------------------------- ............ --------------------------------------- \\

// ---------------------------------------- WEATHER BOX CODE --------------------------------------- \\

// getting weather XML from yr.no
function getWeather(platform, parseTxt) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            loopPlatformsSetWeather(this, parseTxt);
        }
    };
    xmlhttp.open("GET", "https://www.yr.no/sted/Norge/Hav/" + platform + "/varsel.xml", true);
    xmlhttp.send();
}

function loopPlatformsSetWeather(xml, parseTxt) {
    data = xml.responseXML;
    var txt;
    var lat;
    var lng;

    if (parseTxt == "forecast") {
        txt = data.getElementsByTagName("location")[2].getElementsByTagName("body")[0].firstChild.data
        lat = parseFloat(data.getElementsByTagName("location")[1].getAttributeNode("latitude").value);
        lng = parseFloat(data.getElementsByTagName("location")[1].getAttributeNode("longitude").value);
    }
    else if(parseTxt == "wind"){
        txt = "Vindhastighet: " + data.getElementsByTagName("observations")[0].getElementsByTagName("windSpeed")[0].getAttributeNode("mps").value + "m/s";
        lat = data.getElementsByTagName("observations")[0].getElementsByTagName("weatherstation")[0].getAttributeNode("lat").value;
        lng = data.getElementsByTagName("observations")[0].getElementsByTagName("weatherstation")[0].getAttributeNode("lon").value;
    }
    //console.log(oilBoxCordinates[0]);
    //console.log(infoWindows[0].content);

    // adds weather forecast to markers if it's closer than 50 km to a yr.no forecast.
    for (var i = 0; i < oilBoxCordinates.length; i++){
        var tempDist = findDist(oilBoxCordinates[i][0], oilBoxCordinates[i][1], lat, lng);
        if ((tempDist < 40000) && tempDist < infoWindows[i].dist){
            //deletes old weather message if a new one is closer
            var tempContent = infoWindows[i].content.split(oilBoxCordinates[i][1])[0];
            infoWindows[i].setContent(tempContent + oilBoxCordinates[i][1]  + "<br>" + txt);
            infoWindows[i].dist = tempDist;
        }
    }
    //adds "weather data not available" on short info windows
    /*for (var j = 0; j < oilBoxCordinates.length; j++){
        if (infoWindows[j].content.length < 80) {
            var tempContent2 = infoWindows[j].content.split(oilBoxCordinates[j][1])[0];
            infoWindows[j].setContent(tempContent2 + oilBoxCordinates[j][1] + "<br>" +
                "Platformen har ingen tilgjengelig værdata");
        }
    }*/
}
// ---------------------------------------- ............. --------------------------------------- \\
// finding distance between two coordinates
google.maps.event.addListener(map, 'click', findDist);
function findDist(aLat, aLong, bLat, bLong) {
    var a = new google.maps.LatLng(aLat,aLong);
    var b = new google.maps.LatLng(bLat,bLong);
    return google.maps.geometry.spherical.computeDistanceBetween(a,b);
}
// ---------------------------------------- Search for platform --------------------------------------- \\
function searchPlatforms(input) {
    request.open("GET", "../data/dataOil.json", false); // reusing code form higher up
    request.send(null);
    var data = JSON.parse(request.responseText);

    var platformsFound = [];
    for (var i = 0; i < data.length; i++){
        try {
            var tempPlatform = data[i].name.toLowerCase();
            if (tempPlatform.indexOf(input.toLowerCase()) != -1) {
                console.log(data[i].name.toLowerCase());
                platformsFound.push(data[i]);
            }
        }
        catch (e){//aint doing nothing
        }
    }
    return platformsFound;
}

//changes marker by a given platform name
function changeMarker(name){
    for (var i = 0; i < infoWindows.length; i++){
        if (infoWindows[i].content.indexOf(name) != -1){
            var realColor = infoMarkers[i].icon.strokeColor;
            infoMarkers[i].icon.strokeColor = "#22d300";
            infoMarkers[i].icon.scale = 7;
            infoMarkers[i].setMap(map);
            break;
        }
    }
    setTimeout(function () { //the selected marker goes back to normal after 6 seconds
        infoMarkers[i].icon.strokeColor = realColor;
        infoMarkers[i].icon.scale = 2.5;
        infoMarkers[i].setMap(map);
    }, 6000)
}


// ---------------------------------------- ............. --------------------------------------- \\



// ---------------------------------------- MAIN (RUNNING SCRIPT) --------------------------------------- \\
var oilBoxCordinates = [];
var infoWindows = [];
var infoMarkers = [];


//oil platform url parts from yr.no/sted/Oljeplattformene/
var platforms = [/*Nordsjøen:*/ "Alvheim", "Balder", "Brage", "Ekofisk A", "Ekofisk H", "Eldfisk A", "Gjøa", "Grane",
    "Gudrun", "Gullfaks A", "Gyda", "Heimdal", "Oseberg A", "Oseberg Øst", "Petrojarl Varg", "Ringhorne", "Sleipner A",
    "Snorre A", "Statfjord A", "Tor", "Troll A", "Ula", "Valemon", "Valhall", "Veslefrikk B", "Visund",
    /*Norskehavet:*/ "Draugen", "Goliat", "Heidrun", "Kristin", "Njord A", "Norne", "Åsgard A"];

function makeAllInfoWindows(parseTxt) {
    for (var z = 0; z < platforms.length; z++) {
        getWeather(platforms[z], parseTxt);
    }

// making the info boxes
    for (var i = 0; i < data.length; i++) {
        try {
            makeOilBox(data[i].name, data[i].type, parseFloat(data[i].vertices.SumLat),
                parseFloat(data[i].vertices.SumLong));
            var tempCor = [parseFloat(data[i].vertices.SumLat), parseFloat(data[i].vertices.SumLong), 60001];
            oilBoxCordinates.push(tempCor)
        }
        catch (TypeError) {
            console.log("TypeError, object: " + i);
        }
    }
    console.log(isWeatherWorking);
}
try{
    makeAllInfoWindows("wind");
}
//TODO
catch (e){
    //alert("Cannot get weather data.\n\nCORS error: Cross-origin request is not allowed. Fix it, Peder.\n");
}
