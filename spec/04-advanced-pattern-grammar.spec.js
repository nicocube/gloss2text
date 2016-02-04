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
    phonemes: {
      V: 'a e i o u',
      C: 't d p b c g f v th dh s z sh j m n r l'
    },
    syllable: {
      O: 'C CC',
      N: 'V VV VVV',
      K: 'C CC'
    },
    transformations: {
      raising: {
        a: 'ei', e: 'ia', i: 'ae', o: 'ue', u: 'iu', ae: 'eia'
      }
    },
    rules: {      
      nominal: {
        NOM: ['-n>-nd', '-r>-rn', '-l>-ln', '>-en'],
        GEN: ['-NK>-N(raising)K', '-N>-N(raising)']
      },
      verbal: {
        ATTR: ['-NK>-N(raising)K', '-N>-N(raising)']
      }
    },
    lexicon: {
      '1s' : { c: 'nominal', v: 'a'},
      '2s' : { c: 'nominal', v: 'er'},
      '3sa' : { c: 'nominal', v: 'lo'},
      'woman':{ c: 'nominal', v: 'rin'},
      'forest':{ c: 'nominal', v: 'lorth'},
      'love' : { c: 'verbal', v: 'mun'},
      'want' : { c: 'verbal', v: 'mis'},
      'beautiful' : { c: 'verbal', v: 'laen' }
    }
  })

  it("intra syllabic 1", function() {
    expect(parser('1s.GEN beautiful.ATTR forest.ABS 2s.NOM love.IPFV.INT')).toEqual('ei leian lorth ern muon')
  })

  it("intra syllabic 2", function() {
    expect(parser('beautiful.ATTR woman.NOM forest.GEN love.INF want.IPFV')).toEqual('leian rind luerth mun mis')
  })
})


