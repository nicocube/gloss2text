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
  
  it('', function() {
  
  })
})