// Require the necessary files and modules
const fs = require('fs');
const { debugMode } = require('./config.json');

// Returns true if the user is banned from participating, otherwise false
let isBanned =  function(userid) {
	const regEx = new RegExp('\\b'+userid+'\\b', "i")
	let result = [];

	// See if anybody is banned
	let exists = false;
	try {
		fs.accessSync('./files/Banned.txt');
		exists = true;
	} catch {};

	// If so, scan the file for the prompted user
	if (exists) {
		let file = fs.readFileSync('./files/Banned.txt', 'utf8');
		let lines = file.split("\n");
		lines.forEach(line => {
			if (line && line.search(regEx) >= 0) {
				result.push(line);
			};
		});
	};

	if (result.length > 0) {
		return true;
	} else {
		return false;
	};
};

// Outputs a console log element when debug mode is on
let debugLog =  function(line, value) {
	if (debugMode) {
		console.error(`Debugger at ${line}: ${value}`);
	};
};

module.exports = { isBanned, debugLog } ;