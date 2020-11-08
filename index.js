const Discord = require('discord.js');
const tok = require('./config/auth.json');
const bot = new Discord.Client();
const Google = require('./commands/google')
const fs = require('fs');
const path = require('path')
const getJSON = require('get-json')
const axios = require('axios')
const BASEURL = 'https://finder.deepspacecrew.com'

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
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

// https://www.youtube.com/watch?v=pBd90XZ6UYg

function getItemsFromServer() {
    // TODO : Mettre en place une promesse en fin de boucle pour enlever la tempo de merde.
    let dict = {};
    getJSON(BASEURL + '/GetSearch', function (error, response) {
        if (error) {
            console.log(error)
        }
        response.forEach(element => dict[element['name']] = element['id']);
        // console.log(dict);
        let data = JSON.stringify(dict);
        let dataExist = fs.existsSync('./data/items.json')
        if (dataExist) {
            fs.writeFileSync('./data/items.json', data)
        } else {
            fs.mkdir('./data/', (err) => {
                if (err) {
                    return console.log(err)
                }
                fs.writeFileSync('./data/items.json', data)
            });
        }
        // response.forEach(element => console.log('id : ' + element['id'] + ', name :'+ element['name'] ));
    });
    // console.log(dict);
}

function containr(text, words) {
    let i = 0;
    words.forEach(element => {
        if (text.toLowerCase().indexOf(element.toLowerCase()) !== -1) {
            i += 1;
        }
    });
    if (i === words.length){
        return true
    }
}

async function getItems(item) {
    let dico = {}
    const start = Date.now();
    let dataExist = fs.existsSync('./data/items.json');
    if (dataExist) {
        let info = fs.statSync('./data/items.json');
        if (start - info.atimeMs > 2000) {
            await getItemsFromServer();
            console.log("Rechargement des items");
        }
    } else {
        await getItemsFromServer();
        await sleep(5000);
    }
    let data = fs.readFileSync('./data/items.json');
    data = JSON.parse(data)
    let i = ''
    for (i in data) {
        if (containr(i, item) === true) {
            let url = await _getUrl(data[i])
            // console.log(url)
            let result = url['request']['_header'].split("\n")[0].replace('\r', '').replace('GET ', '').replace(' HTTP/1.1', '');
            if (result.length < 30) {
                result = '/Shipshops1/' + data[i]
            }
            // console.log(result);
            dico[BASEURL + result] = i
        }
    }
    // console.log(dico);
    return dico;
}

function _getUrl(iditem) {
    return axios.get(BASEURL + '/Search/' + iditem);
}


bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    // change_avatar();
    // getItemsFromServer();
});

bot.on('message', async function (message) {
    if (Google.match(message)) {
        return Google.action(message)
    }
    if (message.content.startsWith("!move")) {
        console.log("lancement de la recherche des membres");
        let membres = await message.guild.members.fetch();
        let direct = JSON.stringify(membres)
        let retour = JSON.parse(direct)
        for (let i = 0; i < retour.length; i++) {
            let membre = retour[i]
            console.log(membre)
        }
    }

    if (message.content.startsWith("!test")) {
        let member = await message.guild.members.fetch();
        let members = JSON.stringify(member)
        member = JSON.parse(members)
        console.log(member)
    }

    if (message.content.startsWith('!find')) {
        let args = message.content.split(' ');
        let author = message.author;
        args.shift();
        console.log(args.length);
        if (args.length === 0) {
            return message.channel.send("Merci d'envoyer un paramètre à la demande !");
        } else {
            let dico = await getItems(args);
            const embed = new Discord.MessageEmbed()
                .setTitle(`Résultat de la recherche sur ` + args.join(' ') + " :");
            for (i in dico) {
                embed.addField(dico[i], i);
            }
            message.channel.send(`${author} :`);
            return message.channel.send(embed);
        }
    }
    if (message.content === "!ping") {
        message.channel.send('pong');
    }
})

bot.on('guildMemberAdd', function (member) {
    member.createDM().then(function (channel) {
        return channel.send('Bienvenue sur mon serveur ' + member.displayName)
    }).catch(console.error)
})

bot.login(tok["TOKEN"]);