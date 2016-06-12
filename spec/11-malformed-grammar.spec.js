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

describe("malformed grammar test:", function() {
    
  var build_parser = require(__dirname+'/../lib/parser')
  
  it("parse an empty grammar", function() {
    expect(function() { 
      build_parser({})
    }).toThrowError("Your grammar needs a lexicon section.")
  })
  
  it("parse a gramar with lexicon and no paradigms", function() {
    expect(function() { 
      build_parser({lexicon: {}})
    }).toThrowError("Your grammar needs a paradigms section.")
  })
  
  it("parse a grammar with paradigms and no lexicon", function() {
    expect(function() { 
      build_parser({paradigms: {}})
    }).toThrowError("Your grammar needs a lexicon section.")
  })
  
})
