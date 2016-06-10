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

describe("more advanced pattern grammar test:", function() {
  var build_parser = require(__dirname+'/../lib/parser')
    , fs = require('fs')
    , yaml = require('js-yaml')
  
  var parser = build_parser(yaml.safeLoad(fs.readFileSync(__dirname+'/grammar_for_test.yml')))
  
  it("no change rule", function() {
    expect(parser('moon.ABS')).toEqual('aleh')
  })
    
  it("complex phonetic system tranformation", function() {
    expect(parser('moon.MS')).toEqual('aler')
    expect(parser('moon.MS.ABS')).toEqual('aler')
    
    expect(parser('moon.GEN')).toEqual('alerih')
    expect(parser('moon.MS.GEN')).toEqual('alershih')
    
    expect(parser('moon.PL.ABS')).toEqual('alecuh')
    expect(parser('moon.MS.PL.ABS')).toEqual('alerruh')
    
    expect(parser('moon.PL.GEN')).toEqual('alecurih')
    expect(parser('moon.MS.PL.GEN')).toEqual('alerrurih')
  })

  it("tranform via affix", function() {
  })
  
})