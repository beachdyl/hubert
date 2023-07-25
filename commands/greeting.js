const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('greeting')
		.setDescription('May I introduce myself?')
		//.setDefaultMemberPermissions(2048)
		//.setDMPermission(false)
		,
	async execute(interaction) {
		const theEmbed = new EmbedBuilder()
			.setColor('#00ff00')
			.setTitle('Hey there, I\'m Hubert!')
			.setAuthor({name:'Hubert', iconURL:'https://i.ibb.co/BVKGkd9/gayliens.png', url:'https://beachdyl.com'})
			.setDescription(`Hello there! I'm Hubert, your friendly neighborhood chatbot. I'm here to make your experience in this discord server all the more enjoyable by chatting with you and keeping the conversations flowing. Don't hesitate to strike up a chat, ask a question or just say hi. Let's keep the interactions going!`)
			.addFields(
				{name: 'Developer', value: 'This bot is being developed by <@200316185445793792>.', inline: true},
				{name: 'Open Source', value: 'You can find the source code at https://github.com/beachdyl/hubert/', inline: false},
				{name: 'Similarity', value: 'Hubert is a work of fiction. Any similarity to actual persons, living or dead, is purely coincidental.', inline: false}
			)
			.setTimestamp();
		await interaction.reply({ephemeral: false, embeds: [theEmbed] });
	},
};

