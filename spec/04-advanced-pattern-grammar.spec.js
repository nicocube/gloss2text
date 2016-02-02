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

describe("advanced pattern grammar test:", function() {
  
  var build_parser = require(__dirname+'/../lib/parser')
  
  var parser = build_parser({
    syllable: {
      O: '',
      N: '',
      C: ''
    },
    transformations: {
      raising: {
        a: 'ei', e: 'ia', i: 'ae', o: 'ue', u: 'iu'
      }
    },
    rules: {      
      nominal: {
        GEN: '-NC>-N(raising)C'
      },
      verbal: {
        
      }
    },
    lexicon: {
      '1s' : { c: 'nominal', v: 'a'},
      '2s' : { c: 'nominal', v: 'er'},
      '3sa' : { c: 'nominal', v: 'lo'},
      'forest':{ c: 'nominal', v: 'lorth'},
      'love' : { c: 'verbal', v: 'mun'},
      'want' : { c: 'verbal', v: 'mis' },
      'beautiful' : { c: 'verbal', v: 'laen' }
    }
  })

  it("intra syllabic", function() {
    expect(parser('')).toEqual('')
  })
})


