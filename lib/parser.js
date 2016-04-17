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

module.exports = function (grammar) {
  'use strict'
  if (!('lexicon' in grammar)) throw new Error('Your grammar needs a lexicon section.')

  var parse_string_rule = require(__dirname+'/rule')(grammar)
    , lexer = require(__dirname+'/lexer')()
/*
 * stream = require('stream')
    ,
    , tokenizer = require(__dirname+'/tokenizer')()
*/

  function parse(gloss) {
    var all = lexer.lexAll(gloss)
      , cur = []
      , res = ''

    while (all.length > 0) {
      var l = all.shift()
      if (!('blank' in l)) {
        cur.push(l)
      } else {
        if (cur.length > 0) res += parse_word(cur)
        res += l.blank
        cur = []
      }
    }
    res += parse_word(cur)
    return res
  }

  function parse_word(w) {
    var m = w.shift()
    if ('gloss' in m) {
      return parse_gloss(m.gloss, w)
    } else if ('inter' in m) {
      return m.inter + parse_word(w)
    } else {
      w.unshift(m)
      throw new Error('Word must start with gloss: '+JSON.stringify(w))
    }
  }

  function parse_gloss(m, w) {
    var l = find_lexicon(m)
    if (w.length === 0) {
      if ('invariant' in l) {
        return l.invariant
      } else if('irregular' in l && typeof l.irregular === 'string') {
        return l.irregular
      } else {
        var ks = Object.keys(l)
        delete ks.irregular
        if (ks.length !== 1) {
          throw new Error('Should have only one paradigm: '+l)
        }
        if (typeof l[ks[0]] !== 'string') {
          throw new Error('Should be a direct string: '+l)
        } else {
          return l[ks[0]]
        }
      }
    } else {
      var y = w.shift()
      if ('inter' in y) {
        switch (y.inter) {
        case '.': {
          if (w.length === 0) {
            return '.'
          } else {
            return concat_derivation(l, w, grammar.rules)
          }
        }
        case '-': {
          return '-' + parse(w)
        }
        default:
          throw new Error('Unknown inter symbol: '+y.inter)
        }
      }
    }
  }

  function concat_derivation(l, w, r) {
    var y = w.shift()
    if ('gloss' in y) {
      if ('invariant' in l) {
        if (w.length === 0) return l.invariant
        return l.invariant + parse_word(w)
      }
      if ('irregular' in l && y.gloss in l.irregular) {
        var i = l.irregular[y.gloss]
        if (typeof i === 'string' && w.length === 0) return i
        else return irregular_sub_derivation(i, w)
      }
      var ks = Object.keys(l)
      delete ks.irregular
      if (ks.length !== 1) {
        throw new Error('Should have only one paradigm: '+l)
      }
      if (typeof l[ks[0]] !== 'string') {
        throw new Error('Should be a direct string: '+l)
      } else {
        var k = ks[0]
          , p = l[k]
        if (k in r) {
          var e = r[k]
          if (typeof e === 'object') {
            return rule_sub_derivation(p, y.gloss, w, e)
          } else {
            return 'X'
          }
        }
        return ''
      }
    } else {
      throw new Error('Derivation must be gloss: '+JSON.stringify(w))
    }
  }

  function find_lexicon(m) {
    if (m in grammar.lexicon) {
      return grammar.lexicon[m]
    } else {
      throw new Error('No lexicon entry for "'+m+'"')
    }
  }

  function rule_sub_derivation(p, k, w, r) {
    if (k in r) {
      var t = r[k]
      switch(typeof t) {
      case 'function':
        return t(p)
      case 'string':
        return parse_string_rule(t,p)
      case 'object':
        var y = w.shift()
        if ('inter' in y) {
          switch (y.inter) {
          case '.': {
            if (w.length === 0) return '.'
            else return concat_derivation({_:p}, w, {_:t})
          }
          case '-': {
            throw new Error('Invalid usage of "'+y.inter+'"')
          }
          default:
            throw new Error('Unknown inter symbol: '+y.inter)
          }
        }
        return 'Y'
      }
    }
    return 'Z'
  }

  function irregular_sub_derivation(i, w) {
    //console.log(i,w)
    var y = w.shift()
    if ('inter' in y) {
      switch (y.inter) {
      case '.':
        throw new Error('Not Implemented yet')
      case '-':
        return i + parse_word(w)
      }
    }
    throw new Error('Not Implemented yet')
  }

  return parse
}
