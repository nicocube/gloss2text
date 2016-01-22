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
  return function(gloss) {
    var words = gloss.split(/\s+/)
      , res = words.map(word_parser).join(' ')
    return res
  }
  function word_parser(x) {
    var s = x.split('.') // sequence
      , h = s.shift() // head
      , e = grammar.lemmas[h] // entry

    if (typeof e !== 'undefined') {
      if (e.t === 'irregular') {
        return s.reduce(function(p,c) {
          if (c in p)
            return p[c]
          else return ''
        },e.f)
      } else {
        var r = grammar.rules[e.c] // rules
        if (typeof r !== 'undefined') {
          if (s.length === 0) return h
          return s.reduce(function(p,c) {
            if (typeof p !== 'object') {
              return p
            } else {
              var t = p[c] // tmp
              if (typeof t === 'function')
                return t(h)
              if (typeof t === 'object')
                return t
              return ''
            }
          },r)
        }
        return h
      }
    }
  }
}
