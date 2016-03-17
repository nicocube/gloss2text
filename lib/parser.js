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
  if (!('lexicon' in grammar)) throw new Error('Your grammar needs a lexicon section.')

  return function(gloss) {
    var words = gloss.split(/\s+/)
      , res = words.map(word_parser).join(' ')
    return res
  }

  function word_parser(word) { // word
    var morphemes = word.split('-')
    return morphemes.map(morpheme_parser).join(grammar.split_morpheme?'-':'')
  }

  /**
   * m: morpheme
   */
  function morpheme_parser(m) {
    if (m.length === 0) throw new Error('Cannot parse empty string')
      
    var s = m.split('.') // sequence
      , h = s.shift() // head
      , e = grammar.lexicon[h] // entry

    if (typeof e !== 'undefined') {
      if ('invariant' in e) return e.invariant
      if ('irregular' in e) {
        var irr = s.reduce(function(p,c) { return (c in p) ? p[c] : ('v' in p) ? p.v : undefined },e.irregular)
        if (irr !== undefined) return irr
      }
      return Object.keys(e)
      .filter(function(_){ return _ !== 'irregular'})
      .reduce(function(p,c){
        var r = grammar.rules[c] // rule
        if (typeof r !== 'undefined') {
          var v = e[c]
          if (s.length === 0) return v
          return s.reduce(function(q,d) {
            if ('t' in q && (d in q.t)) {
              var t = rec_rule(q.t[d],q.v)
              if (typeof t === 'object') q.t = t
              else {
                delete q.t
                q.v = t
              }
              return q
            } else if (!(d in q.r)) {
              throw new Error('rule for '+c+' does not contain '+d)
            }
            var z = rec_rule(q.r[d],q.v)
            if (typeof z === 'object') q.t = z
            else q.v = z
            return q
          },{r: r, v: v}).v
        }
        return p
      },h)
    } else {
      throw new Error('No lexicon entry for "'+h+'"')
    }
  }

  /**
   * Try to find how to apply a rule recursively
   *
   * t: transformation found in grammar
   * v: value to be transformed
   */
  function rec_rule(t,v) {
    if (typeof t === 'function') return t(v)
    if (typeof t === 'string') return parse_string_rule(t,v)
    if (typeof t === 'object') {
      if (t instanceof Array) {
        return (t.reduce(function(p, c) {
          if (!p.f) {
            var w = rec_rule(c,p.v)
            if (p.v !== w) return {v:w, f:true}
          }
          return p
        },{v:v, f:false})).v
      }
      else return t
    }
    return v
  }

  /**
   * Parse a string defined rule and apply it to a value
   *
   * t: transformation definition as a string
   * v: value to be transformed
   */
  function parse_string_rule(t,v) {
    var patterns = [
      { x: /^-([a-z]*)([A-Z]+)([a-z]*)>-([A-Za-z\(\)]*)$/, s: final_transform },
      { x: /^-([a-z]*)>-([a-z]*)$/, s: final_substitution },
      { x: /^>-([a-z]*)$/, s: function(h,e) { return h.replace(/$/, e[1])} }
    ]
    var i = 0, l = patterns.length
    for(;i<l;i+=1) {
      var p = patterns[i]
        , x = try_pattern(p, t, v)
      if (x !== undefined) return x
    }
    return v
  }

  function try_pattern(p, t, h) {
    var e = p.x.exec(t)
    if (e!==null) {
      return p.s(h,e)
    }
    return undefined
  }

  function final_substitution(h,e) {
    return h.replace(new RegExp(e[1]+'$'), e[2])
  }

  function final_transform(h,e) {
    var p = parse_pattern(e[2], true)
      , rx = new RegExp(e[1]+p+e[3]+'$')
      , x = rx.exec(h)
    if (x !== null) return parse_substitution(e[2], x, e[4])
    return undefined
  }

  function parse_pattern(p, isRoot) {
    var ph = grammar.phonemes
    p = p.trim()
    isRoot = typeof isRoot === 'boolean' && isRoot

    if (!/ /.test(p) && p === p.toLowerCase()) {
      return p
    } else if (p.length == 1) {
      if (p in ph) {
        return (isRoot?'(':'')+parse_pattern(ph[p])+(isRoot?')':'')
      } else {
        return p
      }
    } else if (/ /.test(p)) {
      return p.split(' ').map(parse_pattern).join('|')
    } else {
      var _ =(isRoot?'(':'(?:')
      return _+p.split('').map(parse_pattern).join(')'+_)+')'
    }
    return ''
  }

  function parse_substitution(p, x, s) {
    var rks = splitred2map(p)
      , a = null
      , rx = /(([a-z])\(([A-Z])\))|([A-Z])|([a-z]+)/g
      , res = x.input.substring(0,x.index)

    var cks = {}
    while ((a = rx.exec(s)) !== null) {
      if (a[1] !== undefined) {
        var g = countK(cks,a[3])
          , h = findInK(rks, g)
        //console.log('1>',g, h, x[h])
        var v = x[h]
        if (!(a[2] in grammar.transformations)) throw new Error(a[2]+' is not a valid transformation rule')
        var t = grammar.transformations[a[2]]
        if (!(v in t)) throw new Error('"'+v+'" does not exists in transformation rule "'+a[2]+'": '+ JSON.stringify(t))
        res += t[v]
      }
      if (a[4] !== undefined) {
        var i = countK(cks,a[4])
          , j = findInK(rks, i)
        //console.log('2>',i, j, x[j])
        res += x[j]
      }
      if (a[5] !== undefined) {
        res+= a[5]
      }
    }
    return res
  }

  function splitred2map(p) {
    var ks = {}
    return p.split('').map(function(k) { return countK(ks, k).join('') }).reduce(function(p, c, i) { p[c]=i+1; return p },{})
  }

  function findInK(ks, g) {
    var k = g.join('')
    if (k in ks) {
      return ks[k]
    } else {
      return findInK(ks, [g[0], g[1]-1])
    }
  }

  function countK(ks, k) {
    if (k in ks) { ks[k]+=1 } else { ks[k]=0 }
    return [k, ks[k]]
  }
}
