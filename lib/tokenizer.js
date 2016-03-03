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

  function Tokenizer(parser, isGloss, isInter) {
    if (!(this instanceof Tokenizer)) return new Tokenizer(parser)
    Transform.call(this, {objectMode: true})
    this.parser = parser
    this.isGloss = isGloss || RegExp.prototype.test.bind(/[a-zA-Z0-9_]/)
    this.isInter = isInter || RegExp.prototype.test.bind(/[\.-]/)
    this.bufferType = 'blank'
    this.buffer = ''
  }
  util.inherits(Tokenizer, Transform)
  Tokenizer.prototype.changeType = function (type, c) {
    if (this.buffer.length > 0) {
      var x = {}
      x[this.bufferType] = this.buffer
      this.push(x)
    }
    this.bufferType = type
    this.buffer = c
  }
  Tokenizer.prototype._transform = function (data, encoding, next) {
    try {
      String(data).split('').forEach(function(c) {
        switch(this.bufferType) {
        case 'blank':
          if (this.isGloss(c)) {
            this.changeType('gloss',c)
          } else {
            this.buffer += c
          }
          // inter cannot be preceded by blank => blank
          return
        case 'gloss':
          if (this.isGloss(c)) {
            this.buffer += c
          } else if(this.isInter(c)) {
            this.changeType('inter',c)
          } else {
            this.changeType('blank',c)
          }
          return
        case 'inter':
          if (this.isGloss(c)) {
            this.changeType('gloss',c)
          } else {
            // inter cannot be 2 chars long => blank
            this.bufferType = 'blank'
            this.buffer += c
          }
          return
        }
      }.bind(this))

      if (this.buffer.length > 0) {
        var x = {}
        x[this.bufferType] = this.buffer
        next(null, x)
      } else {
        next(null)
      }
    } catch(e) {
      next(e)
    }
  }
  return Tokenizer
})()
