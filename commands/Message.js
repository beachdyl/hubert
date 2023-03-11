const { SlashCommandBuilder } = require('@discordjs/builders');
const func = require('../functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('message')
		.setDescription('Send a message into the proper channel')
		.addStringOption(option =>
			option
				.setName('message')
				.setDescription('What would you like to say?')
				.setRequired(true)
		),
	async execute(interaction) {
		await interaction.reply({ephemeral: true, content: `I've processed your message. It will be posted under the name **${func.getNickname(interaction.user.id)}**.`});
	},
};
