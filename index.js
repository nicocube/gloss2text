#!/usr/bin/env node

try {
  'use strict'
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
        w: 'watch'
      }
    }
  )


  if ((cli.input.length==0 && Object.keys(cli.flags).length==0) || cli.flags.h) {
    cli.showHelp()
  } else {
    //console.log(cli.input)
    //console.log(cli.flags)

    var fs = require('fs')
      , yaml = require('js-yaml')
      , parse = /yml$/.test(cli.input[0]) ? yaml.safeLoad : JSON.parse
      , tool = require('./tool')

    if (cli.input.length==1) {
      var grammar_analyser = require(__dirname+'/lib/grammar_analyser.js')(parse(fs.readFileSync(cli.input[0], 'utf8')))
      process.stdout.write('Lexicon entries: '+grammar_analyser.count_lexicon_entries()+'\n')
      process.stdout.write('Duplicate lexicon entries:\n'+grammar_analyser.format(grammar_analyser.find_duplicate())+'\n')
    } else if (cli.input.length==2) {
      var grammarFile = cli.input[0]
        , textFile = cli.input[1]
      if (!cli.flags.w) {
        util.parse_file(parse, grammarFile, textFile, cli.flags.i)
      } else {
        tool.set_for_reload(parse, grammarFile, textFile, cli.flags.i, cli.flags.S)
        tool.register(__dirname+'/index.js')
        tool.register(__dirname+'/tool.js')
        fs.readdirSync(__dirname+'/lib')
        .filter(RegExp.prototype.test.bind(/\.js$/))
        .forEach(function (s) { console.log(__dirname+'/lib/'+s); tool.register(__dirname+'/lib/'+s, true) })
        tool.register(grammarFile)
        tool.register(textFile)
        
        tool.print_for_reload()
        
        process.stdin.setEncoding('utf8')
        process.stdin.on('data', function (chunk) {
          console.log(chunk)
          if (chunk==='q' || chunk==='\u0003') process.exit(0)
          if (chunk==='r') {
            tool.reload_dep()
            tool.print_for_reload()
          }
        })
        process.stdin.on('end', function () {
          process.exit(0)
        })
        process.stdin.setRawMode(true)
        process.stdin.resume()
      }
    }
  }

} catch(e) {
  if (! ('S' in cli.flags)) process.stderr.write(chalk.magenta('ERROR:'+e.message+'\n'))
  else process.stderr.write(chalk.magenta(e.stack+'\n'))
  process.exit(1)
}
