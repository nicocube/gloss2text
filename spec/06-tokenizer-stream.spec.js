
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

describe("test tokenizer stream", function() {
  
  var stream = require('stream')
    , tokenizer = require(__dirname+'/../lib/tokenizer')()
  
  it("tokenize a string", function(done) {
    
    var i = 0
      , pt = new stream.PassThrough()
      , expected = [
        {gloss:'1s'},
        {inter:'.'},
        {gloss:'GEN'},
        {blank: ' '},
        {gloss:'beautiful'},
        {inter:'.'},
        {gloss:'IPFV'},
        {inter:'.'},
        {gloss:'ATTR'},
        {blank: ' '},
        {gloss:'forest'},
        {inter:'.'},
        {gloss:'ABS'},
        {blank: ' '},
        {gloss:'2s'},
        {inter:'.'},
        {gloss:'NOM'},
        {blank: ' '},
        {gloss:'love'},
        {inter:'.'},
        {gloss:'IPFV'},
        {inter:'.'},
        {gloss:'INT'},
        {blank: '?'},
      ]
      , ws = new stream.Writable({
        objectMode: true,
        write: function(d, encoding, next) {
          expect(d).toEqual(expected[i])
          i+=1
          next()
        }
      })

    pt
    .pipe(tokenizer)
    .pipe(ws)
    .on('finish', function () {
        expect(i).toEqual(24)
        done()
    })
  
    pt.write('1s.GEN beautiful.IPFV.ATTR forest.ABS 2s.NOM love.IPFV.INT?')
    pt.end()

  })
})
