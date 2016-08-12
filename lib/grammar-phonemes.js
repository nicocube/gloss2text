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
  
  function Ens(n, k, v) {this.n = n; this.k = k; this.v = v || [] }
  Ens.prototype.add = function(x) { this.v.push(x) }
  Ens.prototype.map = function(f) { console.log(f.toString()); return this.v.map(f) }
  Ens.prototype.toString = function() { return this.n+'(\''+this.k+'\',['+this.v.map(function(x){ return x.toString() }).join(',')+'])' }
  Ens.prototype.buildRegex = function() { return '' }
  Ens.prototype.subBuildRegex = function(x) {
    if (typeof x === 'string') return x
    if (x instanceof Ens) return x.buildRegex()
  }
  /**
   * Alternative
   */
  function Alt(k, v) {
    if (!(this instanceof Alt)) return new Alt(k, v)
    Ens.call(this, 'Alt', k, v)
  }
  Alt.prototype = Object.create(Ens.prototype)
  Alt.prototype.buildRegex = function() {
    return this.v.map(this.subBuildRegex).join('|')
  }
  GrammarPhonemes.Alt = Alt
  
  /**
   * Sequence
   */
  function Seq(k, v) {
    if (!(this instanceof Seq)) return new Seq(k, v)
    Ens.call(this, 'Seq', k, v)
  }
  Seq.prototype = Object.create(Ens.prototype)
  Seq.prototype.buildRegex = function() {
    return this.v.map(this.subBuildRegex).join()
  }

  GrammarPhonemes.Seq = Seq

  /**
   * parse string param into a list of terminal and non-terminal objects, 
   */
  GrammarPhonemes.prototype.parse = function(p) {
    return this.buildSeq(p)
  }
  
  var seqPattern = '([a-z]+)|([A-Z]+)|<([A-Za-z]+)>'
  
  GrammarPhonemes.prototype.buildSeq = function(p) {
    var r = new Seq(p)
      , rx = new RegExp(seqPattern, 'g')
      , m = null
    while ((m = rx.exec(p)) !== null) {
      if (m[1]) {
        r.add(m[1])
      } else if (m[2]) {
        m[2].split('').forEach(function(c) {
          r.add(this.buildAlt(c))
        }.bind(this))
      } else if (m[3]) {
        r.add(this.buildAlt(m[3]))
      }
    }
    return r
  }
  
  var altPattern = '^(?:([a-z]+)|([A-Z])|<([A-Za-z]+)>|([a-zA-Z<>]+))$'
  
  GrammarPhonemes.prototype.buildAlt = function(k) {
    if (! (k in this._)) throw new Error('Search for key "'+k+'" not present in this phonemes inventory')
    var r = new Alt(k)

    this._[k].forEach(function(p) {
      var rx = new RegExp(altPattern)
        , m = rx.exec(p)
      if (m !== null) {
        if (m[1]) {
          r.add(m[1])
        } else if (m[2] || m[3]) {
          this.buildAlt(m[2] || m[3]).v.forEach(function(v) { r.add(v) })
        } else if (m[4]) {
          r.add(this.buildSeq(m[4]))
        }
      }
    }.bind(this))
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
          if (m[2].length === 1) {
            return this.subPattern(m[2])
          } else {
            return SeqNonTerminal(m[2], m[2].split('').map(function(c){ return this.subPattern(c) }.bind(this)))
          }
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