# JSON Pretty Printer
A pretty printer for JSON strings!

## Basic usage
```bash
# Show the help menu
jpp --help

# Format JSON strings
jpp '{"a": 1}'

# Works with piping too!
curl -s https://api.github.com/users/jonathanvanschenck/repos | jpp
```

## Installation
Make sure you have `node.js` installed on your system

Make sure the index file is executable
```bash
chmod +x index.js
```

Simulink the index file to some folder in your path, e.g.:
```bash
cd /usr/local/bin
ln -s /path/to/index.js jpp
```
