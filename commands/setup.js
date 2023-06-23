
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
        .setName('setup')
        .setDescription('Sets up Hubert with a name and system message to provide context')
        .addStringOption(option =>
            option.setName('name')
            .setDescription('The name Hubert will go by'))
        .addStringOption(option =>
            option.setName('system_message')
            .setDescription('The message you want set')),
    async execute(interaction) {

        systemMessage = `You are a sociable chatbot named Hubert in a discord server named ${message.guild.name}. The description of the server, if one exists, is here: "${message.guild.description}". Don't state the description directly, but keep it in mind when interacting. Respond concisely. If a message seems to be lacking context, remind users that they need to reply directly to your messages in order for you to have context into the conversation.`
        
        if (interaction.options.getString('system_message')) {
            systemMessage = interaction.options.getString('system_message');
        }

        else {}

        if (botName) {
            botName = interaction.options.getString('name');
        }

        // This is very unnecessary but fun
        let sendToAi = [
            {role: "system", content: `Your name is ${botName}, ${systemMessage}`},
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
