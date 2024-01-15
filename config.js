const fs = require('fs')
const chalk = require('chalk')

let owner = "6289529871790@s.whatsapp.net"
global.ownerNumber = owner

global.apikey = ""
global.webkey = "https://api.yanzbotz.my.id/"

global.packname = 'Created By'
global.author = 'Ryuu'
global.offline = true
global.token = "" // token bot telegram 

global.thumb = fs.readFileSync('./media/menu.jpg')
global.link = 'https://github.com/Ryuuzxy-code'

global.teks = `Welcome to *Aerial - Team*
My name is Ryuu and I am a developer and creator of artificial intelligence that is integrated with WhatsApp desktop

Can I help you?`

global.mess = {
    query: 'Please enter a query!',
    done: 'Succesfully retreieved data!',
    prem: 'Feature Only For User Premium!',
    admin: 'Feature Only for Admin Group!',
    botAdmin: 'This feature can only be used when Bot Admin!',
    owner: 'Feature Only for Owner!',
    group: 'Feature Only for Group Chat!',
    private: 'Feature Only for Private Chat!',
    wait: 'Wait a Moment, for Process...',    
    error: 'Sorry, Error...',
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update'${__filename}'`))
    delete require.cache[file]
    require(file)
})
