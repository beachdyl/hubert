const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const func = require('../functions.js');
const { adminUserId } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('prohibit')
		.setDescription('Proibit a user from interacting with the bot. This does not reveal their identity.')
		.addStringOption(option =>
			option
				.setName('user')
				.setDescription('List a user by anonymous nickname, or Discord ID. Do not use an @mention.')
				.setRequired(true)
		),
	async execute(interaction) {
		const userInput = interaction.options.getString('user');
		if (`${interaction.user.id}` !== adminUserId) {
			await interaction.reply({ephemeral: true, content: `You\'re not <@${adminUserId}>, you\'re <@${interaction.user.id}>! You can\'t do that.`, components: [] });
			console.error(`<@${interaction.user.id}> (${interaction.user.name}) tried to run /prohibit.`);
		} else {
			let resolvedId = func.getUserId(userInput);
			if (resolvedId === "000000000000000000") {
				await interaction.reply({ephemeral: true, content: `Nobody in the system by that name can be located. Nothing changed.`});
			} else {
				fs.appendFileSync('./files/Banned.txt',`${resolvedId}\n`);
				await interaction.reply({ephemeral: true, content: `You have prohibited that user.`});
				console.log(`<@${interaction.user.id}> prohibited <@${resolvedId}>!`)
			};
		};
	},
};
