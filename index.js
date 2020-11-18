const Discord = require('discord.js');
const tok = require('./config/auth.json');
const bot = new Discord.Client();
const Google = require('./commands/google')
const fs = require('fs');
const path = require('path')
const getJSON = require('get-json')
const axios = require('axios')
const BASEURL = 'https://finder.deepspacecrew.com'
let guild_id = 540489005951746048
let roleID = 765320441757171753
const {GoogleSpreadsheet} = require('google-spreadsheet');
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: tok["USER_SQL"],
    password: tok["MDP_SQL"],
});

// connection.connect((err) => {
//     if (err) throw err;
//     console.log('Connecté!');
// });

// connection.end((err) => {
//   if (err) throw err;
//   console.log ('Déconnecté !');
// });

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

async function gogol() {
    let doc = new GoogleSpreadsheet(tok["ID_SHEET"]);
    await doc.useApiKey(tok["API_GOOGLE"]);
    await doc.loadInfo();
    console.log(doc.title + " " + doc.sheetCount);
    for (let i = 0; i < doc.sheetCount; i++) {
        console.log(doc.sheetsByIndex[i].title + " " + i);
    }
    var grade = await doc.sheetsByIndex[0];
    var solde = await doc.sheetsByIndex[2];
    // console.log(solde["_rawProperties"]);
    // console.log(grade["_rawProperties"]);
    // console.log(grade);
    await grade.loadCells('D10:D188');
    await solde.loadCells('A9:A188');
    await solde.loadCells('B9:D188');
    await solde.loadCells('TP9:TP188');
    for (let i = 10; i < 188; i++) {
        if (grade.getCellByA1('D' + i).value) {
            for (let j = 9; j < 188; j++) {
                if (solde.getCellByA1('A' + j).value === grade.getCellByA1('D' + i).value) {
                    console.log(solde.getCellByA1('B' + j).value + " " + grade.getCellByA1('D' + i).value + ", solde : " + solde.getCellByA1('TP' + j).value);
                    break;
                }
            }

        }
    }

    // for (var i = 1; i < solde.rowCount - 2; i++) {
    //     console.log(rows[i].title)
    // }

    console.log("end");
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
    // console.log(start)
    const info = fs.statSync('./data/items.json');
    // console.log(start - info.atimeMs);
    if (start - info.atimeMs > 2000) {
        getItemsFromServer();
        console.log("Rechargement des items");
    }
    let data = fs.readFileSync('./data/items.json');
    data = JSON.parse(data)
    let i = ''
    for (i in data) {
        if (containr(i, item) === true) {
            let url = await _getUrl(data[i])
            // console.log(url)
            result = url['request']['_header'].split("\n")[0].replace('\r', '').replace('GET ', '').replace(' HTTP/1.1', '');
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
        args.shift();
        console.log(args.length)
        if (args.length === 0) {
            return message.channel.send("Merci d'envoyer un paramètre à la demande !");
        } else {
            let dico = await getItems(args);
            const embed = new Discord.MessageEmbed()
                .setTitle("Résultat de la recherche sur " + args.join(' ') + " :")
            for (i in dico) {
                embed.addField(dico[i], i)
            }
            return message.channel.send(embed);
        }

    }
    if (message.content === "!ping") {
        message.channel.send('pong');
        // change_avatar()
    }
    if (message.content === "!solde") {
        let mess = await gogol();
        await message.delete();
    }
})

bot.on('guildMemberAdd', function (member) {
    member.createDM().then(function (channel) {
        return channel.send('Bienvenue sur mon serveur ' + member.displayName)
    }).catch(console.error)
})

bot.login(tok["TOKEN"]);