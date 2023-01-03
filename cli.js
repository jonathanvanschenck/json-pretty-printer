#! /usr/bin/env node

const { resolve, dirname } = require("path");
const { readFileSync, writeFileSync, mkdirSync } = require("fs");

const { Parser, Renderer } = require("./index.js");

const VERSION = require("./package.json").version;
const HELP = `
Pretty printing for JSON streams

USAGE:
    jsp [OPTIONS] INPUT

INPUT:
    Either: A JSON string to pretty print
    Or:     "-" to read from stdin

OPTIONS:
    -h,--help                       Prints this help menu
    -v,--version                    Prints version
    -f,--config-file                Specify a config file (default is "$HOME/.config/jsp/config.json")
    -i,--indent                     Set the indent format (string value)
       --EOL                        Set the EOL format (string value)
       --colon                      Set the colon format (string value)
    -c,--colorize-mode              Set the colorization mode (boolean value)
    -q,--quote-suppression-mode     Set the quote suppression mode (boolean value)
`;


// Get a copy of the arguments array
let args = process.argv.slice(2);


// Set defaults
let config_fp = `${process.env.HOME}/.config/jsp/config.json`;
let colorize = undefined;
let suppress_quotes = undefined;
let indent = undefined;
let EOL = undefined;
let colon = undefined;

// Read off all the options
let arg;
let input
while ( args.length > 0 ) {
    switch (arg = args.shift()) {
        case "-f":
        case "--config-file":
            config_fp = resolve(args.shift());
            break;
        case "-i":
        case "--indent":
            indent = args.shift();
            break;
        case "--EOL":
            EOL = args.shift();
            break;
        case "--colon":
            colon = args.shift();
            break;
        case "-c":
        case "--colorize-mode":
            switch (arg = args.shift()) {
                case "true":
                case "True":
                case "t":
                case "T":
                case "1":
                    colorize = true;
                    break;
                case "false":
                case "False":
                case "f":
                case "F":
                case "0":
                    colorize = false;
                    break;
                default:
                    console.error(`Unknown mode: ${arg}`);
                    console.log(HELP);
                    process.exit(1);
            }
            break;
        case "-q":
        case "--quote-suppression-mode":
            switch (arg = args.shift()) {
                case "true":
                case "True":
                case "t":
                case "T":
                case "1":
                    suppress_quotes = true;
                    break;
                case "false":
                case "False":
                case "f":
                case "F":
                case "0":
                    suppress_quotes = false;
                    break;
                default:
                    console.error(`Unknown mode: ${arg}`);
                    console.log(HELP);
                    process.exit(1);
            }
            break;
        case "-v":
        case "--version":
            console.log(VERSION);
            process.exit(0);
        case "-h":
        case "--help":
            console.log(HELP);
            process.exit(0);
        default:
            if ( args.length > 0 ) {
                console.error(`Unknown argument: ${arg}`);
                console.log(HELP);
                process.exit(1);
            } else {
                input = arg;
            }

    }
}

// Assert the input's existance
if ( !input ) {
    console.error("missing arugment, INPUT");
    console.log(HELP);
    process.exit(1);
}



// Parse the config file
let config;
try {
    config = readFileSync(config_fp, { encoding: "utf8" });
} catch (e) {
    if ( e.code == "ENOENT" ) {
        config = "{}";
        mkdirSync(dirname(config_fp), { recursive: true });
        writeFileSync(config_fp, config, { encoding: "utf8" });
    } else {
        throw e;
    }
}

try {
    config = JSON.parse(config);
} catch (e) {
    console.error(`Failed to parse config file: ${config_fp}`);
    console.log(HELP);
    process.exit(2);
}

// Override the config with the command line options
if ( indent !== undefined ) config.indent = indent;
if ( EOL !== undefined ) config.EOL = EOL;
if ( colon !== undefined ) config.colon = colon;
if ( colorize !== undefined ) config.colorize = colorize;
if ( suppress_quotes !== undefined ) config.suppress_quotes = suppress_quotes;

// Handle piped input
if ( input == "-" ) {

    let p = new Parser();
    let r = new Renderer(config);
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
    // Handle non-piped input
    let p = new Parser();
    let r = new Renderer(config);
    p.on("token", (token) => r.render_token(token));
    r.on("data", (string) => process.stdout.write(string));
    p.end(input);
}
