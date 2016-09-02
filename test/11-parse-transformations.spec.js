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
  , GrammarTransformations = require(__dirname+'/../lib/grammar-transformations')

test('Creation: should fail with improper params: ', function(t) {
  t.throws(function() { new GrammarTransformations() }, 'transformations should be an object, not: undefined')
  t.throws(function() { new GrammarTransformations([]) }, 'transformations should be an object, not: []')
  t.throws(function() { new GrammarTransformations(null) }, 'transformations should not be null')
  t.throws(function() { new GrammarTransformations({}) }, 'transformations should not be an empty object: {}')
  t.throws(function() { new GrammarTransformations({f : {a: 'i'}}) }, 'phonemes should be an object, not: undefined')
  t.throws(function() { new GrammarTransformations({f : {a: 'i'}}, []) }, 'phonemes should be an object, not: []')
  t.throws(function() { new GrammarTransformations({f : {a: 'i'}}, null) }, 'phonemes should not be null')
  t.throws(function() { new GrammarTransformations({f : {a: 'i'}}, {}) }, 'phonemes should not be an empty object: {}')
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
  , g = new GrammarTransformations(t, p)

test('parse basic rules', function(t) {
  t.deepEqual(g.parseRule('_').apply('a'),'a')
  t.deepEqual(g.parseRule('-n').apply('a'),'an')
  t.deepEqual(g.parseRule('-n>-d').apply('a'),'a')
  t.deepEqual(g.parseRule('-n>-d').apply('an'),'ad')
  t.end()
})

test('parse match pattern replace with const', function(t) {
  t.deepEqual(g.parseRule('-K>-n').apply('a'),'a')
  t.deepEqual(g.parseRule('-K>-n').apply('ad'),'an')
  t.deepEqual(g.parseRule('-K>-n').apply('as'),'an')
  t.end()
})

test('parse match pattern replace with capture simple', function(t) {
  t.deepEqual(g.parseRule('-K>-KK').apply('a'),'a')
  t.deepEqual(g.parseRule('-K>-KK').apply('an'),'ann')
  t.deepEqual(g.parseRule('-NK>-KNK').apply('an'),'nan')
  t.end()
})

test('parse match pattern replace with capture complex', function(t) {
  t.deepEqual(g.parseRule('-CC>-CiCCe').apply('adr'),'adirre')
  t.deepEqual(g.parseRule('-CC>-CCaCu').apply('adr'),'adraru')
  t.deepEqual(g.parseRule('-CC>-<C0><C0>a<C1>u').apply('adr'),'addaru')
  t.deepEqual(g.parseRule('-CC>-<C1><C0>').apply('adr'),'ard')
  //t.deepEqual(g.parseRule('-<Cu>>-<Cu>n').apply('ap'),'apn')
  t.end()
})

test('parse simple transformation rules', function(t) {
  t.deepEqual(g.parseRule('-N>-r(N)').apply('a'),'e')
  t.deepEqual(g.parseRule('-N>-r(N)').apply('i'),'i')
  t.deepEqual(g.parseRule('-N>-l(N)').apply('i'),'ae')
  t.deepEqual(g.parseRule('-N>-l(N)').apply('ie'),'aie')
  t.deepEqual(g.parseRule('-N>-l(N)').apply('ae'),'eia')
  t.end()
})

test('parse simple transformation rules + capture', function(t) {
  t.deepEqual(g.parseRule('-Nn>-r(N)').apply('an'),'e')
  t.deepEqual(g.parseRule('-NK>-l(N)').apply('in'),'ae')
  t.deepEqual(g.parseRule('-NK>-l(N)K').apply('ien'),'aien')
  t.deepEqual(g.parseRule('-NK>-l(N)-K').apply('ien'),'aien')
  t.deepEqual(g.parseRule('-NK>-Kl(N)').apply('aen'),'neia')
  t.end()
})

test('parse double transformation rules + capture', function(t) {
  t.deepEqual(g.parseRule('-NK>-r(N)h(K)').apply('i'),'i')
  t.deepEqual(g.parseRule('-NK>-r(N)h(K)').apply('is'),'i')
  t.deepEqual(g.parseRule('-NK>-r(N)-h(K)').apply('is'),'i')
  t.deepEqual(g.parseRule('-NK>-r(N)h(K)').apply('in'),'ind')
  t.deepEqual(g.parseRule('-NK>-h(K)r(N)').apply('ic'),'hi')
  t.end()
})

test('parse complex transformation rules', function(t) {
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('a'),'a')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('an'),'ans')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('ad'),'ads')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('ash'),'ash')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('at'),'ath')
  t.deepEqual(g.parseRule('-K>-x(Ks)').apply('as'),'as')
  t.end()
})