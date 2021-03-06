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

describe("basic french grammar test:", function() {
  
  var build_parser = require(__dirname+'/../lib/parser')
  
  var parser = build_parser({
    paradigms: {
      'verb': {
        '-er': {
          INF: '_',
          IND: { PRS : { '1s' : '-er>-e', '2s' : '-er>-es', '3s' : '-er>-e', '1p' : '-er>-ons', '2p' : '-er>-ez', '3p' : '-er>-ent',  }}
        },
        '-ir': {
          INF: '_',
          IND: { PRS : { '1s' : '-ir>-is', '2s' : '-ir>-is', '3s' : '-ir>-it', '1p' : '-ir>-issons', '2p' : '-ir>-issez', '3p' : '-ir>-issent',  }}
        }
      }
    },
    lexicon: {
      '1s' : { irregular: { 'SBJ' : 'je', 'OBJ' : 'moi', 'CLI': 'm\'' }},
      '2s' : { irregular: { 'SBJ' : 'tu', 'OBJ' : 'toi', 'CLI': 't\'' }},
      '3hs' : { irregular: { 'SBJ' : 'il', 'OBJ' : 'lui', 'CLI': 'l\'' }},
      '3fs' : { irregular: { 'SBJ' : 'elle', 'OBJ' : 'elle', 'CLI': 'l\'' }},
      'love' : { 'verb': 'aimer'},
      'finish' : { 'verb': 'finir'},
      'and' : { invariant: 'et' }
  }})

  it("present tense sentence -er", function() {
    expect(parser('1s.SBJ 3fs.CLI-love.IND.PRS.1s and 3fs.SBJ 1s.CLI-love.IND.PRS.3s')).toEqual('je l\'aime et elle m\'aime')
  })
  
  it("present tense sentence -ir", function() {
    expect(parser('1s.SBJ finish.IND.PRS.1s.')).toEqual('je finis.')
  })
  
  it("infinitive sentence", function() {
    expect(parser('love.INF')).toEqual('aimer')
    expect(parser('love')).toEqual('aimer')
  })
})

