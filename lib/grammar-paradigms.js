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
  var extend = require('extend')
    , GrammarTransformations = require(__dirname+'/grammar-transformations')

  function GrammarParadigms(paradigms, transformations) {
    if (paradigms === null) throw new Error('paradigms should not be null')
    if (typeof paradigms !== 'object' || paradigms instanceof Array) throw new Error('paradigms should be an object, not: '+JSON.stringify(paradigms,null,2))
    if (Object.keys(paradigms).length === 0) throw new Error('paradigms should not be an empty object: '+JSON.stringify(paradigms,null,2))

    if (!(transformations instanceof GrammarTransformations)) throw new Error('transformations must be an instance of GrammarTransformations')

    this._ = Object.keys(paradigms).reduce(function (r, k) {
      r[k] = new Paradigm(k, paradigms[k], transformations)
      return r
    }.bind(this), {})
  }

  function split_clean_str(s, sep) {
    sep = sep || ','
    return s.split(sep).map(function(x) { return x.trim() })
  }

  GrammarParadigms.prototype.find = function(k) {
    if (k in this._) {
      return this._[k]
    }
    throw new Error('Unknown paradigm '+k)
  }

  function Paradigm(name, def, tr) {
    this.name = name
    var common = def._common
    delete def._common
    this.patterns = Object.keys(def).map(function (k) { return new Pattern(split_clean_str(k), def[k], common, tr) })
  }

  Paradigm.prototype.apply = function(n) {
    var f = split_clean_str(n)
      , x = this.patterns.reduce(function(p, c) {
        if (typeof p !== 'undefined') return p
        var m = c.match(f)
        if (m.length > 0) return c
      }, undefined)
    if (typeof x === 'undefined') throw new Error('No pattern found for '+n)
    return new Lemma(x, x.pattern.reduce(function(p, c, i) {
      p[c] = f[i]
      return p
    },{}))
  }

  function Pattern(pattern, def, common, tr) {
    this.pattern = pattern
    this.definition = {}
    extend(true, this.definition, common, def)
    if ('_' in this.definition) {
      this.citation_form = split_clean_str(this.definition._, '.')
      delete this.definition._
      var d = this.definition
        , cf = this.citation_form
        , i = 0
        , l = cf.length - 1
      for (; i < l; i += 1) {
        if (! (cf[i] in d)) {
          d[cf[i]] = {}
        }
        d[cf[i]]._ = this.pattern[0]
        d = d[cf[i]]
      }
      d[cf[i]] = this.pattern[0]
    }
    if ('_compose' in this.definition) {
      this.compose = this.definition._compose
      delete this.definition._compose
    }
    this.tr = tr
  }
  Pattern.prototype.match = function(f) {
    if (this.pattern.length == f.length) {
      return this.pattern.reduce(function(p, c, i) {
        var m = new GrammarTransformations.Matcher(this.tr.parseMatcher(c))
          , r = m.match(f[i])
        if (r != null) p.push(r)
        return p
      }.bind(this), [])
    }
  }
  Pattern.prototype.search = function(a) {
    if (a.length === 0) {
      return this.search(this.citation_form)
    } else {
      var i = 0
        , l = a.length
        , p = this.definition
        , c = a[i]
        , r = new MorphChain()
      for (; i < l ; i += 1, c = a[i]) {
        if (typeof p === 'object' && c in p) {
          p = p[c]
        } else if (typeof p === 'string' && i < l-1) {
          r.chain(this.parse(p))
          p = this.definition
        } else if (! (c in p) && (this.citation_form[i] in p) && (c in p[this.citation_form[i]])) {
          p = p[this.citation_form[i]][c]
        }
      }
      if (typeof p === 'object' && '_' in p) {
        p = p._
      }
      r.chain(this.parse(p))
      return r
    }
  }
  Pattern.prototype.parse = function(p) {
    if (this.pattern.indexOf(p) !== -1) {
      return new Selector(p)
    } else {
      var r = this.tr.parseRule(p)
        , k = p.replace(/^(.*)>.*$/,'$1')
      return new Selector(k !== p ? k : undefined, r)
    }
  }

  function MorphChain() {
    this._ = []
  }
  MorphChain.prototype.chain = function(k) {
    this._.push(k)
  }
  MorphChain.prototype.apply = function(f) {
    return this._.reduce(function(p, c) {
      return c.apply(f)
    }, f)
  }

  function Selector(p, r) {
    this.p = p
    this.r = r
  }
  Selector.prototype.apply = function(f) {
    var r
    if (typeof this.p !== 'undefined') r = f[this.p]
    else r = Object.keys(f).map(function(k) { return f[k] })[0]

    if (this.r) r = this.r.apply(r)

    return r
  }

  function Lemma(pattern, forms) {
    this.forms = forms
    this.pattern = pattern
  }
  Lemma.prototype.resolve = function(a) {
    var k = this.pattern.search(a)
    return k.apply(this.forms)
  }

  return GrammarParadigms
})()