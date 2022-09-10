require('dotenv').config();
const venom = require('venom-bot');
const config = require('./config');
const rmq = require('./rmq');
const fs = require('fs');
const mime = require('mime-types');

const phoneNumber = process.env.PHONENUMBER || config.number;
var wap_status = {};
var WappClient={};

venom
  .create(
    'sessionName'+phoneNumber,
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
	  wap_status = statusSession;
      console.log('Session name: ', session);
	  if(statusSession==="browserClose") {
		  console.log('KILL SIGNAL!!!');
		  process.exit(1)
	  }
    },
    {
      folderNameToken: 'tokens'+phoneNumber, //folder name when saving tokens
      mkdirFolderToken: 'tokens', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
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

//      multidevice: false, // for version not multidevice use false.(default: true)
//      folderNameToken: 't', //folder name when saving tokens
//      mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
//      headless: true, // Headless chrome
      devtools: false, // Open devtools by default
//      useChrome: true, // If false will use Chromium instance
//      debug: false, // Opens a debug session
//      logQR: true, // Logs QR automatically in terminal
 //     browserWS: '', // If u want to use browserWSEndpoint
//      browserArgs: ['--no-sandbox','--disable-dev-shm-usage'], //Original parameters  ---Parameters to be added into the chrome browser instance
//      puppeteerOptions: {}, // Will be passed to puppeteer.launch
//      disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
//      disableWelcome: true, // Will disable the welcoming message which appears in the beginning
//      updatesLog: true, // Logs info updates automatically in terminal
//      autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
//      createPathFileToken: false, // creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken
//      chromiumVersion: '818858', // Version of the browser that will be used. Revision strings can be obtained from omahaproxy.appspot.com.
//      addProxy: [''], // Add proxy server exemple : [e1.p.webshare.io:01, e1.p.webshare.io:01]
//      userProxy: '', // Proxy login username
//      userPass: '' // Proxy password
    },
  )
  .then((client) => {
	  WappClient= client;
	  WappClient.sendMsgg = sendMsgg;
	  WappClient.addclient = addclient;
	  WappClient.evalonweb = evalonweb;
	  WappClient.evalonwebr = evalonwebr;
	  WappClient.evalonwebw = evalonwebw;
	  WappClient.evalonwebz = evalonwebz;
    start(client);
	  rmq.subscribeQueue(phoneNumber, sendMsg);

	  rmq.sendMessage('from'+phoneNumber, 'aaa', {app:'whatsapp', id:phoneNumber, event:'app load', data:'Starting '+phoneNumber});

  })
  .catch((erro) => {
    console.log(erro);
  });
//decodedData
function start(client) {
	console.log('+++++++++')
	client.onMessage( async (message) => {
		//console.log(message)
		let decodedData={};
	  if (message.isMedia === true || message.isMMS === true) {// || message.mimetype == 'audio/ogg; codecs=opus' || (typeof message.mimetype !='undefined' && message.mimetype.match(/pdf/))
		const buffer = await client.decryptFile(message);
		// At this point you can do whatever you want with the buffer
		// Most likely you want to write it into a file
		const fileName = message.from+`some-file-name.${mime.extension(message.mimetype)}`;
		decodedData = {fileName,buffer:buffer.toString('base64')};
	  }
	  console.log("=>");
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
  console.log(MQdata.data.original.author+" >>> "+(MQdata.data.text?MQdata.data.text:MQdata.data.repl))
  await WappClient
  .sendText(MQdata.data.original.author, (MQdata.data.text?MQdata.data.text:MQdata.data.repl))
  .then((result) => {
    console.log('Result: ', result); //return object success
  })
  .catch((erro) => {
    console.error('Error when sending: ', erro); //return object error
  });
}

async function evalonwebz(c){
	var result = await WappClient.page.evaluate(async (c) => {
		console.log('exec '+c);

		const waitEval = (ev) => {
			console.log('waitEval '+ev);
			return new Promise((resolve, reject) => {
				eval(ev);
			});
		};
		return await waitEval(c);
	},c);
	console.log('solved result');
	console.log(result);
	return JSON.parse(result);
}

async function evalonwebw(code){
	return await WappClient.page.evaluate(async (code) => {
		//return await new Promise((resolve) => {
			console.log('>>>>>>===='+code);
			//return await
			var codeex = eval(code);
			console.log(codeex);
			return codeex;
		//	resolve('ok');
	//	})
	},code)
}

async function evalonweb(code){
	WappClient.page.evaluate((code) => {
		eval(code)
	},code)
}

async function evalonwebr(code){
	return WappClient.page.evaluate((code) => {
		return eval(code);
	},code)
}

async function addclient(clientid){
	WappClient.page.evaluate((clientid) => {
		window.Store.Chat.add(clientid.replace('@c.us','')+'@s.whatsapp.net');
	},clientid)
}

async function sendMsgg(to, msg){
	WappClient.page.evaluate((to, msg) => {
		window.WAPI.sendMessage2(to, msg);
	},to, msg)
}
WappClient.evalonwebz = evalonwebz;
WappClient.evalonwebw = evalonwebw;
WappClient.evalonwebr = evalonwebr;
WappClient.evalonweb = evalonweb;
WappClient.sendMsgg = sendMsgg;
WappClient.addclient = addclient;
async function getAllGroups(client) {
	let grupos = [];
	let chats = await client.getAllChats();
	for (chat of chats) {
		if (chat.isGroup)
			grupos.push(chat);
	}
	return grupos;
}

function delay(time) {
	return new Promise(function(resolve) {
		setTimeout(resolve, time)
	});
}

async function sendMsg(msg) {
	let MQdata = JSON.parse(msg);
	console.log(MQdata.data.event)
//	console.log({from: MQdata.data.original.author,
//		  text:(MQdata.data.text?MQdata.data.text:MQdata.data.repl),
//		  id:MQdata.data.original.id});
//		https://web.whatsapp.com/send?phone=972507778978&text=123&app_absent=0
	if(MQdata.event=="addsend"){
		//await WappClient.page.goto('https://api.whatsapp.com/send?phone='+MQdata.phone);
		await WappClient.page.goto('https://web.whatsapp.com/send?phone='+MQdata.phone+'&text='+MQdata.text+'&app_absent=0', {
			waitUntil: 'networkidle2',
		});
		await delay(25000);
		console.log('CLICK!');
		await WappClient.page.evaluate(() => {
		  window.onbeforeunload = null;
		});
		//await WappClient.page
		//await WappClient.page.evaluate(() => $$('footer button')[4].click());
		await WappClient.page.evaluate(() => {
			const xpath = '//*[@id="main"]/footer/div[1]/div/span[2]/div/div[2]/div[2]/button';
			const result = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
			result.iterateNext().click();
		});
	//	await WappClient.Browser.goto('https://api.whatsapp.com/send?phone='+MQdata.phone);

	} else if(MQdata.event=="ping"){
		var WAPversion = await WappClient.getWAVersion();
		rmq.sendMessage('from'+phoneNumber, 'aaa', {app:'whatsapp', id:phoneNumber, event:'PONG', data:{test: wap_status,version: WAPversion}});
	} else if(MQdata.event=="pcommand"){
		(async ()=>{
			console.log('go to: '+MQdata.exec);
			let respo = await new Promise(async (res,rej) => {
				//res(result)
				let result = await WappClient.evalonwebz(MQdata.exec);
				console.log('result');
				console.log(result);
				res(result)
				//eval('WappClient.'+MQdata.exec+'.then((await result) => {console.log(result); res(result)}).catch((erro) => {console.error(\'Error when sending '+MQdata.exec+': \', erro); })');
			});
			console.log(">"+respo);
			rmq.sendMessage(MQdata.returnto?MQdata.returnto:'from'+phoneNumber, 'aaa', {app:'whatsapp', id:phoneNumber, event: MQdata.event,request: MQdata, data:respo});
		})();
	} else if(MQdata.event=="command"){
		//let resp =eval('await WappClient.'+MQdata.exec);
		(async ()=>{
			//var rq = WappClient.getProfilePicFromServer(`972527865691@c.us`);
			//console.log(typeof rq);
			//console.log(await rq)
			
			//let MQdata = {exec:"davai()"};
			let respo = await new Promise(async (res,rej) => {
				//console.log('res(WappClient.'+MQdata.exec+')');
				//eval('res(WappClient.'+MQdata.exec+')');

				//console.log('---------------------');
				//WappClient.sendImageFromBase64()
				console.log(MQdata.exec);
				eval('WappClient.'+MQdata.exec+'.then((result) => {console.log(result); res(result)}).catch((erro) => {console.error(\'Error when sending '+MQdata.exec+': \', erro); })');
			});
			console.log(">"+respo);
			rmq.sendMessage(MQdata.returnto?MQdata.returnto:'from'+phoneNumber, 'aaa', {app:'whatsapp', id:phoneNumber, event: MQdata.event,request: MQdata, data:respo});
		})();
	} else if(MQdata.event==="replay"){
		console.log({
			author:MQdata.data.original.author,
			repl:(MQdata.data.text?MQdata.data.text:MQdata.data.repl),
			id:""+MQdata.data.original.id
			});
	/*	await WappClient.reply(
			MQdata.data.original.author,
			(MQdata.data.text?MQdata.data.text:MQdata.data.repl),
			""+MQdata.data.original.id
		)*/

		await WappClient.sendMessageOptions(
		  MQdata.data.original.author,
		  (MQdata.data.text?MQdata.data.text:MQdata.data.repl),
			{
				quotedMessageId: ""+MQdata.data.original.id,
			}
		).then((result) => {
			console.log('Result: ', result); //return object success
		}).catch((erro) => {
			console.error('Error when sending: ', erro); //return object error
		});
	} else privateMsg(msg);
}