'use strict';


import * as fs from 'fs';

import { exit } from 'process';

import * as turf from "@turf/turf";




for (let j = 0; j < process.argv.length; j++) {
	console.log(j + ' -> ' + (process.argv[j]));
}

var lastTime = 0;
function getMS(msg) {
	const thisTime = Date.now();
	const diff = thisTime - lastTime;
	lastTime = thisTime;

	if (msg) {
		console.log(msg, ':', diff, ' ms')
	}
	return diff;
}

// read county codes
/*
	"geometry": {
				"type": "Polygon",
				"coordinates": [
					[
						[
							-120.5084085,
							34.9483568
							.
							.
							.
		"properties": {
				"osm_id": -9949457,
				"name": "Burlingame",
				"name_en": null,
				"boundary": "administrative",
				"admin_level": 8,
				"admin_centre_node_id": null,
				"admin_centre_node_lat": null,
				"admin_centre_node_lng": null,
				"label_node_id": 150942279,
				"label_node_lat": 37.5780965,
				"label_node_lng": -122.3473099
			}
*/

// read ncic codes
const placeGeojson = fs.readFileSync('../data/CaliforniaAndCountiesAndCities.geojson');
const places = JSON.parse(placeGeojson);

function getCenter(geom) {
	var feature = turf.feature(geom);
	const result = turf.center(feature);
	const coord = result.geometry.coordinates;
	const obj = {lat:coord[1],lng:coord[0]};


	return obj;
}
function getFirstPoint(geom) {
	var arrCoord;
	if (geom.type == 'MultiPolygon') {
		arrCoord = geom.coordinates[0][0][0];
	} else
		if (geom.type == 'Polygon') {
			arrCoord = geom.coordinates[0][0];
		} else {
			console.log("Unxpected geom type", geom.type)
		}
	return { lat: arrCoord[1], lng: arrCoord[0] };
}
const locations = [];

for (const f of places.features) {
	//const pt = getFirstPoint(f.geometry);
	const pt = getCenter(f.geometry);

	const props = f.properties;

	var lat = props.admin_centre_node_lat ?? props.label_node_lat;
	var lng = props.admin_centre_node_lng ?? props.label_node_lng;

	if (!lat) {

		lat = pt.lat;
		lng = pt.lng
	}
	const name = props.name;
	console.log(name, 'lat', lat, 'lng', lng);
	const obj = {name:name, lat:lat, lng:lng};
	locations.push(obj)

}
const str = JSON.stringify( locations)
fs.writeFileSync( './CountyCityLocations.json' , str)
console.log('bye')