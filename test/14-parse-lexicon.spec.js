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
  , GrammarLexicon = require(__dirname+'/../lib/grammar-lexicon')

test('Lexicon: should fail with improper params', function(t) {
  t.throws(function() { new GrammarLexicon(null) }, 'lexicon should not be null')
  t.throws(function() { new GrammarLexicon() }, 'lexicon should be an object, not: undefined')
  t.throws(function() { new GrammarLexicon(undefined) }, 'lexicon should be an object, not: undefined')
  t.throws(function() { new GrammarLexicon(42) }, 'lexicon should be an object, not: 42')
  t.throws(function() { new GrammarLexicon('plop') }, 'lexicon should be an object, not: "plop"')
  t.throws(function() { new GrammarLexicon([]) }, 'lexicon should be an object, not: []')
  t.throws(function() { new GrammarLexicon({}) }, 'lexicon should not be an empty object: {}')
  t.end()
})

var l = {
    STA: {
      verbal: 've, ves',
      irregular: {
        PFV: 'vil'
      }
    },
    ACT: {
      verbal: 'ma'
    },
    THE: {
      verbal: 'shu, shus',
      irregular: {
        'SPL.ATTR': 'shin',
        'SPL.NEG.ATTR': 'shushia'
      }
    },
    ITGa: {
      nominal: 'ne, nedh',
      meaning: 'who'
    },
    ITGi: {
      nominal: 'cul',
      compose: [ 'C-ul' ]
    },
    one: {
      verbal: 'ish'
    },
    two: {
      verbal: 'then'
    },
    ten: {
      verbal: 'farl',
      compose: [ 'farli-C', 'C-arli-C', 'C-arl' ]
    },
    XX: {}
  }
  , gl = new GrammarLexicon(l)
  , Entry = GrammarLexicon.Entry

test('Lexicon: find simple entry', function(t) {
  var actual = gl.find('ACT')
    , expected = Entry('ACT',{ verbal: 'ma' })
  t.deepEqual(actual,expected)
  t.deepEqual(actual.paradigm,'verbal')
  t.deepEqual(actual.parts,['ma'])
  t.end()
})

test('Lexicon: find entry with irregular', function(t) {
  var actual = gl.find('STA')
    , expected = Entry('STA',{ verbal: 've, ves', irregular: { PFV: 'vil' } })
  t.deepEqual(actual,expected)
  t.deepEqual(actual.paradigm,'verbal')
  t.deepEqual(actual.parts,['ve', 'ves'])
  t.deepEqual(actual.irregular,{ PFV: 'vil' })

  var actual_from_cache = gl.find('STA')

  t.equal(actual,actual_from_cache)

  t.end()
})

test('Lexicon: find entry with compose', function(t) {
  var actual = gl.find('ten')
    , expected = Entry('ten',{ verbal: 'farl', compose: [ 'farli-C', 'C-arli-C', 'C-arl' ] })
  t.deepEqual(actual,expected)
  t.deepEqual(actual.paradigm,'verbal')
  t.deepEqual(actual.parts,['farl'])
  t.deepEqual(actual.compose,[ 'farli-C', 'C-arli-C', 'C-arl' ])
  t.end()
})

test('Lexicon: No paradigm found', function(t) {
  t.throws(function() { gl.find('XX') }, 'No paradigm found in: undefined')
  t.end()
})