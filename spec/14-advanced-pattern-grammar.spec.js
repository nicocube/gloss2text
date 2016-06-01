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
        a: 'ei', e: 'ie', i: 'ae', o: 'ue', u: 'iu', ae: 'eia'
      },
      l: {
        a: 'au', e: 'eo', i: 'ia', o: 'ou', u: 'uo', ae: 'aio'
      },
      f: {
        a: 'e', e: 'i', i: 'i', o: 'e', u: 'i'
      }
    },
    rules: {      
      nominal: {
        ABS: {
          SG: '-',
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
        POST: {
          CNJ: ['-K>-Kith', '-N>-Ngith'],
          TRA: ['-Nr>-Nrsh', '-Nn>-Nnsh', '-K>-Kesh', '-N>-Nsh']
        }
      },
      verbal: {
        INF: '-',
        ATTR: ['-NK>-r(N)K', '-N>-r(N)'],
        IPFV: ['-K>-K', '-l>-ln'],
        INT: ['-NK>-l(N)K', '-N>-l(N)'],
        CNJ: '-gim'
      }
    },
    affixes: {
      
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
      'good': { verbal: 'slan' },
      'CAU': { verbal: 'ra', irregular: { IPFV: 'ran' } },
      'clean': { verbal: 'lar' },
      'room': { nominal: 'thed' },
      'toilet': { compound: 'clean-room' },
      'supertoilet': { compound: 'clean-toilet' },
      'circular_test01': { compound: 'clean-circular_test02' },
      'circular_test02': { compound: 'circular_test01-toilet' },
      'circular_test11': { compound: 'clean-circular_test12' },
      'circular_test12': { compound: 'circular_test13-toilet' },
      'circular_test13': { compound: 'circular_test14-room' },
      'circular_test14': { compound: 'circular_test12-toilet' },
      'one': { verbal: 'ish' },
      'two': { verbal: 'then' },
      'ten': {
        verbal: 'farl',
        compose: [ 'farli-C', 'C-arli-C', 'C-arl' ],
        exception: {
          'one-ten' : '=ten'
        }
      },
      'hundred': {
        verbal: 'shimroth',
        compose: [ 'C-emroth', 'V-mroth' ],
        exception: {
          'one-hundred': '=hundred'
        }
      },
      day: {
        nominal: "thil"
      },
      now: {
        nominal: "sur",
        compose: [ "C-ur" ]
      },
      today: {
        compound: "now-day"
      },
      tomorrow: {
        compound: "after-now-day"
      },
      yesterday: {
        compound: "before-now-day"
      },
      after: {
        nominal: "das",
        compose: [ "C-as" ]
      },
      before: {
        nominal: "nov",
        compose: [ "C-ov" ]
      }
    }
  })

  it("intra syllabic 1", function() {
    expect(parser('1s.GEN.SG beautiful.IPFV.ATTR forest.ABS.SG 2s.NOM.SG love.IPFV.INT')).toEqual('ei leian lorth ern muon')
  })

  it("intra syllabic 2", function() {
    expect(parser('beautiful.IPFV.ATTR woman.NOM.SG forest.GEN.SG love.INF want.IPFV')).toEqual('leian rind luerth mun mis')
  })
  
  it("imperfective", function() {
    expect(parser('1s.NOM.SG woman.ABS.SG tell.IPFV')).toEqual('an rin fe')
  })
  
  it("conjunction nominal, morphological rule", function() {
    expect(parser('woman.ABS.PL.POST.CNJ 1s.NOM.SG tell.IPFV')).toEqual('rianith an fe')
  })
  
  xit("conjunction nominal, agglutination rule", function() {
    expect(parser('woman.ABS.PL-POST.CNJ 1s.NOM.SG tell.IPFV')).toEqual('rianith an fe')
  })
  
  it("match terminal and non-terminal '-Nn>-l(N)nd'", function() {
    expect(parser('woman.NOM.PL')).toEqual('riand')
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
  
  it("match irregular then regular rules", function() {
    expect(parser('good-CAU.IPFV.ATTR')).toEqual('slanrein')
  })
  
  it("compound word with stable rule", function() {
    expect(parser('toilet.ABS.SG')).toEqual('larthed')
  })
  
  it("compound word with transforming rule", function() {
    expect(parser('toilet.ABS.PL')).toEqual('lartheod')
  })
  
  it("compound word with advanced transforming rule", function() {
    expect(parser('toilet.ABS.PL.POST.TRA')).toEqual('lartheodesh')
  })
  
  it("compound of compound word", function() {
    expect(parser('supertoilet.ABS.PL')).toEqual('larlartheod')
  })
  
  it("compound word should not go circular shallowly", function() {
    expect(function() { 
      parser('circular_test01.ABS.PL')
    }).toThrow()
  })
  
  it("compound word should not go circular deeply", function() {
    expect(function() { 
      parser('circular_test11.ABS.PL')
    }).toThrow()
  })
  
  it("multiple, contextual forms : no combine", function() {
    expect(parser('ten')).toEqual('farl')
  })
  
  it("multiple, contextual forms : combine after first case", function() {
    expect(parser('ten-one')).toEqual('farlish')
  })
  
  it("multiple, contextual forms : combine after second case", function() {
    expect(parser('ten-two')).toEqual('farlithen')
  })
  
  it("multiple, contextual forms : combine before", function() {
    expect(parser('two-ten')).toEqual('thenarl')
  })
  it("multiple, contextual forms : combine before and after first case", function() {
    expect(parser('two-ten-one')).toEqual('thenarlish')
  })
  
  it("multiple, contextual forms : combine before and after second case", function() {
    expect(parser('two-ten-two')).toEqual('thenarlithen')
  })
  
  it("multiple, contextual forms, with exceptions : default", function() {
    expect(parser('hundred')).toEqual('shimroth')
  })
  
  xit("multiple, contextual forms, with exceptions : exception to default", function() {
    expect(parser('one-hundred')).toEqual('shimroth')
  })
  
  it("multiple, contextual forms, with exceptions : combine two composables", function() {
    expect(parser('ten-hundred')).toEqual('farlimroth')
  })
  
  xit("multiple, contextual forms, with exceptions : combine two composables", function() {
    expect(parser('one-ten-hundred')).toEqual('farlimroth')
  })
  
  it("multiple, contextual forms, with exceptions : combine two composables with one normal in between", function() {
    expect(parser('ten-one-hundred')).toEqual('farlishemroth')
  })
  
  it("multiple, contextual forms, with exceptions : combine two composables with another normal in between", function() {
    expect(parser('ten-two-hundred')).toEqual('farlithenemroth')
  })
  
  it("multiple, contextual forms, with exceptions : combine two composables", function() {
    expect(parser('two-ten-hundred')).toEqual('thenarlimroth')
  })
  
  it("multiple, contextual forms, with exceptions : medial cases", function() {
    expect(parser('tomorrow yesterday')).toEqual('dasurthil novurthil')
  })
  
})
