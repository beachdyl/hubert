const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('restart')
		.setDescription('Restarts the robot, and re-caches events and commands.')
		.setDefaultPermission(true),
	async execute(interaction) {
		await interaction.reply({ content: 'Restarting now! Hopefully, I\'ll be back soon.\n**o7**' });

		script = exec('cd ..; scripts/killRestart.sh || ./killRestart.sh');
		// what to do for data coming from the standard out
		script.stdout.on('data', function(data){
			console.log(data.toString());
		});
		// what to do with data coming from the standard error
		script.stderr.on('data', function(data){
			console.error(data.toString());
		});
		// what to do when the command is done
		script.on('exit', function(code){
			console.log('program ended with code: ' + code);
		});
	},
}