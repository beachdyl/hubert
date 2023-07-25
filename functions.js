// Require the necessary files and modules
const fs = require('fs');
const { messageContainer } = require('./message.js')
const { token, devChannelId, openaiKey, debugMode } = require('./config.json');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: openaiKey,
});
const openai = new OpenAIApi(configuration);

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

// Gotta be Async to let the gpt await command resolve
let condenseContext = async function (context, authorID) {
	
	// Find the last message sent by the author of the thread we want to condense
	let pointerMessage = 0;
	for (let i = context.length - 1; i >= 0; i--) {
		if (context[i].user = authorID) {
			pointerMessage = context[i];
		}
	}

	// Grab the message thread destructively
	let looper = true;
	var messageCollection = new Array();
	messageCollection.push(pointerMessage)
	let count = 0;
	while(looper) {
		count++;
		for (let i = 0; i < context.length; i++) {
			let testMessage = context[i]
			if (pointerMessage.getReplyId() == testMessage.getMessageId()) {
				messageCollection.push(testMessage)
				pointerMessage = testMessage;
				context.splice(i, 1);
			};
		};
		
		// If the next message in the chain has no reply, we break
		if (pointerMessage.getReplyId() == null || count == 100) {
			looper = false;
		};
	};

	// Pull out the parts of the thread we are going to condense
	var toBeCondensed = new Array();
	for (let i = (messageCollection.length / 2) - 1; i < messageCollection.length; i++) {
		toBeCondensed.push(messageCollection.splice(i, 0));
	}

	// Set up our summary message
	let summary = new messageContainer(null, null, null, null, null);
	summary.setUser(toBeCondensed[0].getUser());
	summary.setTime(toBeCondensed[0].getTime());
	summary.setMessageId(toBeCondensed[0].getMessageId());

	// Set system message
	let sendToAi = [
		{role: "system", content: "You are a nameless bot which has been designed to summarize information from other bots to save space. Please summarize the following conversation in 200 words or less while keeping as much detail as possible. Insert no commentary of your own"}
	];

	// Send the information to the bot
	for (let i = 0; i < toBeCondensed.length; i++) {
		let tempMessage = toBeCondensed[i];
		let roleName = "user";
		if (tempMessage.getUser() == client.user.id) {
			roleName = "assistant";
		};
		sendToAi.splice(1, 0, {role: roleName, content: tempMessage.getMessage()});
	};

	const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: sendToAi,
		max_tokens: 400,
		temperature: 1.2,
		user: message.author.id,
	});

	console.log(`${message.author.username} <@${message.author.id}> in ${message.guild.name} had the following content compressed: "${message.content}". The following summary was returned: ${completion.data.usage.total_tokens} (${completion.data.usage.prompt_tokens}/${completion.data.usage.completion_tokens}) tokens: "${completion.data.choices[0].message.content}"`);

	// Finish our summary message
	summary.setMessage(completion.data.choices[0].message.content)
	// Add it back to the thread
	messageCollection.push(summary);
	// Put the thread back into the main array
	output = context.concat(messageCollection);
	// Return the updated context array
	return output;
};

// Outputs a console log element when debug mode is on
let debugLog =  function(line, value) {
	if (debugMode) {
		console.error(`Debugger at ${line}: ${value}`);
	};
};

module.exports = { isBanned, debugLog, condenseContext } ;

