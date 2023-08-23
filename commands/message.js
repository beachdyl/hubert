const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { openaiKey, clientId } = require('../config.json');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: openaiKey,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('Send a specific message in this channel')
        .addStringOption(option =>
            option.setName('prompt')
            .setDescription('What do you want the bot to do?'))
        .setDefaultMemberPermissions(32)
		.setDMPermission(false),
    async execute(interaction) {

        botName, systemMessage = getServerConfig(interaction.guildId, "Hubert", null);
	
		let sendToAi = [
			{role: "system", content: systemMessage}
		];
		sendToAi.splice(1, 0, {role: "user", content: interaction.options.getString("")});
	
		const completion = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: sendToAi,
			max_tokens: 400,
			temperature: 1.1,
			user: interaction.member.user.id,
		});

        await interaction.reply(completion.data.choices[0].message.content);
    }
};
