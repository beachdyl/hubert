const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('greeting')
		.setDescription('May I introduce myself?')
		.setDefaultMemberPermissions(2048)
		.setDMPermission(false),
	async execute(interaction) {
		const theEmbed = new MessageEmbed()
			.setColor('#00ff00')
			.setTitle('Hey there, I\'m Hubert!')
			.setAuthor('Hubert', 'https://i.ibb.co/BVKGkd9/gayliens.png', 'https://beachdyl.com')
			.setDescription(`Hello there! I'm Hubert, your friendly neighborhood chatbot. I'm here to make your experience in this discord server all the more enjoyable by chatting with you and keeping the conversations flowing. Don't hesitate to strike up a chat, ask a question or just say hi. Let's keep the interactions going!`)
			.addField('Developer', 'This bot is being developed by <@200316185445793792>.', true)
			.addField('Open Source', 'You can find the source code at https://github.com/beachdyl/hubert/', false)
			.addField('Similarity', 'Hubert is a work of fiction. Any similarity to actual persons, living or dead, is purely coincidental.', false)
			.setTimestamp();
		await interaction.reply({ephemeral: false, embeds: [theEmbed] });
	},
};

