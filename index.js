#!/usr/bin/env node

try {
  'use strict'
  var meow = require('meow')
    , chalk = require('chalk')

  // temporary test of meow
  var cli = meow(
    '\n  Usages\n'+
    '    $ gloss2text\n'+
    '    $ gloss2text <grammarfile>\n\n'+
    '      REPL mode, any gloss typed on the command-line is parsed.\n'+
    '      /h or /help for inline help about available commands\n\n'+
    '    $ gloss2text <grammarfile> <glossfile>\n\n'+
    '      Options\n'+
    '        -o, --out\tfile to send output to (otherwise goes to command-line)\n'+
    '        -i, --interlinear\toutput both result text on one line and original gloss under\n'+
    '\n'+
    '      Examples\n'+
    '        $ gloss grammar.json gloss.txt -i\n',
    '        $ gloss grammar.yml gloss.txt -i -o glossed.txt\n',
    {
      alias: {
        o: 'output',
        i: 'interlinear'
      }
    }
  )

  if (cli.input.length==0 && Object.keys(cli.flags).length==0) {
    cli.showHelp()
  } else {
    //TODO
    if (cli.input.length!==2 && Object.keys(cli.flags).length > 0) throw Error('Cannot have options in REPL mode.')

    //console.log(cli.input)
    //console.log(cli.flags)

    var parser_builder = require(__dirname+'/lib/parser.js')
      , fs = require('fs')
      , yaml = require('js-yaml')
      , parse = /yml$/.test(cli.input[0]) ? yaml.safeLoad : JSON.parse

    if (cli.input.length==2) {
      var parser = parser_builder(parse(fs.readFileSync(cli.input[0], 'utf8')))
        , text = fs.readFileSync(cli.input[1], 'utf8')
        , lines = text.split('\n')

      lines.forEach(function(l) {
        if (/^\s*$/.test(l) || l.startsWith('>')) {
          process.stdout.write(l+'\n')
        } else {
          process.stdout.write(chalk.cyan(parser(l))+'\n')
          if (cli.flags.i) process.stdout.write(chalk.yellow(l)+'\n')
        }
      })
    }
  }

//*
} catch(e) {
  process.stderr.write(chalk.magenta('ERROR:'+e.message+'\n'))
  process.exit(1)
}
//*/
