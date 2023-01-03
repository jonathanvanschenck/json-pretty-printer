#! /usr/bin/env node

const { Parser, Renderer } = require("./index.js");

const VERSION = require("./package.json").version;

const HELP = `Pretty printing for JSON strings

USAGE:
    jsp [JSON_STRING|options]

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

    let p = new Parser();
    let r = new Renderer();
    p.on("token", (token) => r.render_token(token));
    r.on("data", (string) => process.stdout.write(string));

    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
        const chunk = process.stdin.read();
        if (chunk !== null) p.write(chunk);
    });
    process.stdin.on('end', () => {
        p.end().then(() => {
            process.exit(0);
        });
    });
} else {
    let p = new Parser();
    let r = new Renderer();
    p.on("token", (token) => r.render_token(token));
    r.on("data", (string) => process.stdout.write(string));
    p.end(input);
}
