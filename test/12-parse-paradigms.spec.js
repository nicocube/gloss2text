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
  , GrammarParadigms = require(__dirname+'/../lib/grammar-paradigms')
//  , Paradigm = 

test('Paradigms: should fail with improper params', function(t) {
  t.throws(function() { new GrammarParadigms(null) }, /^Error: paradigms should not be null$/)
  t.throws(function() { new GrammarParadigms() }, /^Error: paradigms should be an object, not: undefined$/)
  t.throws(function() { new GrammarParadigms(undefined) }, /^Error: paradigms should be an object, not: undefined$/)
  t.throws(function() { new GrammarParadigms(42) }, /^Error: paradigms should be an object, not: 42$/)
  t.throws(function() { new GrammarParadigms('plop') }, /^Error: paradigms should be an object, not: "plop"$/)
  t.throws(function() { new GrammarParadigms([]) }, /^Error: paradigms should be an object, not: \[\]$/)
  t.throws(function() { new GrammarParadigms({}) }, /^Error: paradigms should not be an empty object: \{\}$/)
  t.end()
})

var p = {
    nominal: {
      _common: {
        PP: {
          LOC: '-ei',
          ORG:	'-ui',
          _infix: {
            INT: '-an',
            EXT: '-edh'
          }
        }
      },
      '-K': {
        _: 'ABS.SG',
        PL: '-NK>-l(N)K',
        NOM: {
          _: ' -n>-nd, -r>-rn,-l>-ln,  -en  ',
          PL: [ '-Nn>-l(N)nd', '-Nr>-l(N)rn', '-Nl>-l(N)ln', '-NK>-l(N)K-on' ]
        }
      },
      '-N': {
        _compose: '-N+C, -Nm+V',
        _: 'ABS.SG',
        PL: '-N>-l(N)',
        NOM: {
          _: '-n',
          PL: '-N>-l(N)n'
        }
      },
      '-N, -NF': {
        _extends: 'nominal(-N)',
        _compose: '-N+C, -NF+V'
      }
    }
  }
  , gp = new GrammarParadigms(p)

test('Paradigms: Parse paradigms', function(t) {
  var paradigm = gp.find('nominal')
  /*
  t.deepEqual(paradigm, {})
  //*/
  
  t.end()
})

test('Paradigms: Parse paradigms', function(t) {
  var lemma = gp.find('nominal').apply('mna')
  /*
  t.deepEqual(lemma.resolve([]), 'mna')
  t.deepEqual(lemma.resolve(['ABS']), 'mna')
  t.deepEqual(lemma.resolve(['ABS.SG']), 'mna')
  
  t.deepEqual(lemma.resolve(['PL']), 'mnau')
  t.deepEqual(lemma.resolve(['ABS.PL']), 'mnau')
  //*/
  
  t.end()
})