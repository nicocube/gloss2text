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

  function Lexer(isAbbr, isStem, isInter) {
    if (!(this instanceof Lexer)) return new Lexer(isAbbr, isInter)
    this.isAbbr = isAbbr || RegExp.prototype.test.bind(/[A-Z0-9_]/)
    this.isStem = isStem || RegExp.prototype.test.bind(/[a-z0-9_]/)
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
    if (this.bufferType === 'inter') {
      this.bufferType = 'blank' // inter cannot be final
    }
    x[this.bufferType] = this.buffer
    this.buffer = ''
    this.bufferType = 'blank'
    return x
  }

  Lexer.prototype.readChar = function (c) {
    switch(this.bufferType) {
    case 'blank':
      if (this.isAbbr(c)) {
        return this.changeType('abbr',c)
      } else if (this.isStem(c)) {
        return this.changeType('stem',c)
      } else {
        this.buffer += c
      }
      // inter cannot be preceded by blank => blank
      return
    case 'abbr':
      if (this.isAbbr(c)) {
        this.buffer += c
      } else if (this.isStem(c)) {
        if (this.buffer.split('').every(this.isStem)) {
          this.bufferType = 'stem'
          this.buffer += c
        } else {
          throw new Error('Cannot mix stem and abbr: '+ this.buffer + c)
        }
      } else if(this.isInter(c)) {
        return this.changeType('inter',c)
      } else {
        return this.changeType('blank',c)
      }
      return
    case 'stem':
      if (this.isStem(c)) {
        this.buffer += c
      } else if (this.isAbbr(c)) {
        if (this.buffer.split('').every(this.isAbbr)) {
          this.bufferType = 'stem'
          this.buffer += c
        } else {
          throw new Error('Cannot mix stem and abbr: '+ this.buffer + c)
        }
      } else if(this.isInter(c)) {
        return this.changeType('inter',c)
      } else {
        return this.changeType('blank',c)
      }
      return
    case 'inter':
      if (this.isAbbr(c)) {
        return this.changeType('abbr',c)
      } else if (this.isStem(c)) {
        return this.changeType('stem',c)
      } else {
        // inter cannot be 2 chars long or followed by blank, so it is blank
        this.bufferType = 'blank'
        this.buffer += c
      }
      return
    }
  }
  return Lexer
})()