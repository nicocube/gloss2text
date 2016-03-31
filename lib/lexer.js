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

  function Lexer(isGloss, isInter) {
    if (!(this instanceof Lexer)) return new Lexer(isGloss, isInter)
    this.isGloss = isGloss || RegExp.prototype.test.bind(/[a-zA-Z0-9_]/)
    this.isInter = isInter || RegExp.prototype.test.bind(/[\.-]/)
    this.bufferType = 'blank'
    this.buffer = ''
  }

  Lexer.prototype.changeType = function (type, c) {
    var b = this.buffer
      , t = this.bufferType
    this.bufferType = type
    this.buffer = c
    if (b.length > 0) {
      var x = {}
      x[t] = b
      return x
    }
  }

  Lexer.prototype.lexAll = function (d) {
    var r = this.lex(d)
    r.push(this.flush())
    return r
  }

  Lexer.prototype.lex = function (d) {
    return String(d).split('').reduce(function(p,c) {
      var v = this.readChar(c)
      if (typeof v !== 'undefined') p.push(v)
      return p
    }.bind(this),[])
  }

  Lexer.prototype.flush = function() {
    var x = {}
    x[this.bufferType] = this.buffer
    this.buffer = ''
    this.bufferType = 'blank'
    return x
  }

  Lexer.prototype.readChar = function (c) {
    switch(this.bufferType) {
    case 'blank':
      if (this.isGloss(c)) {
        return this.changeType('gloss',c)
      } else {
        this.buffer += c
      }
      // inter cannot be preceded by blank => blank
      return
    case 'gloss':
      if (this.isGloss(c)) {
        this.buffer += c
      } else if(this.isInter(c)) {
        return this.changeType('inter',c)
      } else {
        return this.changeType('blank',c)
      }
      return
    case 'inter':
      if (this.isGloss(c)) {
        return this.changeType('gloss',c)
      } else {
        // inter cannot be 2 chars long => blank
        this.bufferType = 'blank'
        this.buffer += c
      }
      return
    }
  }
  return Lexer
})()