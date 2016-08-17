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

module.exports = function () {
  'use strict'

  var GrammarTransformations = require(__dirname+'/grammar-transformations')
    , GrammarParadigms = require(__dirname+'/grammar-paradigms')
    , GrammarDerivations = require(__dirname+'/grammar-derivations')
    , GrammarLexicon = require(__dirname+'/grammar-lexicon')

  function Grammar(grammar) {
    this.transformations = new GrammarTransformations(grammar.phonemes, grammar.transformations)
    this.paradigms = new GrammarParadigms(grammar.paradigms)
    this.derivations = new GrammarDerivations(grammar.derivations)
    this.lexicon = new GrammarLexicon(grammar.lexicon)
  }
  Grammar.prototype.search = function(gloss) {
    var r = this.lexicon.search(gloss)
    if (r === undefined) this.derivations.search(gloss)
    return r
  }

  return Grammar
}