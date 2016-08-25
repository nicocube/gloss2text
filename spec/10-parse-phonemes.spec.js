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

describe('Parse phonemes', function() {

  var GrammarPhonemes = require(__dirname+'/../lib/grammar-phonemes')
    , Alt = GrammarPhonemes.Alt
    , Seq = GrammarPhonemes.Seq

  describe('Creation: should fail with improper params', function() {
    it('phonemes should not be null', function() {
      expect(function() { 
        new GrammarPhonemes(null)
      }).toThrowError('phonemes should not be null')
    })
    it('phonemes should be an object, not: undefined', function() {
      expect(function() { 
        new GrammarPhonemes()
      }).toThrowError('phonemes should be an object, not: undefined')
    })
    it('phonemes should be an object, not: undefined', function() {
      expect(function() { 
        new GrammarPhonemes(undefined)
      }).toThrowError('phonemes should be an object, not: undefined')
    })
    it('phonemes should be an object, not: 42', function() {
      expect(function() { 
        new GrammarPhonemes(42)
      }).toThrowError('phonemes should be an object, not: 42')
    })
    it('phonemes should be an object, not: "plop"', function() {
      expect(function() { 
        new GrammarPhonemes('plop')
      }).toThrowError('phonemes should be an object, not: "plop"')
    })
    it('phonemes should be an object, not: []', function() {
      expect(function() { 
        new GrammarPhonemes([])
      }).toThrowError('phonemes should be an object, not: []')
    })
    it('phonemes should not be an empty object: {}', function() {
      expect(function() { 
        new GrammarPhonemes({})
      }).toThrowError('phonemes should not be an empty object: {}')
    })
  })

  describe('parse pattern into usable parts according to phonology definition', function() {
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

    it('',function() {
      expect(g.parse('v')).toEqual(Seq('v',['v']))
    })
    it('',function() {
      expect(g.parse('V')).toEqual(Seq('V',[Alt('V',['a','e','o','i','u'])]))
    })
    it('',function() {
      expect(g.parse('C')).toEqual(Seq('C',[Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h'])]))
    })
    it('',function() {
      expect(g.parse('Cr')).toEqual(Seq('Cr',[Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),'r']))
    })
    it('',function() {
      expect(g.parse('<Cr>')).toEqual(Seq('<Cr>',[Alt('Cr',['m','n','l','r','h'])]))
    })
    it('',function() {
      expect(g.parse('vV')).toEqual(Seq('vV',['v',Alt('V',['a','e','o','i','u'])]))
    })
    it('',function() {
      expect(g.parse('vVcCvca<Cu>e')).toEqual(Seq('vVcCvca<Cu>e',['v',Alt('V',['a','e','o','i','u']),'c',Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),'vca',Alt('Cu',['p','t','c','f','th','s','sh']),'e']))
    })
    it('',function() {
      expect(g.parse('plop<Cu>plouf')).toEqual(Seq('plop<Cu>plouf',['plop',Alt('Cu',['p','t','c','f','th','s','sh']),'plouf']))
    })
    it('',function() {
      expect(g.parse('N')).toEqual(Seq('N',[Alt('N', ['a','e','o','i','u', Seq('VV',[Alt('V',['a','e','o','i','u']),Alt('V',['a','e','o','i','u'])])])]))
    })
  })
  
  describe('build regex from parsed pattern', function() {
    it('',function() {
      expect(Seq('v',['v']).buildRegex()).toEqual('v')
    })
    it('',function() {
      expect(Seq('V',[Alt('V',['a','e','o','i','u'])]).buildRegex()).toEqual('(a|e|o|i|u)')
    })
    it('',function() {
      expect(Seq('V',[Alt('V',['a','e','o','i','u'])]).buildRegex(true)).toEqual('(?:a|e|o|i|u)')
    })
    it('',function() {
      expect(Seq('Cr',[Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),'r']).buildRegex()).toEqual('(b|d|g|v|dh|z|j|p|t|c|f|th|s|sh|m|n|l|r|h)r')
    })
    it('',function() {
      expect(Seq('vVcCvca<Cu>e',['v',Alt('V',['a','e','o','i','u']),'c',Alt('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),'vca',Alt('Cu',['p','t','c','f','th','s','sh']),'e']).buildRegex()).toEqual('v(a|e|o|i|u)c(b|d|g|v|dh|z|j|p|t|c|f|th|s|sh|m|n|l|r|h)vca(p|t|c|f|th|s|sh)e')
    })
    it('',function() {
      expect(Seq('N',[Alt('N', ['a','e','o','i','u', Seq('VV',[Alt('V',['a','e','o','i','u']),Alt('V',['a','e','o','i','u'])])])]).buildRegex()).toEqual('(a|e|o|i|u|(?:a|e|o|i|u)(?:a|e|o|i|u))')
    })
  })
})