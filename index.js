// Require the necessary discord.js classes
const fs = require('fs');
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const { token, clientId, guildId, channelId, devChannelId, openaiKey } = require('./config.json');
const { errHandle } = require('@beachdyl/error_handler');
const func = require('./functions.js');

// import openai integration data
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.openaiKey,
});
const openai = new OpenAIApi(configuration);
const response = await openai.listEngines();

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

	message.reply({content: `I've processed your message. It will be posted under the name **${func.getNickname(message.author.id)}**.\nJust so you know, you can also run \`/message {your message}\` in the server. It's still anonymous.\n\n Your message was posted here: https://discord.com/channels/${guildId}/${channelId}`});

	// Send embed with message
	const messageEmbed = new MessageEmbed()
		.setTitle(`Message from ${func.getNickname(message.author.id)}:`)
		.setColor(func.getColor(message.author.id))
		//.setAuthor(func.getNickname(message.author.id))
		.setDescription(message.content)
		//.setFooter('Sector', 'https://i.ibb.co/BVKGkd9/gayliens.png')
	client.channels.cache.get(channelId).send({embeds: [messageEmbed] });
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

	// If interaction is message command, do things
	if (interaction.commandName === 'message') {
		const messageEmbed = new MessageEmbed()
		.setTitle(`Message from ${func.getNickname(interaction.user.id)}:`)
		.setColor(func.getColor(interaction.user.id))
		//.setAuthor(func.getNickname(interaction.user.id))
		.setDescription(interaction.options.getString('message'))
		//.setFooter('Sector', 'https://i.ibb.co/BVKGkd9/gayliens.png')
	client.channels.cache.get(channelId).send({embeds: [messageEmbed] });
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
		.setAuthor('Sector', 'https://i.ibb.co/BVKGkd9/gayliens.png', 'https://beachdyl.com')
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
