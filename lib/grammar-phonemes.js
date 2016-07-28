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

module.exports = (function (phonemes) {
  'use strict'
  
  var pattern = '([a-z]+)|([A-Z])|<([A-Za-z]+)>'
  
  function GrammarPhonemes(phonemes) {
    if (phonemes === null) throw new Error('phonemes should not be null')
    if (typeof phonemes !== 'object' || phonemes instanceof Array) throw new Error('phonemes should be an object, not: '+JSON.stringify(phonemes,null,2))
    if (Object.keys(phonemes).length === 0) throw new Error('phonemes should not be an empty object: '+JSON.stringify(phonemes,null,2))
    
    this._ = {}
    Object.keys(phonemes).forEach(function(k){
      var v = phonemes[k]
      this._[k] = v.trim().split(/ /)
    }.bind(this))
  }
  function buildIndexChecker(a) { return function(i) { return typeof a[i] !== 'undefined' } }
  
  function Terminal(v) {
    if (!(this instanceof Terminal)) return new Terminal(v)
    this.v = v 
  }
  GrammarPhonemes.Terminal = Terminal
  
  function NonTerminal(k,v) {
    if (!(this instanceof NonTerminal)) return new NonTerminal(k,v)
    this.k = k
    this.v = v 
  }
  GrammarPhonemes.NonTerminal = NonTerminal
  
  /**
   * parse string param into a list of terminal and non-terminal objects, 
   */
  GrammarPhonemes.prototype.parse = function(p) {
    var rx = new RegExp(pattern, 'g')
      , m = null
      , r = []
    while ((m = rx.exec(p)) !== null) {
      var c = buildIndexChecker(m)
      if (c(1)) {
        r.push(Terminal(m[1]))
      } else {
        var k = null
        if (c(2)) {
          k = m[2]
        }
        if (c(3)) {
          k = m[3]
        }
        if (k === null) {
          throw new Error('no match found: '+m)  
        }
        r.push(NonTerminal(k, this.subPattern(k)))
      }
    }
    return r
  }

  GrammarPhonemes.prototype.subPattern = function(k) {
    if (! (k in this._)) throw new Error('Search for key "'+k+'" not present in this phonemes inventory')
    return this._[k].map(function(p) {
      var rx = new RegExp(pattern)
        , m = rx.exec(p)
      if (m !== null) {
        var c = buildIndexChecker(m)
        if (c(1)) {
          return m[1]
        }
        if (c(2)) {
          return this.subPattern(m[2])
        }
        if (c(3)) {
          return this.subPattern(m[3])
        }
      }
      throw new Error('Unsuported sequence: '+k)
    }.bind(this))
    .reduce(function(p,c) {
      if (c instanceof Array) Array.prototype.push.apply(p,c)
      else p.push(c)
      return p
    }, [])
  }
  
  
  return GrammarPhonemes
})()