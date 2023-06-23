// Require the necessary files and modules
const fs = require('fs');

// Returns true if the user is banned from participating, otherwise false
let isBanned =  function(userid) {
	const regEx = new RegExp('\\b'+userid+'\\b', "i")
	let result = [];

	// Scan the file for the user
	try {
		fs.accessSync('./files/Banned.txt');
		return;
	} catch {}
	let file = fs.readFileSync('./files/Banned.txt', 'utf8');
	let lines = file.split("\n");
	lines.forEach(line => {
		if (line && line.search(regEx) >= 0) {
			result.push(line);
		};
	});

	if (result.length > 0) {
		return true;
	} else {
		return false;
	};
};

module.exports = { isBanned } ;
