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

function truncateFloat(f, fractionDigits) {
	return parseFloat(f.toFixed(fractionDigits))
}


function getHeapLimit() {
	if (performance && performance.memory) {
		return  ' ' + truncateFloat(performance.memory.jsHeapSizeLimit / 1048576, 1) + " Megabytes"
	
	}
	return 'Heap Limit not available'
}

function getHeapUsed() {
	if (performance && performance.memory) {
		
		return ' ' + truncateFloat(performance.memory.usedJSHeapSize / 1048576, 1) + " Megabytes"
	
		
	}
	return 'Heap used not available'
}

async function getJson(url) {
	try {
		const response = await fetch(url); // {cache: 'no-cache'} https://hacks.mozilla.org/2016/03/referrer-and-cache-control-apis-for-fetch/
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		const json = await response.json();
		return json;
	} catch (error) {
		console.error(error.message);
	}
}

const mapUrlToPromise = new Map();

async function startFetch(url) {
	const prom = await fetch(url);
	mapUrlToPromise.set(url,prom);
	return;
}
async function resolveFetchJson(url) {
	const response = mapUrlToPromise.get(url);
	try {
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		const json = await response.json();
		return json;
	} catch (error) {
		console.error(error.message);
	}
}

//const mapStreetPairToGPS = new Map();
function makeKey(s1, s2) {
	const key = (''+s1).trim() + '/' + (''+s2).trim();
	return key;
}

/* utility functions */
function fileNameIze(str) {
	return str.replaceAll(' ', '_').replaceAll('/', '_');
}


export { getMS, getJson, makeKey, fileNameIze, startFetch, resolveFetchJson, getHeapLimit, getHeapUsed, truncateFloat };
