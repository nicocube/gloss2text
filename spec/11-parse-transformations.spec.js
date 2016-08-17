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

describe('parse transformations', function() {
  
  var GrammarTransformations = require(__dirname+'/../lib/grammar-transformations')
  
  it('Creation: should fail with improper params', function() {
    expect(function() {
      new GrammarTransformations()
    }).toThrowError('transformations should be an object, not: undefined')
    expect(function() {
      new GrammarTransformations([])
    }).toThrowError('transformations should be an object, not: []')
    expect(function() {
      new GrammarTransformations(null)
    }).toThrowError('transformations should not be null')
    expect(function() {
      new GrammarTransformations({})
    }).toThrowError('transformations should not be an empty object: {}')
    expect(function() {
      new GrammarTransformations({f : {a: 'i'}})
    }).toThrowError('phonemes should be an object, not: undefined')
    expect(function() {
      new GrammarTransformations({f : {a: 'i'}}, [])
    }).toThrowError('phonemes should be an object, not: []')
    expect(function() {
      new GrammarTransformations({f : {a: 'i'}}, null)
    }).toThrowError('phonemes should not be null')
    expect(function() {
      new GrammarTransformations({f : {a: 'i'}}, {})
    }).toThrowError('phonemes should not be an empty object: {}')
  })
  
  describe('parse rule and apply', function() {
    var p = {
        V: 'a e o i u',
        Cu: 'p t c f th s sh',
        Cv: 'b d g v dh z j',
        Cr: 'm n l r h',
        C: '<Cv> <Cu> <Cr>',
        O: 'C',
        K: 'C',
        N: 'V VV',
        S: 'N ON ONK NK',
      }
      , t = {
        r: { a: 'e', o: 'e', _: '_'},
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
      , g = new GrammarTransformations(t, p)
      
    it("basic rules", function() {
      expect(g.parseRule('_').apply('a')).toEqual('a')
      expect(g.parseRule('-n').apply('a')).toEqual('an')
      expect(g.parseRule('-n>-d').apply('a')).toEqual('a')
      expect(g.parseRule('-n>-d').apply('an')).toEqual('ad')
    })
    
    it("match pattern replace with const", function() {
      expect(g.parseRule('-K>-n').apply('a')).toEqual('a')
      expect(g.parseRule('-K>-n').apply('ad')).toEqual('an')
      expect(g.parseRule('-K>-n').apply('as')).toEqual('an')
    })
    
    it("match pattern replace with capture simple", function() {
      expect(g.parseRule('-K>-KK').apply('a')).toEqual('a')
      expect(g.parseRule('-K>-KK').apply('an')).toEqual('ann')
      expect(g.parseRule('-NK>-KNK').apply('an')).toEqual('nan')
    })

    it("match pattern replace with capture complex", function() {
      expect(g.parseRule('-CC>-CiCCe').apply('adr')).toEqual('adirre')
      
      expect(g.parseRule('-CC>-CCaCu').apply('adr')).toEqual('adraru')
      expect(g.parseRule('-CC>-<C0><C0>a<C1>u').apply('adr')).toEqual('addaru')
      
      expect(g.parseRule('-CC>-<C1><C0>').apply('adr')).toEqual('ard')
      
      //expect(g.parseRule('-<Cu>>-<Cu>n').apply('ap')).toEqual('apn')
    })
    
    it("simple transformation rules", function() {
      expect(g.parseRule('-N>-r(N)').apply('a')).toEqual('e')
      expect(g.parseRule('-N>-r(N)').apply('i')).toEqual('i')
      expect(g.parseRule('-N>-l(N)').apply('i')).toEqual('ae')
      expect(g.parseRule('-N>-l(N)').apply('ie')).toEqual('aie')
      expect(g.parseRule('-N>-l(N)').apply('ae')).toEqual('eia')
    })
     
    it("simple transformation rules + capture", function() { 
      expect(g.parseRule('-Nn>-r(N)').apply('an')).toEqual('e')
      expect(g.parseRule('-NK>-l(N)').apply('in')).toEqual('ae')
      expect(g.parseRule('-NK>-l(N)K').apply('ien')).toEqual('aien')
      expect(g.parseRule('-NK>-l(N)-K').apply('ien')).toEqual('aien')
      expect(g.parseRule('-NK>-Kl(N)').apply('aen')).toEqual('neia')
    })
      
    it("double transformation rules + capture", function() { 
      expect(g.parseRule('-NK>-r(N)h(K)').apply('i')).toEqual('i')
      expect(g.parseRule('-NK>-r(N)h(K)').apply('is')).toEqual('i')
      expect(g.parseRule('-NK>-r(N)-h(K)').apply('is')).toEqual('i')
      expect(g.parseRule('-NK>-r(N)h(K)').apply('in')).toEqual('ind')
      
      expect(g.parseRule('-NK>-h(K)r(N)').apply('ic')).toEqual('hi')
    })
    
    it("complex transformation rules", function() {
      expect(g.parseRule('-K>-x(Ks)').apply('a')).toEqual('a')
      expect(g.parseRule('-K>-x(Ks)').apply('an')).toEqual('ans')
      expect(g.parseRule('-K>-x(Ks)').apply('ad')).toEqual('ads')
      expect(g.parseRule('-K>-x(Ks)').apply('ash')).toEqual('ash')
      expect(g.parseRule('-K>-x(Ks)').apply('at')).toEqual('ath')
      expect(g.parseRule('-K>-x(Ks)').apply('as')).toEqual('as')
    })
  })
})