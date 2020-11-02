const Discord = require('discord.js');
const tok = require('./config/auth.json');
const bot = new Discord.Client();

const fs = require('fs');
const path = require('path')

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function change_avatar() {
    const testFolder = './avatar/';
    fs.readdir(testFolder, (err, files) => {
        // console.log(files)
        const avatar = files[getRandomInt(files.length)]
        bot.user.setAvatar(path.join(testFolder, avatar))
            .then(() => console.log("Avatar correctement modifié"))
            .catch(console.error)
    });
}

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    change_avatar()
});

bot.on('message', function (message) {
    if (message.content === "!ping") {
        message.channel.send('pong');
        // change_avatar()
    }
})

bot.login(tok["TOKEN"]);