
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { openaiKey, clientId } = require('../config.json');
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
            .setDescription('The message you want set'))
        //.setDefaultMemberPermissions(32)
		//.setDMPermission(false)
        ,
    async execute(interaction) {

        // Set default parameters
        systemMessage = 'n/a'
        botName = 'n/a'
        
        // Read to see if there are any previous data entries which need to be kept
        file = interaction.guildId;
        try {
            // Look in the config for a valid custom message
            let temp = fs.readFileSync(`./files/servers/${file}.txt`, 'utf8');
            tempMessage = temp.slice(temp.indexOf('\n') + 1);
            if (tempMessage != 'n/a') {
                systemMessage = tempMessage;
            }
            //Look in the config for a valid custom name
            tempName = temp.slice(0, temp.indexOf('\n'));
            if (tempName != 'n/a') {
                botName = tempName;
            }
        } catch (err) {
            errHandle(`Could not read server data file\n${err}`, 1, client);
        };
        
        // Check what options have been used in the command
        if (interaction.options.getString('system_message')) {
            systemMessage = interaction.options.getString('system_message');
        };
        if (botName) {
            botName = interaction.options.getString('name');
            interaction.guild.members.cache.get(clientId).setNickname(botName);
        };

        // Write the parameters to a file with the name as the server Id
        try {
            fs.writeFileSync(`./files/servers/${file}.txt`, `${botName}\n${systemMessage}`)
        } catch (err) {
            throw(err);
        };

        // Have the Ai write a message updating the user on their servers new status
        let sendToAi = [
            {role: "system", content: `You are a sociable chatbot named ${botName} in a discord server named ${interaction.guild.name}. The description of the server, if one exists, is here: "${interaction.guild.description}". Don't state the description directly, but keep it in mind when interacting. Respond concisely. If a message seems to be lacking context, remind users that they need to reply directly to your messages in order for you to have context into the conversation.`},
            {role: "user" , content: 'Tell me about yourself in 50 words or less'}
        ];
        if (systemMessage) {
            sendToAi = [
                {role: "system", content: `Your name is ${botName}, ${systemMessage}`},
                {role: "user" , content: 'Tell me about yourself in 50 words or less'}
            ];
        };

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
