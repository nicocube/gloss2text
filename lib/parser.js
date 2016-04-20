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

  function parse(text) {
    var a = lexer.lexAll(text)
    return parse_blank(a)
  }

  function parse_blank(a) {
    var cur = []
      , res = ''

    while (a.length > 0) {
      var l = a.shift()
      if (!('blank' in l)) {
        cur.push(l)
      } else {
        if (cur.length > 0) res += parse_inter(cur)
        res += l.blank
        cur = []
      }
    }
    if (cur.length > 0) res += parse_inter(cur)
    return res
  }

  function parse_inter(a) {
    var cur = []
      , res = ''

    while (a.length > 0) {
      var l = a.shift()
      if (!('inter' in l)) {
        cur.push(l.gloss)
      } else if (l.inter === '-') {
        if (cur.length > 0) res += parse_gloss(cur)
        cur = []
      } else if (l.inter === '.') {
        if (a.length === 0) {
          res += parse_gloss(cur) + l.inter
          cur = []
        }
      }
    }
    if (cur.length > 0) res += parse_gloss(cur)
    return res
  }

  function parse_gloss(w) {
    var m = w.shift()
      , x = find_lexicon(m)
    if ('invariant' in x) {
      if (w.length === 0) return x.invariant
      else {
        w.unshift(m)
        throw new Error('Invariant stem '+m+' defined as '+x+' should not appear as a chain head: '+w)
      }
    }
    if('irregular' in x) {
      var i = parse_irregular(x, w)
      if (typeof i !== 'undefined') return i
    }
    return parse_regular(x,w)
  }

  function parse_irregular(x, w) {
    if (w.length === 0 && typeof x.irregular === 'string') {
      return x.irregular
    } else {
      var i = 0
        , l = w.length
        , r = x.irregular
      for(; i < l ; i += 1) {
        var v = w[i]
        r = r[v]
        if (typeof r !== 'object' && i+1 < l) {
          // manage the case when gloss chain is deeper than irregular definition
          throw new Error('Not implemented yet')
        }
      }
      return r
    }
  }

  function parse_regular(x, w) {
    var p = find_paradigm(x)
      , s = x[p]
    if (w.length === 0) return s
    if (! (p in grammar.rules)) {
      throw new Error('No rule found for paradigm: '+p)
    }
    var r = grammar.rules[p]
      , i = 0
      , l = w.length
      , v = s
    for(; i < l ; i += 1) {
      var g = w[i]
      if (!(g in r)) {
        if (!(g in grammar.rules[p])) throw new Error('Cannot find '+g+' for paradigm '+p+' in '+grammar.rules[p])
        r = grammar.rules[p]
      }
      var t = r[g]
      switch(typeof t) {
      case 'function':
        v = t(s)
        break
      case 'string':
        v = parse_string_rule(t,s)
        break
      case 'object':
        if (t instanceof Array) {
          v = parse_array_rule(t, s)
        } else {
          r = t
        }
      }
      s = v
    }
    return v
  }

  function parse_array_rule(r, s) {
    var i = 0
      , l = r.length
    for(; i < l ; i += 1) {
      var t = r[i]
        , v = s
      switch(typeof t) {
      case 'function':
        v = t(s)
        break
      case 'string':
        v = parse_string_rule(t, s)
        break
      case 'object':
        if (t instanceof Array) {
          v = parse_array_rule(t, s)
        } else {
          // is this case can even exists ?
          throw new Error('Not implemented yet')
        }
      }
      if (v !== s) return v
      else s = v
    }
    return v
  }

  function find_lexicon(m) {
    if (m in grammar.lexicon) {
      return grammar.lexicon[m]
    } else {
      throw new Error('No lexicon entry for "'+m+'"')
    }
  }

  function find_paradigm(x) {
    var p = Object.keys(x).filter(function(x) { return x!=='irregular' && x!=='invariant'}).reduce(function(p, c) { return p || c }, undefined)
    if (typeof p === 'undefined') {
      throw new Error('No paradigm found in: '+p)
    }
    return p
  }

  return parse
}
