const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { adminUserId } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('prohibit')
		.setDescription('Proibit a user from interacting with the bot.')
		.addStringOption(option =>
			option
				.setName('user')
				.setDescription('List a user by Discord ID. Do not use an @mention.')
				.setRequired(true)
		)
		.setDefaultMemberPermissions(0)
		.setDMPermission(false),
	async execute(interaction) {
		const userInput = interaction.options.getString('user');
		if (`${interaction.user.id}` !== adminUserId) {
			await interaction.reply({ephemeral: true, content: `You\'re not <@${adminUserId}>, you\'re <@${interaction.user.id}>! Only global bot admins can do that.`});
			console.error(`<@${interaction.user.id}> (${interaction.user.name}) tried to run /prohibit.`);
		} else {
			fs.appendFileSync('./files/Banned.txt',`${userInput}\n`);
			await interaction.reply({ephemeral: true, content: `You have prohibited that user.`});
			console.log(`<@${interaction.user.id}> prohibited <@${userInput}>!`);
		};
	},
};
