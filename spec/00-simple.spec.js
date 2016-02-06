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
  
  it("parse an empty string", function() {
    var parser = build_parser({lexicon:{}})
      , actual = parser('')
      , expected = ''
    expect(actual).toEqual(expected)
  })
  
  it("parse a single irregular morpheme", function() {
    var parser = build_parser({lexicon: { '1s' : { irregular: { 'OBJ' : 'me' }}}})
      , actual = parser('1s.OBJ')
      , expected = 'me'
    expect(actual).toEqual(expected)
  })
  
  it("parse a single regular morpheme", function() {
    var parser = build_parser({ rules: { 'verb' : { '3s' : function(w) { return w+'s' } } },lexicon: { 'parse' : { verb: 'parse' }}})
      , actual = parser('parse.3s')
      , expected = 'parses'
    expect(actual).toEqual(expected)
  })
  
  it("parse a simple sentence", function() {
    var parser = build_parser({
      rules : { 'verb' : { '3s' : function(w) { return w+'s' } } },
      lexicon : {
      '1s' : { irregular: { 'SBJ' : 'I', 'OBJ' : 'me' }},
      '3fs' : { irregular: { 'SBJ' : 'she', 'OBJ' : 'her' }},
      'love' : { verb: 'love'},
      'and' : { invariant: 'and' }
    }})
      , actual = parser('1s.SBJ love 3fs.OBJ and 3fs.SBJ love.3s 1s.OBJ')
      , expected = 'I love her and she loves me'
    expect(actual).toEqual(expected)
  })
  
})
