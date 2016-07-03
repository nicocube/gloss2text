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

module.exports = function (grammar) {
  'use strict'
  function prop_copy(dest, src) {
    Object.keys(src).forEach(function(k) {
      if (k in dest && typeof dest[k] === 'object' && ! (dest[k] instanceof Array)) {
        prop_copy(dest[k], src[k])
      } else if (typeof src[k] === 'object' && ! (src[k] instanceof Array)) {
        var n = {}
        prop_copy(n, src[k])
        dest[k] = n
      } else {
        dest[k] = src[k]
      }
    })
  }

  Object.keys(grammar.paradigms).forEach(function(k) {
    var p = grammar.paradigms[k]
    if ('_extends' in p) {
      var e = p._extends
      if (e in grammar.paradigms) {
        delete p._extends
        var x = grammar.paradigms[e]
          , n = {}
        prop_copy(n,x)
        prop_copy(n,p)
        grammar.paradigms[k] = n
      }
    }
  })

  return grammar
}
