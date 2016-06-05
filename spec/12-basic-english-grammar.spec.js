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

describe("basic english grammar test:", function() {
    
  var build_parser = require(__dirname+'/../lib/parser')
  
  var parser = build_parser({
    paradigms: {
      verb : { PRS : { '3s' : '-s' }, PRT : '-d', PP : '>-d' } // -d and >-d are both valid
    },
    lexicon: {
      '1s' : { irregular: { 'SBJ' : 'I', 'OBJ' : 'me' }},
      '2s' : { irregular: { 'SBJ' : 'you', 'OBJ' : 'you' }},
      '3ms' : { irregular: { 'SBJ' : 'he', 'OBJ' : 'him' }},
      '3fs' : { irregular: { 'SBJ' : 'she', 'OBJ' : 'her' }},
      'love' : { verb: 'love' },
      'and' : { invariant: 'and' }
  }})
  
  it("present tense sentence", function() {
    expect(parser('1s.SBJ love 3fs.OBJ and 3fs.SBJ love.PRS.3s 1s.OBJ')).toEqual('I love her and she loves me')
  })
  it("past tense sentence", function() {
    expect(parser('2s.SBJ love.PRT 3fs.OBJ')).toEqual('you loved her')
  })
  
})
    
