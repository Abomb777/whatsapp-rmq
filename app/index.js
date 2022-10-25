require("dotenv").config();
const config = require("./config");
const rmq = require("./rmq");
const mime = require("mime-types");
const fs = require("fs");
const {
  Client,
  LegacySessionAuth,
  LocalAuth,
  MessageMedia,
} = require("whatsapp-web.js");
//const { MessageMedia } = require('whatsapp-web.js');

const phoneNumber = process.env.PHONENUMBER || config.number;
// Path where the session data will be stored
const SESSION_FILE_PATH = "./tokens/session.json";

var WappClient = {};

// Load the session data if it has been previously saved
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
  const data = fs.readFileSync(SESSION_FILE_PATH, "utf8");
  try {
    sessionData = JSON.parse(data); //require(SESSION_FILE_PATH);
  } catch (e) {}
}

// Use the saved values
const client = new Client({
  /*    authStrategy: new LegacySessionAuth({
        session: sessionData
    }),*/
  puppeteer: {
    headless: false,
    executablePath: "/usr/bin/google-chrome-stable",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      /*      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-extensions',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'*/
    ],
  },
  authStrategy: new LocalAuth({
    clientId: "client-one",
    dataPath: "./tokens/",
  }),
});

//test22
// Save session values to the file upon successful auth
/*client.on("authenticated", (session) => {
  sessionData = session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
    if (err) {
      console.error(err);
    }
  });
});*/

client.on("ready", () => {
  console.log("Client is ready!");
  WappClient = client;
  WappClient.evalonwebz = evalonwebz;
  WappClient.sendImageFromBase64 = sendImage;
  WappClient.sendMedFromBase64 = sendMed;
  WappClient.sendText = WappClient.sendMessage;
  rmq.subscribeQueue(phoneNumber, sendMsg);
  rmq.sendMessage("from" + phoneNumber, "aaa", {
    app: "whatsapp",
    id: phoneNumber,
    event: "app load",
    data: "Starting " + phoneNumber,
  });
});

client.on("message", async (message) => {
  if (message.body == "!ping") {
    message.reply("pong");
  }
  //console.log(message)
  let decodedData = {};
  try {
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      decodedData = { media };
      // do something with the media data here
    }
    if (message.isMedia === true || message.isMMS === true) {
      // || message.mimetype == 'audio/ogg; codecs=opus' || (typeof message.mimetype !='undefined' && message.mimetype.match(/pdf/))
      const buffer = await client.decryptFile(message);
      // At this point you can do whatever you want with the buffer
      // Most likely you want to write it into a file
      const fileName =
        message.from + `some-file-name.${mime.extension(message.mimetype)}`;
      decodedData = { fileName, buffer: buffer.toString("base64") };
    }
  } catch (e) {
    console.log(e);
  }
  console.log("=>");
  rmq.sendMessage("from" + phoneNumber, "aaa", {
    app: "whatsapp",
    id: phoneNumber,
    event: "message",
    data: { ...message, decodedData },
  });
  if (typeof message.mimetype !== "undefined") console.log(message.mimetype);
});

client.on("onStateChange", (state) => {
  rmq.sendMessage("from" + phoneNumber, "aaa", {
    app: "whatsapp",
    id: phoneNumber,
    event: "StateChange",
    data: { ...state },
  });
});
client.on("onAck", (ack) => {
  rmq.sendMessage("from" + phoneNumber, "aaa", {
    app: "whatsapp",
    id: phoneNumber,
    event: "ack",
    data: { ...ack },
  });
});
client.on("onAddedToGroup", (chatEvent) => {
  rmq.sendMessage("from" + phoneNumber, "aaa", {
    app: "whatsapp",
    id: phoneNumber,
    event: "AddedToGroup",
    data: { ...chatEvent },
  });
});

client.initialize();

async function privateMsg(msg) {
  console.log("MSG PRIVATE");
  let MQdata = JSON.parse(msg);
  console.log(
    MQdata.data.original.author +
      " >>> " +
      (MQdata.data.text ? MQdata.data.text : MQdata.data.repl)
  );
  await WappClient.sendText(
    MQdata.data.original.author,
    MQdata.data.text ? MQdata.data.text : MQdata.data.repl
  )
    .then((result) => {
      console.log("Result: ", result); //return object success
    })
    .catch((erro) => {
      console.error("Error when sending: ", erro); //return object error
    });
}

async function sendMsg(msg) {
  let MQdata = JSON.parse(msg);
  console.log(MQdata.data.event);
  //	console.log({from: MQdata.data.original.author,
  //		  text:(MQdata.data.text?MQdata.data.text:MQdata.data.repl),
  //		  id:MQdata.data.original.id});
  //		https://web.whatsapp.com/send?phone=972507778978&text=123&app_absent=0
  if (MQdata.event == "addsend") {
    //await WappClient.page.goto('https://api.whatsapp.com/send?phone='+MQdata.phone);
    await WappClient.page.goto(
      "https://web.whatsapp.com/send?phone=" +
        MQdata.phone +
        "&text=" +
        MQdata.text +
        "&app_absent=0",
      {
        waitUntil: "networkidle2",
      }
    );
    await delay(25000);
    console.log("CLICK!");
    await WappClient.page.evaluate(() => {
      window.onbeforeunload = null;
    });
    //await WappClient.page
    //await WappClient.page.evaluate(() => $$('footer button')[4].click());
    await WappClient.page.evaluate(() => {
      const xpath =
        '//*[@id="main"]/footer/div[1]/div/span[2]/div/div[2]/div[2]/button';
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      );
      result.iterateNext().click();
    });
    //	await WappClient.Browser.goto('https://api.whatsapp.com/send?phone='+MQdata.phone);
  } else if (MQdata.event == "ping") {
    var WAPversion = await WappClient.getWAVersion();
    rmq.sendMessage("from" + phoneNumber, "aaa", {
      app: "whatsapp",
      id: phoneNumber,
      event: "PONG",
      data: { test: wap_status, version: WAPversion },
    });
  } else if (MQdata.event == "pcommand") {
    (async () => {
      console.log("go to: " + MQdata.exec);
      let respo = await new Promise(async (res, rej) => {
        //res(result)
        let result = await WappClient.evalonwebz(MQdata.exec);
        console.log("result");
        console.log(result);
        res(result);
        //eval('WappClient.'+MQdata.exec+'.then((await result) => {console.log(result); res(result)}).catch((erro) => {console.error(\'Error when sending '+MQdata.exec+': \', erro); })');
      });
      console.log("response >>>");
      console.log(respo);
      rmq.sendMessage(
        MQdata.returnto ? MQdata.returnto : "from" + phoneNumber,
        "aaa",
        {
          app: "whatsapp",
          id: phoneNumber,
          event: MQdata.event,
          request: MQdata,
          data: respo,
        }
      );
    })();
  } else if (MQdata.event == "command") {
    //let resp =eval('await WappClient.'+MQdata.exec);
    (async () => {
      //var rq = WappClient.getProfilePicFromServer(`972527865691@c.us`);
      //console.log(typeof rq);
      //console.log(await rq)

      //let MQdata = {exec:"davai()"};
      let respo = await new Promise(async (res, rej) => {
        //console.log('res(WappClient.'+MQdata.exec+')');
        //eval('res(WappClient.'+MQdata.exec+')');

        //console.log('---------------------');
        //WappClient.sendImageFromBase64()
        console.log(MQdata.exec);
        eval(
          "WappClient." +
            MQdata.exec +
            ".then((result) => {console.log(result); res(result)}).catch((erro) => {console.error('Error when sending " +
            MQdata.exec +
            ": ', erro); })"
        );
      });
      console.log(">" + respo);
      rmq.sendMessage(
        MQdata.returnto ? MQdata.returnto : "from" + phoneNumber,
        "aaa",
        {
          app: "whatsapp",
          id: phoneNumber,
          event: MQdata.event,
          request: MQdata,
          data: respo,
        }
      );
    })();
  } else if (MQdata.event === "replay") {
    console.log({
      author: MQdata.data.original.author,
      repl: MQdata.data.text ? MQdata.data.text : MQdata.data.repl,
      id: "" + MQdata.data.original.id,
    });
    /*	await WappClient.reply(
                MQdata.data.original.author,
                (MQdata.data.text?MQdata.data.text:MQdata.data.repl),
                ""+MQdata.data.original.id
            )*/

    await WappClient.sendMessageOptions(
      MQdata.data.original.author,
      MQdata.data.text ? MQdata.data.text : MQdata.data.repl,
      {
        quotedMessageId: "" + MQdata.data.original.id,
      }
    )
      .then((result) => {
        console.log("Result: ", result); //return object success
      })
      .catch((erro) => {
        console.error("Error when sending: ", erro); //return object error
      });
  } else privateMsg(msg);
}

async function evalonwebz(c) {
  var result = await WappClient.pupPage.evaluate(async (c) => {
    console.log("exec " + c);

    const waitEval = (ev) => {
      console.log("waitEval " + ev);
      return new Promise((resolve, reject) => {
        eval(ev);
      });
    };
    return await waitEval(c);
  }, c);
  console.log("solved result");
  console.log(result);
  return JSON.parse(result);
}

async function sendImage(to, b64, name, text) {
  var media = await new MessageMedia(
    "image/jpg",
    b64.replace(/^.*\;base64\,/, ""),
    name || "myimage.jpg"
  );
  await client.sendMessage(to, media, { caption: text });
}

async function sendMed(to, mimetype, b64, name, text) {
  var media = await new MessageMedia(mimetype, b64, name || "myimage.jpg");
  await client.sendMessage(to, media, { caption: text });
}
