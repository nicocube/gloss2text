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

describe("test transformation rule parsing:", function() {
  var rule = require(__dirname+'/../lib/rule')({
    phonemes: {
      V: 'a e o i u',
      Cu: 'p t c f th s sh',
      Cv: 'b d g v dh z j',
      Cr: 'm n l r h',
      C: '<Cv> <Cu> <Cr>',
      O: 'C',
      K: 'C',
      N: 'V VV',
      S: 'N ON ONK NK',
    },
    transformations: {
      r: { a: 'e', o: 'e', e: 'i', u: 'i', _: '_'},
      l: { a: 'ei', e: 'ie', i: 'ae', o: 'ue', u: 'iu', ae: 'eia', ie: 'aie', ei: 'iae'},
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
  })
  
  it("basic rules", function() {
    expect(rule.parse_string_rule('_','a')).toEqual('a')
    expect(rule.parse_string_rule('-n','a')).toEqual('an')
    expect(rule.parse_string_rule('-n>-d','a')).toEqual('a')
    expect(rule.parse_string_rule('-n>-d','an')).toEqual('ad')
  })
  
  it("phoneme class rules", function() {
    expect(rule.parse_string_rule('-K>-Kn','a')).toEqual('a')
    expect(rule.parse_string_rule('-K>-n','ad')).toEqual('an')
    expect(rule.parse_string_rule('-K>-n','as')).toEqual('an')
    
    expect(rule.parse_string_rule('-K>-KK','a')).toEqual('a')
    expect(rule.parse_string_rule('-K>-KK','an')).toEqual('ann')
    expect(rule.parse_string_rule('-NK>-KNK','an')).toEqual('nan')
    
    expect(rule.parse_string_rule('-K>-KK','an')).toEqual('ann')
    expect(rule.parse_string_rule('-NK>-KNK','an')).toEqual('nan')
    expect(rule.parse_string_rule('-NK>-KNK','an')).toEqual('nan')
    
    expect(rule.parse_string_rule('-CC>-CiCCe','adr')).toEqual('adirre')
    
    expect(rule.parse_string_rule('-CC>-CCaCu','adr')).toEqual('adraru')
    expect(rule.parse_string_rule('-CC>-{C0}{C0}a{C1}u','adr')).toEqual('addaru')
    
    expect(rule.parse_string_rule('-CC>-{C1}{C0}','adr')).toEqual('ard')
    
    //expect(rule.parse_string_rule('-{Cu}>-{Cu}n','ap')).toEqual('apn')
  })
  
  it("simple transformation rules", function() {
    expect(rule.parse_string_rule('-N>-r(N)','a')).toEqual('e')
    expect(rule.parse_string_rule('-N>-r(N)','i')).toEqual('i')
    expect(rule.parse_string_rule('-N>-l(N)','i')).toEqual('ae')
    expect(rule.parse_string_rule('-N>-l(N)','ie')).toEqual('aie')
    expect(rule.parse_string_rule('-N>-l(N)','ae')).toEqual('eia')
    
    expect(rule.parse_string_rule('-Nn>-r(N)','an')).toEqual('e')
    expect(rule.parse_string_rule('-NK>-l(N)','in')).toEqual('ae')
    expect(rule.parse_string_rule('-NK>-l(N)K','ien')).toEqual('aien')
    expect(rule.parse_string_rule('-NK>-Kl(N)','aen')).toEqual('neia')
    
    expect(rule.parse_string_rule('-NK>-r(N)h(K)','i')).toEqual('i')
    expect(rule.parse_string_rule('-NK>-r(N)h(K)','is')).toEqual('i')
    expect(rule.parse_string_rule('-NK>-r(N)h(K)','in')).toEqual('ind')
    
    expect(rule.parse_string_rule('-NK>-h(K)r(N)','ic')).toEqual('hi')
  })
  
  it("complex transformation rules", function() {
    expect(rule.parse_string_rule('-K>-x(Ks)','a')).toEqual('a')
    expect(rule.parse_string_rule('-K>-x(Ks)','an')).toEqual('ans')
    expect(rule.parse_string_rule('-K>-x(Ks)','ad')).toEqual('ads')
    expect(rule.parse_string_rule('-K>-x(Ks)','ash')).toEqual('ash')
    expect(rule.parse_string_rule('-K>-x(Ks)','at')).toEqual('ath')
    expect(rule.parse_string_rule('-K>-x(Ks)','as')).toEqual('as')
  })

})