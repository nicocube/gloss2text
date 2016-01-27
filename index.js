#!/usr/bin/env node

//try {
  'use strict'
  var meow = require('meow')
  //  , chalk = require('chalk')

  // temporary test of meow
  var cli = meow(
    '\n  Usages\n'+
    '    $ gloss2text\n'+
    '    $ gloss2text grammar.json\n\n'+
    '      REPL mode, any gloss typed on the command-line is parsed.\n'+
    '      /h or /help for inline help about available commands\n\n'+
    '    $ gloss2text grammar.json gloss.txt\n\n'+
    '      Options\n'+
    '        -o, --out\tfile to send output to (otherwise goes to command-line)\n'+
    '        -i, --interlinear\toutput both result text on one line and original gloss under\n'+
    '\n'+
    '      Examples\n'+
    '        $ gloss grammar.json gloss.txt -i -o glossed\n',
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

    if (cli.input.length==2) {
      var parser = parser_builder(JSON.parse(fs.readFileSync(cli.input[0], 'utf8')))
        , text = fs.readFileSync(cli.input[1], 'utf8')
      console.log(parser(text))
    }
  }

/*
} catch(e) {
  console.log(e.message)
  process.exit(1)
}
*/
