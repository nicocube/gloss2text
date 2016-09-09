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
    
    this._ = {}
    Object.keys(paradigms).forEach(function (k) {
      this._[k] = new Paradigm(k, paradigms[k])
    }.bind(this))
  }
  
  GrammarParadigms.prototype.find = function(k) {
    if (k in this._) {
      return this._[k]
    }
    throw new Error('Unknown paradigm '+k)
  }
  
  function Paradigm(name, def) {
    this.name = name
    this.def = def
  }
  Paradigm.prototype.apply = function(n) {
    return new Lemma(n, this)
  }
  
  function Lemma(forms, paradigm) {
    this.form = forms.split(',').map(function(x) { return x.trim() })
    this.paradigm = paradigm
  }
  Lemma.prototype.resolve = function() {
    
  }
  
  return GrammarParadigms
})()