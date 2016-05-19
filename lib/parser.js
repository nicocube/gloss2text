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
        if (cur.length > 0) res += parse_gloss(cur, res === '' ? 'initial' : 'medial')
        cur = []
      } else if (l.inter === '.') {
        if (a.length === 0) {
          res += parse_gloss(cur, res === '' ? 'initial' : 'medial') + l.inter
          cur = []
        }
      }
    }
    if (cur.length > 0) res += parse_gloss(cur, res === '' ? 'isolate' : 'final')
    return res
  }

  function parse_gloss(w, x) {
    var m = w.shift()
      , l = find_lexicon(m)
    if ('invariant' in l) {
      if (w.length === 0) return l.invariant
      else {
        w.unshift(m)
        throw new Error('Invariant stem '+m+' defined as '+l+' should not appear as a chain head: '+w)
      }
    }
    if('compound' in l) {
      return parse_compound(l, w, x)
    }
    if('irregular' in l) {
      var i = parse_irregular(l, w, x)
      if (typeof i !== 'undefined') return i
    }
    return parse_regular(l, w, x)
  }

  function parse_compound(l, w, x) {
    var c = lexer.lexAll(l.compound)
      , p
      , s
      , a = ''

    while(c.length > 0) {
      var e = c.shift()
      if ('gloss' in e) {
        var m = find_lexicon(e.gloss)
        p = find_paradigm(m)
        s = m[p]
        a += s
      }
    }

    if (w.length === 0) return a
    if (! (p in grammar.rules)) {
      throw new Error('No rule found for paradigm: '+p)
    }
    var r = grammar.rules[p]
      , y = {}
    y[p] = a
    return rec_parse_regular(y, w, 0, r, a)
  }

  function parse_irregular(l, w, x) {
    if (w.length === 0 && typeof l.irregular === 'string') {
      return l.irregular
    } else {
      var y = l.irregular
      return rec_parse_irregular(l, w, 0, y)
    }
  }

  function rec_parse_irregular(l, w, i, y) {
    var s = w.length
      , g = w[i]
    if (g in y) {
      y = y[g]
      if (i < s && typeof y === 'object') return rec_parse_irregular(l, w, i+1, y)
      else if (typeof y === 'string') {
        if (i+1 === s) return y
        else return rec_parse_regular(l, w, i+1, {}, y)
      }
      else throw new Error('Type of '+y+' not string or object in '+l)
    }
    return undefined // no irregular form found, return undefined to switch to regular
  }

  function parse_regular(l, w, x) {
    var p = find_paradigm(l)
      , s = find_stem(l, p, x)
    if (w.length === 0) return s
    if (! (p in grammar.rules)) {
      throw new Error('No rule found for paradigm: '+p)
    }
    var r = grammar.rules[p]
    return rec_parse_regular(l, w, 0, r, s)
  }

  function rec_parse_regular(l, w, i, r, s) {
    var g = w[i]
      , v = s
    if (!(g in r)) {
      var p = find_paradigm(l)
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
    if (i+1 === w.length) return v
    return rec_parse_regular(l, w, i+1, r, v)
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
          throw new Error('Not implemented yet: array of sub rule of type object')
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

  function find_paradigm(l, position) {
    var p = Object.keys(l).filter(function(k) { return k!=='irregular' && k!=='invariant' && k!=='compound' && k!=='meaning'}).reduce(function(p, c) { return p || c }, undefined)
    if (typeof p === 'undefined') {
      throw new Error('No paradigm found in: '+p)
    }
    return p
  }

  function find_stem(l, p, x) {
    var s = l[p]
    if (s instanceof Array) {
      console.log(s, x)
      switch (x) {
      case 'isolate':
        s = s.filter(function(f) { return ! f.startsWith('-') && ! f.endsWith('-') })
        break;
      case 'initial':
        s = s.filter(function(f) { return ! f.startsWith('-') && f.endsWith('-') })
        break;
      case 'medial':
        s = s.filter(function(f) { return f.startsWith('-') && f.endsWith('-') })
        break;
      case 'final':
        s = s.filter(function(f) { return f.startsWith('-') && ! f.endsWith('-') })
        break;
      }
      if (s.length === 0) throw new Error('No '+x+' form found in: '+l)
      return s[0].replace(/-/g,'')
    }
    return s
  }

  return parse
}
