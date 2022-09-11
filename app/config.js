const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const projectVersion = require('../package.json');

const argv = yargs(hideBin(process.argv)).argv;
console.log(argv);
for (const k in argv) {
	console.log(k);
	if(k!=="_") process.env[k] = argv[k];
}

module.exports={
	rmq: process.env.rmq,
	version: projectVersion.version
};