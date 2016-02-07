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
      C: 't d p b c g f v th dh s z sh j m n r l',
      O: 'C CC',
      N: 'V VV VVV',
      K: 'C CC'
    },
    syllable: ['N', 'ON', 'NK', 'ONK'],
    transformations: {
      r: {
        a: 'ei', e: 'ia', i: 'ae', o: 'ue', u: 'iu', ae: 'eia'
      },
      l: {
        a: 'au', e: 'eo', i: 'ie', o: 'ou', u: 'uo', ae: 'aio'
      }
    },
    rules: {      
      nominal: {
        ABS: '->-',
        NOM: ['-N>-Nn', '-n>-nd', '-r>-rn', '-l>-ln', '>-en'],
        GEN: ['-NK>-r(N)K', '-N>-r(N)'],
        CNJ: ['-K>-Kith', '-N>-Ngith']
      },
      verbal: {
        INF: '->-',
        ATTR: ['-NK>-r(N)K', '-N>-r(N)'],
        IPFV: ['-K>-K', '-N>-Nn'],
        INT: ['-NK>-l(N)K', '-N>-l(N)'],
        CNJ: '>-gim'
      }
    },
    lexicon: {
      '1s': { nominal: 'a'},
      '2s': { nominal: 'er'},
      '3sa': { nominal: 'lo'},
      'woman':{ nominal: 'rin'},
      'forest':{ nominal: 'lorth'},
      'love': { verbal: 'mun'},
      'want': { verbal: 'mis'},
      'beautiful': { verbal: 'laen' },
      'tell': { verbal: 'fe' },
    }
  })

  it("intra syllabic 1", function() {
    expect(parser('1s.GEN beautiful.IPFV.ATTR forest.ABS 2s.NOM love.IPFV.INT')).toEqual('ei leian lorth ern muon')
  })

  it("intra syllabic 2", function() {
    expect(parser('beautiful.IPFV.ATTR woman.NOM forest.GEN love.INF want.IPFV')).toEqual('leian rind luerth mun mis')
  })
  
  it("imperfecive", function() {
    expect(parser('1s.NOM woman.ABS tell.IPFV')).toEqual('an rin fen')
  })
  
  it("conjunction nominal", function() {
    expect(parser('1s.NOM woman.NOM.CNJ tell.IPFV')).toEqual('an rindith fen')
  })
  
})


