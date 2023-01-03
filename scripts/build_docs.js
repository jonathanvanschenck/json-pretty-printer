/**
 * Build the documentation for your webapp
 */

const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const EMPTY_STRING = '​';

set_empty_string = function(data) {
  // Hacky fix for: https://github.com/jsdoc/jsdoc/issues/1529
  data.forEach((e)=>{
    if (typeof(e.params) === 'object') {
        e.params.forEach((p)=>{
          if (p.defaultvalue === '""') {
            p.defaultvalue = EMPTY_STRING;
          }
        })
    }
  })
}


const output_fp = path.resolve(`API.md`)
let files = ["index.js"]

glob.sync(path.resolve("lib/**/*.js")).forEach((fp)=> {

  console.log(`[build_documentation] : Reading '${fp}'`);
  let data = fs.readFileSync(fp, 'utf-8');
  if (
    data.includes("/**") // all jsdoc-style comments
  ) {
    files.push(fp)
  }
})

console.log(`[build_documentation] : Building documentation into '${output_fp}'`);
data = jsdoc2md.getTemplateDataSync({files: files, configure: path.resolve("scripts/jsdoc_config.json") })
set_empty_string(data)
output = jsdoc2md.renderSync({ data: data })
fs.writeFileSync(output_fp, output)
