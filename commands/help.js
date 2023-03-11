const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List available commands and information.'),
	async execute(interaction) {
		const exampleEmbed = new MessageEmbed()
			.setColor('#532d8e')
			.setTitle('\"Robo-Kathryn, help me!\"')
			.setAuthor('Purple Fire Robotics', 'https://i.ibb.co/cDrSdS5/PF-Flame.png', 'https://purplefire.org')
			.setDescription('Sure thing! Here are the commands I\'m prepared to handle at the moment. Remember, all commands start with a slash (/) typed straight into the message box.')
			.addField('/calendar [section]', 'Gets you a list with the next 10 events on our calendar, as well as a link to the calendar itself. If *section* is specified, it will filter to only show events hosted by that section (general meetings are always shown).', false)
			.addField('/meeting', 'If somebody asked for information about a meeting that is on the calendar, you can use this to give them a handy link to it, so they can find the answer.', false)
			.addField('/announce <section>', 'For club leaders to publish an announcement to the announcement channel of *section*.', false)
			.addField('/greeting', 'I\'d love to tell you a little more about myself.', false)
			.addField('/help', 'Bring up this help message again!', false)
			.setThumbnail('https://i.ibb.co/cDrSdS5/PF-Flame.png')
			.setTimestamp();
		await interaction.reply({ephemeral: false, embeds: [exampleEmbed] });
	},
};

