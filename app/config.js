const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
//console.log("load package");
const projectVersion = require("../package.json");

const argv = yargs(hideBin(process.argv)).argv;
//console.log(argv);
for (const k in argv) {
  if (typeof k !== "undefined") {
    process.env[k] = argv[k];
    console.log(k + "=" + argv[k]);
  }
}

module.exports = {
  rmq: process.env.rmq,
  version: projectVersion.version,
};
