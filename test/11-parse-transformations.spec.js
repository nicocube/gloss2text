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
  , GrammarPhonemes  = require(__dirname+'/../lib/grammar-phonemes')
  , GrammarTransformations = require(__dirname+'/../lib/grammar-transformations')

test('Transformations: should fail with improper params: ', function(t) {
  t.throws(function() { new GrammarTransformations() }, /^Error: transformations should be an object, not: undefined$/)
  t.throws(function() { new GrammarTransformations([]) }, /^Error: transformations should be an object, not: \[\]$/)
  t.throws(function() { new GrammarTransformations(null) }, /^Error: transformations should not be null$/)
  t.throws(function() { new GrammarTransformations({}) }, /^Error: transformations should not be an empty object: \{\}$/)

  t.throws(function() { new GrammarTransformations({f : {a: 'i'}}) }, /^Error: phonemes must be an instance of GrammarPhonemes$/)
  t.throws(function() { new GrammarTransformations({f : {a: 'i'}}, []) }, /^Error: phonemes must be an instance of GrammarPhonemes$/)
  t.throws(function() { new GrammarTransformations({f : {a: 'i'}}, null) }, /^Error: phonemes must be an instance of GrammarPhonemes$/)
  t.throws(function() { new GrammarTransformations({f : {a: 'i'}}, {}) }, /^Error: phonemes must be an instance of GrammarPhonemes$/)
  t.end()
})

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
  , t = {
    r: { a: 'e', o: 'e', _: '_'},
    l: { a: 'ei', e: 'ie', i: 'ae', o: 'ue', u: 'iu', ae: 'eia', ie: 'aie', ei: 'iae'},
    h: { n: 'nd', c: 'h', _: ''},
    x: {
      ns: '_',
      ds: 'ds',
      shs: 'sh',
      ts: 'th',
      ss : 's',
      _: ''
    }
  }
  , g = new GrammarTransformations(t, new GrammarPhonemes(p))

test('Transformations: parse basic rules', function(t) {
  t.deepEqual(g.parseRule('_').apply('a').toText(), 'a')
  t.deepEqual(g.parseRule('-n').apply('a').toText(), 'an')
  t.deepEqual(g.parseRule('-n>-d').apply('a').toText(), 'a')
  t.deepEqual(g.parseRule('-n>-d').apply('an').toText(),'ad')
  t.end()
})

test('Transformations: parse match pattern replace with const', function(t) {
  t.deepEqual(g.parseRule('-K>-n').apply('a').toText(),'a')
  t.deepEqual(g.parseRule('-K>-n').apply('ad').toText(),'an')
  t.deepEqual(g.parseRule('-K>-n').apply('as').toText(),'an')
  t.end()
})

test('Transformations: parse match pattern replace with capture simple', function(t) {
  t.deepEqual(g.parseRule('-K>-KK').apply('a').toText(),'a')
  t.deepEqual(g.parseRule('-K>-KK').apply('an').toText(),'ann')
  t.deepEqual(g.parseRule('-NK>-KNK').apply('an').toText(),'nan')
  t.end()
})

test('Transformations: parse match pattern replace with capture complex', function(t) {
  t.deepEqual(g.parseRule('-CC>-CiCCe').apply('adr').toText(),'adirre')
  t.deepEqual(g.parseRule('-CC>-CCaCu').apply('adr').toText(),'adraru')
  t.deepEqual(g.parseRule('-CC>-<C0><C0>a<C1>u').apply('adr').toText(),'addaru')
  t.deepEqual(g.parseRule('-CC>-<C1><C0>').apply('adr').toText(),'ard')
  //t.deepEqual(g.parseRule('-<Cu>>-<Cu>n').apply('ap'),'apn')
  t.end()
})

test('Transformations: parse simple transformation rules', function(t) {
  t.deepEqual(g.parseRule('-N>-r(N)').apply('a').toText(),'e')
  t.deepEqual(g.parseRule('-N>-r(N)').apply('i').toText(),'i')
  t.deepEqual(g.parseRule('-N>-l(N)').apply('i').toText(),'ae')
  t.deepEqual(g.parseRule('-N>-l(N)').apply('ie').toText(),'aie')
  t.deepEqual(g.parseRule('-N>-l(N)').apply('ae').toText(),'eia')
  t.end()
})

test('Transformations: parse simple transformation rules + capture', function(t) {
  t.deepEqual(g.parseRule('-Nn>-r(N)').apply('an').toText(),'e')
  t.deepEqual(g.parseRule('-NK>-l(N)').apply('in').toText(),'ae')
  t.deepEqual(g.parseRule('-NK>-l(N)K').apply('ien').toText(),'aien')
  t.deepEqual(g.parseRule('-NK>-l(N)-K').apply('ien').toText(),'aien')
  t.deepEqual(g.parseRule('-NK>-Kl(N)').apply('aen').toText(),'neia')
  t.end()
})

test('Transformations: parse double transformation rules + capture', function(t) {
  t.deepEqual(g.parseRule('-NK>-r(N)h(K)').apply('i').toText(),'i')
  t.deepEqual(g.parseRule('-NK>-r(N)h(K)').apply('is').toText(),'i')
  t.deepEqual(g.parseRule('-NK>-r(N)-h(K)').apply('is').toText(),'i')
  t.deepEqual(g.parseRule('-NK>-r(N)h(K)').apply('in').toText(),'ind')
  t.deepEqual(g.parseRule('-NK>-h(K)r(N)').apply('ic').toText(),'hi')
  t.end()
})

test('Transformations: parse complex transformation rules', function(t) {
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('a').toText(),'a')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('an').toText(),'ans')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('ad').toText(),'ads')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('ash').toText(),'ash')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('at').toText(),'ath')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('as').toText(),'as')
  t.end()
})