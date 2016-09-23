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

  function GrammarParadigms(paradigms) {
    if (paradigms === null) throw new Error('paradigms should not be null')
    if (typeof paradigms !== 'object' || paradigms instanceof Array) throw new Error('paradigms should be an object, not: '+JSON.stringify(paradigms,null,2))
    if (Object.keys(paradigms).length === 0) throw new Error('paradigms should not be an empty object: '+JSON.stringify(paradigms,null,2))
    
    this._ = Object.keys(paradigms).reduce(function (r, k) {
      r[k] = new Paradigm(k, paradigms[k])
      return r
    }, {})
  }
  
  GrammarParadigms.prototype.find = function(k) {
    if (k in this._) {
      return this._[k]
    }
    throw new Error('Unknown paradigm '+k)
  }
  
  function Paradigm(name, def) {
    this.name = name
    this._common = def._common
    delete def._common
    this.patterns = Object.keys(def).map(function (k) { return new Pattern(k, def[k]) })
  }
  Paradigm.prototype.apply = function(n) {
    var p = this.patterns.filter(function(p) { return p.match(n) })
    return new Lemma(n, p)
  }
  
  function Pattern(pattern, def) {
    this.pattern = pattern
    this.def = def
  }
  Pattern.prototype.match = function() {}
  
  function Lemma(forms, pattern) {
    this.form = forms.split(',').map(function(x) { return x.trim() })
    this.pattern = pattern
  }
  Lemma.prototype.resolve = function() {
    
  }
  
  return GrammarParadigms
})()