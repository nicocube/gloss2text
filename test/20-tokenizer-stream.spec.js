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
var test = require('tape')
  , stream = require('stream')
  , Tokenizer = require(__dirname+'/../lib/tokenizer')

test('Tokenizer: parse a string', function(t) {
  var i = 0
    , pt = new stream.PassThrough()
    , tk = Tokenizer()
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
      {blank: '?'}
    ]
    , ws = new stream.Writable({
      objectMode: true,
      write: function(d, encoding, next) {
        t.deepEqual(d,expected[i])
        i+=1
        next()
      }
    })

  pt
  .pipe(tk)
  .pipe(ws)
  .on('finish', function () {
    t.deepEqual(i,24)
    t.end()
  })

  pt.write('1s.GEN beautiful.IPFV.ATTR forest.ABS 2s.NOM love.IPFV.INT?')
  pt.end()

})

test('Tokenizer: parse multiple string', function(t) {
  var i = 0
    , pt = new stream.PassThrough()
    , tk = Tokenizer()
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
      {blank: '?'}
    ]
    , ws = new stream.Writable({
      objectMode: true,
      write: function(d, encoding, next) {
        t.deepEqual(d,expected[i])
        i+=1
        next()
      }
    })

  pt
  .pipe(tk)
  .pipe(ws)
  .on('finish', function () {
    t.deepEqual(i,24)
    t.end()
  })

  pt.write('1s.GEN beautiful.IP')
  pt.write('FV.ATTR fo')
  pt.write('rest.ABS ')
  pt.write('2s.NOM love.IPFV.INT?')
  pt.end()
})
