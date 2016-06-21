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
          w: 'watch',
          v: 'verbose'
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
        , path = require('path')
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
          , tf
          , textFile = tf = cli.input[1]
          , isDir = fs.statSync(textFile).isDirectory()
        
        if (isDir) {
          textFile = fs.readdirSync(textFile)
          .map(function(f) { return path.join(tf, f)})
          .filter(function(f) { return ! fs.statSync(f).isDirectory()})
          if (textFile.length === 0) throw new Error("No file found in "+tf)
        } else {
          textFile = [textFile]
        }
        
        if (cli.flags.w) {
          require('minus-watch').add([grammarFile, tf])
          require('minus-watch').add(textFile)
        }
        
        var totalTestCount = 0
          , totalFailureCount = 0
          , isTest = cli.flags.t  

        textFile.forEach(function(f) {
          var testCount = 0
            , failureCount = 0
          if (isDir) {
            process.stdout.write(chalk.inverse('Running: '+f+':'))
          }
          var parser = parser_builder(parse(fs.readFileSync(grammarFile, 'utf8')))
            , text = fs.readFileSync(f, 'utf8')
            , lines = text.split('\n')
            , x = undefined
            , isInterlinear = cli.flags.i
            , isTestFailed = false

          lines.forEach(function(l, i) {
            if (l.startsWith('#')) {
              x = l.replace(/^#\s*/,'')
              testCount+=1
              isTestFailed = false
              if (isDir && i === 0) {
                process.stdout.write('\n')
              }
            } else if (! /^\s*$/.test(l) && ! l.startsWith('>')) {
              try {
                var p = parser(l)
              } catch(e) {
                if (isDir && i === 0) {
                  process.stdout.write('\n')
                }
                process.stdout.write(chalk.magenta('While processing file "'+f+'" line number '+(i+1)+': '+l+'\n'))
                if (! ('S' in cli.flags)) process.stdout.write(chalk.magenta('ERROR:'+e.message+'\n'))
                else process.stdout.write(chalk.magenta(e.stack+'\n'))
              }
              if (typeof x !== 'undefined' && p !== x) {
                if (isTest) process.stdout.write('\n'+chalk.bgRed('Line: '+(i+1))+'\n')
                process.stdout.write(chalk.red('Expect: '+x)+'\n')
                process.stdout.write(chalk.red('Actual: '+p)+'\n')
                isTestFailed = true
                failureCount += 1
              } else if (!isTest) {
                if (isDir && i === 0) {
                  process.stdout.write('\n')
                }
                process.stdout.write(chalk.cyan(p)+'\n')
              }
              if ((!isTest || isTestFailed) && isInterlinear) process.stdout.write(chalk.yellow(l)+'\n')
              x = undefined
            } else if (!isTest || isTestFailed) {
              if (isDir && i === 0) {
                process.stdout.write('\n')
              }
              process.stdout.write(l+'\n')
              isTestFailed = false
            }
          })

          if (isTest) {
            if (failureCount == 0) {
              process.stdout.write(chalk.bgGreen(' '+ testCount+' check'+(testCount>1?'s':'')+' passed!')+'\n')
            } else {
              process.stdout.write(chalk.bgRed(' '+ failureCount+'/'+testCount+' check'+(testCount>1?'s':'')+' failed!')+'\n')
            }
          }
          totalTestCount += testCount
          totalFailureCount += failureCount
        })
        if (isTest) {
          process.stdout.write('\n'+chalk.inverse('Total:\n'))
          if (totalFailureCount == 0) {
            process.stdout.write(chalk.bgGreen(' '+ totalTestCount+' check'+(totalTestCount>1?'s':'')+' passed!')+'\n')
          } else {
            process.stdout.write(chalk.bgRed(' '+ totalFailureCount+'/'+totalTestCount+' check'+(totalTestCount>1?'s':'')+' failed!')+'\n')
          }
        } 
      }
    }

  } catch(e) {
    if (! ('S' in cli.flags)) process.stdout.write(chalk.magenta('ERROR:'+e.message+'\n'))
    else process.stdout.write(chalk.magenta(e.stack+'\n'))
  }
}