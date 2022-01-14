const venom = require('venom-bot');
const config = require('./config');
const rmq = require('./rmq');
const fs = require('fs');
const mime = require('mime-types');

const phoneNumber = process.env.PHONENUMBER || config.name;

var WappClient={};
rmq.subscribeQueue(phoneNumber, sendMsg);

rmq.sendMessage('from'+phoneNumber, 'aaa', {app:'whatsapp', id:phoneNumber, event:'app load', data:'Starting '+phoneNumber});

venom
  .create(
    'sessionName',
	(base64Qrimg, asciiQR, attempts, urlCode) => {
	  rmq.sendMessage('from'+phoneNumber, 'aaa', {
			version: config.version,
			app: 'whatsapp',
			id: phoneNumber,
			event: 'qrrequest',
			attempts: attempts,
			terminalqr: asciiQR,
			base64: base64Qrimg,
			urlCode: urlCode
		});
	  //console.log(asciiQR);
    },
    (statusSession, session) => {
	  console.log('-----------------------------');
      console.log('Status Session: ', statusSession);
      //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken || chatsAvailable || deviceNotConnected || serverWssNotConnected || noOpenBrowser
      //Create session wss return "serverClose" case server for close
      console.log('Session name: ', session);
	  if(statusSession==="browserClose") {
		  console.log('KILL SIGNAL!!!');
		  process.exit(1)
	  }
    },
    {
      folderNameToken: 'tokens/'+phoneNumber, //folder name when saving tokens
      mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
      headless: false, // Headless chrome
//      devtools: false, // Open devtools by default
//      useChrome: true, // If false will use Chromium instance
      debug: false, // Opens a debug session
//      logQR: true, // Logs QR automatically in terminal
//      browserWS: '', // If u want to use browserWSEndpoint
//      browserArgs: [''], //Original parameters  ---Parameters to be added into the chrome browser instance
//      puppeteerOptions: {}, // Will be passed to puppeteer.launch
      disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
      disableWelcome: true, // Will disable the welcoming message which appears in the beginning
//      updatesLog: true, // Logs info updates automatically in terminal
//      autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
//      createPathFileToken: false, //creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken
    },
  )
  .then((client) => {
	  WappClient= client;
    start(client);
  })
  .catch((erro) => {
    console.log(erro);
  });
//decodedData
function start(client) {
	client.onMessage( async (message) => {
		//console.log(message)
		let decodedData={};
	  if (message.isMedia === true || message.isMMS === true || message.mimetype == 'audio/ogg; codecs=opus' || (typeof message.mimetype !='undefined' && message.mimetype.match(/pdf/))) {
		const buffer = await client.decryptFile(message);
		// At this point you can do whatever you want with the buffer
		// Most likely you want to write it into a file
		const fileName = message.from+`some-file-name.${mime.extension(message.mimetype)}`;
		decodedData = {fileName,buffer:buffer.toString('base64')};
	  }
	  console.log("=>")
	  rmq.sendMessage('from'+phoneNumber, 'aaa', {app:'whatsapp', id:phoneNumber, event:'message', data:{...message,decodedData}});
	  if(typeof message.mimetype !== 'undefined') console.log(message.mimetype);
	});
	client.onStateChange(state => {
	  rmq.sendMessage('from'+phoneNumber, 'aaa', {app:'whatsapp', id:phoneNumber, event:'StateChange', data:{...state}});
	});
	client.onAck(ack => {
	  rmq.sendMessage('from'+phoneNumber, 'aaa', {app:'whatsapp', id:phoneNumber, event:'ack', data:{...ack}});
	});
	client.onAddedToGroup(chatEvent => {
	  rmq.sendMessage('from'+phoneNumber, 'aaa', {app:'whatsapp', id:phoneNumber, event:'AddedToGroup', data:{...chatEvent}});
	});
}

async function privateMsg(msg) {
	console.log("MSG PRIVATE")
  let MQdata = JSON.parse(msg);
  await WappClient
  .sendText(MQdata.data.original.author, (MQdata.data.text?MQdata.data.text:MQdata.data.repl))
  .then((result) => {
    console.log('Result: ', result); //return object success
  })
  .catch((erro) => {
    console.error('Error when sending: ', erro); //return object error
  });
}

async function sendMsg(msg) {
	let MQdata = JSON.parse(msg);
	console.log(MQdata.data.event)
//	console.log({from: MQdata.data.original.author,
//		  text:(MQdata.data.text?MQdata.data.text:MQdata.data.repl),
//		  id:MQdata.data.original.id});
	if(MQdata.event=="replay"){
		await WappClient.reply(
		  MQdata.data.original.author,
		  (MQdata.data.text?MQdata.data.text:MQdata.data.repl),
		  ""+MQdata.data.original.id
		).then((result) => {
			console.log('Result: ', result); //return object success
		}).catch((erro) => {
			console.error('Error when sending: ', erro); //return object error
		});
	} else privateMsg(msg);
}