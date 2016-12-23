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
  , GrammarTransformations = require(__dirname+'/../lib/grammar-transformations')
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
    V: 'a e o i u',
    Cu: 'p t c f th s sh',
    Cv: 'b d g v dh z j',
    Cr: 'm n l r h',
    C: '<Cv> <Cu> <Cr>',
    O: 'C',
    K: 'C CC',
    N: 'V VV',
    S: 'N ON ONK NK'
  }
  , t = {
    r: { a: 'e', o: 'e', _: '_'},
    l: { a: 'au', e: 'eo', i: 'ie', o: 'ou', u: 'uo'},
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
  , pa = {
    nominal: {
      _common: {
        PP: {
          LOC: '-ei',
          ORG:	'-ui',
          DIR:	'-end',
          TRV:	'-eos',
          _infix: {
            INT: '-an',
            EXT: '-edh'
          }
        }
      },
      '-K': {
        _: 'ABS.SG',
        ABS: {
          PL: '-NK>-l(N)K'
        },
        NOM: {
          _: ' -n>-nd, -r>-rn,-l>-ln,  -en ',
          PL: [ '-Nn>-l(N)nd', '-Nr>-l(N)rn', '-Nl>-l(N)ln', '-NK>-l(N)K-on' ]
        }
      },
      '-N': {
        _compose: '+NK>+mNK, +N>+mN',
        _: 'ABS.SG',
        ABS: {
          PL: '-N>-l(N)'
        },
        NOM: {
          _: '-n',
          PL: '-N>-l(N)n'
        }
      },
      '-N, -NF': {
        _extends: 'nominal(-N)',
        _compose: '+ON>(-N)-ON, +ONK>(-N)-ONK, +N>(-NF)-N, +NK>(-NF)-NK '
      }
    }
  }
  , gp = new GrammarParadigms(pa, new GrammarTransformations(t, new GrammarPhonemes(p)))

test('Paradigms: resolve -N form lemma', function(t) {
  var lemma = gp.find('nominal').apply('mna')

  //*
  t.deepEqual(lemma.resolve([]), 'mna')
  t.deepEqual(lemma.resolve(['ABS']), 'mna')
  t.deepEqual(lemma.resolve(['ABS','SG']), 'mna')

  t.deepEqual(lemma.resolve(['PL']), 'mnau')
  t.deepEqual(lemma.resolve(['ABS','PL']), 'mnau')

  t.deepEqual(lemma.resolve(['NOM']), 'mnan')
  t.deepEqual(lemma.resolve(['NOM','PL']), 'mnaun')

  t.deepEqual(lemma.resolve(['PP','LOC']), 'mnamei')
  t.deepEqual(lemma.resolve(['PP','DIR']), 'mnamend')
  t.deepEqual(lemma.resolve(['PP','TRV']), 'mnameos')

  t.deepEqual(lemma.resolve(['PL','PP','LOC']), 'mnaumei')
  t.deepEqual(lemma.resolve(['ABS', 'PL','PP','LOC']), 'mnaumei')

  /*
  t.deepEqual(lemma.resolve(['PP','EXT','LOC']), 'mnamedhei')
  t.deepEqual(lemma.resolve(['ABS','PL','PP','EXT','LOC']), 'mnaumedhei')
  //*/
  t.end()
})

test('Paradigms: resolve -r (-K) form lemma', function(t) {
  var lemma = gp.find('nominal').apply('er')

  //*
  t.deepEqual(lemma.resolve([]), 'er')
  t.deepEqual(lemma.resolve(['ABS']), 'er')
  t.deepEqual(lemma.resolve(['ABS','SG']), 'er')

  t.deepEqual(lemma.resolve(['PL']), 'eor')
  t.deepEqual(lemma.resolve(['ABS','PL']), 'eor')

  t.deepEqual(lemma.resolve(['NOM']), 'ern')
  t.deepEqual(lemma.resolve(['NOM','PL']), 'eorn')

  t.deepEqual(lemma.resolve(['PP','LOC']), 'erei')
  t.deepEqual(lemma.resolve(['PP','DIR']), 'erend')
  t.deepEqual(lemma.resolve(['PP','TRV']), 'ereos')

  t.deepEqual(lemma.resolve(['PL','PP','LOC']), 'eorei')
  t.deepEqual(lemma.resolve(['ABS', 'PL','PP','LOC']), 'eorei')

  /*
  t.deepEqual(lemma.resolve(['PP','EXT','LOC']), 'eoredhei')
  t.deepEqual(lemma.resolve(['ABS','PL','PP','EXT','LOC']), 'eoredhei')
  //*/
  t.end()
})

test('Paradigms: resolve -n (-K) form lemma', function(t) {
  var lemma = gp.find('nominal').apply('rin')

  //*
  t.deepEqual(lemma.resolve([]), 'rin')
  t.deepEqual(lemma.resolve(['ABS']), 'rin')
  t.deepEqual(lemma.resolve(['ABS','SG']), 'rin')

  t.deepEqual(lemma.resolve(['PL']), 'rien')
  t.deepEqual(lemma.resolve(['ABS','PL']), 'rien')

  t.deepEqual(lemma.resolve(['NOM']), 'rind')
  t.deepEqual(lemma.resolve(['NOM','PL']), 'riend')

  t.deepEqual(lemma.resolve(['PP','LOC']), 'rinei')
  t.deepEqual(lemma.resolve(['PP','DIR']), 'rinend')
  t.deepEqual(lemma.resolve(['PP','TRV']), 'rineos')

  t.deepEqual(lemma.resolve(['PL','PP','LOC']), 'rienei')
  t.deepEqual(lemma.resolve(['ABS', 'PL','PP','LOC']), 'rienei')

  /*
  t.deepEqual(lemma.resolve(['PP','EXT','LOC']), 'rienedhei')
  t.deepEqual(lemma.resolve(['ABS','PL','PP','EXT','LOC']), 'rienedhei')
  //*/
  t.end()
})