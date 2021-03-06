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
  if (!('paradigms' in grammar)) throw new Error('Your grammar needs a paradigms section.')

  grammar = require(__dirname+'/grammar_expand')(grammar)

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

    while (a.length > 0) {
      var l = a.shift()
      if (!('inter' in l)) {
        var m = 'abbr' in l ? l.abbr : 'stem' in l ? l .stem : l.mix
        if (last.length === 0 && isCompound(m)) {
          cur.pop()
          expand_compound(m).forEach(function(x) {
            cur.push([x])
          })
          last = cur[cur.length-1]
        } else {
          last.push(m)
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
    for (; i < a.length; i += 1) {
      a[i][0] = find_lexicon(a[i][0])
    }
    i = 0
    for (; i < a.length; i += 1) {
      var l = a[i][0]
      if ('compose' in l) {
        if (i === 0) a[i][0] = find_matching_initial(l, a[i+1][0])
        else if (i < a.length-1) a[i][0] = find_matching_medial(l, a[i-1][0], a[i+1][0])
        else a[i][0] = find_matching_final(l, a[i-1][0])
      } else if (i > 0 && l.isDerivation) {
        var p = find_paradigm(l)
        if (rule.is_string_pattern(l[p])) {
          var ps = split_trim(p, ',')
            , j = 0, psl = ps.length, lmc = 0
            , pp = find_paradigm(a[i-1][0])
          pc:
          for(; j < psl; j+=1) {
            var m = /^(.*)>(.*)$/.exec(ps[j])
              , ms = m[1].split(/\./)
              , wp = ms[0]
            if (pp === wp) {
              if (a[i-1].length !== ms.length) {
                lmc += 1
                continue pc
              }
              if (ms.length > 1 && ms.length == a[i-1].length) {
                if (ms.length > 1) {
                  var k = ms.length - 1
                  for (; k > 0; k -= 1) {
                    if (ms[k] !== a[i-1][k]) {
                      lmc += 1
                      continue pc
                    }
                  }
                  var o = a[i-1]
                  a[i-1] = [ {} ]
                  a[i-1][0][pp] = parse_gloss(o)
                }
              }
              var x = rule.parse_string_rule(l[p], a[i-1][0][pp])
              a[i-1][0] = {}
              a[i-1][0][m[2]] = x

              if (a[i].length > 1) {
                a[i].slice(1).forEach(function(e) { a[i-1].push(e) })
              }
              a.splice(i,1)
              break pc
            }
            lmc += 1
          }
          if (lmc === psl) {
            throw new Error('No matching derivation for "'+p+'" in "'+a[i-1][0][pp]+(a[i-1].length>1?'.':'')+a[i-1].slice(1).join('.')+'"')
          }
        }
      }
    }
  }

  function split_trim(s, sep) {
    return s.split(sep).map(function(t){ return t.trim() })
  }

  var initialRx = /^([^-]+)-([^-])$/
    , finalRx = /^([^-])-([^-]+)$/
    , medialRx = /^(?:([^-])-)?([^-]+)(?:-([^-]))?$/

  function find_matching_initial(l, n) {
    var c = l.compose
    .map(function (x) { return initialRx.exec(x) })
    .filter(function (x) { return x !== null })
    while (c.length > 0) {
      var pl = find_paradigm(l)
        , pn = find_paradigm(n)
        , sn = n[pn]
        , x = c.shift()
      if (x[2] in grammar.phonemes) {
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
    var c = l.compose
    .map(function (x) { return medialRx.exec(x) })
    .filter(function (x) { return x !== null })
    .sort(function(a, b) {
      function score01(y) { return typeof y !== 'undefined' ? 1 : 0 }
      function score(x) { return score01(x[1]) + score01(x[3]) }
      return -score(a)+score(b)
    })
    while (c.length > 0) {
      var pl = find_paradigm(l)
        , pn = find_paradigm(n)
        , pp = find_paradigm(p)
        , sn = n[pn]
        , sp = p[pp]
        , x = c.shift()
        , p_prx = typeof x[1] !== 'undefined' && x[1] in grammar.phonemes ? new RegExp(rule.parse_pattern(x[1], true)+'$') : null
        , n_prx = typeof x[3] !== 'undefined' && x[3] in grammar.phonemes ? new RegExp('^'+rule.parse_pattern(x[3], true)) : null
        , r = {}
      if (p_prx !== null && n_prx !== null) {
        if (p_prx.test(sp) && n_prx.test(sn)) {
          r[pl] = x[2]
          return r
        } else if(p_prx.test(sp)) {
          return find_matching_final(l, p)
        } else if(n_prx.test(sn)) {
          return find_matching_initial(l, n)
        }
      } else if (p_prx !== null) {
        if (p_prx.test(sp)) {
          r[pl] = x[2]
          return r
        }
      } else if (n_prx !== null) {
        if (n_prx.test(sp)) {
          r[pn] = x[2]
          return r
        }
      }
    }
    return l
  }

  function find_matching_final(l, p) {
    var c = l.compose
    .map(function (x) { return finalRx.exec(x) })
    .filter(function (x) { return x !== null })
    while (c.length > 0) {
      var pl = find_paradigm(l)
        , pp = find_paradigm(p)
        , sp = p[pp]
        , x = c.shift()
      if (x[1] in grammar.phonemes) {
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
      if (typeof y === 'object') {
        if (i+1 === s && '_' in y) {
          return y._
        } else if (i < s) return rec_parse_irregular(l, w, i+1, y)
      } else if (typeof y === 'string') {
        if (i+1 === s) return y
        else {
          var p = find_paradigm(l)
          return rec_parse_regular(l, p, w, i+1, {}, y)
        }
      }
      else throw new Error('Type of '+y+' not string or object in '+l)
    } else if ('_' in y) {
      y = y._
      var q = find_paradigm(l)
      return rec_parse_regular(l, q, w, i, {} , y)
    }
    return undefined // no irregular form found, return undefined to switch to regular
  }

  function parse_regular(l, w) {
    var p = find_paradigm(l)
      , s = l[p]
    if (w.length === 0) return s
    if (! (p in grammar.paradigms)) {
      throw new Error('No rule found for paradigm: '+p)
    }
    var r = grammar.paradigms[p]._
    return rec_parse_regular(l, p, w, 0, r, s)
  }

  function rec_parse_regular(l, p, w, i, r, s) {
    var g = w[i]
      , v = s
      , found = false
    if (!(g in r)) {
      if ('_' in r) {
        w.splice(i-1,1,'_')
        return rec_parse_regular(l, p, w, i-1, r, s)
      }
      if (!(g in grammar.paradigms[p]._)) {
        throw new Error('Cannot find '+g+' for paradigm '+p+' in '+JSON.stringify(grammar.paradigms[p]._))
      }
      r = grammar.paradigms[p]._
    }
    var t = r[g]
    switch(typeof t) {
    case 'function':
      v = t(s)
      r = {}
      found = true
      break
    case 'string':
      v = rule.parse_string_rule(t,s)
      r = {}
      found = true
      break
    case 'object':
      if (t instanceof Array) {
        v = parse_array_rule(t, s)
        r = {}
        found = true
      } else {
        r = t
      }
    }
    if (i+1 === w.length) {
      if (!found && '_' in r && t !== r._) {
        w.push('_')
        return rec_parse_regular(l, p, w, i+1, r, v)
      }
      return v
    }
    return rec_parse_regular(l, p, w, i+1, r, v)
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
    } else if (typeof grammar.derivations === 'object' && grammar.derivations !== null && m in grammar.derivations) {
      grammar.derivations[m].isDerivation = true
      return grammar.derivations[m]
    } else {
      throw new Error('No lexicon entry for "'+m+'"')
    }
  }

  function find_paradigm(l) {
    var p = Object.keys(l).filter(function(k) { return ['irregular','invariant','compound','compose','meaning'].indexOf(k) === -1}).reduce(function(p, c) { return p || c }, undefined)
    if (typeof p === 'undefined') {
      throw new Error('No paradigm found in: '+p)
    }
    return p
  }

  return parse
}
