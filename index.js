// Require the necessary discord.js classes
const fs = require('fs');
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const { token, clientId, guildId, channelId, devChannelId, openaiKey } = require('./config.json');
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
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_TYPING],
	partials: ["CHANNEL"],
	presence: {
		activity: {
			type: "WATCHING", name: "people talk"
		}
	}
});

// Register commands from commands directory
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

// Process text messages
client.on("messageCreate", message => {
	if (message.channel.id !== channelId) return; // Ignore messages sent ouside operational channel
	if (message.author.bot) return; // Ignore bot messages (namely itself)
	if (func.isBanned(message.author.id)) {
		message.reply({ephemeral: true, content: `You do not have permission to interact with me.`});
		return; // Don't process input from banned users
	};
	
	if (message.content === "new") {
		
	};

	// query openai with the prompt
	try {
		const completion = openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: [{role: "user", content: message.content}],
		max_tokens: 20,
		temperature: 0.5,
		user: message.author.id,
		});
	} catch (error) {
		errHandle(`OpenAI request error\n${error}`, 1, client);
	}
	try{
		console.log(completion.data.choices[0].message);
		message.reply({content: completion.data.choices[0].message});
	} catch (error) {
		errHandle(`OpenAI response discord reply error\n${error}`, 1, client);
	}
	

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
	// Set the bot status to online
	client.user.setPresence({status: 'online'});

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

// Check for unhandled errors on each interaction
client.on('interactionCreate', interaction => {
	let refDate = parseInt(fs.readFileSync('./files/Day.txt'), 10);
	let d = new Date()
	let nowDate = d.getDay()
	if (refDate !== nowDate) {
		fs.unlinkSync('./files/Nicknames.txt');
		fs.appendFileSync('./files/Nicknames.txt',`\n`);

		fs.writeFileSync('./files/Day.txt',`${nowDate}`)

		console.log('Reset Nickname file for new date.')
	}
});

// Login to Discord using the secret token
client.login(token);
