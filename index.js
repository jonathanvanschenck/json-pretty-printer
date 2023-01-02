#!/usr/bin/node

const VERSION = require("./package.json").version;
const Parser = require("./lib/Parser.js");

const HELP = `Pretty printing for JSON strings

USAGE:
    jpp [JSON_STRING|options]

OPTIONS:
    -h,--help            Prints this help menu
    -v,--version         Prints version
`;

let input = process.argv[2];

if ( !input ) {
    console.error("missing arugment, JSON_STRING");
    console.log(HELP);
    process.exit(1);
}

if ( (["-h", "--help"]).includes(input) ) {
    console.log(HELP);
    process.exit(0);
} else if ( (["-v", "--version"]).includes(input) ) {
    console.log(VERSION);
    process.exit(0);
} else if ( input == "-" ) {
    let stdin = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
        const chunk = process.stdin.read();
        if (chunk !== null) stdin = stdin + chunk;
    });
    process.stdin.on('end', () => {
        if ( stdin ) {
            let p = new Parser();
            p.on("data", (string) => process.stdout.write(string));
            p.parse(stdin);
        }
        process.exit(0);
    });
} else {
    let p = new Parser();
    p.on("data", (string) => process.stdout.write(string));
    p.parse(input);
}
