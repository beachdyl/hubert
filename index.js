// Require the necessary discord.js classes
const fs = require('fs');
const path = require('node:path');
const { Client, Intents, Collection, MessageEmbed } = require('discord.js');
const { token, devChannelId, openaiKey } = require('./config.json');
const { errHandle } = require('@beachdyl/error_handler');
const func = require('./functions.js');

// import message struct
const { messageContainer } = require('./message.js')

// import openai integration data
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: openaiKey,
});
const openai = new OpenAIApi(configuration);

// Try deleting old errorTemp.txt if it exists
try {fs.unlinkSync('./errorTemp.txt');}
catch (error) {}

// Create a new client instance
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.GUILD_PRESENCES],
	partials: ["CHANNEL"],
});
client.options.failIfNotExists = false;

// Register slash command
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

try {
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		client.commands.set(command.data.name, command);
	}
} catch (error) {
	try {
		errHandle(`Command registration of command named ${command.data.name}\n${error}`, 1, client);
	} catch (error) {
		errHandle(`Command registration of unknown command\n${error}`, 1, client);
	}
}

// Init the struct to remember messages
var messageContainerContainer = new Array();

// Process text messages
client.on("messageCreate", async message => {

	systemMessage = `You are a sociable chatbot named Hubert in a discord server named ${message.guild.name}. The description of the server, if one exists, is here: "${message.guild.description}". Don't state the description directly, but keep it in mind when interacting. Respond concisely. If a message seems to be lacking context, remind users that they need to reply directly to your messages in order for you to have context into the conversation.`

	const serverFiles = fs.readdirSync('./servers').filter(file => file.endsWith('.txt'));
	for (const file of serverFiles) {
		if (file == `${message.guildId}.txt`) {
			try {
				systemMessage = fs.readFileSync(`./servers/${file}`, 'utf8')
			} catch (err) {
				errHandle(`Could not read server data file\n${err}`, 1, client);
			};
		};
	};
	
	let replyToMe = false;
	let replyId = null;
	if (message.channel.name !== `hubert`) return; // Ignore messages sent ouside operational channels
	if (func.isBanned(message.author.id)) {
		message.reply({content: `You do not have permission to interact with me.`});
		return; // Don't process input from banned users
	};
	if (message.author.bot) {
		if (message.author.id == client.user.id) { // Record the message if it's from Hubert
			if (message.reference) {
				messageContainerContainer.push(new messageContainer(message.author.id, message.timestamp, message.id, message.reference.messageId, message.content));
			} else {
				// if it's no longer a reply, then don't try to get its reply ID
				messageContainerContainer.push(new messageContainer(message.author.id, message.timestamp, message.id, null, message.content)); 
			};
		};
		return // Ignore messages from non Hubert bots
	};
	if (message.system) return; // Ignore system messages
	if (message.reference) { // Check if the message is a reply
		if ((await message.channel.messages.fetch(message.reference.messageId)).author.id == client.user.id) {
			replyToMe = true;
			replyId = message.reference.messageId;
		} else {
			replyId = null;
			return; // If it is a reply, but not to the bot, then don't interact with it
		};
	};
	

	messageContainerContainer.push(new messageContainer(message.author.id, message.timestamp, message.id, replyId, message.content));
	// Find message history
	if (replyToMe) {
		let pointerMessage = messageContainerContainer[messageContainerContainer.length - 1];
		let looper = true;
		var messageCollection = new Array();
		messageCollection.push(pointerMessage)
		let count = 0;
		while(looper) {
			count++;
			for (let i = 0; i < messageContainerContainer.length; i++) {
				let testMessage = messageContainerContainer[i]
				if (pointerMessage.getReplyId() == testMessage.getMessageId()) {
					messageCollection.push(testMessage)
					pointerMessage = testMessage;
				};
			};
			
			// If the next message in the chain has no reply, we break
			if (pointerMessage.getReplyId() == null || count > 20) {
				looper = false;
			};
		};
	};
	// query openai with the prompt
	try {
		let sendToAi = [
			{role: "system", content: global.systemMessage}
		];
		if (replyToMe) { 

			
			// Add context from the context collector
			for (let i = 0; i < messageCollection.length; i++) {
				let tempMessage = messageCollection[i];
				let roleName = "user";
				if (tempMessage.getUser() == client.user.id) {
					roleName = "assistant";
				};
				sendToAi.splice(1, 0, {role: roleName, content: tempMessage.getMessage()});
			};

			// if reply is not in memory, get content directly
			if (messageContainerContainer.length < 2) {
				sendToAi.splice(1, 0, {role: "assistant", content: (await message.channel.messages.fetch(message.reference.messageId)).content}); 
				sendToAi.splice(1, 0, {role: "user", content: (await message.channel.messages.fetch((await message.channel.messages.fetch(message.reference.messageId)).reference.messageId)).content}); 
			}
		} else {
			sendToAi.splice(1, 0, {role: "user", content: message.content});
		};

		const completion = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: sendToAi,
			max_tokens: 400,
			temperature: 1.2,
			user: message.author.id,
		});

		console.log(`${message.author.username} <@${message.author.id}> in ${message.guild.name} asked: "${message.content}" and Hubert responded with ${completion.data.usage.total_tokens} (${completion.data.usage.prompt_tokens}/${completion.data.usage.completion_tokens}) tokens: "${completion.data.choices[0].message.content}"`);
		message.channel.sendTyping();
		client.user.setPresence({status: 'online'});
		try{
			setTimeout(() => {
				message.reply({content: completion.data.choices[0].message.content});
			},
			Math.floor(Math.random() * (8500 - 4000 + 1)) + 4000); // random message response delay
		} catch (error) {
			errHandle(`Reply to prompt\n${error}`, 1, client);
		};
	} catch (error) {
		if (error.response) {
			if (error.response.status == 429) {
				try{
					client.user.setPresence({status: 'idle'});
					message.react(`❌`);
					client.users.cache.get(message.author.id).send(`Sorry! I can only handle so many messages per minute. Try again in a minute.`);
				} catch (error) {
					errHandle(`Rate limit message error\n${error}`, 1, client);
				}
			} else {
				console.error(error)
				errHandle(`OpenAI request error\n${error}`, 1, client);
			}
		} else {
			console.error(error)
			errHandle(`OpenAI request error\n${error}`, 1, client);
		}
	};
});

// Process slash command interactions
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	if (func.isBanned(message.author.id)) {
		message.reply({content: `You do not have permission to interact with me.`});
		return; // Don't process input from banned users
	};
	
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Process button interactions
client.on('interactionCreate', interaction => {
	if (!interaction.isButton()) return;
	errHandle(interaction, 1, client);
});

// Do things once the bot is ready
client.on('ready', () => {
	// Set the bot status to online and set its status
	client.user.setPresence({
		status: 'online',
		activities: {
			name: "to your insightful words",
			type: "LISTENING"
		}
	});

	// Send a good morning embed
	const readyEmbed = new MessageEmbed()
		.setColor('#00ff00')
		.setTitle('Ready to rock and roll!')
		.setAuthor('Hubert', 'https://i.ibb.co/BVKGkd9/gayliens.png', 'https://beachdyl.com')
		.setDescription('I was asleep, but I am no longer asleep! To make a long story short, ~~I put a whole bag of jellybeans~~ **good morning**!')
		.setTimestamp();
	client.channels.cache.get(devChannelId).send({embeds: [readyEmbed] });

	// Check for persistent errors
	try {
		fs.accessSync('./persistError.txt');
		errHandle(fs.readFileSync('./persistError.txt'), 7, client);
	} catch {}
});

// Check for unhandled errors on each interaction
client.on('interactionCreate', interaction => {
	try {
		fs.accessSync('./tempError.txt');
		errHandle(fs.readFileSync('./tempError.txt'), 3, client);
	} catch {}
});

// Login to Discord using the secret token
client.login(token);