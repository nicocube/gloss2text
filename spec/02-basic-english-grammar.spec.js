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

describe("minimal language test:", function() {
    
  var build_parser = require(__dirname+'/../lib/parser')
  
  it("parse a simple sentence", function() {
    var parser = build_parser({
      rules: {
        'verb' : { 'PRS' :{ '3-SG' : function(w) { return w+'s' } } }
      },
      lemmas: {
        '1-SG' : { t: 'irregular', f: { 'SBJ' : 'I', 'OBJ' : 'me' }},
        '3-F-SG' : { t: 'irregular', f: { 'SBJ' : 'she', 'OBJ' : 'her' }},
        'love' : { t: 'regular', c: 'verb'},
        'and' : 'invariant'
    }})
      , actual = parser('1-SG.SBJ love 3-F-SG.OBJ and 3-F-SG.SBJ love.PRS.3-SG 1-SG.OBJ')
      , expected = 'I love her and she loves me'
    expect(actual).toEqual(expected)
  })
  
})
    
