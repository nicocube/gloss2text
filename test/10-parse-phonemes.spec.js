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

'use strict'
var test = require('tape')
  , GrammarPhonemes = require(__dirname+'/../lib/grammar-phonemes')
  , Alt = GrammarPhonemes.Alt
  , Seq = GrammarPhonemes.Seq

test('Phonemes: should fail with improper params', function(t) {
  t.throws(function() { new GrammarPhonemes(null) }, /^Error: phonemes should not be null$/)
  t.throws(function() { new GrammarPhonemes() }, /^Error: phonemes should be an object, not: undefined$/)
  t.throws(function() { new GrammarPhonemes(undefined) }, /^Error: phonemes should be an object, not: undefined$/)
  t.throws(function() { new GrammarPhonemes(42) }, /^Error: phonemes should be an object, not: 42$/)
  t.throws(function() { new GrammarPhonemes('plop') }, /^Error: phonemes should be an object, not: "plop"$/)
  t.throws(function() { new GrammarPhonemes([]) }, /^Error: phonemes should be an object, not: \[\]$/)
  t.throws(function() { new GrammarPhonemes({}) }, /^Error: phonemes should not be an empty object: \{\}$/)
  t.end()
})

test('Phonemes: parse pattern into usable parts according to phonology definition', function(t) {
  var p = {
      V: 'a e o i u',
      Cu: 'p t c f th s sh',
      Cv: 'b d g v dh z j',
      Cr: 'm n l r h',
      C: '<Cv> <Cu> <Cr>',
      O: 'C',
      K: 'C',
      N: 'V VV',
      S: 'N ON ONK NK'
    }
    , g = new GrammarPhonemes(p)

  t.deepEqual(g.parse('v'),Seq('v',['v']))
  t.deepEqual(g.parse('V'),Seq('V',[Alt('V',['a','e','o','i','u'])]))
  t.deepEqual(g.parse('C'),Seq('C',[Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h'])]))
  t.deepEqual(g.parse('Cr'),Seq('Cr',[Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),'r']))
  t.deepEqual(g.parse('<Cr>'),Seq('<Cr>',[Alt('Cr',['m','n','l','r','h'])]))
  t.deepEqual(g.parse('vV'),Seq('vV',['v',Alt('V',['a','e','o','i','u'])]))
  t.deepEqual(g.parse('vVcCvca<Cu>e'),Seq('vVcCvca<Cu>e',['v',Alt('V',['a','e','o','i','u']),'c',Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),'vca',Alt('Cu',['p','t','c','f','th','s','sh']),'e']))
  t.deepEqual(g.parse('plop<Cu>plouf'),Seq('plop<Cu>plouf',['plop',Alt('Cu',['p','t','c','f','th','s','sh']),'plouf']))
  t.deepEqual(g.parse('N'),Seq('N',[Alt('N', [Seq('VV',[Alt('V',['a','e','o','i','u']),Alt('V',['a','e','o','i','u'])]),'a','e','o','i','u'])]))
  t.end()
})

test('Phonemes: build regex from parsed pattern', function(t) {
  t.deepEqual(Seq('v',['v']).buildRegex(),'v')
  t.deepEqual(Seq('V',[Alt('V',['a','e','o','i','u'])]).buildRegex(),'(a|e|o|i|u)')
  t.deepEqual(Seq('V',[Alt('V',['a','e','o','i','u'])]).buildRegex(true),'(?:a|e|o|i|u)')
  t.deepEqual(Seq('Cr',[Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),'r']).buildRegex(),'(b|d|g|v|dh|z|j|p|t|c|f|th|s|sh|m|n|l|r|h)r')
  t.deepEqual(Seq('vVcCvca<Cu>e',['v',Alt('V',['a','e','o','i','u']),'c',Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),'vca',Alt('Cu',['p','t','c','f','th','s','sh']),'e']).buildRegex(),'v(a|e|o|i|u)c(b|d|g|v|dh|z|j|p|t|c|f|th|s|sh|m|n|l|r|h)vca(p|t|c|f|th|s|sh)e')
  t.deepEqual(Seq('N',[Alt('N', [Seq('VV',[Alt('V',['a','e','o','i','u']),Alt('V',['a','e','o','i','u'])]),'a','e','o','i','u'])]).buildRegex(),'((?:a|e|o|i|u)(?:a|e|o|i|u)|a|e|o|i|u)')
  t.end()
})
