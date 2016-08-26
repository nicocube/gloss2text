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

describe('Parse lexicon', function() {
  
  var GrammarLexicon = require(__dirname+'/../lib/grammar-lexicon')
  
  describe('Creation: should fail with improper params', function() {
    it('',function() {
      expect(function() { 
        new GrammarLexicon(null)
      }).toThrowError('lexicon should not be null')
    })
    it('',function() {
      expect(function() { 
        new GrammarLexicon()
      }).toThrowError('lexicon should be an object, not: undefined')
    })
    it('',function() {
      expect(function() { 
        new GrammarLexicon(undefined)
      }).toThrowError('lexicon should be an object, not: undefined')
    })
    it('',function() {
      expect(function() { 
        new GrammarLexicon(42)
      }).toThrowError('lexicon should be an object, not: 42')
    })
    it('',function() {
      expect(function() { 
        new GrammarLexicon('plop')
      }).toThrowError('lexicon should be an object, not: "plop"')
    })
    it('',function() {
      expect(function() { 
        new GrammarLexicon([])
      }).toThrowError('lexicon should be an object, not: []')
    })
    it('',function() {
      expect(function() { 
        new GrammarLexicon({})
      }).toThrowError('lexicon should not be an empty object: {}')
    })
  })

  describe('', function() {
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
          }
        }
      , gl = new GrammarLexicon(l)
      , Entry = GrammarLexicon.Entry
    
    it('', function() {
      var actual = gl.find('ACT')
        , expected = Entry('ACT',{ verbal: 'ma' })
      expect(actual).toEqual(expected)
      expect(actual.paradigm).toEqual('verbal')
      expect(actual.parts).toEqual(['ma'])
    })
    
    it('', function() {
      var actual = gl.find('STA')
        , expected = Entry('STA',{ verbal: 've, ves', irregular: { PFV: 'vil' } })
      expect(actual).toEqual(expected)
      expect(actual.paradigm).toEqual('verbal')
      expect(actual.parts).toEqual(['ve', 'ves'])
      expect(actual.irregular).toEqual({ PFV: 'vil' })
    })
  })
})