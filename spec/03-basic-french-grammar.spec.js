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
    rules: {
      'verb-1st-group': {
        IND : { PRS : { '1s' : '-er>-e', '2s' : '-er>-es', '3s' : '-er>-e', '1p' : '-er>-ons', '2p' : '-er>-ez', '3p' : '-er>-ent',  }}
      }
    },
    lexicon: {
      '1s' : { t: 'irregular', f: { 'SBJ' : 'je', 'OBJ' : 'moi', 'CLI': 'm\'' }},
      '2s' : { t: 'irregular', f: { 'SBJ' : 'tu', 'OBJ' : 'toi', 'CLI': 't\'' }},
      '3hs' : { t: 'irregular', f: { 'SBJ' : 'il', 'OBJ' : 'lui', 'CLI': 'l\'' }},
      '3fs' : { t: 'irregular', f: { 'SBJ' : 'elle', 'OBJ' : 'elle', 'CLI': 'l\'' }},
      'aimer' : { t: 'regular', c: 'verb-1st-group'},
      'et' : { t: 'invariant' }
  }})

  it("parse a simple sentence", function() {
    expect(parser('1s.SBJ 3fs.CLI-aimer.IND.PRS.1s et 3fs.SBJ 1s.CLI-aimer.IND.PRS.3s')).toEqual('je l\'aime et elle m\'aime')
  })
  
})

