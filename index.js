const Discord = require('discord.js');
const tok = require('./config/auth.json');
const bot = new Discord.Client();
const Google = require('./commands/Google')
const fs = require('fs');
const path = require('path')
const getJSON = require('get-json')

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


function getItems() {
    var dict = {};
    getJSON('https://finder.deepspacecrew.com/GetSearch', function (error, response) {
        if (error) {
            console.log(error)
        }
        response.forEach(element => dict[element['name']] = element['id']);
        // response.forEach(element => console.log('id : ' + element['id'] + ', name :'+ element['name'] ));
    });
    // console.log(dict);

}


async function find(text) {
    console.log(text)
}


bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    change_avatar()
});

bot.on('message', function (message) {
    if (Google.match(message)) {
        return Google.action(message)
    }
    if (message.content.startsWith('!find')) {
        let args = message.content.split(' ');
        args.shift();
        getItems();
        // return message.channel.send(getItems(args));
    }
    if (message.content === "!ping") {
        message.channel.send('pong');
        // change_avatar()
    }
})

bot.on('guildMemberAdd', function (member) {
    member.createDM().then(function (channel) {
        return channel.send('Bienvenu sur mon serveur ' + member.displayName)
    }).catch(console.error)
})

bot.login(tok["TOKEN"]);