// Require the necessary files and modules
const fs = require('fs');
const { messageContainer } = require('./message.js')
const { token, devChannelId, openaiKey } = require('./config.json');
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
	let summary = new messageContainer(null, null, null, null, null, null);
	summary.setUser(toBeCondensed[0].getUser());
	summary.setTime(toBeCondensed[0].getTime());
	summary.setMessageId(toBeCondensed[0].getMessageId());
	summary.setGuildId(toBeCondensed[0].getGuildId());

	// Set system message
	let sendToAi = [
		{role: "system", content: "You are a nameless bot which has been designed to summarize information from other bots to save space. Please summarize the following conversation in 200 words or less while keeping as much detail as possible. Insert no commentary of your own"}
	];

	// Find the name of the bot whose conversation is being summarized
	botName = getServerConfig(summary.getGuildId(), "Hubert", null);

	let sendToString = "";
	// Form a string out of the conversation to send to bot
	for (let i = 0; i < toBeCondensed.length; i++) {
		let tempMessage = toBeCondensed[i];
		let roleName = "user";
		if (tempMessage.getUser() == client.user.id) {
			roleName = `${botName}`;
		};
		sendToString.concat(`\r\n${roleName}:`, tempMessage.getMessage())
	};

	sendToAi.splice(1, 0, {role: "user", content: sendToString});

	const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: sendToAi,
		max_tokens: 400,
		temperature: 1.2,
		user: message.author.id,
	});

	console.log(`@${summary.getUser()} in <${summary.getGuildId}> had their conversation condensed into this summary: ${completion.data.usage.total_tokens} (${completion.data.usage.prompt_tokens}/${completion.data.usage.completion_tokens}) tokens: "${completion.data.choices[0].message.content}"`);

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
				tempMessage = temp.slice(temp.indexOf('\n') + 1);
				if (tempMessage != 'n/a') {
					systemMessage = tempMessage;
				}
				//Look in the config for a valid custom name
				tempName = temp.slice(0, temp.indexOf('\n'));
				if (tempName != 'n/a') {
					botName = tempName;
				}
			} catch (err) {

			};
		};
	};

	return (botName, systemMessage);
}

module.exports = { isBanned, condenseContext, getServerConfig} ;