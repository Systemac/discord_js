const Discord = require('discord.js');
const tok = require('./config/auth.json');
const bot = new Discord.Client();
const Google = require('./commands/google')
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


function getItemsFromServer() {
    var dict = {};
    getJSON('https://finder.deepspacecrew.com/GetSearch', function (error, response) {
        if (error) {
            console.log(error)
        }
        response.forEach(element => dict[element['name']] = element['id']);
        // console.log(dict);
        let data = JSON.stringify(dict);
        fs.writeFileSync('./data/items.json', data)
        // response.forEach(element => console.log('id : ' + element['id'] + ', name :'+ element['name'] ));
    });
    // console.log(dict);
}

function containr(text, words) {
    // console.log(words.length)
    let i = 0;
    words.forEach(element => {
        // console.log(element)
        if (text.toLowerCase().indexOf(element.toLowerCase()) !== -1) {
            i += 1;
        }
    });
    if (i === words.length){
        return true
    }
}

function getItems(item) {
    const start = Date.now();
    console.log(start)
    const info = fs.statSync('./data/items.json');
    console.log(start - info.atimeMs);
    if (start - info.atimeMs > 10000000) {
        getItemsFromServer();
        console.log("Rechargement des items");
    }
    fs.readFile('./data/items.json', (err, data) => {
        if (err) throw err;
        var dict = JSON.parse(data)
        for (const i in dict) {
            // console.log(i);
            if (containr(i, item) === true) {
                console.log("trouvé " + i + " " + dict[i])
            }
        }
    });
}



async function find(text) {
    console.log(text)
}


bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    change_avatar();
    getItemsFromServer();
});

bot.on('message', function (message) {
    if (Google.match(message)) {
        return Google.action(message)
    }
    if (message.content.startsWith('!find')) {
        let args = message.content.split(' ');
        args.shift();
        getItems(args);
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