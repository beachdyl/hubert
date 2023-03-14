// Require the necessary discord.js classes
const fs = require('fs');
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const { token, clientId, devChannelId, openaiKey } = require('./config.json');
const { errHandle } = require('@beachdyl/error_handler');
const func = require('./functions.js');

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

// Register commands from commands directory
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

try {
	for (file of commandFiles) {
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

// Process text messages
client.on("messageCreate", async message => {
	let replyToMe = false;
	if (message.channel.name !== `hubert`) return; // Ignore messages sent ouside operational channels
	if (message.author.bot) return; // Ignore bot messages (namely itself)
	if (message.system) return; // Ignore system messages
	if (func.isBanned(message.author.id)) { // Don't process input from banned users
		client.users.cache.get(message.author.id).send(`You do not have permission to interact with me.`);
		return; 
	};	
	if (message.reference) { // Check if the message is a reply
		if ((await message.channel.messages.fetch(message.reference.messageId)).author.id == clientId) {
			replyToMe = true;
		} else {
			return; // If it is a reply, but not to the bot, then don't interact with it
		}
	};

	// query openai with the prompt
	try {
		let sendToAi = [
			{role: "system", content: `You are a sociable chatbot named Hubert in a discord server named ${message.guild.name}. The description of the server, if one exists, is here: "${message.guild.description}". Don't state the description directly, but keep it in mind when interacting. Respond concisely. If a message seems to be lacking context, remind users that they need to reply directly to your messages in order for you to have context into the conversation.`},
			{role: "user", content: message.content}
		];
		if (replyToMe) { // add a bit of context if the user is replying to the bot
			sendToAi.splice(1, 0, {role: "assistant", content: (await message.channel.messages.fetch(message.reference.messageId)).content}); 
			sendToAi.splice(1, 0, {role: "user", content: (await message.channel.messages.fetch((await message.channel.messages.fetch(message.reference.messageId)).reference.messageId)).content}); 
		};

		const completion = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: sendToAi,
			max_tokens: 400,
			temperature: 1.3,
			user: message.author.id,
		});

		console.log(`${message.author.name} <@${message.author.id}> in ${message.guild.name} asked: "${message.content}" and Hubert responded with ${completion.data.usage.total_tokens} (${completion.data.usage.prompt_tokens}/${completion.data.usage.completion_tokens}) tokens: "${completion.data.choices[0].message.content}"`);
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
	if (func.isBanned(interaction.user.id)) {
		interaction.reply({ephemeral: true, content: `You do not have permission to interact with me.`});
		return; // Don't process input from banned users
	};
	
	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	// If interaction is restart command, do things
	if (interaction.commandName === 'restart') {
		client.user.setPresence({status: 'idle'});
		errHandle(`Requested restart`, 8, client)
	}
	
	try {
		await command.execute(interaction);
	} catch (error) {
		try {
			errHandle(`Interaction named ${interaction.commandName}\n${error}`, 1, client);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		} catch (error) {
			try {
				errHandle(`Error of interaction named ${interaction.commandName}\n${error}`, 5, client);
			} catch (error) {
				errHandle(`Error of interaction of unknown name\n${error}`, 5, client);
			}
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