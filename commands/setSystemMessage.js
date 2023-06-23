
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { openaiKey } = require('../config.json');
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: openaiKey,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_system_message')
        .setDescription('Sets the system message which provides context to Hubert')
        .addStringOption(option =>
            option.setName('system_message')
            .setRequired(true)
            .setDescription('The message you want set')),
    async execute(interaction) {
        systemMessage = interaction.options.getString('system_message');
        let file = interaction.guildId;
        try {
            fs.writeFileSync(`./files/servers/${file}.txt`, systemMessage)
        } catch (err) {
            throw (err);
        };

        // This is very unnecessary but fun
        let sendToAi = [
            {role: "system", content: systemMessage},
            {role: "user" , content: 'Tell me about yourself in 50 words or less'}
        ];

        const completion = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: sendToAi,
			max_tokens: 400,
			temperature: 1.2,
			user: interaction.member.user.id,
		});

        await interaction.reply(completion.data.choices[0].message.content);
    },
};
