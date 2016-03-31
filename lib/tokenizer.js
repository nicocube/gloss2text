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

module.exports = (function () {
  'use strict'
  var util = require('util')
    , Transform = require('stream').Transform
    , Lexer = require(__dirname+'/lexer')

  function Tokenizer(lexer) {
    if (!(this instanceof Tokenizer)) return new Tokenizer(lexer)
    Transform.call(this, {objectMode: true})
    this.lexer = lexer || Lexer()
  }
  util.inherits(Tokenizer, Transform)
  Tokenizer.prototype._transform = function (data, encoding, next) {
    try {
      var r = this.lexer.lex(String(data))
      r.forEach(this.push.bind(this))
      next()
    } catch(e) {
      next(e)
    }
  }
  Tokenizer.prototype._flush = function (next) {
    try {
      var v = this.lexer.flush()
      this.push(v)
      next()
    } catch(e) {
      next(e)
    }
  }
  return Tokenizer
})()
