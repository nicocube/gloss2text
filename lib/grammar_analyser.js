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
  var res = {}

  res.count_lexicon_entries = function count_lexicon_entries() {
    return Object.keys(grammar.lexicon).length
  }

  res.find_duplicate = function find_duplicate() {
    return Object.keys(grammar.lexicon)
    .map(function(k) { var o = grammar.lexicon[k]; o.$k = k; return o })
    .reduce(function(p, c) {
      if ('invariant' in c) {
        treat_lexeme(c.invariant, p, c)
      } else if ('compound' in c) {
        treat_lexeme(c.compound, p, c)
      } else {
        var x = find_paradigm(c)
        if(typeof x !== 'undefined') {
          var l = c[x]
          treat_lexeme(l, p, c)
        } else {
          if ('irregular' in c) throw new Error('Do not know hot to treat a pure irregular lexicon entry: '+c)
          else throw new Error('A regular lexicon entry must have a paradigm: '+c)
        }
      }
      return p
    }, {tmp: {} , res: {} }).res
  }

  function find_paradigm(o) {
    return Object.keys(o).filter(function(k) { return ['invariant', 'irregular', 'compound','compose','meaning', '$k'].indexOf(k) === -1 }).reduce(function(p, c) { return p || c }, undefined)
  }

  function treat_lexeme(l, p, c) {
    if (l in p.tmp) {
      p.tmp[l].push(c)
      if (! (l in p.res)) p.res[l] = p.tmp[l]
    } else {
      p.tmp[l] = [c]
    }
  }

  res.format = function (d) {
    return Object.keys(d)
    .map(function(k) {
      var res = k+'\n'
      res += d[k].map(function(e) {
        var l = e.$k
        delete e.$k
        return ' '.repeat(2)+l+':\n'+
          Object.keys(e)
          .map(function(k) { return ' '.repeat(4)+k+': '+e[k] }).join('\n')
      }).join('\n')
      return res
    }).join('\n')
  }

  return res
}