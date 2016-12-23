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

    if (!(phonemes instanceof GrammarPhonemes)) throw new Error('phonemes must be an instance of GrammarPhonemes')

    this._tf = transformations
    this._ph = phonemes
    this.cache = { _: new NoopRule('') }
  }

  var transformRx = /^(?:(\+|-)?([a-zA-Z<>]*)(\+|-)?>)?(\+|-)?([a-zA-Z<>0-9\(\)-]+)(\+|-)?$/
  var idx_prefix_matcher = 1
  var idx_matcher = 2
  var idx_suffix_matcher = 3
  var idx_prefix_replacement = 4
  var idx_replacement = 5
  var idx_suffix_replacement = 6

  GrammarTransformations.prototype.parseRule = function(d) {
    if (d in this.cache) return this.cache[d]
    var m = transformRx.exec(d)
    if (m !== null) {
      if (typeof m[idx_replacement] === 'undefined') {
        throw new Error('No replacement term in '+d)
      }
      var rule
        , pfxMatch = typeof m[idx_prefix_matcher] !== 'undefined' && m[idx_prefix_matcher] === '+'
                  || typeof m[idx_suffix_matcher] !== 'undefined' && m[idx_suffix_matcher] === '-'
        , pfxReplt = typeof m[idx_prefix_replacement] !== 'undefined' && m[idx_prefix_replacement] === '+'
                  || typeof m[idx_suffix_replacement] !== 'undefined' && m[idx_suffix_replacement] === '-'

      if (typeof m[idx_matcher] === 'undefined') {
        if (pfxReplt) {
          rule = new PrependRule(d, m[idx_replacement])
        } else {
          rule = new AppendRule(d, m[idx_replacement])
        }
      } else {
        var l = this.parseMatcher(m[idx_matcher])
          , r = this.parseReplacement(m[idx_replacement])

        if (r.length === 1 && r[0] instanceof TerminalReplacement) {
          rule = new ReplaceRule(d, (pfxMatch?'^':'')+l.buildRegex()+(pfxMatch?'':'$'), r[0].v)
        } else {
          rule = new TransformRule(d, new Matcher(l, pfxMatch), new Replacer(r, this._tf, pfxReplt))
        }
      }
      this.cache[d] = rule
      return rule
    }
    throw new Error('Not matching '+JSON.stringify(d)+' with '+transformRx)
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

  function NoopRule(d) { this.d = d }
  NoopRule.prototype.apply = function(s) { return new RuleResult(s) }
  GrammarTransformations.NoopRule = NoopRule

  function AppendRule(d, a) { this.d = d; this.a = a }
  AppendRule.prototype.apply = function(s) { return new RuleResult(s, [s, this.a]) }
  AppendRule.prototype.toString = function() { return 'AppendRule { ' + this.a + ' }' }
  GrammarTransformations.AppendRule = AppendRule

  function PrependRule(d, a) { this.d = d; this.a = a }
  PrependRule.prototype.apply = function(s) { return new RuleResult(s, [this.a, s]) }
  GrammarTransformations.PrependRule = PrependRule

  function ReplaceRule(d, l,r) { this.d = d; this.l = new RegExp(l); this.r = r }
  ReplaceRule.prototype.apply = function(s) { return new RuleResult(s.replace(this.l, this.r)) }
  GrammarTransformations.ReplaceRule = ReplaceRule

  function TransformRule(d, l, r) { this.d = d; this.l = l; this.r = r }
  TransformRule.prototype.apply = function(s) {
    var m = this.l.match(s)
      , r = m !== null ? this.r.replace(m) : s
    return new RuleResult(r)
  }
  TransformRule.prototype.test = function(s) {
    return this.l.test(s)
  }
  GrammarTransformations.TransformRule = TransformRule

  function RuleResult(o, r) {
    this.o = o
    this.r = r
  }
  RuleResult.prototype.toText = function() {
    return this.r ? this.r.join('') : this.o
  }
  GrammarTransformations.RuleResult = RuleResult

  function Matcher(l, pfx){
    this.l = l
    this.k = l.map(function(x) { if (x instanceof GrammarPhonemes.Ens) return x.k })
    this.rx = !pfx ? '(.*?)'+l.buildRegex()+'$' : '^'+l.buildRegex()+'(.*)'
    this.pfx = !!pfx
  }
  Matcher.prototype.test = function(s) {
    return new RegExp(this.rx).test(s)
  }
  Matcher.prototype.match = function(s) {
    var m = new RegExp(this.rx).exec(s)
    if (m !== null) {
      if (!this.pfx) {
        return {
          b: m[1],
          ks: this.k.reduce(function(p,c,i) {
            if (!(c in p)) p[c] = []
            p[c].push(m[i+2])
            return p
          },{})
        }
      } else {
        return {
          b: m[m.length-1],
          ks: this.k.reduce(function(p,c,i) {
            if (!(c in p)) p[c] = []
            p[c].push(m[i+1])
            return p
          },{})
        }
      }
    }
    return null
  }
  GrammarTransformations.Matcher = Matcher

  function Replacer(r, tf, pfx){
    this.r = r
    this._tf = tf
    this.pfx = !!pfx
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

  return GrammarTransformations
})()