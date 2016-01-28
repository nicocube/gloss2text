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
        return s.reduce(function(p,c) {
          if (c in p)
            return p[c]
          else return ''
        },e.f)
      } else {
        var r = grammar.rules[e.c] // rule
        if (typeof r !== 'undefined') {
          if (s.length === 0) return h
          return s.reduce(function(p,c) {
            if (typeof p !== 'object') {
              return p
            } else {
              var t = p[c] // tmp
              if (typeof t === 'function')
                return t(v)
              if (typeof t === 'string')
                return transform(t,v)
              if (typeof t === 'object')
                return t
              return ''
            }
          },r)
        }
        return v
      }
    }
  }
  function transform(t,h) {
    var patterns = [
      { x: /^-(.*)>-(.*)$/, s: function(h,e) { return h.replace(e[1], e[2])} },
      { x: /^>-(.*)$/, s: function(h,e) { return h.replace(/$/, e[1])} }
    ]
    var i = 0, l = patterns.length
    for(;i<l;i+=1) {
      var p = patterns[i]
        , x = try_pattern(p, t, h)
      if (x !== null) return x
    }
    return h
  }
  function try_pattern(p, t, h) {
    var e = p.x.exec(t)
    if (e!==null) {
      return p.s(h,e)
    }
    return null
  }
}
