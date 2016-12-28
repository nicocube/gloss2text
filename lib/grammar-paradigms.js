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
  function pad(n) {
    return new Array(typeof n === 'number' ? n : 0).fill(' ').join('')
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
      this.citation_forms = split_clean_str(this.definition._, '.')
      delete this.definition._
      var d = this.definition
        , cf = this.citation_forms
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
      this.compose = split_clean_str(this.definition._compose).map(tr.parseRule.bind(tr))
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
      return this.search(this.citation_forms)
    } else {
      var i = 0
        , l = a.length
        , p = this.definition
        , c = a[i]
        , r = new MorphChain(this.tr)
        , ifxOf
      for (; i < l ; i += 1, c = a[i]) {
        if (typeof p === 'object') {
          if (c in p) {
            p = p[c]
          } else if ((this.citation_forms[i] in p) && (c in p[this.citation_forms[i]])) {
            p = p[this.citation_forms[i]][c]
          } else if ('_infix' in p && c in p._infix) {
            ifxOf = p
            p = p._infix[c]
          }
        }
        if (typeof p === 'string') {
          p = split_clean_str(p)
        }
        if (i < l-1 && p instanceof Array) {
          r.chain(p.map(this.parse.bind(this, r)))
          if (typeof ifxOf === 'undefined') p = this.definition
          else {
            p = ifxOf
            ifxOf = undefined
          }
        }
      }
      if (typeof p === 'object' && '_' in p) {
        p = p._
      }
      if (typeof p === 'string') r.chain(split_clean_str(p).map(this.parse.bind(this, r)))
      else if (p instanceof Array) r.chain(p.map(this.parse.bind(this, r)))
      return r
    }
  }
  Pattern.prototype.parse = function(m, p) {
    if (this.pattern.indexOf(p) !== -1) {
      m.setForm(p)
      return new Selector(this)
    } else {
      var r = this.tr.parseRule(p)
        , k = p.replace(/^(.*)>.*$/,'$1')
      m.setForm(k !== p ? k : undefined)
      return new Selector(this, r)
    }
  }
  Pattern.prototype.toString = function() {
    return 'Pattern { ' + this.pattern.toString() + ' }'
  }

  function MorphChain(tr) {
    this.tr = tr
    this._ = []
  }
  MorphChain.prototype.chain = function(k) {
    this._.push(k)
  }
  MorphChain.prototype.setForm = function(f) {
    this.f = f
  }
  MorphChain.prototype.apply = function(f) {
    var p

    if (typeof f === 'string') {
      p = f
    } else if (typeof this.f !== 'undefined' && this.f in f) {
      p = f[this.f]
    } else {
      this.setForm(Object.keys(f)[0])
      p = f[this.f]
    }
    
    var m = this.parseMatcher()
      , i = 0
      , li = this._.length
      , c = this._[0]
      , isStem = true
    for (; i < li ; i += 1, c = this._[i]) {
      var j = 0
        , lj = c.length
        , s = c[0]
      for (; j < lj ; j += 1, s = c[j]) {
        var n = s.apply(p, isStem)
        //console.log(n, p)
        if (n !== p) {
          p = n
          isStem = isStem && m.test(p)
          break
        }
      }
    }
    return p
  }
  MorphChain.prototype.parseMatcher = function() {
    var rx = /^(\+|-)?([a-zA-Z<>]*)(\+|-)?$/
      , idx_matcher_prefix = 1
      , idx_matcher = 2
      , idx_matcher_suffix = 3
      , m = rx.exec(this.f)
      , pfxMatch = typeof m[idx_matcher_prefix] !== 'undefined' && m[idx_matcher_prefix] === '+'
                || typeof m[idx_matcher_suffix] !== 'undefined' && m[idx_matcher_suffix] === '-'
      , l = this.tr.parseMatcher(m[idx_matcher])
    return new GrammarTransformations.Matcher(l, pfxMatch)
  }
  MorphChain.prototype.toString = function(n) {
    var nl = (n ? '\n': ' ')
    n = typeof n === 'number' ? n : 0
    return 'MorphChain ['+ nl +
      this._.map(function(o) {
        return pad(n + 2) + '['+ nl + o.map(function(x) {
          return pad(n + 4)+x.toString(n + 4)
        }).join(','+ nl)+ nl +
        pad(n + 2) + ']'
      }).join(','+ nl)+ nl+
      ']'
  }

  function Selector(p, r) {
    this.p = p
    this.r = r
  }
  Selector.prototype.apply = function(r, isStem) {
    if (this.r) {
      var x = this.r.apply(r)
      //console.log(x)
      if (!x.r) {
        r = x.toText()
      } else {
        if (isStem && this.p.compose) {
          r = this.p.compose.reduce(function(p, c) {
            if (typeof p === 'string') return p
            if (p.r && c.d.startsWith('+') && c.test(p.r[1])) {
              var v = c.apply(p.r[1])
              return p.r[0] + v.toText()
            }
            return p
          }.bind(this), x)
        } else {
          r = x.toText()
        }
        if (! (typeof r === 'string')) return r.toText()
      }
    }
    return r
  }
  Selector.prototype.toString = function(n) {
    var nl = (n ? '\n': ' ')
    n = typeof n === 'number' ? n : 0
    return 'Selector {' + nl +
      ['p', 'f', 'r'].map(function(k) {
        return pad(n+2)+k +': '+ String(this[k])
      }.bind(this)).join(','+nl)+ nl + pad(n) + '}'
  }

  function Lemma(pattern, forms) {
    this.forms = forms
    this.pattern = pattern
  }
  Lemma.prototype.resolve = function(a) {
    var k = this.pattern.search(a)
    //console.log(k.toString(true))
    return k.apply(this.forms)
  }

  return GrammarParadigms
})()