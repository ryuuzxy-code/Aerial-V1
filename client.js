require('./config.js')
const {
BufferJSON,
WA_DEFAULT_EPHEMERAL,
generateWAMessageFromContent,
proto,
generateWAMessageContent,
generateWAMessage,
prepareWAMessageMedia,
areJidsSameUser,
getContentType
} = require('@whiskeysockets/baileys');
const bot = new Telegraf(token)
const axios = require('axios');
const toMs = require('ms');
const os = require('os');
const ms = require('parse-ms');
const cheerio = require('cheerio');
const dl = require("@bochilteam/scraper");
const fs = require("fs");
const util = require("util");
const chalk = require('chalk');
const moment = require('moment-timezone');
const { exec } = require('child_process');
const { from } = require('form-data');
const afk = JSON.parse(fs.readFileSync('./lib/off.json'))
const { isAfk, cekafk, addafk } = require('./lib/offline');
const { format } = require('path');

global.Func = require("./lib/myfunc");
let mode = true // Mode publik, true yang berarti public, false self

module.exports = async (conn, m) => {
try {
const body = m.mtype === 'conversation' ? m.message.conversation : m.mtype === 'extendedTextMessage' ? m.message.extendedTextMessage.text : '';
const budy = typeof m.text === 'string' ? m.text : '';
const prefix = /^[#!.,®©¥€¢£/\∆✓]/.test(body) ? body.match(/^[#!.,®©¥€¢£/\∆✓]/gi) : '#' 
global.prefix
const commands = body.startsWith(prefix) ? body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase() : '';
const command = commands.replace(prefix, '');
const args = body.trim().split(/ +/).slice(1);
const detouq = (m.quoted || m)
const quoted = (detouq.mtype == 'buttonsMessage') ? detouq[Object.keys(detouq)[1]] : (detouq.mtype == 'templateMessage') ? detouq.hydratedTemplate[Object.keys(detouq.hydratedTemplate)[1]] : (detouq.mtype == 'product') ? detouq[Object.keys(detouq)[0]] : m.quoted ? m.quoted : m
const mime = (quoted.msg || quoted).mimetype || ''
const qmsg = (quoted.msg || quoted)
const q = question = args.join(' ');
const message = m;
const messageType = m.mtype;
const messageKey = message.key;
const pushName = m.pushName || 'Undefined';
const itsMe = m.key.fromMe || global.ownerNumber.includes(m.sender) ? true : false
const sender = m.sender;
const userId = sender.split("@")[0];
const reply = m.reply;


const isGroup = m.key.remoteJid.endsWith('@g.us') 
const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(e => {}) : ''
const groupName = m.isGroup ? groupMetadata.subject : ''
const participants = m.isGroup ? await groupMetadata.participants : ''
const groupAdmins = m.isGroup ? await Func.getGroupAdmins(participants) : ''
const isBotAdmins = m.isGroup ? groupAdmins.includes(itsMe) : false
const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
const groupOwner = m.isGroup ? groupMetadata.owner : ''
const isGroupOwner = m.isGroup ? (groupOwner ? groupOwner : groupAdmins).includes(m.sender) : false
const groupMembers = m.isGroup ? groupMetadata.participants : ''

moment.tz.setDefault("Asia/Makassar").locale("id")
const time = moment.tz('Asia/Makassar').format('HH:mm:ss')
const waktu = moment().tz('Asia/Makassar').format('HH:mm:ss')
if (waktu < "23:59:00") {
 var ucapanWaktu = 'Selamat Malam 🏙️'
}
if (waktu < "19:00:00") {
 var ucapanWaktu = 'Selamat Petang 🌆'
}
if (waktu < "18:00:00") {
 var ucapanWaktu = 'Selamat Sore 🌇'
}
if (waktu < "15:00:00") {
 var ucapanWaktu = 'Selamat Siang 🌤️'
}
if (waktu < "10:00:00") {
 var ucapanWaktu = 'Selamat Pagi 🌄'
}
if (waktu < "05:00:00") {
 var ucapanWaktu = 'Selamat Subuh 🌆'
}
if (waktu < "03:00:00") {
 var ucapanWaktu = 'Selamat Malam 🌃'
}

const more = String.fromCharCode(8206)
const readmore = more.repeat(4001)

const ftextt = {
 key: {
fromMe: false, 
participant: `0@s.whatsapp.net`, 
...(m.chat ? { 
  remoteJid: "status@broadcast" 
} : {})}, 
message: { "extendedTextMessage": {
  "text":`*AERIAL - BOT*`, 
  "title": `${ucapanWaktu}`, 
  'jpegThumbnail': await Func.reSize('./media/menu.jpg', 100, 100)}
}
 }

if (body.startsWith('$')) {
if (!itsMe) return 
exec(q, async (err, stdout) => {
if (err) return m.reply(`${err}`)
if (stdout) {
await m.reply(`${stdout}`)
}
})
}

if (body.startsWith('>')) {
if (!itsMe) return 
try {
let evaled = await eval(q)
if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
await m.reply(evaled)
} catch (err) {
await m.reply(String(err))
}
}

if (body.startsWith('=>')) {
if (!itsMe) return 
function Return(sul) {
let sat = JSON.stringify(sul, null, 2)
if (sat) {
var bang = util.format(sat)
} else if (sat == undefined) {
var bang = util.format(sul)
}
return m.reply(bang)
}
try {
m.reply(util.format(eval(`(async () => { return ${q} })()`)))
} catch (e) {
m.reply(String(e))
}
}

cekafk(afk)
if (!m.key.remoteJid.endsWith('@g.us') && global.offline){
if (!m.key.fromMe){
if (isAfk(m.key.remoteJid)) return
addafk(m.key.remoteJid)
heheh = ms(Date.now() - global.waktuu) 
let tkss = global.teks
m.reply(tkss)
}
}
if (m.key.remoteJid.endsWith('@g.us') && global.offline) {
if (!m.key.fromMe){
if (m.message.extendedTextMessage != undefined){
if (m.message.extendedTextMessage.contextInfo != undefined){
if (m.message.extendedTextMessage.contextInfo.mentionedJid != undefined){
for (let ment of m.message.extendedTextMessage.contextInfo.mentionedJid) {
if (ment === `${ownerNumber}@s.whatsapp.net`){
if (isAfk(m.key.remoteJid)) return
addafk(m.key.remoteJid)
heheh = ms(Date.now() - global.waktuu)
let tkss = global.teks
m.reply(tkss)
}
}
}
}
}
}
}

//Mode Public/Self
if (!mode) {
if (!m.key.fromMe) return;
}

//Reader Messages 
if (m.message) {
//conn.readMessages([m.key]);

//Reader Console Command 
console.log(chalk.black(chalk.bgWhite('|| WATSHAPP ||')), chalk.black(chalk.bgGreen(time)) + ' >', chalk.black(chalk.bgBlue(budy || m.mtype)))}

if (!body.startsWith(prefix)) {
return;
}

switch (command) {

case 'meki': {
m.reply('hai beb')
}
break

case 'status': {
if (!itsMe) return
m.reply(`乂 *STATUS - SERVER*

- Hostname: ${os.hostname()}
- Platform: ${os.platform()}
- Type: ${os.type}
- OS: ${os.version()}/${os.release()}
- Arch: ${os.arch()}
- RAM: ${formatSize(os.freemem())} / ${formatSize(os.totalmem())}

- Uptime OS
  ${runtime(os.uptime())}

- Runtime Bot
  ${runtime(process.uptime())}
`)
}
break
case 'get': {
if (!itsMe) return
if (!q) return Func.newReply(mess.query)
if (!isUrl) return Func.newReply('Enter the link where you want to download the media...')
conn.sendFileUrl(m.chat, q)
}
break
case 'hdtag':{
if (!itsMe) return
let mem = []
groupMembers.map( i => mem.push(i.id))
conn.sendMessage(m.chat, { text: q ? q : '', mentions: mem})
}
break
case 'offline':{
if (!itsMe) return
global.offline = true
Func.newReply('Bot is now debuging...')
}
break
case 'online':{
if (!itsMe) return
global.offline = false
Func.newReply('Debug is turned off!')
}
break
case 'tes': {
if (!itsMe) return
Func.newReply('The bot has run...');
}
break;  
case 'tiktok': case 'ttnowm': case 'tiktoknowm': case 'tt': {
if (!itsMe) return
if (!q) return Func.newReply(mess.query)
if (!isUrl(q)) return Func.newReply('URL invalid!')
reaction('⏳')
fetchJson(global.webkey + 'api/downloader/snaptik?url=' + q + `&apiKey=` + global.apikey).then( data => {
conn.sendMessage(m.chat, { video: { url: data.result.server1.url }, caption: data.result.caption }, { quoted: m })
})
}
break;
case 'bard':
case 'gpt3': 
if (!itsMe) return
try {
if (!q) return reply('Question?')
reaction('⏳')
fetchJson(global.webkey + `api/ai/` + command + `?query=` + q + `&apiKey=` + global.apikey).then( data => {
conn.sendMessage(m.chat, { text: data.result }, { quoted: m }) 
})
} catch(e) {
m.reply(mess.error)
}
break;
case 'ai':
if (!itsMe) return 
try {
if (!q) return reply('Question?')
reaction('⏳')
fetchJson(global.webkey + `api/ai/gpt3?query=` + q + `&apiKey=` + global.apikey).then( data => {
conn.sendMessage(m.chat, { text: data.result }, { quoted: m })
})
} catch {
m.reply(mess.error)
}
break;
case 'backup': {
if (!itsMe) return
reaction('⏳')
exec('zip backup.zip *')
let malas = await fs.readFileSync('./backup.zip')
await conn.sendMessage(m.chat, {
document: malas,
mimetype: 'application/zip',
fileName: 'backup.zip'
}, {
quoted: m
})
}
break
case 'menu': {
if (!itsMe) return
let teks = `Hi ${pushName || 'Kak!'} ${ucapanWaktu}

乂 *INFORMATION*
◦ Creator: @6285796158860
◦ Time: ${time}
${readmore}
乂 *OWNER MENU*
${prefix}tes
${prefix}get
${prefix}status

乂 *MAIN MENU*
${prefix}online
${prefix}offline

乂 *AI MENU*
${prefix}gpt3
${prefix}bard

乂 *DL MENU*
${prefix}tiktok

乂 *GC MENU*
${prefix}hdtag
`
conn.sendMessage(m.chat, { text: teks, 
contextInfo: { externalAdReply: {
title: "Aerial - BOT",
body: ucapanWaktu,
sourceUrl: "",
mediaUrl: "",
mediaType: 1,
showAdAttribution: true,
renderLargerThumbnail: true,
thumbnailUrl: "https://telegra.ph/file/955c9b7387159b4886b4a.jpg", 
mentions: ['6285796158860@s.whatsapp.net']}}}, { quoted: ftextt })
 }
 break;

default: {}
}

} catch (err) {
console.log(util.format(err));
m.reply(util.format(err));
}
}


let file = require.resolve(__filename);
fs.watchFile(file, () => {
fs.unwatchFile(file);
console.log(chalk.redBright(`Update ${__filename}`));
delete require.cache[file];
require(file);
});