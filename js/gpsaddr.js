import { getJson } from "./utils_helper.js";



//var wayJson = JSON.parse(readFileSync('./temp/ways.json', 'utf8'));


async function getWaysJson() {
	const waysFileName = './data/geocoder/ways.json';
	const waysJson = await getJson(waysFileName);
	return waysJson;
}

const wayJson = await getWaysJson();


var wayData = [];

function initWayData(obj) {
	for (const way of obj.elements) {
		const tags = way.tags;

		if (!tags) {
			console.log("skipping no tag way");
			continue;
		}
		const name = tags.name;
		if (!name) {
			//console.log("Undefined name for way id:", way.id);
			continue;
		}
		const geometry = way.geometry; // list of lat long 

		const bounds = way.bounds;

		wayData.push({ 'name': name, 'geometry': geometry, 'bounds': bounds });

		//console.log(name, geometry.length);
	}
}

initWayData(wayJson);

function distGpsGps(gps1, gps2) {//  { "lat": 37.8655316, "lon": -122.3100479 },
	const dLat = Math.abs(gps1.lat - gps2.lat);
	const dLon = Math.abs(gps1.lon - gps2.lon);
	const retval = dLat + dLon;
	return retval;
}
function distGpsGeometry(gps, geom) {  // geom is array of gps points
	var minDist = 9999999999;
	for (const gps2 of geom) {
		const d = distGpsGps(gps, gps2);
		minDist = Math.min(minDist, d);
	}
	return minDist;
}


function isNear( gps, bounds) {
	/*
	gps
	 { "lat": 37.8655316, "lon": -122.3100479 },

	"bounds": {
		"minlat": 37.8665279,
		"minlon": -122.2427622,
		"maxlat": 37.8691466,
		"maxlon": -122.2402112
	  },
	  */

	if (!bounds) {
		return true;
	}
	const epsilon = 100.0 / metersPerDegree;



	if (gps.lat < bounds.minlat - epsilon) {
		return false;
	}
	if (gps.lat > bounds.maxlat + epsilon) {
		return false;
	}

	if (gps.lon < bounds.minllon - epsilon) {
		return false;
	}
	if (gps.lon > bounds.maxllon + epsilon) {
		return false;
	}


	return true;
}

// 1 degree approx 100,000 meteres
const metersPerDegree = 100000;
const fuzzLimit = 0.0001

function findClosest(gps) //  { "lat": 37.8655316, "lon": -122.3100479 },
{
	var min1 = 99999999999;  // min1 is closest node, min2 is 2nd closest
	// min2Name is always a different road name from min1Name
	var min1Name;
	var min2 = min1;
	var min2Name;

	var wayCount=0;
	var waySkip = 0;


	for (const w of wayData) {
		wayCount++
		// skip if gps is not in wayData bbox 
		if ( !isNear(gps, w.bounds)) {
			waySkip ++;
			continue;

		}
		const d = distGpsGeometry(gps, w.geometry);
		if (d < min1) {

			if (w.name != min1Name) { // avoid making min2Name equal to new min1Name
				min2Name = min1Name;
				min2 = min1;
			}


			min1Name = w.name;
			min1 = d;
			if (d < 10 * fuzzLimit) {
				//console.log(min1Name, ': ', metersPerDegree * d);
			}
			continue;
		}


		if (d < min2 && w.name != min1Name) { // avoid making min2Name equal to new min1Name
			min2Name = w.name;
			min2 = d;
			if (d < 10 * fuzzLimit) {
				//console.log(min2Name, ': ', metersPerDegree * d);
			}
		}

	}
	
	//console.log("Waycount: ", wayCount - waySkip,"/", waySkip );
	//console.log("WaySkipped: ", waySkip);

	if (min2) {
		return "" + min1Name + '/' + min2Name;
	} else {
		return min1Name;
	}
	

}

export { findClosest };
