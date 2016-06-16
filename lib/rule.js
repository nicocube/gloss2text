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

  var string_patterns = [
    { x: /^-([a-z]*)([A-Z]+)([a-z]*)>-([A-Za-z\(\)0-9\{\}-]*)$/, s: final_transform },
    { x: /^-([a-z]*)>-([a-z]*)$/, s: final_substitution },
    { x: /^(?:>?)-([a-z]*)$/, s: function(h,e) { return h.replace(/$/, e[1])} }
  ]

  function is_string_pattern(s) {
    var i = 0, l = string_patterns.length
    for(;i<l;i+=1) {
      if (string_patterns[i].x.test(s)) return true
    }
    return false
  }

  /**
   * Parse a string defined rule and apply it to a value
   *
   * t: transformation definition as a string
   * v: value to be transformed
   */
  function parse_string_rule(t,v) {
    var i = 0, l = string_patterns.length
    for(;i<l;i+=1) {
      var p = string_patterns[i]
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

    var mltRx = /^<([A-Za-z]+)>$/
      , mlt = null

    if (!/ /.test(p) && p === p.toLowerCase()) {
      return p
    } else if ((mlt = mltRx.exec(p)) !== null) {
      var k = mlt[1]
      if (k in ph) {
        return (isRoot?'(':'')+parse_pattern(ph[k])+(isRoot?')':'')
      } else {
        return p
      }
    } else if (p.length == 1) {
      if (p in ph) {
        return (isRoot?'(':'')+parse_pattern(ph[p])+(isRoot?')':'')
      } else {
        return p
      }
    } else if (/ +/.test(p)) {
      return p.split(/ +/).map(parse_pattern).join('|')
    } else {
      var _ =(isRoot?'(':'(?:')
      return _+p.split('').map(parse_pattern).join(')'+_)+')'
    }
  }

  function parse_substitution(p, x, s) {
    var rks = splitred2map(p)
      , a = null
      , rx = /(([a-z])\(((?:[A-Z]|[a-zA-Z]+?))\))|\{([A-Za-z]+[0-9]*)\}|([A-Z])|([a-z]+)/g
      , res = x.input.substring(0,x.index)

    //console.log('0>',s)
    var cks = {}
    while ((a = rx.exec(s)) !== null) {
      if (a[1] !== undefined) {
        var v = a[3].split('')
          .map(function(k){
            if (k === k.toLowerCase()) return k
            var g = countK(cks, k)
              , h = findInK(rks, g)
            //console.log('1>',g, h, x[h])
            return x[h]
          })
          .join('')
        //console.log('1>', v)
        if (!(a[2] in grammar.transformations)) throw new Error(a[2]+' is not a valid transformation rule')
        var t = grammar.transformations[a[2]]
        if (!(v in t)) {
          if ('_' in t) t[v] = t._
          else throw new Error('"'+v+'" does not exists in transformation rule "'+a[2]+'": '+ JSON.stringify(t))
        }
        if (t[v] === '_') t[v] = v
        res += t[v]
      }
      if (a[4] !== undefined) {
        //console.log('2>',i, j, x[j])
        res += x[findInK(rks, a[4])]
      }
      if (a[5] !== undefined) {
        var i = countK(cks,a[5])
          , j = findInK(rks, i)
        //console.log('2>',i, j, x[j])
        res += x[j]
      }
      if (a[6] !== undefined) {
        res+= a[6]
      }
    }
    return res
  }

  function splitred2map(p) {
    var ks = {}
    return p.split('')
      .map(function(k) { return countK(ks, k).join('') })
      .reduce(function(p, c, i) { p[c]=i+1; return p },{})
  }

  function countK(ks, k) {
    if (k in ks) { ks[k]+=1 } else { ks[k]=0 }
    return [k, ks[k]]
  }

  function findInK(ks, g) {
    var k = typeof g === 'string' ? g : g.join('')
    if (k in ks) {
      return ks[k]
    } else {
      return findInK(ks, [g[0], g[1]-1])
    }
  }

  return {
    is_string_pattern: is_string_pattern,
    parse_string_rule: parse_string_rule,
    parse_pattern: parse_pattern
  }
}
