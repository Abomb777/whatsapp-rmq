// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
const venom = require("venom-bot");

venom
  .create(
    "sessionName",
    (base64Qrimg, asciiQR, attempts, urlCode) => {
      console.log(asciiQR);
    },
    (statusSession, session) => {
      console.log("-----------------------------");
      console.log("Status Session: ", statusSession);
      //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken || chatsAvailable || deviceNotConnected || serverWssNotConnected || noOpenBrowser
      //Create session wss return "serverClose" case server for close
      console.log("Session name: ", session);
      if (statusSession === "browserClose") {
        console.log("KILL SIGNAL!!!");
        process.exit(1);
      }
    },
    {
      //      folderNameToken: 'tokens/'+phoneNumber, //folder name when saving tokens
      mkdirFolderToken: "", //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
      headless: false, // Headless chrome
      //      devtools: false, // Open devtools by default
      //      useChrome: true, // If false will use Chromium instance
      debug: true, // Opens a debug session
      //      logQR: true, // Logs QR automatically in terminal
      //      browserWS: '', // If u want to use browserWSEndpoint
      //       browserArgs: [ "--no-sandbox", "--disable-dev-shm-usage"],
      //    browserArgs: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"], //Original parameters  ---Parameters to be added into the chrome browser instance
      //      puppeteerOptions: {}, // Will be passed to puppeteer.launch
      disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
      disableWelcome: true, // Will disable the welcoming message which appears in the beginning
      //      updatesLog: true, // Logs info updates automatically in terminal
      //      autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
      createPathFileToken: true, //creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken

      //      multidevice: false, // for version not multidevice use false.(default: true)
      folderNameToken: "t", //folder name when saving tokens
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
    }
  )
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onMessage((message) => {
    console.log(message);
    if (message.body === "Hi" && message.isGroupMsg === false) {
      client
        .sendText(message.from, "Welcome Venom 🕷")
        .then((result) => {
          console.log("Result: ", result); //return object success
        })
        .catch((erro) => {
          console.error("Error when sending: ", erro); //return object error
        });
    }
  });
}
