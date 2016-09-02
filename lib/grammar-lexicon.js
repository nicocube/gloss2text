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

module.exports = (function () {
  'use strict'
  function GrammarLexicon(lexicon) {
    if (lexicon === null) throw new Error('lexicon should not be null')
    if (typeof lexicon !== 'object' || lexicon instanceof Array) throw new Error('lexicon should be an object, not: '+JSON.stringify(lexicon,null,2))
    if (Object.keys(lexicon).length === 0) throw new Error('lexicon should not be an empty object: '+JSON.stringify(lexicon,null,2))
    this._ = lexicon
    this.cache = {}
  }

  function find_paradigm(l) {
    var p = Object.keys(l).filter(function(k) { return ['irregular','invariant','compound','compose','meaning'].indexOf(k) === -1}).reduce(function(p, c) { return p || c }, undefined)
    if (typeof p === 'undefined') {
      throw new Error('No paradigm found in: '+p)
    }
    return p
  }

  function Entry(k, d) {
    if (!(this instanceof Entry)) return new Entry(k, d)
    this.k = k
    var p = find_paradigm(d)
    this.paradigm = p
    this.parts = d[p].split(',').map(function(s) { return s.trim() })

    ;['irregular', 'compose'].forEach(function(m) {
      if (d[m]) this[m] = d[m]
    }.bind(this))
  }
  GrammarLexicon.Entry = Entry

  GrammarLexicon.prototype.find = function(k) {
    if (k in this.cache) return this.cache[k]
    if (k in this._) return this.cache[k] = new Entry(k, this._[k])
  }

  return GrammarLexicon
})()