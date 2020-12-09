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
const con = mysql.createConnection({
    host: 'localhost',
    user: tok["USER_SQL"],
    password: tok["MDP_SQL"],
    database: "bot_fcu",
});

// con.connect((err) => {
//     if (err) throw err;
//     console.log('Connecté!');
// });

// con.end((err) => {
//   if (err) throw err;
//   console.log ('Déconnecté !');
// });

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

async function gogol() {
    let doc = new GoogleSpreadsheet(tok["ID_SHEET_MASTER"]);
    await doc.useApiKey(tok["API_GOOGLE"]);
    await doc.loadInfo();
    // console.log(doc.title + " " + doc.sheetCount);
    for (let i = 0; i < doc.sheetCount; i++) {
        console.log(doc.sheetsByIndex[i].title + " " + i);
    }
    var grade = await doc.sheetsByIndex[0];
    var solde = await doc.sheetsByIndex[2];
    // console.log(solde["_rawProperties"]);
    // console.log(grade["_rawProperties"]);
    // console.log(grade);
    await grade.loadCells('D10:D188');
    await grade.loadCells('I10:I188');
    await grade.loadCells('K10:K188');
    await solde.loadCells('A9:B188');
    await solde.loadCells('TP9:TP188');
    con.connect((err) => {
        if (err) throw err;
        console.log('Connecté!');
    });
    for (let i = 10; i < 188; i++) {
        if (grade.getCellByA1('D' + i).value) {
            for (let j = 9; j < 188; j++) {
                if (solde.getCellByA1('A' + j).value === grade.getCellByA1('D' + i).value) {
                    let pseudo = grade.getCellByA1('D' + i).value;
                    let gra = solde.getCellByA1('B' + j).value;
                    let handle = grade.getCellByA1('I' + i).value;
                    let spe = grade.getCellByA1('K' + i).value;
                    let solde_ = solde.getCellByA1('TP' + j).value;
                    // console.log(solde.getCellByA1('B' + j).value + " " + grade.getCellByA1('D' + i).value + ", solde : " + solde.getCellByA1('TP' + j).value);
                    let sql = `INSERT INTO personnel (pseudo, grade, handle, specialite, solde) VALUES (?,?,?,?,?)`;
                    let todo = ['' + pseudo + '', '' + gra + '', '' + handle + '', '' + spe + '', solde_]
                    await con.query(sql, todo, function (err, result) {
                        if (err) throw err;
                        console.log(pseudo + " inséré dans la table.")
                    });
                    break;
                }
            }
        }
    }
    // TODO : table perso : ID, pseudo, grade, handle, specialite, solde | table ship : nom, marque, role, ID des pacs | table validation : date pour validation total de l'item, bool pour les petites parties
    con.end((err) => {
        if (err) throw err;
        console.log('Déconnecté !');
    });
    console.log("end");
}

function idOf(i) {
    return (i >= 26 ? idOf((i / 26 >> 0) - 1) : '') + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i % 26 >> 0];
}
0
function rename_ship(name) {
    name = name.replace(/[\s-\/(+).]/g, '_');
    name = name.replace(/_{2,}/g, '_');
    name = name.replace('\'', '');
    name = name.replace(/_$/g, '');
    return name
}

async function create_table_ship() {
    let fleet = new GoogleSpreadsheet(tok["ID_SHEET_FLEET"]);
    await fleet.useApiKey(tok["API_GOOGLE"]);
    await fleet.loadInfo();
    var flotte = await fleet.sheetsByIndex[0];
    await flotte.loadCells('B9:B' + flotte.rowCount);
    con.connect((err) => {
        if (err) throw err;
        console.log('Connecté!');
    });
    for (let i = 9; i < flotte.rowCount; i++) {
        if (flotte.getCellByA1('B' + i).value) {
            var name = flotte.getCellByA1('B' + i).value
            console.log(flotte.getCellByA1('B' + i).value)
            name = rename_ship(name)
            var sql = "ALTER TABLE ships ADD COLUMN " + name + " VARCHAR(50)";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log(name + " inséré dans la table.")
            });
        }
    }
    con.end((err) => {
        if (err) throw err;
        console.log('Déconnecté !');
    });
}

async function dl_ships() {
    let master = new GoogleSpreadsheet(tok["ID_SHEET_MASTER"]);
    let fleet = new GoogleSpreadsheet(tok["ID_SHEET_FLEET"]);
    await master.useApiKey(tok["API_GOOGLE"]);
    await fleet.useApiKey(tok["API_GOOGLE"]);
    await master.loadInfo();
    await fleet.loadInfo();
    var grade = await master.sheetsByIndex[0];
    var flotte = await fleet.sheetsByIndex[0];
    // console.log(grade.rowCount)
    await grade.loadCells('D10:D' + grade.rowCount);
    await flotte.loadCells('K3:DM3');
    await flotte.loadCells('K1:DM1');
    await flotte.loadCells('B9:B178');
    for (let i = 10; i <= grade.rowCount; i++) {
        if (grade.getCellByA1('D' + i).value) {
            for (let j = 10; j < flotte.columnCount; j++) {
                // console.log(flotte.getCellByA1(idOf(j) + '3').value)
                // console.log(grade.getCellByA1('D' + i).value)
                if (flotte.getCellByA1(idOf(j) + '3').value === grade.getCellByA1('D' + i).value) {
                    if (flotte.getCellByA1(idOf(j) + '1').value > 0) {
                        console.log(grade.getCellByA1('D' + i).value);
                        let pseudo = grade.getCellByA1('D' + i).value;
                        await flotte.loadCells(idOf(j) + '9:' + idOf(j) + flotte.columnCount);

                        // console.log(flotte.getCellByA1(idOf(j) + '3').value + " " + grade.getCellByA1('D' + i).value);
                        // con.connect((err) => {
                        //     if (err) throw err;
                        //     console.log('Connecté!');
                        // });
                        // let sql = `INSERT INTO personnel (pseudo, grade, handle, specialite, solde) VALUES (?,?,?,?,?)`;
                        // let todo = [''+pseudo+'',''+gra+'',''+handle+'',''+spe+'',solde_]
                        // con.query(sql, todo, function (err, result) {
                        //     if (err) throw err;
                        //     console.log(pseudo + " inséré dans la table.")
                        // });
                        // con.end((err) => {
                        //     if (err) throw err;
                        //     console.log ('Déconnecté !');
                        // });
                    }
                    break;
                }
            }
        }
    }
    console.log("end");
}

function perso(ps) {
    con.connect((err) => {
        if (err) throw err;
        console.log('Connecté!');
    });
    let sql = "SELECT grade, pseudo, solde FROM personnel WHERE pseudo = ?";
    let todo = ['' + ps + '']
    con.query(sql, todo, (function (err, result) {
        if (err) throw err;
        // console.log(result)
        console.log(result[0].solde)
    }))
    con.end((err) => {
        if (err) throw err;
        console.log('Déconnecté !');
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
    gogol();
    // perso('Systemack');
    // dl_ships();
    // create_table_ship()
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