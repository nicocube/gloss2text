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

module.exports = function (grammar, lexicon) {
  'use strict'
  return function(gloss) {
    var words = gloss.split(/\s+/)
      , res = words.map(word_parser).join(' ')
    return res
  }
  function word_parser(x) {
    var y = x.split('.')
    return y.reduce(function(p,c) {
      if (c in p)
        return p[c]
      else return ''
    },lexicon)
  }
}
