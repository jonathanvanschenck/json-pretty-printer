// Many thanks to: https://lihautan.com/json-parser-with-javascript
// for the details on implementing a JSON parser in JavaScript

const { EventEmitter } = require('events');
const { f } = require("yaclc");

/**
 * TODO
 * @event Parser#close
 */

/**
 * TODO
 * @event Parser#drain
 */

/**
 * TODO
 * @event Parser#error
 */

/**
 * TODO
 * @event Parser#finish
 */

/**
 * TODO
 * @event Parser#pipe
 */

/**
 * TODO
 * @event Parser#unpipe
 */

/**
 * TODO
 * @event Parser#token
 */

/**
 * TODO
 * @event Parser#data
 */

/**
 * Class to parse JSON strings into tokens
 * @extends EventEmitter
 */
class Parser extends EventEmitter {
    #tree;
    #data;
    #head;
    #f;
    #q;
    #last_token;
    #indent;

    constructor({ colorized=true, indent=4, suppress_quotes=true }={}) {
        super();

        this.#f = colorized ? f : x => x;
        this.#q = suppress_quotes ? x => x : x => '"'+x+'"';

        this.#tree = [];
        this.#data = "";
        this.#reset_head();

        this.#indent = indent;

        this.#last_token = null;
        this.on("token", (token) => this.#on_token(token));
        this.on("end", () => this.#on_end());
    }

    #on_token(token) {
        let string = "";
        if ( this.#last_token ) {
            // Check if the previous bracket is empty, and if so, close it
            if ( this.#last_token.path.length >= token.path.length ) {
                if ( this.#last_token.type == "array" ) string += "]";
                if ( this.#last_token.type == "object" ) string += "}";
            }
            // Close any relevant brackets
            for ( let i = this.#last_token.path.length - 1; i >= token.path.length; i-- ) {
                string = string + "\n" + " ".repeat(i*this.#indent) + (typeof(this.#last_token.path[i]) == "string" ? "}" : "]");
            } 
            if (  this.#last_token.path.length >= token.path.length || this.#last_token.type != "object" && this.#last_token.type != "array" ) string += ",";
            string += "\n";
            string += " ".repeat(token.path.length*this.#indent);

            if ( typeof(token.path[token.path.length-1]) == "string" ) string += this.#f(this.#q(token.path[token.path.length-1]), {color:"white"}) + ': ';
        }


        switch ( token.type ) {
            case "object":
                string += "{";
                break;
            case "array":
                string += "[";
                break;
            case "keyword":
                switch (token.value) {
                    case "null":
                        string += this.#f("null", { bold:true, color:"cyan" });
                        break;
                    case "true":
                        string += this.#f("true", { color:"green" });
                        break;
                    case "false":
                        string += this.#f("false", { color:"red" });
                        break;
                    default:
                        break;
                }
                break;
            case "number":
                string += this.#f(token.value, { color:"#810895" }); // bright purple
                break;
            case "string":
                string += this.#f(this.#q(token.value), { color:"yellow" });
                break;
            default:
                break;
        }
        this.emit("data", string);
        this.#last_token = JSON.parse(JSON.stringify(token));
    }

    #on_end() {
        let string = "";
        if ( this.#last_token.path.length > 0 ) {
            // Close any relevant brackets
            for ( let i = this.#last_token.path.length - 1; i >= 0; i-- ) {
                string = string + "\n" + " ".repeat(i*this.#indent) + (typeof(this.#last_token.path[i]) == "string" ? "}" : "]");
            } 
        } else {
            // We never got anything but a single, empty pair
            string += (this.#last_token.type == "object" ? "}" : "]");
        }
        this.emit("data", string+"\n");
    }

    /**
     * Read data until we hit something which isn't whitespace
     * @private
     */
    #skip_whitespace() {
        while ( this.#data[this.#head]?.match(/\s/) ) this.#head++;
    }

    /**
     * Reset the reading head to the beginning of the data.
     * @private
     */
    #reset_head() { this.#head = 0; }

    /**
     * Truncate the data to the current head position.
     */
    #consume_read_data() {
        this.#data = this.#data.slice(this.#head);
        this.#head = 0;
    }

    
    /**
     * Examine the next character in the data stream
     * @returns {string?}
     */
    #peak() {
        return this.#data[this.#head];
    }

    /**
     * Read the next character in the data stream, moving the head position over
     * @returns {string?}
     */
    #read() {
        // get head, then move it over
        return this.#data[this.#head++];
    }


    /**
     * Parse a JSON primative from the data stream
     *
     * @private
     * @returns {boolean|number|string|null}
     */
    #parse_value() {
        return this.#parse_object() ??
            this.#parse_array() ??
            this.#parse_string() ??
            this.#parse_number() ??
            this.#parse_keyword("null") ??
            this.#parse_keyword("true") ??
            this.#parse_keyword("false")
    }

    /**
     * Parse an object from the data stream
     *
     * @private
     * @returns {string?}
     */
    #parse_object() {
        // Check for, and cosume leading brace
        this.#skip_whitespace();
        if ( this.#peak() !== "{" ) return;
        this.#read(); // consume closing brace
        this.#consume_read_data();
        this.emit("token", { type: "object", path: this.#tree });

        // We can now look for (key: value) pairs
        let first = true;
        while ( this.#peak() !== "}" ) {
            // Check for a comma
            this.#skip_whitespace();
            if ( !first && this.#read() !== "," ) {
                // Failed to read the comman -- TODO, should yield here and wait for more data
                throw new Error("Failed to comma key");
            }
            first = false;

            // Get the key
            this.#skip_whitespace();
            const key = this.#parse_string(true);
            if ( key === undefined ) {
                // Failed to read the key -- TODO, should yield here and wait for more data
                throw new Error("Failed to read key");
            };

            // Consume colon
            this.#skip_whitespace();
            if ( this.#read() !== ":" ) {
                // Failed to read the colon -- TODO, should yield here and wait for more data
                throw new Error("Failed to read colon");
            }

            // Get the value
            this.#tree.push(key);
            this.#parse_value();
            this.#tree.pop();
            this.#skip_whitespace();
        }

        // Consume the closing brace
        this.#read();
        this.#consume_read_data();

        return "}";
    }

    /**
     * Parse an array from the data stream
     *
     * @private
     * @returns {string?}
     */
    #parse_array() {
        // Check for, and cosume leading bracket
        this.#skip_whitespace();
        if ( this.#peak() !== "[" ) return;
        this.#read(); // consume leading bracket
        this.#consume_read_data();
        this.emit("token", { type: "array", path: this.#tree });

        // We can now look for value arrays
        let key = 0;
        while ( this.#peak() !== "]" ) {
            // Check for a comma
            this.#skip_whitespace();
            if ( key > 0 && this.#read() !== "," ) {
                // Failed to read the comman -- TODO, should yield here and wait for more data
                throw new Error("Failed to comma key");
            }

            // Get the value
            this.#tree.push(key++);
            this.#parse_value();
            this.#tree.pop();
            this.#skip_whitespace();
        }

        // Consume the closing brace
        this.#read();
        this.#consume_read_data();

        return "]";
    }

    /**
     * Parse a string from the data stream
     *
     * @private
     * @param {boolean} no_emit - If true, don't emit the token
     * @returns {string?}
     */
    #parse_string(no_emit=false) {
        // TODO Add escapes

        // Check for, and consume leading quote
        this.#skip_whitespace();
        if ( this.#peak() !== '"' ) return;
        this.#read();

        // Extract the string value
        let string = "";
        while ( this.#peak() !== '"' ) {
            let c = this.#read();
            if ( c === undefined ) {
                // Failed to read the string -- TODO, should yield here and wait for more data
                throw new Error("Failed to read string");
            }
            string += c;
        }

        // We have found a valid string, so consume the data and return the string
        this.#read(); // consume trailing quote
        this.#consume_read_data();
        if ( !no_emit ) this.emit("token", { type: "string", path: this.#tree, value: string });
        return string;
    }

    /**
     * Parse a keyword from the data stream
     *
     * @private
     * @returns {string?}
     */
    #parse_keyword(keyword) {
        this.#skip_whitespace();
        if ( this.#data.slice(this.#head, this.#head + keyword.length) !== keyword ) return;
        
        // We have found a valid keyword, so consume the data and return the keyword
        for ( let i = 0; i < keyword.length; i++ ) this.#read();
        this.#consume_read_data();
        this.emit("token", { type: "keyword", path: this.#tree, value: keyword });
        return keyword;
    }

    /**
     * Parse a number from the data stream
     *
     * @private
     * @returns {string?}
     */
    #parse_number() {
        this.#skip_whitespace();
        if ( !this.#peak()?.match(/[-\d\.]/) ) return;

        let number = "";
        // Pull the negative, if it exists
        if ( this.#peak() === "-" ) {
            number += this.#read();
        }

        // We either have a single zero, or at least 1 non-zero digit followed by any number of digits, or a decimal place
        if ( this.#peak() === "0" ) {
            number += this.#read();
        } else if ( this.#peak()?.match(/[1-9]/) ) {
            while ( this.#peak()?.match(/[0-9]/) ) number += this.#read();
        } else if ( this.#peak() === "." ) {
            // pass, we'll get this one in a sec
        } else {
            // Failed to read the number -- TODO, should yield here and wait for more data
            throw new Error("Failed to read number");
        }

        // Pull the decimal place and any trailing digits
        if ( this.#peak() === "." ) {
            number += this.#read();
            while ( this.#peak()?.match(/[0-9]/) ) number += this.#read();
        }

        // Pull the exponent
        if ( this.#peak()?.match(/[eE]/) ) {
            number += this.#read();
            if ( this.#peak()?.match(/[-+]/) ) number += this.#read();
            while ( this.#peak()?.match(/[0-9]/) ) number += this.#read();
        }

        // Double check that the number is actually valid ....
        const check = parseFloat(number);
        if ( isNaN(check) ) {
            // Failed to read the number -- TODO, should yield here and wait for more data
            throw new Error("Failed to read number");
        }

        // We have found a valid number, so consume the data and return the number
        this.#consume_read_data();
        this.emit("token", { type: "number", path: this.#tree, value: number });
        return number;
    }

    /**
     * Add the following chunk to the parser's data stack
     *
     * @param {string} chunk
     */
    write(chunk) { /* TODO */ }

    /**
     * Add the following chunk to the parser's data stack, and declare this the end
     *
     * @param {string} chunk
     */
    end(chunk) { /* TODO */ }

    /**
     * Parse the provided text
     *
     * @param {string} text
     */
    parse(text) {
        // Hard reset everything with the provided text (nukes the stream, if partially executed)
        this.#data = text;
        this.#tree = [];
        this.#reset_head();

        // JSON must start with either an object or an array
        this.#parse_object() ?? this.#parse_array();

        // Check that we parsed everything, or throw an error
        this.#skip_whitespace();
        if ( this.#head < this.#data.length ) throw new Error("Unparsed trailling characters");


        // End the stream
        this.emit("end")
    }
}

module.exports = exports = Parser;
