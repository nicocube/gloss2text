/*
 * Copyright 2016 Nicolas Lochet Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

module.exports = function() {
  'use strict'
  try {
    var meow = require('meow')
      , chalk = require('chalk')

    // temporary test of meow
    var cli = meow(
      '\n  Usages\n'+
      '    $ gloss2text\n'+
      '\n'+
      '      This documentation.\n'+
      '\n'+
      '      General options\n'+
      '        -h, --help\tshow this documentation (even with other parameters)\n'+
      '        -S, --stacktrace\tshow stacktrace\n'+
      '\n'+
      '    $ gloss2text <grammarfile>\n'+
      '\n'+
      '      Print meta-informations about the grammar (number of entries, duplicates, etc).\n'+
      '\n'+
      '    $ gloss2text <grammarfile> <glossfile>\n'+
      '\n'+
      '      Specific options\n'+
      '        -i, --interlinear\toutput both result text on one line and original gloss under\n'+
      '        -o, --out\tfile to send output to (otherwise goes to command-line)\n'+
      '        -t, --test\tunit test mode (check hint lines, print erronous, and display report)\n'+
      '        -w, --watch\tdo not close after treating file/tests and watch changes to reload automatically (do not work with --out option)\n'+
      '\n'+
      '      Examples\n'+
      '        $ gloss grammar.json gloss.txt -i\n',
      '        $ gloss grammar.yml gloss.txt -i -o glossed.txt\n',
      {
        alias: {
          h: 'help',
          o: 'output',
          i: 'interlinear',
          c: 'count',
          d: 'duplicate',
          S: 'stacktrace',
          t: 'test',
          'watch': 'w'
        }
      }
    )

    /*
    console.log(cli.input)
    console.log(cli.flags)
    //*/

    if ((cli.input.length===0 && (Object.keys(cli.flags).length===0 || cli.flags.w || cli.flags.watch)) || cli.flags.h) {
      cli.showHelp()
    } else {
      var fs = require('fs')
        , chalk = require('chalk')
        , yaml = require('js-yaml')
        , parse = /yml$/.test(cli.input[0]) ? yaml.safeLoad : JSON.parse
        , parser_builder = require(__dirname+'/lib/parser.js')

      if (cli.input.length==1) {
        var grammar_analyser = require(__dirname+'/lib/grammar_analyser.js')(parse(fs.readFileSync(cli.input[0], 'utf8')))
        process.stdout.write('Lexicon entries: '+grammar_analyser.count_lexicon_entries()+'\n')
        process.stdout.write('Duplicate lexicon entries:\n'+grammar_analyser.format(grammar_analyser.find_duplicate())+'\n')
      } else if (cli.input.length==2) {
        var grammarFile = cli.input[0]
          , textFile = cli.input[1]
        if (cli.flags.w) {
          require('minus-watch').add([grammarFile, textFile])
        }
        var parser = parser_builder(parse(fs.readFileSync(grammarFile, 'utf8')))
          , text = fs.readFileSync(textFile, 'utf8')
          , lines = text.split('\n')
          , x = undefined
          , isInterlinear = cli.flags.i

        lines.forEach(function(l) {
          if (/^\s*$/.test(l) || l.startsWith('>')) {
            process.stdout.write(l+'\n')
          } else if (l.startsWith('#')) {
            x = l.replace(/^#\s*/,'')
          } else {
            var p = parser(l)
            if (typeof x !== 'undefined' && p !== x) {
              process.stdout.write(chalk.red('Expect: '+x)+'\n')
              process.stdout.write(chalk.red('Actual: '+p)+'\n')
            } else {
              process.stdout.write(chalk.cyan(p)+'\n')
            }
            if (isInterlinear) process.stdout.write(chalk.yellow(l)+'\n')
            x = undefined
          }
        })
      }
    }

  } catch(e) {
    if (! ('S' in cli.flags)) process.stderr.write(chalk.magenta('ERROR:'+e.message+'\n'))
    else process.stderr.write(chalk.magenta(e.stack+'\n'))
  }
}