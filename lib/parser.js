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

  var rule = require(__dirname+'/rule')(grammar)
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
    var cur = [[]]
      , last = cur[0]
      , res = ''

    while (a.length > 0) {
      var l = a.shift()
      if (!('inter' in l)) {
        if (last.length === 0 && isCompound(l.gloss)) {
          cur.pop()
          expand_compound(l.gloss).forEach(function(x) {
            cur.push([x])
          })
          last = cur[cur.length-1]
        } else {
          last.push(l.gloss)
        }
      } else if (l.inter === '-') {
        last = []
        cur.push(last)
      }
    }
    if (cur.length === 1) {
      return parse_gloss(cur[0])
    } else {
      return parse_composition(cur)
    }
    return res
  }

  function isCompound(x) {
    var l = find_lexicon(x)
    return 'compound' in l
  }

  function expand_compound(x) {
    var l = find_lexicon(x)
    var a = l.compound.split('-')
      , c = [ x ]
      , r = []
    while (a.length > 0) {
      var e = a.shift()
        , el = find_lexicon(e)
      if (! ('compound' in el)){
        r.push(e)
      } else if (c.indexOf(e) !== -1) {
        throw new Error('Circular reference with '+x +': '+ c)
      } else {
        c.push(e)
        el.compound.split('-').reverse().forEach(function(x) { a.unshift(x) })
      }
    }
    return r
  }

  function parse_composition(a) {
    var res = ''
    check_for_composition(a)
    while (a.length > 0) {
      var l = a.shift()
      res += parse_gloss(l)
    }
    return res
  }

  function check_for_composition(a) {
    var i = 0
      , s = a.length
    for (; i < s; i += 1) {
      a[i][0] = find_lexicon(a[i][0])
    }
    i = 0
    for (; i < s; i += 1) {
      var l = a[i][0]
      if ('compose' in l) {
        if (i === 0) a[i][0] = find_matching_initial(l, a[i+1][0])
        else if (i < a.length-1) a[i][0] = find_matching_medial(l, a[i-1][0], a[i+1][0])
        else a[i][0] = find_matching_final(l, a[i-1][0])
      }
    }
  }

  var initialRx = /^(.)\+(.*)$/
    , finalRx = /^(.*)\+(.)$/
    , medialRx = /^(.)\+(.*)\+(.)$/

  function find_matching_initial(l, n) {
    var c = l.compose.filter(function (x) { return finalRx.test(x) && ! initialRx.test(x) })
    if (c.length > 0) {
      var pl = find_paradigm(l)
        , pn = find_paradigm(n)
        , sn = n[pn]
        , x = finalRx.exec(c[0])
      if (x !== null && x[2] in grammar.phonemes) {
        var prx = new RegExp('^'+rule.parse_pattern(x[2], true))
        if (prx.test(sn)) {
          var r = {}
          r[pl] = x[1]
          return r
        }
      }
    }
    return l
  }

  function find_matching_medial(l, p, n) {
    var c = l.compose.filter(function (x) { return finalRx.test(x) && initialRx.test(x) })
    if (c.length > 0) {
      var pl = find_paradigm(l)
        , pn = find_paradigm(n)
        , pp = find_paradigm(p)
        , sn = n[pn]
        , sp = p[pp]
        , x = medialRx.exec(c[0])
      if (x !== null && x[1] in grammar.phonemes && x[3] in grammar.phonemes) {
        var p_prx = new RegExp(rule.parse_pattern(x[1], true)+'$')
          , n_prx = new RegExp('^'+rule.parse_pattern(x[3], true))
        if (p_prx.test(sp) && n_prx.test(sn)) {
          var r = {}
          r[pl] = x[2]
          return r
        } else if(p_prx.test(sp)) {
          return find_matching_final(l, p)
        } else if(n_prx.test(sn)) {
          return find_matching_initial(l, n)
        }
      }
    }
    return l
  }

  function find_matching_final(l, p) {
    var c = l.compose.filter(function (x) { return ! finalRx.test(x) && initialRx.test(x) })
    if (c.length > 0) {
      var pl = find_paradigm(l)
        , pp = find_paradigm(p)
        , sp = p[pp]
        , x = initialRx.exec(c[0])
      if (x !== null && x[1] in grammar.phonemes) {
        var prx = new RegExp(rule.parse_pattern(x[1], true)+'$')
        if (prx.test(sp)) {
          var r = {}
          r[pl] = x[2]
          return r
        }
      }
    }
    return l
  }

  function parse_gloss(w) {
    var m = w.shift()
      , l = typeof(m) === 'object' ? m : find_lexicon(m)
    if ('invariant' in l) {
      if (w.length === 0) return l.invariant
      else {
        w.unshift(m)
        throw new Error('Invariant stem '+m+' defined as '+l+' should not appear as a chain head: '+w)
      }
    }
    if('irregular' in l) {
      var i = parse_irregular(l, w)
      if (typeof i !== 'undefined') return i
    }
    return parse_regular(l, w)
  }

  function parse_irregular(l, w) {
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

  function parse_regular(l, w) {
    var p = find_paradigm(l)
      , s = l[p]
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
      if (!(g in grammar.rules[p])) throw new Error('Cannot find '+g+' for paradigm '+p+' in '+JSON.stringify(grammar.rules[p]))
      r = grammar.rules[p]
    }
    var t = r[g]
    switch(typeof t) {
    case 'function':
      v = t(s)
      break
    case 'string':
      v = rule.parse_string_rule(t,s)
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
        v = rule.parse_string_rule(t, s)
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

  function find_paradigm(l) {
    var p = Object.keys(l).filter(function(k) { return k!=='irregular' && k!=='invariant' && k!=='compound' && k!=='meaning'}).reduce(function(p, c) { return p || c }, undefined)
    if (typeof p === 'undefined') {
      throw new Error('No paradigm found in: '+p)
    }
    return p
  }

  return parse
}
