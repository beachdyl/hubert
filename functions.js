// Require the necessary files and modules
const fs = require('fs');
const errHandle = require ('@beachdyl/error_handler');
const { channelId } = require('./config.json');

// getNickname function. Returns a string of the nickname of that user. If one doesn't exist, create it and then return that.
let getNickname =  function(userid) {
	const regEx = new RegExp('\\b'+userid+'\\b', "i")
	let result = [];

	// Scan the file for the user
	let file = fs.readFileSync('./files/Nicknames.txt', 'utf8');
	let lines = file.split("\n");
	lines.forEach(line => {
		if (line && line.search(regEx) >= 0) {
			result.push(line);
		};
	});

	if (result.length > 0) {
		// If they have one, return the nickname of the user
		result = result[0];
		result = result.substring(result.indexOf(" ")+1, result.length);
		result = result.substring(0, result.indexOf(" "));
		return result;
	} else {
		// If they don't have one, create a nickname and color for the user and return the name
		let newName = getRandomWord();
		let randColor = Math.floor(Math.random()*16777215).toString(16);
		fs.appendFileSync('./files/Nicknames.txt',`${userid} ${newName} #${randColor} \n`);
		return newName;
	};
};

// getUserId function. Returns a string of the Discord ID of a user, given their nickname.
let getUserId =  function(nickname) {
	const regEx = new RegExp('\\b'+nickname+'\\b', "i")
	let result = [];

	// Scan the file for the user
	let file = fs.readFileSync('./files/Nicknames.txt', 'utf8');
	let lines = file.split("\n");
	lines.forEach(line => {
		if (line && line.search(regEx) >= 0) {
			result.push(line);
		};
	});

	if (result.length > 0) {
		// If they have one, return the id of the user
		result = result[0];
		result = result.substring(0, result.indexOf(" "));
		return result;
	} else {
		// If they don't have one, return 18 0s
		return "000000000000000000";
	};
};

// Returns the color of a user
let getColor =  function(userid) {
	const regEx = new RegExp('\\b'+userid+'\\b', "i")
	let result = [];

	// Scan the file for the user
	let file = fs.readFileSync('./files/Nicknames.txt', 'utf8');
	let lines = file.split("\n");
	lines.forEach(line => {
		if (line && line.search(regEx) >= 0) {
			result.push(line);
		};
	});

	if (result.length > 0) {
		// If they exist, return the color of the user
		result = result[0];
		result = result.substring(result.indexOf(" ")+1, result.length);
		result = result.substring(result.indexOf(" ")+1, result.length);

		return result;
	} else {
		// If they don't exist, return black
		return `#000000`;
	};
};

// Returns true if the user is banned from participating, otherwise false
let isBanned =  function(userid) {
	const regEx = new RegExp('\\b'+userid+'\\b', "i")
	let result = [];

	// Scan the file for the user
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

// Get a random word from the words file
let getRandomWord = function() {
	let file = fs.readFileSync('./files/US.txt', "utf-8")

	var lines = file.split('\n');
	var line = lines[Math.floor(Math.random()*lines.length)]

	return line;
};


module.exports = { getRandomWord, getNickname, getUserId, getColor, isBanned } ;
