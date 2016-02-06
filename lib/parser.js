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

  return function(gloss) {
    var words = gloss.split(/\s+/)
      , res = words.map(word_parser).join(' ')
    return res
  }

  function word_parser(word) { // word
    var morphemes = word.split('-')
    return morphemes.map(morpheme_parser).join(grammar.split_morpheme?'-':'')
  }

  function morpheme_parser(m) {
    var s = m.split('.') // sequence
      , h = s.shift() // head
      , e = grammar.lexicon[h] // entry
      , v = (((typeof e === 'object') && ('v' in e)) ? e.v : h)

    if (typeof e !== 'undefined') {
      if (e.t === 'irregular') {
        return s.reduce(function(p,c) { return (c in p) ? p[c] : ('v' in p) ? p.v : '' },e.f)
      } else {
        var r = grammar.rules[e.c] // rule
        if (typeof r !== 'undefined') {
          if (s.length === 0) return v
          return s.reduce(function(p,c) {
            if (typeof p !== 'object') {
              return p
            } else {
              var t = p[c] // tmp
              return rec_rule(t,v)
            }
          },r)
        }
        return v
      }
    }
  }

  function rec_rule(t,v) {
    if (typeof t === 'function') return t(v)
    if (typeof t === 'string') return transform(t,v)
    if (typeof t === 'object') {
      if (t instanceof Array) {
        return (t.reduce(function(p, c) {
          if (!p.f) {
            var w = rec_rule(c,p.v)
            if (p.v !== w) return {v:w, f:true}
          }
          return p
        },{v:v, f:false})).v
      }
      else return t
    }
    return v
  }

  function transform(t,h) {
    var patterns = [
      { x: /^-([A-Z]*)>-([A-Za-z\(\)]*)$/, s: final_transform },
      { x: /^-([a-z]*)>-([a-z]*)$/, s: final_substitution },
      { x: /^>-([a-z]*)$/, s: function(h,e) { return h.replace(/$/, e[1])} }
    ]
    var i = 0, l = patterns.length
    for(;i<l;i+=1) {
      var p = patterns[i]
        , x = try_pattern(p, t, h)
      if (x !== undefined) return x
    }
    return h
  }

  function try_pattern(p, t, h) {
    var e = p.x.exec(t)
    if (e!==null) {
      return p.s(h,e)
    }
    return undefined
  }

  function final_substitution(h,e) {
    return h.replace(new RegExp(e[1]+'$'), e[2])
  }

  function final_transform(h,e) {
    var p = parse_pattern(e[1], true)
      , rx = new RegExp(p+'$')
      , x = rx.exec(h)
    if (x !== null) return parse_substitution(e[1], x, e[2])
    return undefined
  }

  function parse_pattern(p, isRoot) {
    var ph = grammar.phonemes
    p = p.trim()
    isRoot = typeof isRoot === 'boolean' && isRoot

    if (!/ /.test(p) && p === p.toLowerCase()) {
      return p
    } else if (p.length == 1) {
      if (p in ph) {
        return (isRoot?'(':'')+parse_pattern(ph[p])+(isRoot?')':'')
      } else {
        return p
      }
    } else if (/ /.test(p)) {
      var s = p.split(' ')
      return s.map(parse_pattern).join('|')
    } else {
      var t = p.split('')
        , _ =(isRoot?'(':'(?:')
      return _+t.map(parse_pattern).join(')'+_)+')'
    }
    return ''
  }

  function parse_substitution(p, x, s) {
    var k = splitred2map(p)
      , a = null
      , rx = /(([a-z])\(([A-Z])\))|([A-Z])/g
      , res = x.input.substring(0,x.index)

    while ((a = rx.exec(s)) !== null) {
      if (a[1] !== undefined) {
        var v = x[k[a[3]]]
          , t = grammar.transformations[a[2]]
        res += t[v]
      }
      if (a[4] !== undefined) {
        var i = k[a[4]]
        res += x[i]
      }
    }

    return res
  }
  function splitred2map(p) {
    return p.split('').reduce(function(p, c, i) { p[c]=i+1; return p },{})
  }

}
