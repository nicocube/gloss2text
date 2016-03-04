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
      },
      f: {
        a: 'e', e: 'i', i: 'i', o: 'e', u: 'i'
      }
    },
    rules: {      
      nominal: {
        ABS: {
          SG: '->-',
          PL: ['-NK>-l(N)K', '-N>-l(N)']
        },
        NOM: {
          SG: ['-N>-Nn', '-n>-nd', '-r>-rn', '-l>-ln', '>-en'],
          PL: ['-N>-l(N)n', '-Nn>-l(N)nd', '-Nr>-l(N)rn', '-Nl>-l(N)ln', '-NK>-l(N)Kon']
        },
        GEN: {
          SG: ['-NK>-r(N)K', '-N>-r(N)'],
          PL: ['-NC>-l(N)C-f(N)', '-NCC>-l(N)Cf(N)C', '-N>-l(N)rf(N)']
        },
        VOC: {
          SG: ['-CC>-CiCe', '-C>-CCe', '-N>-Nme'],
          PL: ['-NC>-l(N)CCe', '-NCC>-l(N)CoCe', '-N>-l(N)me']
        },
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
      'good': { verbal: 'slan' }
    }
  })

  it("intra syllabic 1", function() {
    expect(parser('1s.GEN.SG beautiful.IPFV.ATTR forest.ABS 2s.NOM.SG love.IPFV.INT')).toEqual('ei leian lorth ern muon')
  })

  it("intra syllabic 2", function() {
    expect(parser('beautiful.IPFV.ATTR woman.NOM.SG forest.GEN.SG love.INF want.IPFV')).toEqual('leian rind luerth mun mis')
  })
  
  it("imperfecive", function() {
    expect(parser('1s.NOM.SG woman.ABS.SG tell.IPFV')).toEqual('an rin fen')
  })
  
  it("conjunction nominal, morphological rule", function() {
    expect(parser('woman.ABS.PL.CNJ 1s.NOM.SG tell.IPFV')).toEqual('rienith an fen')
  })
  
  it("conjunction nominal, agglutination rule", function() {
    expect(parser('woman.ABS.PL-CNJ 1s.NOM.SG tell.IPFV')).toEqual('rienith an fen')
  })
  
  it("match terminal and non-terminal '-Nn>-l(N)nd'", function() {
    expect(parser('woman.NOM.PL')).toEqual('riend')
  })

  it("match terminal and non-terminal '-NK>-l(N)Kon' for double consonnant", function() {
    expect(parser('forest.NOM.PL')).toEqual('lourthon')
  })

  it("match terminal and non-terminal '-NK>-l(N)Kon' for double consonnant", function() {
    expect(parser('forest.VOC.SG')).toEqual('lorithe')
  })
  
  it("match terminal and non-terminal '-NCC>-l(N)CoCe' for double consonnant", function() {
    expect(parser('forest.VOC.PL')).toEqual('lourothe')
  })
  
  it("match terminal and non-terminal '-NCC>-l(N)C+f(N)C' for double consonnant", function() {
    expect(parser('forest.GEN.PL')).toEqual('loureth')
  })
  
  //good.MOD.CAU.IPFV.POS 
  
  //good.MOD.CAU.PFV.POS
})
