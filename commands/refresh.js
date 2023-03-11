const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { adminUserId } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('refresh')
		.setDescription('Removes all stored nicknames and colors!'),
	async execute(interaction) {

		// Check executor. If not Dylan, do nothing.
		if (`${interaction.user.id}` !== adminUserId) {
			await interaction.reply({ephemeral: true, content: `You\'re not <@${adminUserId}>, you\'re <@${interaction.user.id}>! You can\'t do that.`, components: [] });
			console.error(`<@${interaction.user.id}> (${interaction.user.name}) tried to run /refresh.`);
		} else {
			fs.unlinkSync('./files/Nicknames.txt');
			fs.appendFileSync('./files/Nicknames.txt',`\n`);
			
			await interaction.reply({ content: 'I have cleared all nicknames!', components: [] });
		};
	},
};
