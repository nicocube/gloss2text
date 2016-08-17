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
  var GrammarPhonemes = require(__dirname+'/grammar-phonemes')

  function GrammarTransformations(transformations, phonemes) {
    if (transformations === null) throw new Error('transformations should not be null')
    if (typeof transformations !== 'object' ||transformations instanceof Array) throw new Error('transformations should be an object, not: '+JSON.stringify(transformations,null,2))
    if (Object.keys(transformations).length === 0) throw new Error('transformations should not be an empty object: '+JSON.stringify(transformations,null,2))

    this._tf = transformations
    this._ph = new GrammarPhonemes(phonemes)
    this.cache = { _: new NoopRule() }
  }

  var transformRx = /^(?:-([a-zA-Z<>]*)>)?-([a-zA-Z<>0-9\(\)-]+)$/

  GrammarTransformations.prototype.parseRule = function(d) {
    if (d in this.cache) return this.cache[d]

    var m = transformRx.exec(d)
    if (m !== null) {
      if (typeof m[2] === 'undefined') {
        throw new Error('No replacement term in '+d)
      }
      var rule
      if (typeof m[1] === 'undefined') {
        rule = new AppendRule(m[2])
      } else {
        var l = this.parseMatcher(m[1])
          , r = this.parseReplacement(m[2])

        if (r.length === 1 && r[0] instanceof TerminalReplacement) {
          rule = new ReplaceRule(l.buildRegex()+'$', r[0].v)
        } else {
          rule = new TransformRule(new Matcher(l), new Replacer(r, this._tf))
        }
      }
      this.cache[d] = rule
      return rule
    }
    throw new Error('Not matching '+d+' with '+transformRx)
  }

  GrammarTransformations.prototype.parseMatcher = function(s) {
    return this._ph.parse(s)
  }

  function TerminalReplacement(v) { this.v = v }
  function NonTerminalReplacement(k,i) { this.k = k; this.i = i }
  function TransformReplacement(f,v) { this.f = f; this.v = v }

  var subPattern = '([a-z]+)|([A-Z])|<([A-Za-z]+)([0-9]?)>'
    , transPattern = '([a-z])\\(([A-Za-z]+)\\)'
    , pattern = transPattern+'|'+subPattern

  function buildIndexChecker(a) { return function(i) { return typeof a[i] !== 'undefined' } }

  GrammarTransformations.prototype.parseReplacement = function(s) {
    var rgx = new RegExp(pattern,'g')
      , r = []
      , m
    while ((m = rgx.exec(s)) !== null) {
      var c = buildIndexChecker(m)
      if (c(3)) {
        r.push(new TerminalReplacement(m[3]))
      } else if (c(1)) {
        /*
        var rx = new RegExp(subPattern,'g')
        rx.exec(m[2])
        */
        r.push(new TransformReplacement(m[1],m[2]))
      } else if (c(4)) {
        r.push(new NonTerminalReplacement(m[4]))
      } else if (c(5)) {
        r.push(new NonTerminalReplacement(m[5], m[6]))
      }
    }
    return r
  }

  function Rule() {}
  Rule.prototype.apply = function(s) {s}

  function NoopRule() {}
  NoopRule.prototype = new Rule()
  NoopRule.prototype.apply = function(s) { return s }

  function AppendRule(a) { this.a = a }
  AppendRule.prototype = new Rule()
  AppendRule.prototype.apply = function(s) { return s+this.a }

  function ReplaceRule(l,r) {
    this.l = new RegExp(l)
    this.r = r
  }
  ReplaceRule.prototype = new Rule()
  ReplaceRule.prototype.apply = function(s) { return s.replace(this.l, this.r) }

  function Matcher(l){
    this.l = l
    this.k = l.map(function(x) { if (x instanceof GrammarPhonemes.Ens) return x.k })
    this.rx = '(.*?)'+l.buildRegex()+'$'
  }
  Matcher.prototype.match = function(s) {
    var m = new RegExp(this.rx).exec(s)
    if (m !== null) {
      return {
        b: m[1],
        ks: this.k.reduce(function(p,c,i) {
          if (!(c in p)) p[c] = []
          p[c].push(m[i+2])
          return p
        },{})
      }
    }
    return null
  }
  function Replacer(r, tf){
    this.r = r
    this._tf = tf
  }
  Replacer.prototype.replace = function(m) {
    var s = m.b
      , ttf = function(tf) {
        return function(v) {
          if (v in tf) {
            if (tf[v] === '_') {
              return v
            } else {
              return tf[v]
            }
          } else if ('_' in tf) {
            if (tf._ === '_') {
              return v
            } else {
              return tf._
            }
          }
        }.bind(this)
      }

    this.r.forEach(function(x) {
      if (x instanceof TerminalReplacement) {
        s += x.v
      } else if (x instanceof NonTerminalReplacement) {
        if (typeof x.i !== 'undefined') {
          s += m.ks[x.k][x.i]
        } else {
          var p = m.ks[x.k].shift()
          s += p
          if (m.ks[x.k].length === 0) m.ks[x.k].unshift(p)
        }
      } else if (x instanceof TransformReplacement) {
        if (x.f in this._tf) {
          if (x.v in m.ks) {
            var v = m.ks[x.v][0]
            s += ttf(this._tf[x.f])(v)
          } else {
            var rgx = new RegExp(subPattern,'g')
              , n
              , k = ''

            while ((n = rgx.exec(x.v)) !== null) {
              if (n[1]) {
                k += n[1]
              } else if (n[2] && n[2] in m.ks) {
                k += m.ks[n[2]][0]
              }
            }
            s += ttf(this._tf[x.f])(k)
          }
        }
      }
    }.bind(this))
    return s
  }

  function TransformRule(l,r) {
    this.l = l
    this.r = r
  }
  TransformRule.prototype = new Rule()
  TransformRule.prototype.apply = function(s) {
    var m = this.l.match(s)
      , r = m !== null ? this.r.replace(m) : s
    return r
  }

  return GrammarTransformations
})()