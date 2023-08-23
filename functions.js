// Require the necessary files and modules
const fs = require('fs');
const { messageContainer } = require('./message.js')
const { clientId, openaiKey, debugMode } = require('./config.json');
const { Configuration, OpenAIApi } = require("openai");
const {encode, decode} = require('gpt-3-encoder');

const configuration = new Configuration({
    apiKey: openaiKey,
});
const openai = new OpenAIApi(configuration);

// Returns true if the user is banned from participating, otherwise false
let isBanned = function(userid) {
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

// Get token values for a string
let tokenize = function(string) {
	const encoded = encode(string);
	return encoded.length;
};

// Outputs a console log element when debug mode is on
let debugLog =  function(line, value) {
	if (debugMode) {
		console.error(`Debugger at ${line}: ${value}`);
	};
};

// summarize old messages to allow the robot to have more context
// Gotta be Async to let the gpt await command resolve
let condenseContext = async function (context, authorId) {

	// Find the last message sent by the author of the thread we want to condense
	let pointerMessage = 0;
	for (let i = context.length - 1; i >= 0; i--) {
		if (context[i].user = authorId) {
			pointerMessage = context.splice(i,1);
			pointerMessage = pointerMessage[0];
			i = -1;
		};
	};

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
	let collectionLength = messageCollection.length;
    let numIterations = Math.floor((collectionLength / 2) - 1);
    if (messageCollection.length != 1) {
        for (let i = numIterations; i < collectionLength; i++) {
			toBeCondensed.push(messageCollection.splice(numIterations, 1)[0]);
        };
    } else {
        toBeCondensed.push(messageCollection[0]);
    };

	// Set up our summary message

	let summary = new messageContainer(null, null, null, null, null, null);
	let oldData = toBeCondensed[0];
    summary.setUser("summary");
    summary.setTime(oldData.getTime());
    summary.setMessageId(oldData.getMessageId());
    summary.setGuildId(oldData.getGuildId());

	// Set system message
	let sendToAi = [
		{role: "system", content: "Please summarize this conversation so that future bots can understand what was discussed without reading the entire transcript. Do so concisely while keeping as much detail as possible. Insert no commentary of your own."}
	];

	// Find the name of the bot whose conversation is being summarized
	botName, systemMessage = getServerConfig(summary.getGuildId(), "Hubert", null);

	let sendToString = "";
	// Form a string out of the conversation to send to bot
    for (let i = toBeCondensed.length - 1; i >= 0; i--) {
        let tempMessage = toBeCondensed[i];
        let roleName = "user";
        if (tempMessage.getUser() == clientId) {
            roleName = `${botName}`;
        };
		sendToString = `${sendToString}
		${roleName}: ${tempMessage.getMessage()}`;
	};
	sendToAi.splice(1, 0, {role: "user", content: sendToString});

	const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: sendToAi,
		max_tokens: 400,
		temperature: 1,
		user: authorId,
	});

	console.log(`<@${authorId}> in server ${summary.getGuildId()} had their conversation summarized using ${completion.data.usage.total_tokens} (${completion.data.usage.prompt_tokens}/${completion.data.usage.completion_tokens}) tokens: "${completion.data.choices[0].message.content}"`);
	// Finish our summary message
	summary.setMessage(completion.data.choices[0].message.content)
	// Add it back to the thread
	messageCollection.push(summary);
	// Put the thread back into the main array
	output = context.concat(messageCollection);
	// Return the updated context array
	return output;
}

let getServerConfig = function(guildId, botName, systemMessage) {
	const serverFiles = fs.readdirSync('./files/servers').filter(file => file.endsWith('.txt'));
	for (const file of serverFiles) {
		if (file == `${guildId}.txt`) {
			try {
				// Look in the config for a valid custom message
				let temp = fs.readFileSync(`./files/servers/${file}`, 'utf8');
				let tempMessage = temp.slice(temp.indexOf('\n') + 1);
				if (tempMessage != 'n/a') {
					systemMessage = tempMessage;
				};
				//Look in the config for a valid custom name
				tempName = temp.slice(0, temp.indexOf('\n'));
				if (tempName != 'n/a') {
					botName = tempName;
				};
			} catch (err) {

			};
		};
	};

	return (botName, systemMessage);
};

module.exports = { isBanned, tokenize, debugLog, condenseContext, getServerConfig } ;