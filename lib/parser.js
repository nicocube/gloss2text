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

  var rec_rule = require(__dirname+'/rule')(grammar)
    , lexer = require(__dirname+'/lexer')()
/*
 * stream = require('stream')
    ,
    , tokenizer = require(__dirname+'/tokenizer')()
*/

  return function parse_gloss(gloss) {
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
      return parse_morpheme(m.gloss, w)
    } else if ('inter' in m) {
      return m.inter + parse_word(w)
    } else {
      w.unshift(m)
      throw new Error('Word must start with gloss: '+JSON.stringify(w))
    }
  }

  function parse_morpheme(m, w) {
    var y = w.shift()
    if ('inter' in y) {
      var s = m+y.inter
      switch (y.inter) {
      case '.': {
        s = concat_derivation(s, w, grammar.rules)
        return s
      }
      case '-': {
        s = concat_lexicon(s,w)
        return s
      }
      default:
        throw new Error('Unknown inter symbol: '+y.inter)
      }
    }
  }
  function concat_derivation(s, w, r) {
    var m = w.shift()
    if ('gloss' in m) {
      if (m.gloss in r) {
        return ''
      }
    } else {
      w.unshift(m)
      throw new Error('Word must start with gloss: '+JSON.stringify(w))
    }
  }
  function concat_lexicon(s, w) {
    var m = w.shift()
    if ('gloss' in m) {
      if (m.gloss in grammar.lexicon) {
        return s + grammar.lexicon[m.gloss]
      } else {
        concat_derivation(s, w, grammar.rules)
      }
    } else {
      w.unshift(m)
      throw new Error('Word must start with gloss: '+JSON.stringify(w))
    }
  }
  /**
   * m: morpheme
   */
  function morpheme_parser(m) {
    if (m.length === 0) throw new Error('Cannot parse empty string')

    var s = m.split('.') // sequence
      , h = s.shift() // head
      , e = grammar.lexicon[h] // entry

    if (typeof e !== 'undefined') {
      if ('invariant' in e) return e.invariant
      if ('irregular' in e) {
        var irr = s.reduce(function(p,c) {
          if (typeof p !== 'undefined') {
            if (c in p) return p[c]
            if ('v' in p) return  p.v
          }
          return undefined
        },e.irregular)
        if (irr !== undefined) return irr
      }
      return Object.keys(e)
      .reduce(function(p,c){
        var r = grammar.rules[c] // rule
        if (typeof r !== 'undefined') {
          var v = e[c]
          if (s.length === 0) return v
          return s.reduce(function(q,d) {
            if ('t' in q && (d in q.t)) {
              var t = rec_rule(q.t[d],q.v)
              if (typeof t === 'object') q.t = t
              else {
                delete q.t
                q.v = t
              }
              return q
            } else if (!(d in q.r)) {
              throw new Error('rule for '+c+' does not contain '+d)
            }
            var z = rec_rule(q.r[d],q.v)
            if (typeof z === 'object') q.t = z
            else q.v = z
            return q
          },{r: r, v: v}).v
        }
        return p
      },h)
    } else {
      throw new Error('No lexicon entry for "'+h+'"')
    }
  }
}
