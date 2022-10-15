const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const projectVersion = require("../package.json");
console.log("load " + projectVersion.version);
const argv = yargs(hideBin(process.argv)).argv;
//console.log(argv);
for (const k in argv) {
  if (k !== "_" && k !== "$0") {
    process.env[k] = argv[k];
    console.log(k + "=" + argv[k]);
  }
}

module.exports = {
  rmq: process.env.rmq,
  version: projectVersion.version,
};
