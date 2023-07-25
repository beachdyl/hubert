const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List available commands and information.')
		.setDefaultMemberPermissions(2048)
		.setDMPermission(false),
	async execute(interaction) {
		const theEmbed = new EmbedBuilder()
			.setColor('#532d8e')
			.setTitle('\"Hubert, help me!\"')
			.setAuthor({name:'Hubert', iconURL: 'https://i.imgur.com/lP3AUoy.png', url: 'https://github.com/beachdyl/hubert'})
			.setDescription('Sure thing! Here are the commands I\'m prepared to handle at the moment. Remember, all commands start with a slash (/) typed straight into the message box.')
			.addFields(
				{name: '/placeholder', value: 'Gets you a list.', inline: false},
				{name: '/greeting', value: 'I\'d love to tell you a little more about myself.', inline: false},
				{name: '/help', value: 'Bring up this help message again!', inline: false}
			)
			.setTimestamp();
		await interaction.reply({ephemeral: false, embeds: [theEmbed] });
	},
};

