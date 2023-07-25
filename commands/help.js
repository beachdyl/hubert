const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List available commands and information.')
		//.setDefaultMemberPermissions(2048)
		//.setDMPermission(false)
		,
	async execute(interaction) {
		const theEmbed = new MessageEmbed()
			.setColor('#532d8e')
			.setTitle('\"Hubert, help me!\"')
			.setAuthor('Hubert', 'https://i.ibb.co/BVKGkd9/gayliens.png', 'https://beachdyl.com')
			.setDescription('Sure thing! Here are the commands I\'m prepared to handle at the moment. Remember, all commands start with a slash (/) typed straight into the message box.')
			.addField('/placeholder', 'Gets you a list.', false)
			.addField('/greeting', 'I\'d love to tell you a little more about myself.', false)
			.addField('/help', 'Bring up this help message again!', false)
			.setTimestamp();
		await interaction.reply({ephemeral: false, embeds: [theEmbed] });
	},
};

