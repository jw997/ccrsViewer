import { getMS, getJson, makeKey, fileNameIze } from "./utils_helper.js";

import { findClosest } from "./gpsaddr.js";

// touch or mouse?
let mql = window.matchMedia("(pointer: fine)");
const pointerFine = mql.matches;

// set default chart font color to black
Chart.defaults.color = '#000';
Chart.defaults.font.size = 14;
const selectCounty = document.querySelector('#selectCounty');
const selectCity = document.querySelector('#selectCity');

const selectVehicleTypes = document.querySelector('#selectVehicleTypes');

const Year_First=2016;
const Year_Last=2025;

// ADD NEW YEAR
const check2025 = document.querySelector('#check2025');
const check2024 = document.querySelector('#check2024');
const check2023 = document.querySelector('#check2023');
const check2022 = document.querySelector('#check2022');
const check2021 = document.querySelector('#check2021');
const check2020 = document.querySelector('#check2020');

const check2019 = document.querySelector('#check2019');
const check2018 = document.querySelector('#check2018');
const check2017 = document.querySelector('#check2017');
const check2016 = document.querySelector('#check2016');
//const check2015 = document.querySelector('#check2015');

const selectStreet = document.querySelector('#selectStreet');
const selectSeverity = document.querySelector('#severity');
const selectStopResult = document.querySelector('#stopResult');

const summary = document.querySelector('#summary');

const saveanchor = document.getElementById('saveanchor')

const countyCityJsonFile = './data/county_cities.json';
const countyCityJSON = await getJson(countyCityJsonFile);

// test get a file from other repo
const testurl = 'https://jw997.github.io/osm-intersections/data/intersections/intersections_alamedacounty.json'

const testJson = await getJson(testurl);

// populate the city select
function populateSelect(selectData, select) {

	// remove any existing options
	const optionCount = select.options.length;
	for (let i = 0; i < optionCount; i++) {
		select.options.remove(0)
	}

	for (const datum of selectData) {

		const opt = document.createElement("option");
		opt.value = datum;
		opt.text = datum;  // name is first synonym from streetArray
		select.add(opt, null);
	}
}

const mapCountyToCities = new Map();
const arrCounties = [];
const arrCountyCityKeys = [];

for (const obj of countyCityJSON) {
	arrCounties.push(obj.countyName);
	mapCountyToCities.set(obj.countyName, obj.cityNames);
	for (const city of obj.cityNames) {
		const k = makeKey(obj.countyName, city);
		arrCountyCityKeys.push(k);
	}
}

populateSelect(arrCounties, selectCounty);

function getCitiesForCounty(county) {
	return mapCountyToCities.get(county);
}

/* when county select changes, populate the city */
selectCounty.addEventListener('change', (event) => {
	console.log("Select county changed to ", selectCounty.value);
	const county = selectCounty.value;
	const arrCities = ["Any", "Unincorporated"].concat(getCitiesForCounty(county));
	populateSelect(arrCities, selectCity)
});

function getStreetsForCountyCity(county, city) {
	const k = makeKey(county, city);
	const obj = mapCountyCityToStreets.get(k);
	return obj.streets;
}

/* when city changes,  fill the streets */
selectCity.addEventListener('change', (event) => {
	console.log("Select city changed to ", selectCity.value);
	const county = selectCounty.value;
	const city = selectCity.value;
	const arrStreets = ['Any'].concat(getStreetsForCountyCity(county, city));
	populateSelect(arrStreets, selectStreet)
});


/* read streets for each county / city */
getMS();
const mapCountyCityToStreets = new Map();

for (const k of arrCountyCityKeys) {
	console.log(k);
	// make a file name out oof k
	const locName = fileNameIze(k);
	const fileName = 'data/streets/' + 'streets_' + locName + '.json';

	console.log("Reading streets file ", fileName)

	const obj = await getJson(fileName);
	mapCountyCityToStreets.set(k, obj)
}
getMS('read streets');


function getIcon(name) {
	const icon = new L.Icon({
		//	iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/' + name,
		iconUrl: './images/' + name,
		//	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
		shadowUrl: './images/marker-shadow.png',
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41]
	});
	return icon;

}

const greenIcon = getIcon('marker-highway-green.png');
const redIcon = getIcon('marker-highway-red.png');
const orangeIcon = getIcon('marker-highway-orange.png');
const yellowIcon = getIcon('marker-highway-yellow.png');
const goldIcon = getIcon('marker-highway-brown.png');
const blueIcon = getIcon('marker-highway-blue.png');
const violetIcon = getIcon('marker-icon-violet.png');



const w3_highway_brown = '#633517';
const w3_highway_red = '#a6001a';
const w3_highway_orange = '#e06000';
const w3_highway_schoolbus = '#ee9600';
const w3_highway_yellow = '#ffab00';
const w3_highway_green = '#004d33';
const w3_highway_blue = '#00477e';

const violet = "#9400d3";//"#EE82EE";

const black = "#000000";

const grey = "#101010";

const stopNoAction = "No Action"
const stopCitation = "Citation"
const stopWarning = "Warning"
const stopArrest = "Arrest"
const stopUnkown = "unknown"




function getOptionsForSeverity(sev) {
	var colorValue;
	var rad = 6;
	var opa = 0.5;

	switch (sev) {
		case 'Fatal':
			colorValue = w3_highway_red;
			rad = 10;
			opa = 1;
			break;
		case "Serious Injury":
			colorValue = w3_highway_orange;
			rad = 8;
			opa = 1;
			break;
		case "Minor Injury":
			colorValue = w3_highway_brown;
			opa = 1;
			break;
		case "Possible Injury":
			colorValue = w3_highway_yellow;
			break;
		case "No Injury":
			colorValue = w3_highway_blue;
			break;
		case "Unspecified Injury":
			colorValue = violet;
			break;
		default:
			console.error("Unexpected Injury severity ", sev);
	}
	if (!pointerFine) {
		rad *= 1.5;
	}
	const retval = {
		color: colorValue,
		radius: rad,
		fill: true,
		fillOpacity: opa
	};
	return retval;

}



// todo make a severity class with the icons and text wrapped together
function getIconForSeverity(sev) {
	var icon;
	switch (sev) {
		case 'Fatal':
			icon = redIcon;
			break;
		case "Serious Injury":
			icon = orangeIcon;
			break;
		case "Minor Injury":
			icon = goldIcon;
			break;
		case "Possible Injury":
			icon = yellowIcon;
			break;
		case "No Injury":
			icon = blueIcon;
			break;
		case "Unspecified Injury":
			icon = violetIcon;
			break;
		default:
			console.error("Unexpected Injury severity ", sev);
	}
	return icon;
}

/*
async function getCityBoundary() {
	const file = './data/cityboundary/Land_Boundary.geojson';
	const cityGeoJson = await getJson(file);
	return cityGeoJson;
}

const cityGeoJson = await getCityBoundary();

getMS();
*/


getMS();

const mapCountyYearToData = new Map(); // key from MakeKey(county, year) county/year 

async function getCCRSDataCache(year, county) {
	const k = makeKey(county, year)
	const cachedData = mapCountyYearToData.get(k)
	
	if (cachedData) {
		return cachedData;
	}


	//  https://raw.githubusercontent.com/jw997/ccrsData/refs/heads/main/test/ccrs    2024_Alameda_County.json

	//https://jw997.github.io/ccrsData/test/ccrs2024_Alameda_County.json

	//  http://127.0.0.1:8087/test/ccrs    2024_Alameda_County.json



	// const file = './data/ccrsByCounty/ccrs' + year + '_' + fileNameIze(county) + '.json';
	//const file = 'https://raw.githubusercontent.com/jw997/ccrsData/refs/heads/main/test/ccrs' + year + '_' + fileNameIze(county) + '.json';
	 const file = 'https://jw997.github.io/ccrsData/data/ccrs' + year + '_' + fileNameIze(county) + '.json';

	//const file = 'http://127.0.0.1:8087/data/ccrs' + year + '_' + fileNameIze(county) + '.json';
	
	
	const ccrsJson = await getJson(file);
	mapCountyYearToData.set(k,ccrsJson.features);

	return ccrsJson.features;
}

async function loadCcrsData(years, county){
	for (const y of years) {
		await getCCRSDataCache(y, county);
	}
}

// iterator for loaded data for a county
function* makeCcrsIterator(county) {

	let iterationCount = 0;

	for (let y = Year_First; y <= Year_Last; y++) {
		const k = makeKey(county, y);
		if (mapCountyYearToData.has(k)) {
			const data = mapCountyYearToData.get(k);
			for (const datum of data) {
				iterationCount++;
				yield datum;
			}
		}
	}
	return iterationCount;
  }



async function getCCRSData() {
	var arrays = [];
	// ADD NEW YEAR
	for (var y = 2024; y <= 2025; y++) {
		// const file = './data/ccrs/ccrs' + y + '.json';
		// const file = './data/ccrsOakland/addgps/ccrs' + y + '.json';
		const file = './data/ccrsAlamedaCounty/addgpsmulti/ccrs' + y + '.json';
		//const file = './data/ccrsLosAngelesCounty/ccrs' + y + '.json';
		//const fileNames = ['ccrs/ccrs2025.json'];
		//for (const fName of fileNames) {
		//	const file = './data/' + fName;
		// ccrs2024_Alameda_County.json 

		for (const { countyName: county } of countyCityJSON) {
			//const file = './data/ccrsByCounty/ccrs' + y + '_' + fileNameIze(county) + '.json';
		//	const ccrsJson = await getJson(file);
			//arrays.push(ccrsJson.features);
			const oneFile = await getCCRSDataCache(y,county)
			arrays.push(oneFile);
		}
	}
	const retval = [].concat(...arrays)
	return retval;
}

const mergedCCRSJson = []; //await (getCCRSData());


getMS('loading CCRS data')
const setCityNames = new Set();
for (const f of mergedCCRSJson) {
	const attr = f.attributes;
	setCityNames.add(attr.CityName);
}

const arrCity = ['Any'];
const newCities = Array.from(setCityNames).sort();
for (const c of newCities) {
	arrCity.push(c)
}

//populateSelect( arrCity , selectCity);

getMS('city list')


// read fatal crash override data
/*
async function getOverrideData() {
	var arrays = [];

	const fileNames = ['fatal.json'];
	for (const fName of fileNames) {
		const file = './data/override/' + fName;
		const overrideJson = await getJson(file);
		arrays.push(overrideJson.features);

	}
	const retval = [].concat(...arrays)
	return retval;
}

const overrideJson = await getOverrideData();



*/

/*
function makeTimeStamp(c) {
	const d = coll.attributes.Date;
	const t = coll.attributes.Time;

	if (!d || !t) {
		console.log("collision with missing date time ", coll);
		return undefined;
	} else {
		const str = d + ' ' + t;
		const ts = Date.parse(str);
		return ts;
	}

}

function makeTimeStampSet(arr) {
	var setTimeStamps = new Set();
	for (const coll of arr) {
		const d = coll.attributes.Date;
		const t = coll.attributes.Time;

		if (!d || !t) {
			console.log("collision with missing date time ", coll);
		} else {
			const str = d + ' ' + t;
			const ts = Date.parse(str);
			if (setTimeStamps.has(str)) {
				console.log("collsion with dupe date time ", coll);

			} else {
				setTimeStamps.add(ts);
				if (!coll.attributes.DateTime) {
					coll.attributes.DateTime = ts;
				}
			}
		}
	}
	return setTimeStamps;
}

function makeTimeStampMap(arr) {
	var setTimeStamps = new Map();
	for (const coll of arr) {
		const d = coll.attributes.Date;
		const t = coll.attributes.Time;

		if (!d || !t) {
			console.log("collision with missing date time ", coll);
		} else {
			const str = d + ' ' + t;
			const ts = Date.parse(str);
			if (setTimeStamps.has(str)) {
				console.log("collsion with dupe date time ", coll);

			} else {
				setTimeStamps.set(ts, coll);
				if (!coll.attributes.DateTime) {
					coll.attributes.DateTime = ts;
				}
			}
		}
	}
	return setTimeStamps;
}
getMS();
// make set of swtrs collision time stamps
const tsCcrs = makeTimeStampSet(mergedCCRSJson);




// make maps of ts to coll
const tsMapCcrs = makeTimeStampMap(mergedCCRSJson);

getMS("Made time stamp sets")
*/


getMS();

// apply overrides by local id
// these correct severity for fatal crashes, and add news urls
/*
function applyOverrides(overrides) {
	for (const o of overrides) {
		const oa = o.attributes;
		const t = lidMapTransparency.get(oa.Case_Number);
		if (t) {
			const attr = t.attributes;
			attr.Injury_Severity = oa.Injury_Severity;
			attr.url = oa.url;
		} else {
			console.log("override not matched ", oa.Case_Number)
		}

		const s = lidMapSwitrs.get(oa.Case_Number);
		if (s) {
			const attr = s.attributes;
			attr.Injury_Severity = oa.Injury_Severity;
			attr.url = oa.url;
		}

		const c = lidMapCcrs.get(oa.Case_Number);
		if (c) {
			const attr = c.attributes;
			attr.Injury_Severity = oa.Injury_Severity;
			attr.url = oa.url;
		}
	}
}
*/
//applyOverrides(overrideJson);
getMS();

/*
const tsSwrtsIntersectionTransparency = tsSwtrs.intersection(tsTransparency);
const tsSwtrsMinusTransparency = tsSwtrs.difference(tsTransparency);
const tsTransparencyMinusSwtrs = tsTransparency.difference(tsSwtrs);
*/
// for union, start with switrs and ccrs




/*
console.log(" mergedUnion: ", mergedUnion.length);

console.log("Swtrs time stamps: ", tsSwtrs.size);
console.log("Transparency time stamps: ", tsTransparency.size);

console.log("tsSwtrsUnionTransparency: ", tsSwtrsUnionTransparency.size);
console.log("tsSwrtsIntersectionTransparency :", tsSwrtsIntersectionTransparency.size);

console.log("tsSwtrsMinusTransparency: ", tsSwtrsMinusTransparency.size);

console.log("tsTransparencyMinusSwtrs: ", tsTransparencyMinusSwtrs.size);
*/



//const mergedTransparencyJson = mergedSWITRSJson;

const popupFields = ['Date',
	'Time',
	
	'Case_Number',

	'Local_Report_Number',
	'Accident_Location',
	'Accident_Location_Offset',
	'CityName',
	'Latitude',
	'Longitude',

	'Primary_Collision_Factor_Code',
	'PCF_Description',

	'Involved_Objects',
	
	'Party_at_Fault',
	'Number_of_Injuries',
	'Number_of_Fatalities',
	
	'Injury_Severity',
	"Injury_Ages",
	"url"


];
function collisionPopup(obj) {
	var msg = "";
	for (const k of popupFields) {
		const v = obj[k];
		if (v) {
			msg += (k + ': ' + v + '<br>');
		}
	}
	return msg;
}

var map;

function createMap() {
	// Where you want to render the map.
	var element = document.getElementById('osm-map');
	// Height has to be set. You can do this in CSS too.
	//element.style = 'height:100vh;';
	// Create Leaflet map on map element.
	map = L.map(element, {
		preferCanvas: true
	});
	// Add OSM tile layer to the Leaflet map.
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	// Target's GPS coordinates.
	var target = L.latLng('37.87', '-122.27'); // berkeley 37°52′18″N 122°16′22″W
	// Set map's center to target with zoom 14.
	map.setView(target, 14);
	// add geojson precincts to map
}






function createCrashLegend() {
	const legend = L.control.Legend({
		position: "bottomright",
		title: 'Injury',
		collapsed: false,
		symbolWidth: 24,
		opacity: 0.6,
		column: 1,

		legends: [{
			label: "Fatal",
			type: "circle",
			color: w3_highway_red,
			fillColor: w3_highway_red

			//url: "./images/marker-highway-red.png",
		}, {
			label: "Serious",
			type: "circle",

			color: w3_highway_orange,
			fillColor: w3_highway_orange
			//url: "./images/marker-highway-orange.png",
		}, {
			label: "Minor",
			type: "circle",
			color: w3_highway_brown,
			fillColor: w3_highway_brown
			//url: "./images/marker-highway-brown.png"
		}, {
			label: "Possible",
			type: "circle",
			color: w3_highway_yellow,
			fillColor: w3_highway_yellow

			//url: "./images/marker-highway-yellow.png",
		}, {
			label: "No Injury",
			type: "circle",
			color: w3_highway_blue,
			fillColor: w3_highway_blue
			//url: "./images/marker-highway-blue.png"
		}, {
			label: "Unspecified",
			type: "circle",
			color: violet,
			fillColor: violet
			//url: "./images/marker-icon-violet.png",

		}
		]

	})

	return legend;
}


const legendCrash = createCrashLegend();


createMap();

//if (pointerFine) { // skip the legend for the mobile case.  maybe make a smaller legend?
//const legend = createLegend();
//}

// add city boundary to map
//L.geoJSON(cityGeoJson, { fillOpacity: 0.05 }).addTo(map);

const resizeObserver = new ResizeObserver(() => {
	console.log("resize observer fired");
	map.invalidateSize();
});

resizeObserver.observe(document.getElementById('osm-map'));


// keep track of markers for removal
const markers = [];

function removeAllMakers() {
	for (const m of markers) {
		m.remove();
	}
}

function removeStreetEndings(instr) {

	const thingsToRemove = [' AVENUE', ' STREET', ' ROAD', ' COURT', ' BOULEVARD', ' LANE', ' COURT', ' WAY'];  // to do add more
	for (const p of thingsToRemove) {
		if (instr.endsWith(p)) {
			const retval = instr.slice(0, -p.length)
			return retval;
		}
	}
}
function checkFilter(coll, vehTypeRegExp,
	filter2025,
	filter2024, filter2023,
	filter2022, filter2021, filter2020,
	filter2019,
	filter2018,
	filter2017,
	filter2016,
	//filter2015,

	selectStreet, severity, selectStopResult, selectCity, selectCounty
) {

	// for traffic stops, just return true
	//if (coll.attributes.Stop_GlobalID) {
	//	return true;
	//}
	const attr = coll.attributes;

	if ((selectCounty != 'Any') && (attr.CountyName != selectCounty)) {
		return false;
	}

	if ((selectCity != 'Any') && (attr.CityName != selectCity)) {
		return false;
	}
	/*
		if (!tsSet.has(attr.DateTime)) {
			return false;
		}*/

	const year = attr.Year;
	if ((year == 2025) && !filter2025) {
		return false;

	}
	if ((year == 2024) && !filter2024) {
		return false;

	}
	if ((year == 2023) && !filter2023) {
		return false;

	}
	if ((year == 2022) && !filter2022) {
		return false;

	}
	if ((year == 2021) && !filter2021) {
		return false;

	}
	if ((year == 2020) && !filter2020) {
		return false;

	}
	if ((year == 2019) && !filter2019) {
		return false;

	}
	if ((year == 2018) && !filter2018) {
		return false;

	}
	if ((year == 2017) && !filter2017) {
		return false;

	}
	if ((year == 2016) && !filter2016) {
		return false;

	}
	/*	if ((year == 2015) && !filter2015) {
			return false;
	
		}*/
	if ((year < 2016) || (year > 2025)) {
		return false;
	}
	/*
		if (coll.attributes.Stop_GlobalID) {
			const loc = attr.Stop_Location;
	
			if (selectStreet != "Any") {
	
				if (selectStreet.includes('|')) {
					const re = new RegExp(selectStreet, 'i');
	
					if (!loc.match(re)) {
						return false;
					}
				} else {
					const m = loc.toUpperCase().includes(selectStreet.toUpperCase());
					if (!m) {
						return false;
					}
				}
			}
			if (selectStopResult != "Any") {
	
				const res = getStopResultCategory(attr.Result_of_Stop);
				if (res != selectStopResult) {
					return false;
				}
			}
	
		
	
			return true;
		}*/

	const involved = attr.Involved_Objects;
	const m = involved.match(vehTypeRegExp);

	if (!m) {
		return false;
	}

	const loc = attr.Accident_Location;

	if (selectStreet != "Any") {

		if (selectStreet.includes('|')) {
			const re = new RegExp(selectStreet, 'i');

			if (!loc.match(re)) {
				return false;
			}
		} else {
			const ss = removeStreetEndings(selectStreet.toUpperCase());
			const m = loc.toUpperCase().includes(ss);
			if (!m) {
				return false;
			}
		}
	}
	var acceptableSeverities = [];
	// if coll has unspecifed severity, but switrs gives a severity use that instead
	var coll_severity = attr.Injury_Severity;

	if (coll_severity == 'Unspecified Injury') {
		if (coll.switrsRecord) {
			coll_severity = coll.switrsRecord.attributes.Injury_Severity
		}
	}
	/*
		if (attr.NumberKilled>0) {
			coll_severity = 'Fatal';
			attr.Injury_Severity = 'Fatal'
		} */

	acceptableSeverities.push('Fatal');

	if (severity == 'Fatal') {
		if (acceptableSeverities.indexOf(coll_severity) == -1) {
			return false;
		}
	}
	acceptableSeverities.push('Serious Injury');

	if (severity == 'Serious Injury') {
		if (acceptableSeverities.indexOf(coll_severity) == -1) {
			return false;
		}
	}

	acceptableSeverities.push('Minor Injury');

	if (severity == 'Minor Injury') {
		if (acceptableSeverities.indexOf(coll_severity) == -1) {
			return false;
		}
	}

	acceptableSeverities.push('Possible Injury');

	if (severity == 'Possible Injury') {
		if (acceptableSeverities.indexOf(coll_severity) == -1) {
			return false;
		}
	}

	if (severity == 'No Injury') {
		if (coll_severity != 'No Injury') {
			return false;
		}
		/*if ((attr.Number_of_Injuries != 0) || (attr.Number_of_Fatalities != 0)) {
			return false;
		}*/
	}
	return true;
}

const LatitudeDefault = 37.868412;
const LongitudeDefault = -122.349938;

function isStopAttr(a) {
	if (a.Stop_GlobalID) {
		return true;
	}
	return false;

}
function incrementMapKey(m, k) {
	m.set(k, m.get(k) + 1);
}

function gpsDistance(attr1, attr2) {
	if (!(attr1.Latitude && attr1.Longitude && attr2.Latitude && attr2.Longitude)) {
		// someone is missint a gps coord
		return null;
	}

	const dLat = Math.abs(attr1.Latitude - attr2.Latitude);
	const dLon = Math.abs(attr1.Longitude - attr2.Longitude);
	const metersPerDegree = 100000;
	const meters = Math.round(metersPerDegree * (dLat + dLon));

	return meters;
}

function floatFixed(f, d) {
	return Number.parseFloat(f.toFixed(d));
}
function roundLoc(arr) {
	const digits = 4;
	const retval = [floatFixed(arr[0], digits), floatFixed(arr[1], digits)];
	return retval;
}
async function addMarkers(CollsionsOrStops, collisionJson, histYearData, histHourData, histFaultData, histAgeInjuryData,
	vehTypeRegExp,
	// ADD NEW YEAR
	filter2025,
	filter2024, filter2023, filter2022, filter2021, filter2020,
	filter2019, filter2018, filter2017, filter2016, //filter2015,
	selectStreet, selectSeverity, selectStopResult, selectCity, selectCounty

) {
	removeAllMakers();
	const markersAtLocation = new Map();
	// add collisions to map
	var markerCount = 0
	var skipped = 0, plotted = 0;

	var arrMappedCollisions = [];
	const arrYears = getYearSelection()
	const county = selectCounty;

	await loadCcrsData(arrYears, county);

	const iter = makeCcrsIterator(county);

	for (const coll of iter /* collisionJson*/ ) {
		const attr = coll.attributes;
		const checked = checkFilter(coll, vehTypeRegExp,
			// ADD NEW YEAR
			filter2025,
			filter2024, filter2023, filter2022, filter2021, filter2020,
			filter2019, filter2018, filter2017, filter2016, //filter2015,
			selectStreet, selectSeverity, selectStopResult, selectCity, selectCounty);
		if (!checked) {
			continue;
		}
		plotted++;
		arrMappedCollisions.push(attr); // add to array for export function

		// ADD NEW CHART
		//histData.set(attr.Year, histData.get(attr.Year) + 1);
		incrementMapKey(histYearData, attr.Year);

		if (!attr.Month) {
			//console.log("Undefined hour " , attr.Case_Number);
			// try to set it from time
			attr.Month = parseInt(attr.Date.substr(5, 2));
		}
		incrementMapKey(histMonthData, attr.Month);

		if (!attr.Hour) {
			//console.log("Undefined hour " , attr.Case_Number);
			// try to set it from time
			attr.Hour = parseInt(attr.Time.substr(0, 2));
		}
		const hour = 3 * Math.floor(attr.Hour / 3);
		//console.log ( "Hour is " , attr.Hour, ' ' , attr.Case_Number);
		incrementMapKey(histHourData, hour);

		if (isStopAttr(attr)) {
			incrementMapKey(histStopResultData, getStopResultCategory(attr.Result_of_Stop));
		}

		if (!isStopAttr(attr)) {
			//histFaultData.set(attr.Party_at_Fault, histFaultData.get(attr.Party_at_Fault) + 1);
			incrementMapKey(histFaultData, attr.Party_at_Fault);
			//histSeverityData.set(attr.Injury_Severity, histSeverityData.get(attr.Injury_Severity) + 1);
			incrementMapKey(histSeverityData, attr.Injury_Severity);
			for (const v of arrObjectKeys) {
				if (attr.Involved_Objects.includes(v)) {

					histObjectData.set(v, histObjectData.get(v) + 1);
				}
			}

			//histAgeInjuryData
			const ageStr = attr.Injury_Ages;
			if (ageStr) {
				// split 
				const ages = ageStr.split("/");
				for (const a of ages) {
					const k = 10 * Math.floor(a / 10);
					incrementMapKey(histAgeInjuryData, k);
				}
			}

		}


		// lat data
		const latStr = attr.Latitude;

		if (latStr) {
			// split 
			for (const l of arrLatKeys) {
				if (latStr < l) {

					incrementMapKey(histLatData, l);
					break;
				}
			}
		}

		// lon data
		const lonStr = attr.Longitude;

		if (lonStr) {
			// split 
			for (const l of arrLonKeys) {
				if (lonStr < l) {

					incrementMapKey(histLonData, l);
					break;
				}
			}
		}


		var gpsError;

		if (coll.localRecord) {
			gpsError = gpsDistance(attr, coll.localRecord.attributes)
		}
		if (coll.ccrsRecord) {
			gpsError = gpsDistance(attr, coll.ccrsRecord.attributes)
		}

		// add gpsError to histogram
		if (gpsError) {
			const bin = getGpsDeltaBin(gpsError)
			incrementMapKey(histGPSDeltaData, bin);
		}
		// if lat  or long is missing, try the linked coll record
		var lat = attr.Latitude;
		if (!lat) {
			if (coll.localRecord) {
				lat = coll.localRecord.attributes.Latitude;

			}
		}
		if (!lat) {
			if (coll.switrsRecord) {
				lat = coll.switrsRecord.attributes.Latitude;
			}
		}
		//const long = attr.Latitude ?? coll.switrsColl.Latitude ?? coll.localColl.Latitude;
		var long = attr.Longitude;
		if (!long) {
			if (coll.localRecord) {
				long = coll.localRecord.attributes.Longitude;
			}

		}
		if (!long) {
			if (coll.switrsRecord) {
				long = coll.switrsRecord.attributes.Longitude;
			}
		}

		if (lat && long) {
			const loc = [lat, long];
			//	const roundLoc = loc.map((c) => c.toFixed(3));
			const ct = markersAtLocation.get(JSON.stringify(roundLoc(loc))) ?? 0;

			/*if (ct > 0) {
				console.log("adjusting marker")
			}*/

			var marker;

			if (!isStopAttr(attr)) {
				//var myMarker = getIconForSeverity(attr.Injury_Severity);
				//marker = L.marker([lat + ct * 0.0001, long - ct * 0.0001],
				//		{ icon: myMarker });

				const opt = getOptionsForSeverity(attr.Injury_Severity);



				marker = L.circleMarker([lat + ct * 0.0001, long - ct * 0.0001], opt
					/*	{
						color: '#3388ff',
						radius: 5,
						fill: true,
						fillOpacity: 1
					}
					*/
				);

			} else {
				//myMarker = getIconForStop(attr.Result_of_Stop);
				const opt = getOptionsForStop(attr.Result_of_Stop);

				marker = L.circleMarker([lat + ct * 0.0001, long - ct * 0.0001], opt /*{
					color: '#3388ff',
					radius: 5,
					fill: true,
					fillOpacity: 0.5
				}*/
				);

			}
			/*const marker = L.marker([lat + ct * 0.0001, long - ct * 0.0001],
				{ icon: myMarker });*/

			markersAtLocation.set(JSON.stringify(roundLoc(loc)), ct + 1);
			var msg = collisionPopup(attr);
			if (coll.switrsRecord) {
				const msg2 = collisionPopup(coll.switrsRecord.attributes);
				msg += '<br>Switrs properties:<br>' + msg2;
			} else if (coll.localRecord) {
				const msg2 = collisionPopup(coll.localRecord.attributes);
				msg += '<br>BPD properties:<br>' + msg2;
			}

			if (pointerFine) {

				//marker.bindTooltip(msg).openTooltip(); can copy from tooltip!
				marker.bindPopup(msg).openPopup();
			} else {
				marker.bindPopup(msg).openPopup();
			}

			marker.addTo(map);
			markers.push(marker);
			markerCount++;
		} else {
			//histMissingGPSData.set(attr.Year, histMissingGPSData.get(attr.Year) + 1);
			console.log("Missing gps for collision id:", attr.CollisionId)
			incrementMapKey(histMissingGPSData, attr.Year);
			skipped++;
		}
	}
	console.log('Skipped', skipped);
	console.log('Plotted', plotted);
	console.log("markerCount ", markerCount)

	const summaryMsg = '<br>Matching ' + CollsionsOrStops + ': ' + plotted;//+ '<br>' + 'Skipped: ' + skipped + '<br>';
	summary.innerHTML = summaryMsg;

	// set array for download
	const json = JSON.stringify(arrMappedCollisions, null, 2);
	const inputblob = new Blob([json], {
		type: "application/json",
	});
	const u = URL.createObjectURL(inputblob);
	saveanchor.href = u;

}

// chart data variables
// ADD NEW CHART
const histYearData = new Map();
const histMonthData = new Map();
const arrMonthKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const histHourData = new Map();
const arrHourKeys = [0, 3, 6, 9, 12, 15, 18, 21];

const histMissingGPSData = new Map();

const histGPSDeltaData = new Map();
const arrGPSDeltaKeys = [0, 10, 100, 1000];
function getGpsDeltaBin(delta) {

	if (delta <= 10) {
		return 0;
	}
	if (delta <= 100) {
		return 10;
	}
	if (delta <= 1000) {
		return 100;
	}
	return 1000;

}

var histFaultData = new Map();

var histSeverityData = new Map();
var histObjectData = new Map();


var histAgeInjuryData = new Map();  // bars 0-9, 10-19, 20-, 30, 40, 50, 60, 70, 80+
const arrAgeKeys = [0, 10, 20, 30, 40, 50, 60, 70, 80];

var histStopResultData = new Map();
const arrStopResultKeys = [stopArrest, stopCitation, stopWarning, stopNoAction, stopUnkown];


const arrSeverityKeys = [
	"Unspecified Injury",
	"No Injury",

	"Possible Injury",
	"Minor Injury",

	"Serious Injury",
	"Fatal"


];

const arrObjectKeys = [
	"Car", "Motorcycle", "Bicycle", "Pedestrian", "Truck", "Bus", "Parked Car", "Object", "Electric Bike", "Electric Scooter", "Electric Skateboard"
];

var histLatData = new Map();
const arrLatKeys = [0, 37.84, 37.85, 37.86, 37.87, 37.88, 37.89, 37.90, 37.91];


var histLonData = new Map();
const arrLonKeys = [-122.33, -122.32, -122.31, -122.30, -122.29, -122.28, -122.27, -122.26, -122.25, -122.24, -122.23, -122.22, -122.21, -122.20, -122.19];


/* histogram data */
function clearHistData(keys, data) {
	for (const f of keys) {
		data.set(f, 0);
	}
}

// ADD NEW CHART
clearHistData(arrObjectKeys, histObjectData);
clearHistData(arrSeverityKeys, histSeverityData);
clearHistData(arrAgeKeys, histAgeInjuryData);
clearHistData(arrStopResultKeys, histStopResultData);
clearHistData(arrHourKeys, histHourData);
clearHistData(arrMonthKeys, histMonthData);
clearHistData(arrGPSDeltaKeys, histGPSDeltaData);
clearHistData(arrLatKeys, histLatData);
clearHistData(arrLonKeys, histLonData);


// clear data functions
function clearHistYearData() {
	// ADD NEW YEAR
	for (var y = 2015; y <= 2025; y++) {
		histYearData.set(y, 0);
		histMissingGPSData.set(y, 0);
	}
}
clearHistYearData();

const faultKeys = [
	"Bicyclist",
	"Driver",
	"Object",
	"Other",
	"Pedestrian"
];

function clearFaultData() {
	for (const f of faultKeys) {
		histFaultData.set(f, 0);
	}
}
clearFaultData();

// chart variables
// ADD NEW CHART
var histYearChart;
var histMonthChart;
var histHourChart;

var histChartGPS;
var histChartGPSDelta; // gpsDelta
var histFaultChart;

var histObjectChart;
var histSeverityChart;
var histAgeInjuryChart;

var histStopResultChart;

var histLatChart;
var histLonChart;



function createOrUpdateChart(data, chartVar, element, labelText) {
	// data should be an array of objects with members bar and count
	if (chartVar == undefined) {
		chartVar = new Chart(element
			,
			{
				type: 'bar',
				data: {
					labels: data.map(row => row.bar),
					datasets: [
						{
							label: labelText,
							data: data.map(row => row.count)
						}
					]
				}
			}
		);
	} else {
		//const newData = data.map(row => row.count);
		// update data

		const newData = {
			label: labelText,
			data: data.map(row => row.count)
		}

		chartVar.data.datasets.pop();
		chartVar.data.datasets.push(newData);
		//	console.log(newData);
		chartVar.update();
	}
	return chartVar;
}


function getYearSelection() {
	const years = [];
	const checks = [check2016, check2017, check2018, check2019, check2020, check2021, check2022, check2023, check2024, check2025];
	var year = 2016;

	for (const c of checks) {
		if (c.checked) {
			years.push(year)
		}
		year++;
	}

	return years;
}

async function handleFilterClick() {
	// ADD NEW CHART
	clearHistYearData();
	clearHistData(arrMonthKeys, histMonthData);
	clearHistData(arrHourKeys, histHourData);
	clearFaultData();
	clearHistData(arrObjectKeys, histObjectData);
	clearHistData(arrSeverityKeys, histSeverityData);
	clearHistData(arrAgeKeys, histAgeInjuryData);
	clearHistData(arrStopResultKeys, histStopResultData);
	clearHistData(arrGPSDeltaKeys, histGPSDeltaData);
	clearHistData(arrLatKeys, histLatData);
	clearHistData(arrLonKeys, histLonData);

	//const dataSpec = selectData.value;

	var collData;

	legendCrash.remove();
	//legendStop.remove();

	var legend = legendCrash;
	var bStops = false;

	const years = getYearSelection();
	const city = selectCity.value;
	//const county = selectCounty.value;

	//const arrYears = getYearSelection();

	//loadCcrsData(arrYears, county);

	

	collData = mergedCCRSJson;
	//tsSet = tsCcrs;


	const CollsionsOrStops = bStops ? 'Stops' : 'Collisions';

	legend.addTo(map);
	await addMarkers(CollsionsOrStops, collData, histYearData, histHourData, histFaultData, histAgeInjuryData,

		selectVehicleTypes.value,
		// ADD NEW YEAR
		check2025.checked,
		check2024.checked,
		check2023.checked,
		check2022.checked,
		check2021.checked,
		check2020.checked,

		check2019.checked,
		check2018.checked,
		check2017.checked,
		check2016.checked,
		//	check2015.checked,

		selectStreet.value,
		selectSeverity.value,
		selectStopResult.value,
		selectCity.value,
		selectCounty.value
	);

	// ADD NEW CHART
	const dataFault = [];
	for (const k of faultKeys) {
		dataFault.push({ bar: k, count: histFaultData.get(k) })
	}

	const dataObject = [];
	for (const k of arrObjectKeys) {
		dataObject.push({ bar: k, count: histObjectData.get(k) })
	}

	const dataSeverity = [];
	for (const k of arrSeverityKeys) {
		dataSeverity.push({ bar: k, count: histSeverityData.get(k) })
	}

	const dataStopResult = [];
	for (const k of arrStopResultKeys) {
		dataStopResult.push({ bar: k, count: histStopResultData.get(k) })
	}

	const dataGPSDelta = [];
	for (const k of arrGPSDeltaKeys) {
		dataGPSDelta.push({ bar: k, count: histGPSDeltaData.get(k) })
	}


	// ADD NEW CHART
	histFaultChart = createOrUpdateChart(dataFault, histFaultChart, document.getElementById('crashFaultHist'), 'Collisions by Fault');

	histObjectChart = createOrUpdateChart(dataObject, histObjectChart, document.getElementById('involvedObjectHist'), 'Crash Particpants');

	histSeverityChart = createOrUpdateChart(dataSeverity, histSeverityChart, document.getElementById('severityHist'), 'Injury Severity');

	const dataByYear = [];
	// ADD NEW YEAR
	for (var bar = 2015; bar <= 2025; bar++) {
		dataByYear.push({ bar: bar, count: histYearData.get(bar) });
	}



	histYearChart = createOrUpdateChart(dataByYear, histYearChart, document.getElementById('yearHist'), CollsionsOrStops + ' by Year');

	const dataByMonth = [];
	for (const k of arrMonthKeys) {
		dataByMonth.push({ bar: k, count: histMonthData.get(k) })
	}

	histMonthChart = createOrUpdateChart(dataByMonth, histMonthChart, document.getElementById('monthHist'), CollsionsOrStops + ' by Month');


	const dataByHour = [];
	for (const k of arrHourKeys) {
		dataByHour.push({ bar: k, count: histHourData.get(k) })
	}

	histHourChart = createOrUpdateChart(dataByHour, histHourChart, document.getElementById('hourHist'), CollsionsOrStops + ' by Hour');

	const dataGPSByYear = [];
	// ADD NEW YEAR
	for (var bar = 2015; bar <= 2025; bar++) {
		dataGPSByYear.push({ bar: bar, count: histMissingGPSData.get(bar) });
	}

	histChartGPS = createOrUpdateChart(dataGPSByYear, histChartGPS, document.getElementById('gpsHist'), 'Missing GPS by Year');
	//ageInjuryHist

	histChartGPSDelta = createOrUpdateChart(dataGPSDelta, histChartGPSDelta, document.getElementById('gpsDelta'), 'GPS Delta');


	const dataInjurybyAge = [];
	for (const k of arrAgeKeys) {
		dataInjurybyAge.push({ bar: k, count: histAgeInjuryData.get(k) })
	}

	histAgeInjuryChart = createOrUpdateChart(dataInjurybyAge, histAgeInjuryChart, document.getElementById('ageInjuryHist'), 'Injury by Age');

	histStopResultChart = createOrUpdateChart(dataStopResult, histStopResultChart, document.getElementById('stopResultHist'), 'Stop Results');

	const dataByLat = [];
	for (const k of arrLatKeys) {
		dataByLat.push({ bar: k, count: histLatData.get(k) })
	}

	histLatChart = createOrUpdateChart(dataByLat, histLatChart, document.getElementById('latHist'), CollsionsOrStops + ' by Latitude');


	const dataByLon = [];
	for (const k of arrLonKeys) {
		dataByLon.push({ bar: k, count: histLonData.get(k) })
	}

	histLonChart = createOrUpdateChart(dataByLon, histLonChart, document.getElementById('lonHist'), CollsionsOrStops + ' by Longitude');


}

function handleExportClick() {
	handleFilterClick();
}

saveanchor.addEventListener(
	"click", handleExportClick
	// (event) => (event.target.href = canvas.toDataURL()),
);


/* unused stuff

const json = JSON.stringify(3.1415, null, 2);
const inputblob = new Blob([json], {
	type: "application/json",
});


const u = URL.createObjectURL(inputblob);

saveanchor.href = u;

async function saveFile1() {
	// create a new handle
	const newHandle = await window.showSaveFilePicker();

	// create a FileSystemWritableFileStream to write to
	const writableStream = await newHandle.createWritable();

	// write our file
	await writableStream.write(inputblob);

	// close the file and write the contents to disk.
	await writableStream.close();
}



async function saveFile() {



	//const inputblob = { hello: "world" };
	const json = JSON.stringify(3.1415, null, 2);
	const inputblob = new Blob([json], {
		type: "application/json",
	});





	const downloadelem = document.createElement("a");
	const url = URL.createObjectURL(inputblob);
	document.body.appendChild(downloadelem);
	downloadelem.src = url;
	downloadelem.click();
	downloadelem.remove();
	window.URL.revokeObjectURL(url);
}
//downloadBlob(yourblob);


async function handleExportClick() {
	await saveFile();

}



function randomOffset() {
	const r = Math.random() - 0.5;
	return r / 5000;
}
function objToString(obj) {
	var msg = "";
	
	for (const [key, value] of Object.entries(obj)) {
		msg += ('<br>' + key + ':' + value);
	}
	return msg;
}
	
	
const bikeIcon = L.icon({ iconUrl: './test/bicycle.png' });
const pedIcon = L.icon({ iconUrl: './test/pedestrian.png' });
const carIcon = L.icon({ iconUrl: './test/suv.png' });
	
	
/*
	(function () {
		const data = [
			{ year: 2015, count: histData.get(2015) },
			{ year: 2016, count: histData.get(2016) },
			{ year: 2017, count: histData.get(2017) },
			{ year: 2018, count: histData.get(2018) },
			{ year: 2019, count: histData.get(2019) },
			{ year: 2020, count: histData.get(2020) },
			{ year: 2021, count: histData.get(2021) },
			{ year: 2022, count: histData.get(2022) },
			{ year: 2023, count: histData.get(2023) },
			{ year: 2024, count: histData.get(2024) },
	
		];
		if (histChart == undefined) {
			histChart = new Chart(
				document.getElementById('crashHist'),
				{
					type: 'bar',
					data: {
						labels: data.map(row => row.year),
						datasets: [
							{
								label: 'Collisions by Year',
								data: data.map(row => row.count)
							}
						]
					}
				}
			);
		} else {
			//const newData = data.map(row => row.count);
			// update data
	
			const newData = {
				label: 'Collisions by Year',
				data: data.map(row => row.count)
			}
	
			histChart.data.datasets.pop();
			histChart.data.datasets.push(newData);
			console.log(newData);
			histChart.update();
		}
	})();
	
*/




export {
	greenIcon, goldIcon, redIcon,
	collisionPopup,
	map, handleFilterClick
};