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

describe('parse phonemes', function() {

  var GrammarPhonemes = require(__dirname+'/../lib/grammar-phonemes')
    , Terminal = GrammarPhonemes.Terminal
    , NonTerminal = GrammarPhonemes.NonTerminal

  it('Creation: should fail with improper params', function() {
    expect(function() { 
      new GrammarPhonemes(null)
    }).toThrowError('phonemes should not be null')
    
    expect(function() { 
      new GrammarPhonemes()
    }).toThrowError('phonemes should be an object, not: undefined')
    
    expect(function() { 
      new GrammarPhonemes(undefined)
    }).toThrowError('phonemes should be an object, not: undefined')
    
    expect(function() { 
      new GrammarPhonemes(42)
    }).toThrowError('phonemes should be an object, not: 42')
    
    expect(function() { 
      new GrammarPhonemes('plop')
    }).toThrowError('phonemes should be an object, not: "plop"')
    
    expect(function() { 
      new GrammarPhonemes([])
    }).toThrowError('phonemes should be an object, not: []')
    
    expect(function() { 
      new GrammarPhonemes({})
    }).toThrowError('phonemes should not be an empty object: {}')
  })

  it('split Pattern into usable parts according to phonology definition', function() {
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

    expect(g.parse('v')).toEqual([Terminal('v')])
    expect(g.parse('V')).toEqual([NonTerminal('V',['a','e','o','i','u'])])
    expect(g.parse('C')).toEqual([NonTerminal('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h'])])
    
    expect(g.parse('Cr')).toEqual([NonTerminal('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),Terminal('r')])
    expect(g.parse('<Cr>')).toEqual([NonTerminal('Cr',['m','n','l','r','h'])])
    
    expect(g.parse('vV')).toEqual([Terminal('v'),NonTerminal('V',['a','e','o','i','u'])])
    
    expect(g.parse('vVcCvcaCe')).toEqual([Terminal('v'),NonTerminal('V',['a','e','o','i','u']),Terminal('c'),NonTerminal('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),Terminal('vca'),NonTerminal('C',['b','d','g','v','dh','z','j','p','t','c','f','th','s','sh','m','n','l','r','h']),Terminal('e')])
    
    expect(g.parse('plop<Cu>plouf')).toEqual([Terminal('plop'),NonTerminal('Cu',['p','t','c','f','th','s','sh']),Terminal('plouf')])
  })
})