#!/usr/bin/node

const VERSION = "0.1.1";

const COLOR = {};
COLOR.black ="\x1b[30m";
COLOR.red = "\x1b[31m";
COLOR.green = "\x1b[32m";
COLOR.yellow = "\x1b[33m";
COLOR.blue = "\x1b[34m";
COLOR.magenta = "\x1b[35m";
COLOR.cyan = "\x1b[36m";
COLOR.white = "\x1b[37m";

for ( const [name, r, g, b ] of [
    ["lightblue", 114, 159, 207 ],
    ["brightblue", 50, 175, 255 ],
    ["brightpurple", 129, 8, 149 ],
]) {
    COLOR[name] = `\x1b[38;2;${r};${g};${b}m`;
}

function f(string, { color="white", bold=false }={}) {
    return `${COLOR[color]}${bold?"\x1b[1m":""}${string}\x1b[0m`;
}


function pprint(obj) {
    str = JSON.stringify(obj,null,4);

    str = str.replace(/"([^"]+)":/g, (_, match) => {
        return `${f(match, {color: "white"})}:`;
    });

    // Replace strings
    str = str.replace(/("[^"]+"),\n/g, (_, match) => {
        return `${f(match, {color: "yellow"})},\n`;
    });
    str = str.replace(/("[^"]+")\n/g, (_, match) => {
        return `${f(match, {color: "yellow"})}\n`;
    });

    // Replace all nulls
    str = str.replace(/null,\n/g, () => {
        return `${f("null", {color: "cyan", bold:true})},\n`;
    });
    str = str.replace(/null\n/g, () => {
        return `${f("null", {color: "cyan", bold:true})}\n`;
    });

    // Replace all bools
    str = str.replace(/(true|false),\n/g, (_, match) => {
        return `${f(match, {color: match=="true" ? "green" : "red"})},\n`;
    });
    str = str.replace(/(true|false)\n/g, (_, match) => {
        return `${f(match, {color: match=="true" ? "green" : "red"})}\n`;
    });

    // Replace all numbers
    str = str.replace(/([-.0-9e]+),\n/g, (_, match) => {
        return `${f(match, {color: "brightpurple"})},\n`;
    });
    str = str.replace(/([-.0-9e]+)\n/g, (_, match) => {
        return `${f(match, {color: "brightpurple"})}\n`;
    });

    return str;
}

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
        console.log(pprint(JSON.parse(stdin)));
        process.exit(0);
    });
} else {
    console.log(pprint(JSON.parse(input)));
}
