
var dep = {
    _ : {},
    add : function(s) {
      return this._[s] = {
        $: require(s),
        get: function() {
          return this.$
        },
        reset: function() {
          delete require.cache[s]
          this.$ = require(s)
        } 
      }
    },
    reset : function(s) {
      this._[s].reset()
    },
    reloadAll : function() {
      Object.keys(dep._).forEach(function(k){ dep.reset(k) })
    }
  }
  , parser_builder = dep.add(__dirname+'/lib/parser.js')
  , fs = require('fs')
  , chalk = require('chalk')

function parse_file(parse, grammarFile, textFile, isInterlinear) {
  var parser = parser_builder.get()(parse(fs.readFileSync(grammarFile, 'utf8')))
    , text = fs.readFileSync(textFile, 'utf8')
    , lines = text.split('\n')
    , x = undefined

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

var for_reload = {}
function set_for_reload(parse, grammarFile, textFile, isInterlinear, isPrintStackTrace) {
  for_reload.parse = parse
  for_reload.grammarFile = grammarFile
  for_reload.textFile = textFile
  for_reload.isInterlinear = isInterlinear
  for_reload.isPrintStackTrace = isPrintStackTrace
}

function print_for_reload() {
  parse_file(for_reload.parse, for_reload.grammarFile, for_reload.textFile, for_reload.isInterlinear)
  prompt_for_reload()
}

function prompt_for_reload() {
  process.stdout.write(chalk.gray('\nWait for change on files. r to reload, q to quit\n'))
}

function register(filename, isResetable){
  fs.watchFile(filename,
  { interval: 1000 },  
  function() {
    process.stdout.write('\nUpdate found on '+filename+'\n')
    if (typeof filename === 'string' && isResetable) {
      dep.reset(filename)
    }
    try {
      print_for_reload()
    } catch(e) {
      if (!for_reload.isPrintStackTrace) process.stderr.write(chalk.magenta('ERROR:'+e.message+'\n'))
      else process.stderr.write(chalk.magenta(e.stack+'\n'))
      prompt_for_reload()
    }
  })
}

module.exports = {
  reload_dep : dep.reloadAll.bind(dep),
  parse_file : parse_file,
  set_for_reload : set_for_reload,
  print_for_reload : print_for_reload,
  register : register
}
