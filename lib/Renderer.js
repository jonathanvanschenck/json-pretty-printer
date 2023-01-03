
const { EventEmitter } = require("events");
const { f } = require("yaclc");

class Renderer extends EventEmitter {
    #f;
    #formats;
    #q;
    #EOL;
    #indent;
    #colon;
    #last_token;

    constructor({
        indent = "    ",
        EOL = "\n",
        colon = ": ",
        suppress_quotes = true,
        colorize = true,
        quotes_color = "default",
        quotes_faint = true,
        colon_color = "default",
        colon_faint = true,
        bracket_color = "default",
        bracket_faint = true,
        key_color = "white",
        string_color = "yellow",
        null_color = "cyan",
        null_bold = true,
        true_color = "green",
        false_color = "red",
        number_color = "#810895", // bright magenta
    }={}) {

        super();

        if (colorize) {
            this.#f = f;
            this.#formats = {
                quotes : {
                    color : quotes_color,
                    faint : quotes_faint
                },
                bracket : {
                    color : bracket_color,
                    faint : bracket_faint
                },
                key : {
                    color : key_color
                },
                string : {
                    color : string_color
                },
                null : {
                    color : null_color,
                    bold : null_bold,
                },
                true : {
                    color : true_color
                },
                false : {
                    color : false_color
                },
                number : {
                    color : number_color
                },
            };
        } else {
            this.#f = x => x;
            this.#formats = {};
        }

        const q = this.#f(`"`, { color: quotes_color, faint: quotes_faint });
        this.#q = suppress_quotes ? x => x : x => `${q}${x}${q}`;
        this.#EOL = EOL;
        this.#indent = (n) => indent.repeat(n);
        this.#colon = this.#f(colon, { color: colon_color, faint: colon_faint });

        this.#last_token = null;
    }

    render(tokens) {
        let string = "";
        this.on("data", (data) => string += data);
        tokens.forEach(token => this.render_token(token));
        return string;
    }

    render_token(token) {
        let string = "";

        let empty = false;
        if ( this.#last_token ) {
            // check if we are closing the bracket we just opened
            if ( token.type == `${this.#last_token.type}_closing` ) empty = true;

            if ( !empty ) {
                // Add commas, but only if we didn't just open brackets, or are about to close them
                if ( !this.#last_token.type.match(/^(object|array)$/) && !token.type.includes("closing") ) {
                    string += ",";
                }

                string += this.#EOL;
            }
        }

        // add indenting and the key (if applicable)
        if ( !empty ) {
            string += this.#indent(token.path.length);
            let key = token.path.length ? token.path[token.path.length - 1] : undefined;
            if ( typeof(key) === "string" && !token.type.includes("closing") ) {
                string += this.#q(key) + this.#colon;
            }
        }

        switch (token.type) {
            case "EOF":
                string = this.#EOL;
                break;
            case "object":
                string += this.#f("{", this.#formats.bracket);
                break;
            case "object_closing":
                string += this.#f("}", this.#formats.bracket);
                break;
            case "array":
                string += this.#f("[", this.#formats.bracket);
                break;
            case "array_closing":
                string += this.#f("]", this.#formats.bracket);
                break;
            case "string":
                string += this.#q(this.#f(token.value, this.#formats.string));
                break;
            case "number":
                string += this.#f(token.value, this.#formats.number);
                break;
            case "null":
            case "true":
            case "false":
                string += this.#f(token.value, this.#formats[token.type]);
                break;
            default:
                string = "";
                break;
        }

        this.emit("data", string);

        this.#last_token = token;
    }

    static render(tokens=[], opts={}) {
        return (new Renderer(opts).render(tokens));
    }
}

module.exports = exports = Renderer;
