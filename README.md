# JSON Stream
A parser and pretty printer for JSON streams!

## CLI
### Basic usage
```bash
# Show the help menu
jsp --help

# Format JSON strings
jsp '{"a": 1}'

# Works with piping too!
curl -s https://api.github.com/users/jonathanvanschenck/repos | jpp
```

### Installation
Make sure you have `node.js` installed on your system

Make sure the index file is executable
```bash
chmod +x cli.js
```

Simulink the index file to some folder in your path, e.g.:
```bash
cd /usr/local/bin
ln -s /path/to/cli.js jsp
```
