import { t as Ue } from "../../../../../scripts/i18n.js";
import { main_api as cs } from "../../../../../script.js";
import { getFriendlyTokenizerName as Xr, getTextTokens as fs, tokenizers as Zr, getTokenCountAsync as Ks } from "../../../../../scripts/tokenizers.js";
import { debounce as Qr } from "../../../../../scripts/utils.js";
import { debounce_timeout as ei } from "../../../../../scripts/constants.js";
import { getContext as ti } from "../../../../../scripts/extensions.js";
import { callGenericPopup as ni, POPUP_TYPE as si } from "../../../../../scripts/popup.js";
import { SlashCommand as ri } from "../../../../../scripts/slash-commands/SlashCommand.js";
import { SlashCommandParser as ii } from "../../../../../scripts/slash-commands/SlashCommandParser.js";
// @__NO_SIDE_EFFECTS__
function Nn(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const V = {}, it = [], Oe = () => {
}, Ws = () => !1, tn = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), nn = (e) => e.startsWith("onUpdate:"), te = Object.assign, $n = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, oi = Object.prototype.hasOwnProperty, H = (e, t) => oi.call(e, t), P = Array.isArray, ot = (e) => It(e) === "[object Map]", ks = (e) => It(e) === "[object Set]", us = (e) => It(e) === "[object Date]", M = (e) => typeof e == "function", z = (e) => typeof e == "string", Pe = (e) => typeof e == "symbol", N = (e) => e !== null && typeof e == "object", qs = (e) => (N(e) || M(e)) && M(e.then) && M(e.catch), Gs = Object.prototype.toString, It = (e) => Gs.call(e), li = (e) => It(e).slice(8, -1), Js = (e) => It(e) === "[object Object]", Ln = (e) => z(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, yt = /* @__PURE__ */ Nn(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), sn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, ci = /-\w/g, pe = sn(
  (e) => e.replace(ci, (t) => t.slice(1).toUpperCase())
), fi = /\B([A-Z])/g, tt = sn(
  (e) => e.replace(fi, "-$1").toLowerCase()
), zs = sn((e) => e.charAt(0).toUpperCase() + e.slice(1)), gn = sn(
  (e) => e ? `on${zs(e)}` : ""
), Ae = (e, t) => !Object.is(e, t), Wt = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Ys = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Vn = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let as;
const rn = () => as || (as = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function on(e) {
  if (P(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], r = z(s) ? hi(s) : on(s);
      if (r)
        for (const i in r)
          t[i] = r[i];
    }
    return t;
  } else if (z(e) || N(e))
    return e;
}
const ui = /;(?![^(]*\))/g, ai = /:([^]+)/, di = /\/\*[^]*?\*\//g;
function hi(e) {
  const t = {};
  return e.replace(di, "").split(ui).forEach((n) => {
    if (n) {
      const s = n.split(ai);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function Bn(e) {
  let t = "";
  if (z(e))
    t = e;
  else if (P(e))
    for (let n = 0; n < e.length; n++) {
      const s = Bn(e[n]);
      s && (t += s + " ");
    }
  else if (N(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const pi = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", gi = /* @__PURE__ */ Nn(pi);
function Xs(e) {
  return !!e || e === "";
}
function mi(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = Un(e[s], t[s]);
  return n;
}
function Un(e, t) {
  if (e === t) return !0;
  let n = us(e), s = us(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = Pe(e), s = Pe(t), n || s)
    return e === t;
  if (n = P(e), s = P(t), n || s)
    return n && s ? mi(e, t) : !1;
  if (n = N(e), s = N(t), n || s) {
    if (!n || !s)
      return !1;
    const r = Object.keys(e).length, i = Object.keys(t).length;
    if (r !== i)
      return !1;
    for (const o in e) {
      const l = e.hasOwnProperty(o), f = t.hasOwnProperty(o);
      if (l && !f || !l && f || !Un(e[o], t[o]))
        return !1;
    }
  }
  return String(e) === String(t);
}
const Zs = (e) => !!(e && e.__v_isRef === !0), fe = (e) => z(e) ? e : e == null ? "" : P(e) || N(e) && (e.toString === Gs || !M(e.toString)) ? Zs(e) ? fe(e.value) : JSON.stringify(e, Qs, 2) : String(e), Qs = (e, t) => Zs(t) ? Qs(e, t.value) : ot(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, r], i) => (n[mn(s, i) + " =>"] = r, n),
    {}
  )
} : ks(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => mn(n))
} : Pe(t) ? mn(t) : N(t) && !P(t) && !Js(t) ? String(t) : t, mn = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Pe(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
let le;
class _i {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this.__v_skip = !0, this.parent = le, !t && le && (this.index = (le.scopes || (le.scopes = [])).push(
      this
    ) - 1);
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].pause();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].resume();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = le;
      try {
        return le = this, t();
      } finally {
        le = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = le, le = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    this._on > 0 && --this._on === 0 && (le = this.prevScope, this.prevScope = void 0);
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, s;
      for (n = 0, s = this.effects.length; n < s; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, s = this.cleanups.length; n < s; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        for (n = 0, s = this.scopes.length; n < s; n++)
          this.scopes[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const r = this.parent.scopes.pop();
        r && r !== this && (this.parent.scopes[this.index] = r, r.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function bi() {
  return le;
}
let K;
const _n = /* @__PURE__ */ new WeakSet();
class er {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, le && le.active && le.effects.push(this);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, _n.has(this) && (_n.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || nr(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, ds(this), sr(this);
    const t = K, n = ge;
    K = this, ge = !0;
    try {
      return this.fn();
    } finally {
      rr(this), K = t, ge = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        kn(t);
      this.deps = this.depsTail = void 0, ds(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? _n.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    En(this) && this.run();
  }
  get dirty() {
    return En(this);
  }
}
let tr = 0, xt, vt;
function nr(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = vt, vt = e;
    return;
  }
  e.next = xt, xt = e;
}
function Kn() {
  tr++;
}
function Wn() {
  if (--tr > 0)
    return;
  if (vt) {
    let t = vt;
    for (vt = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; xt; ) {
    let t = xt;
    for (xt = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (s) {
          e || (e = s);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function sr(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function rr(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const r = s.prevDep;
    s.version === -1 ? (s === n && (n = r), kn(s), yi(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = r;
  }
  e.deps = t, e.depsTail = n;
}
function En(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (ir(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function ir(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === At) || (e.globalVersion = At, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !En(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = K, s = ge;
  K = e, ge = !0;
  try {
    sr(e);
    const r = e.fn(e._value);
    (t.version === 0 || Ae(r, e._value)) && (e.flags |= 128, e._value = r, t.version++);
  } catch (r) {
    throw t.version++, r;
  } finally {
    K = n, ge = s, rr(e), e.flags &= -3;
  }
}
function kn(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: r } = e;
  if (s && (s.nextSub = r, e.prevSub = void 0), r && (r.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      kn(i, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function yi(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let ge = !0;
const or = [];
function He() {
  or.push(ge), ge = !1;
}
function Ne() {
  const e = or.pop();
  ge = e === void 0 ? !0 : e;
}
function ds(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = K;
    K = void 0;
    try {
      t();
    } finally {
      K = n;
    }
  }
}
let At = 0;
class xi {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class qn {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!K || !ge || K === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== K)
      n = this.activeLink = new xi(K, this), K.deps ? (n.prevDep = K.depsTail, K.depsTail.nextDep = n, K.depsTail = n) : K.deps = K.depsTail = n, lr(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = K.depsTail, n.nextDep = void 0, K.depsTail.nextDep = n, K.depsTail = n, K.deps === n && (K.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, At++, this.notify(t);
  }
  notify(t) {
    Kn();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      Wn();
    }
  }
}
function lr(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        lr(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const An = /* @__PURE__ */ new WeakMap(), Ze = /* @__PURE__ */ Symbol(
  ""
), On = /* @__PURE__ */ Symbol(
  ""
), Ot = /* @__PURE__ */ Symbol(
  ""
);
function Q(e, t, n) {
  if (ge && K) {
    let s = An.get(e);
    s || An.set(e, s = /* @__PURE__ */ new Map());
    let r = s.get(n);
    r || (s.set(n, r = new qn()), r.map = s, r.key = n), r.track();
  }
}
function De(e, t, n, s, r, i) {
  const o = An.get(e);
  if (!o) {
    At++;
    return;
  }
  const l = (f) => {
    f && f.trigger();
  };
  if (Kn(), t === "clear")
    o.forEach(l);
  else {
    const f = P(e), d = f && Ln(n);
    if (f && n === "length") {
      const a = Number(s);
      o.forEach((p, w) => {
        (w === "length" || w === Ot || !Pe(w) && w >= a) && l(p);
      });
    } else
      switch ((n !== void 0 || o.has(void 0)) && l(o.get(n)), d && l(o.get(Ot)), t) {
        case "add":
          f ? d && l(o.get("length")) : (l(o.get(Ze)), ot(e) && l(o.get(On)));
          break;
        case "delete":
          f || (l(o.get(Ze)), ot(e) && l(o.get(On)));
          break;
        case "set":
          ot(e) && l(o.get(Ze));
          break;
      }
  }
  Wn();
}
function nt(e) {
  const t = /* @__PURE__ */ j(e);
  return t === e ? t : (Q(t, "iterate", Ot), /* @__PURE__ */ he(e) ? t : t.map(me));
}
function ln(e) {
  return Q(e = /* @__PURE__ */ j(e), "iterate", Ot), e;
}
function Ce(e, t) {
  return /* @__PURE__ */ $e(e) ? ft(/* @__PURE__ */ Qe(e) ? me(t) : t) : me(t);
}
const vi = {
  __proto__: null,
  [Symbol.iterator]() {
    return bn(this, Symbol.iterator, (e) => Ce(this, e));
  },
  concat(...e) {
    return nt(this).concat(
      ...e.map((t) => P(t) ? nt(t) : t)
    );
  },
  entries() {
    return bn(this, "entries", (e) => (e[1] = Ce(this, e[1]), e));
  },
  every(e, t) {
    return Me(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Me(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => Ce(this, s)),
      arguments
    );
  },
  find(e, t) {
    return Me(
      this,
      "find",
      e,
      t,
      (n) => Ce(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return Me(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Me(
      this,
      "findLast",
      e,
      t,
      (n) => Ce(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return Me(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Me(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return yn(this, "includes", e);
  },
  indexOf(...e) {
    return yn(this, "indexOf", e);
  },
  join(e) {
    return nt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return yn(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Me(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return mt(this, "pop");
  },
  push(...e) {
    return mt(this, "push", e);
  },
  reduce(e, ...t) {
    return hs(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return hs(this, "reduceRight", e, t);
  },
  shift() {
    return mt(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Me(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return mt(this, "splice", e);
  },
  toReversed() {
    return nt(this).toReversed();
  },
  toSorted(e) {
    return nt(this).toSorted(e);
  },
  toSpliced(...e) {
    return nt(this).toSpliced(...e);
  },
  unshift(...e) {
    return mt(this, "unshift", e);
  },
  values() {
    return bn(this, "values", (e) => Ce(this, e));
  }
};
function bn(e, t, n) {
  const s = ln(e), r = s[t]();
  return s !== e && !/* @__PURE__ */ he(e) && (r._next = r.next, r.next = () => {
    const i = r._next();
    return i.done || (i.value = n(i.value)), i;
  }), r;
}
const Si = Array.prototype;
function Me(e, t, n, s, r, i) {
  const o = ln(e), l = o !== e && !/* @__PURE__ */ he(e), f = o[t];
  if (f !== Si[t]) {
    const p = f.apply(e, i);
    return l ? me(p) : p;
  }
  let d = n;
  o !== e && (l ? d = function(p, w) {
    return n.call(this, Ce(e, p), w, e);
  } : n.length > 2 && (d = function(p, w) {
    return n.call(this, p, w, e);
  }));
  const a = f.call(o, d, s);
  return l && r ? r(a) : a;
}
function hs(e, t, n, s) {
  const r = ln(e), i = r !== e && !/* @__PURE__ */ he(e);
  let o = n, l = !1;
  r !== e && (i ? (l = s.length === 0, o = function(d, a, p) {
    return l && (l = !1, d = Ce(e, d)), n.call(this, d, Ce(e, a), p, e);
  }) : n.length > 3 && (o = function(d, a, p) {
    return n.call(this, d, a, p, e);
  }));
  const f = r[t](o, ...s);
  return l ? Ce(e, f) : f;
}
function yn(e, t, n) {
  const s = /* @__PURE__ */ j(e);
  Q(s, "iterate", Ot);
  const r = s[t](...n);
  return (r === -1 || r === !1) && /* @__PURE__ */ Yn(n[0]) ? (n[0] = /* @__PURE__ */ j(n[0]), s[t](...n)) : r;
}
function mt(e, t, n = []) {
  He(), Kn();
  const s = (/* @__PURE__ */ j(e))[t].apply(e, n);
  return Wn(), Ne(), s;
}
const wi = /* @__PURE__ */ Nn("__proto__,__v_isRef,__isVue"), cr = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Pe)
);
function Ti(e) {
  Pe(e) || (e = String(e));
  const t = /* @__PURE__ */ j(this);
  return Q(t, "has", e), t.hasOwnProperty(e);
}
class fr {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, s) {
    if (n === "__v_skip") return t.__v_skip;
    const r = this._isReadonly, i = this._isShallow;
    if (n === "__v_isReactive")
      return !r;
    if (n === "__v_isReadonly")
      return r;
    if (n === "__v_isShallow")
      return i;
    if (n === "__v_raw")
      return s === (r ? i ? Di : hr : i ? dr : ar).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const o = P(t);
    if (!r) {
      let f;
      if (o && (f = vi[n]))
        return f;
      if (n === "hasOwnProperty")
        return Ti;
    }
    const l = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ ee(t) ? t : s
    );
    if ((Pe(n) ? cr.has(n) : wi(n)) || (r || Q(t, "get", n), i))
      return l;
    if (/* @__PURE__ */ ee(l)) {
      const f = o && Ln(n) ? l : l.value;
      return r && N(f) ? /* @__PURE__ */ Fn(f) : f;
    }
    return N(l) ? r ? /* @__PURE__ */ Fn(l) : /* @__PURE__ */ Jn(l) : l;
  }
}
class ur extends fr {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, r) {
    let i = t[n];
    const o = P(t) && Ln(n);
    if (!this._isShallow) {
      const d = /* @__PURE__ */ $e(i);
      if (!/* @__PURE__ */ he(s) && !/* @__PURE__ */ $e(s) && (i = /* @__PURE__ */ j(i), s = /* @__PURE__ */ j(s)), !o && /* @__PURE__ */ ee(i) && !/* @__PURE__ */ ee(s))
        return d || (i.value = s), !0;
    }
    const l = o ? Number(n) < t.length : H(t, n), f = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ ee(t) ? t : r
    );
    return t === /* @__PURE__ */ j(r) && (l ? Ae(s, i) && De(t, "set", n, s) : De(t, "add", n, s)), f;
  }
  deleteProperty(t, n) {
    const s = H(t, n);
    t[n];
    const r = Reflect.deleteProperty(t, n);
    return r && s && De(t, "delete", n, void 0), r;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!Pe(n) || !cr.has(n)) && Q(t, "has", n), s;
  }
  ownKeys(t) {
    return Q(
      t,
      "iterate",
      P(t) ? "length" : Ze
    ), Reflect.ownKeys(t);
  }
}
class Ci extends fr {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return !0;
  }
  deleteProperty(t, n) {
    return !0;
  }
}
const Ei = /* @__PURE__ */ new ur(), Ai = /* @__PURE__ */ new Ci(), Oi = /* @__PURE__ */ new ur(!0);
const Pn = (e) => e, Vt = (e) => Reflect.getPrototypeOf(e);
function Pi(e, t, n) {
  return function(...s) {
    const r = this.__v_raw, i = /* @__PURE__ */ j(r), o = ot(i), l = e === "entries" || e === Symbol.iterator && o, f = e === "keys" && o, d = r[e](...s), a = n ? Pn : t ? ft : me;
    return !t && Q(
      i,
      "iterate",
      f ? On : Ze
    ), te(
      // inheriting all iterator properties
      Object.create(d),
      {
        // iterator protocol
        next() {
          const { value: p, done: w } = d.next();
          return w ? { value: p, done: w } : {
            value: l ? [a(p[0]), a(p[1])] : a(p),
            done: w
          };
        }
      }
    );
  };
}
function Bt(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Fi(e, t) {
  const n = {
    get(r) {
      const i = this.__v_raw, o = /* @__PURE__ */ j(i), l = /* @__PURE__ */ j(r);
      e || (Ae(r, l) && Q(o, "get", r), Q(o, "get", l));
      const { has: f } = Vt(o), d = t ? Pn : e ? ft : me;
      if (f.call(o, r))
        return d(i.get(r));
      if (f.call(o, l))
        return d(i.get(l));
      i !== o && i.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !e && Q(/* @__PURE__ */ j(r), "iterate", Ze), r.size;
    },
    has(r) {
      const i = this.__v_raw, o = /* @__PURE__ */ j(i), l = /* @__PURE__ */ j(r);
      return e || (Ae(r, l) && Q(o, "has", r), Q(o, "has", l)), r === l ? i.has(r) : i.has(r) || i.has(l);
    },
    forEach(r, i) {
      const o = this, l = o.__v_raw, f = /* @__PURE__ */ j(l), d = t ? Pn : e ? ft : me;
      return !e && Q(f, "iterate", Ze), l.forEach((a, p) => r.call(i, d(a), d(p), o));
    }
  };
  return te(
    n,
    e ? {
      add: Bt("add"),
      set: Bt("set"),
      delete: Bt("delete"),
      clear: Bt("clear")
    } : {
      add(r) {
        const i = /* @__PURE__ */ j(this), o = Vt(i), l = /* @__PURE__ */ j(r), f = !t && !/* @__PURE__ */ he(r) && !/* @__PURE__ */ $e(r) ? l : r;
        return o.has.call(i, f) || Ae(r, f) && o.has.call(i, r) || Ae(l, f) && o.has.call(i, l) || (i.add(f), De(i, "add", f, f)), this;
      },
      set(r, i) {
        !t && !/* @__PURE__ */ he(i) && !/* @__PURE__ */ $e(i) && (i = /* @__PURE__ */ j(i));
        const o = /* @__PURE__ */ j(this), { has: l, get: f } = Vt(o);
        let d = l.call(o, r);
        d || (r = /* @__PURE__ */ j(r), d = l.call(o, r));
        const a = f.call(o, r);
        return o.set(r, i), d ? Ae(i, a) && De(o, "set", r, i) : De(o, "add", r, i), this;
      },
      delete(r) {
        const i = /* @__PURE__ */ j(this), { has: o, get: l } = Vt(i);
        let f = o.call(i, r);
        f || (r = /* @__PURE__ */ j(r), f = o.call(i, r)), l && l.call(i, r);
        const d = i.delete(r);
        return f && De(i, "delete", r, void 0), d;
      },
      clear() {
        const r = /* @__PURE__ */ j(this), i = r.size !== 0, o = r.clear();
        return i && De(
          r,
          "clear",
          void 0,
          void 0
        ), o;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((r) => {
    n[r] = Pi(r, e, t);
  }), n;
}
function Gn(e, t) {
  const n = Fi(e, t);
  return (s, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? s : Reflect.get(
    H(n, r) && r in s ? n : s,
    r,
    i
  );
}
const Mi = {
  get: /* @__PURE__ */ Gn(!1, !1)
}, Ii = {
  get: /* @__PURE__ */ Gn(!1, !0)
}, Ri = {
  get: /* @__PURE__ */ Gn(!0, !1)
};
const ar = /* @__PURE__ */ new WeakMap(), dr = /* @__PURE__ */ new WeakMap(), hr = /* @__PURE__ */ new WeakMap(), Di = /* @__PURE__ */ new WeakMap();
function ji(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function Hi(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : ji(li(e));
}
// @__NO_SIDE_EFFECTS__
function Jn(e) {
  return /* @__PURE__ */ $e(e) ? e : zn(
    e,
    !1,
    Ei,
    Mi,
    ar
  );
}
// @__NO_SIDE_EFFECTS__
function Ni(e) {
  return zn(
    e,
    !1,
    Oi,
    Ii,
    dr
  );
}
// @__NO_SIDE_EFFECTS__
function Fn(e) {
  return zn(
    e,
    !0,
    Ai,
    Ri,
    hr
  );
}
function zn(e, t, n, s, r) {
  if (!N(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const i = Hi(e);
  if (i === 0)
    return e;
  const o = r.get(e);
  if (o)
    return o;
  const l = new Proxy(
    e,
    i === 2 ? s : n
  );
  return r.set(e, l), l;
}
// @__NO_SIDE_EFFECTS__
function Qe(e) {
  return /* @__PURE__ */ $e(e) ? /* @__PURE__ */ Qe(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function $e(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function he(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function Yn(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function j(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ j(t) : e;
}
function $i(e) {
  return !H(e, "__v_skip") && Object.isExtensible(e) && Ys(e, "__v_skip", !0), e;
}
const me = (e) => N(e) ? /* @__PURE__ */ Jn(e) : e, ft = (e) => N(e) ? /* @__PURE__ */ Fn(e) : e;
// @__NO_SIDE_EFFECTS__
function ee(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function Ut(e) {
  return Li(e, !1);
}
function Li(e, t) {
  return /* @__PURE__ */ ee(e) ? e : new Vi(e, t);
}
class Vi {
  constructor(t, n) {
    this.dep = new qn(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ j(t), this._value = n ? t : me(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ he(t) || /* @__PURE__ */ $e(t);
    t = s ? t : /* @__PURE__ */ j(t), Ae(t, n) && (this._rawValue = t, this._value = s ? t : me(t), this.dep.trigger());
  }
}
function we(e) {
  return /* @__PURE__ */ ee(e) ? e.value : e;
}
const Bi = {
  get: (e, t, n) => t === "__v_raw" ? e : we(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const r = e[t];
    return /* @__PURE__ */ ee(r) && !/* @__PURE__ */ ee(n) ? (r.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function pr(e) {
  return /* @__PURE__ */ Qe(e) ? e : new Proxy(e, Bi);
}
class Ui {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new qn(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = At - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    K !== this)
      return nr(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return ir(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function Ki(e, t, n = !1) {
  let s, r;
  return M(e) ? s = e : (s = e.get, r = e.set), new Ui(s, r, n);
}
const Kt = {}, zt = /* @__PURE__ */ new WeakMap();
let ze;
function Wi(e, t = !1, n = ze) {
  if (n) {
    let s = zt.get(n);
    s || zt.set(n, s = []), s.push(e);
  }
}
function ki(e, t, n = V) {
  const { immediate: s, deep: r, once: i, scheduler: o, augmentJob: l, call: f } = n, d = (O) => r ? O : /* @__PURE__ */ he(O) || r === !1 || r === 0 ? je(O, 1) : je(O);
  let a, p, w, T, I = !1, F = !1;
  if (/* @__PURE__ */ ee(e) ? (p = () => e.value, I = /* @__PURE__ */ he(e)) : /* @__PURE__ */ Qe(e) ? (p = () => d(e), I = !0) : P(e) ? (F = !0, I = e.some((O) => /* @__PURE__ */ Qe(O) || /* @__PURE__ */ he(O)), p = () => e.map((O) => {
    if (/* @__PURE__ */ ee(O))
      return O.value;
    if (/* @__PURE__ */ Qe(O))
      return d(O);
    if (M(O))
      return f ? f(O, 2) : O();
  })) : M(e) ? t ? p = f ? () => f(e, 2) : e : p = () => {
    if (w) {
      He();
      try {
        w();
      } finally {
        Ne();
      }
    }
    const O = ze;
    ze = a;
    try {
      return f ? f(e, 3, [T]) : e(T);
    } finally {
      ze = O;
    }
  } : p = Oe, t && r) {
    const O = p, Y = r === !0 ? 1 / 0 : r;
    p = () => je(O(), Y);
  }
  const G = bi(), k = () => {
    a.stop(), G && G.active && $n(G.effects, a);
  };
  if (i && t) {
    const O = t;
    t = (...Y) => {
      O(...Y), k();
    };
  }
  let R = F ? new Array(e.length).fill(Kt) : Kt;
  const W = (O) => {
    if (!(!(a.flags & 1) || !a.dirty && !O))
      if (t) {
        const Y = a.run();
        if (r || I || (F ? Y.some((Ve, _e) => Ae(Ve, R[_e])) : Ae(Y, R))) {
          w && w();
          const Ve = ze;
          ze = a;
          try {
            const _e = [
              Y,
              // pass undefined as the old value when it's changed for the first time
              R === Kt ? void 0 : F && R[0] === Kt ? [] : R,
              T
            ];
            R = Y, f ? f(t, 3, _e) : (
              // @ts-expect-error
              t(..._e)
            );
          } finally {
            ze = Ve;
          }
        }
      } else
        a.run();
  };
  return l && l(W), a = new er(p), a.scheduler = o ? () => o(W, !1) : W, T = (O) => Wi(O, !1, a), w = a.onStop = () => {
    const O = zt.get(a);
    if (O) {
      if (f)
        f(O, 4);
      else
        for (const Y of O) Y();
      zt.delete(a);
    }
  }, t ? s ? W(!0) : R = a.run() : o ? o(W.bind(null, !0), !0) : a.run(), k.pause = a.pause.bind(a), k.resume = a.resume.bind(a), k.stop = k, k;
}
function je(e, t = 1 / 0, n) {
  if (t <= 0 || !N(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ ee(e))
    je(e.value, t, n);
  else if (P(e))
    for (let s = 0; s < e.length; s++)
      je(e[s], t, n);
  else if (ks(e) || ot(e))
    e.forEach((s) => {
      je(s, t, n);
    });
  else if (Js(e)) {
    for (const s in e)
      je(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && je(e[s], t, n);
  }
  return e;
}
function Rt(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (r) {
    cn(r, t, n);
  }
}
function Fe(e, t, n, s) {
  if (M(e)) {
    const r = Rt(e, t, n, s);
    return r && qs(r) && r.catch((i) => {
      cn(i, t, n);
    }), r;
  }
  if (P(e)) {
    const r = [];
    for (let i = 0; i < e.length; i++)
      r.push(Fe(e[i], t, n, s));
    return r;
  }
}
function cn(e, t, n, s = !0) {
  const r = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: o } = t && t.appContext.config || V;
  if (t) {
    let l = t.parent;
    const f = t.proxy, d = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; l; ) {
      const a = l.ec;
      if (a) {
        for (let p = 0; p < a.length; p++)
          if (a[p](e, f, d) === !1)
            return;
      }
      l = l.parent;
    }
    if (i) {
      He(), Rt(i, null, 10, [
        e,
        f,
        d
      ]), Ne();
      return;
    }
  }
  qi(e, n, r, s, o);
}
function qi(e, t, n, s = !0, r = !1) {
  if (r)
    throw e;
  console.error(e);
}
const re = [];
let Te = -1;
const lt = [];
let Ke = null, st = 0;
const gr = /* @__PURE__ */ Promise.resolve();
let Yt = null;
function Gi(e) {
  const t = Yt || gr;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Ji(e) {
  let t = Te + 1, n = re.length;
  for (; t < n; ) {
    const s = t + n >>> 1, r = re[s], i = Pt(r);
    i < e || i === e && r.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function Xn(e) {
  if (!(e.flags & 1)) {
    const t = Pt(e), n = re[re.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Pt(n) ? re.push(e) : re.splice(Ji(t), 0, e), e.flags |= 1, mr();
  }
}
function mr() {
  Yt || (Yt = gr.then(br));
}
function zi(e) {
  P(e) ? lt.push(...e) : Ke && e.id === -1 ? Ke.splice(st + 1, 0, e) : e.flags & 1 || (lt.push(e), e.flags |= 1), mr();
}
function ps(e, t, n = Te + 1) {
  for (; n < re.length; n++) {
    const s = re[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      re.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function _r(e) {
  if (lt.length) {
    const t = [...new Set(lt)].sort(
      (n, s) => Pt(n) - Pt(s)
    );
    if (lt.length = 0, Ke) {
      Ke.push(...t);
      return;
    }
    for (Ke = t, st = 0; st < Ke.length; st++) {
      const n = Ke[st];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    Ke = null, st = 0;
  }
}
const Pt = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function br(e) {
  try {
    for (Te = 0; Te < re.length; Te++) {
      const t = re[Te];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Rt(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Te < re.length; Te++) {
      const t = re[Te];
      t && (t.flags &= -2);
    }
    Te = -1, re.length = 0, _r(), Yt = null, (re.length || lt.length) && br();
  }
}
let de = null, yr = null;
function Xt(e) {
  const t = de;
  return de = e, yr = e && e.type.__scopeId || null, t;
}
function Yi(e, t = de, n) {
  if (!t || e._n)
    return e;
  const s = (...r) => {
    s._d && Cs(-1);
    const i = Xt(t);
    let o;
    try {
      o = e(...r);
    } finally {
      Xt(i), s._d && Cs(1);
    }
    return o;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function Xi(e, t) {
  if (de === null)
    return e;
  const n = dn(de), s = e.dirs || (e.dirs = []);
  for (let r = 0; r < t.length; r++) {
    let [i, o, l, f = V] = t[r];
    i && (M(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && je(o), s.push({
      dir: i,
      instance: n,
      value: o,
      oldValue: void 0,
      arg: l,
      modifiers: f
    }));
  }
  return e;
}
function Ge(e, t, n, s) {
  const r = e.dirs, i = t && t.dirs;
  for (let o = 0; o < r.length; o++) {
    const l = r[o];
    i && (l.oldValue = i[o].value);
    let f = l.dir[s];
    f && (He(), Fe(f, n, 8, [
      e.el,
      l,
      e,
      t
    ]), Ne());
  }
}
function Zi(e, t) {
  if (ie) {
    let n = ie.provides;
    const s = ie.parent && ie.parent.provides;
    s === n && (n = ie.provides = Object.create(s)), n[e] = t;
  }
}
function kt(e, t, n = !1) {
  const s = el();
  if (s || ct) {
    let r = ct ? ct._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (r && e in r)
      return r[e];
    if (arguments.length > 1)
      return n && M(t) ? t.call(s && s.proxy) : t;
  }
}
const Qi = /* @__PURE__ */ Symbol.for("v-scx"), eo = () => kt(Qi);
function qt(e, t, n) {
  return xr(e, t, n);
}
function xr(e, t, n = V) {
  const { immediate: s, deep: r, flush: i, once: o } = n, l = te({}, n), f = t && s || !t && i !== "post";
  let d;
  if (Mt) {
    if (i === "sync") {
      const T = eo();
      d = T.__watcherHandles || (T.__watcherHandles = []);
    } else if (!f) {
      const T = () => {
      };
      return T.stop = Oe, T.resume = Oe, T.pause = Oe, T;
    }
  }
  const a = ie;
  l.call = (T, I, F) => Fe(T, a, I, F);
  let p = !1;
  i === "post" ? l.scheduler = (T) => {
    oe(T, a && a.suspense);
  } : i !== "sync" && (p = !0, l.scheduler = (T, I) => {
    I ? T() : Xn(T);
  }), l.augmentJob = (T) => {
    t && (T.flags |= 4), p && (T.flags |= 2, a && (T.id = a.uid, T.i = a));
  };
  const w = ki(e, t, l);
  return Mt && (d ? d.push(w) : f && w()), w;
}
function to(e, t, n) {
  const s = this.proxy, r = z(e) ? e.includes(".") ? vr(s, e) : () => s[e] : e.bind(s, s);
  let i;
  M(t) ? i = t : (i = t.handler, n = t);
  const o = Dt(this), l = xr(r, i.bind(s), n);
  return o(), l;
}
function vr(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let r = 0; r < n.length && s; r++)
      s = s[n[r]];
    return s;
  };
}
const no = /* @__PURE__ */ Symbol("_vte"), so = (e) => e.__isTeleport, ro = /* @__PURE__ */ Symbol("_leaveCb");
function Zn(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, Zn(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
function Sr(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function gs(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const Zt = /* @__PURE__ */ new WeakMap();
function St(e, t, n, s, r = !1) {
  if (P(e)) {
    e.forEach(
      (F, G) => St(
        F,
        t && (P(t) ? t[G] : t),
        n,
        s,
        r
      )
    );
    return;
  }
  if (wt(s) && !r) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && St(e, t, n, s.component.subTree);
    return;
  }
  const i = s.shapeFlag & 4 ? dn(s.component) : s.el, o = r ? null : i, { i: l, r: f } = e, d = t && t.r, a = l.refs === V ? l.refs = {} : l.refs, p = l.setupState, w = /* @__PURE__ */ j(p), T = p === V ? Ws : (F) => gs(a, F) ? !1 : H(w, F), I = (F, G) => !(G && gs(a, G));
  if (d != null && d !== f) {
    if (ms(t), z(d))
      a[d] = null, T(d) && (p[d] = null);
    else if (/* @__PURE__ */ ee(d)) {
      const F = t;
      I(d, F.k) && (d.value = null), F.k && (a[F.k] = null);
    }
  }
  if (M(f))
    Rt(f, l, 12, [o, a]);
  else {
    const F = z(f), G = /* @__PURE__ */ ee(f);
    if (F || G) {
      const k = () => {
        if (e.f) {
          const R = F ? T(f) ? p[f] : a[f] : I() || !e.k ? f.value : a[e.k];
          if (r)
            P(R) && $n(R, i);
          else if (P(R))
            R.includes(i) || R.push(i);
          else if (F)
            a[f] = [i], T(f) && (p[f] = a[f]);
          else {
            const W = [i];
            I(f, e.k) && (f.value = W), e.k && (a[e.k] = W);
          }
        } else F ? (a[f] = o, T(f) && (p[f] = o)) : G && (I(f, e.k) && (f.value = o), e.k && (a[e.k] = o));
      };
      if (o) {
        const R = () => {
          k(), Zt.delete(e);
        };
        R.id = -1, Zt.set(e, R), oe(R, n);
      } else
        ms(e), k();
    }
  }
}
function ms(e) {
  const t = Zt.get(e);
  t && (t.flags |= 8, Zt.delete(e));
}
rn().requestIdleCallback;
rn().cancelIdleCallback;
const wt = (e) => !!e.type.__asyncLoader, wr = (e) => e.type.__isKeepAlive;
function io(e, t) {
  Tr(e, "a", t);
}
function oo(e, t) {
  Tr(e, "da", t);
}
function Tr(e, t, n = ie) {
  const s = e.__wdc || (e.__wdc = () => {
    let r = n;
    for (; r; ) {
      if (r.isDeactivated)
        return;
      r = r.parent;
    }
    return e();
  });
  if (fn(t, s, n), n) {
    let r = n.parent;
    for (; r && r.parent; )
      wr(r.parent.vnode) && lo(s, t, n, r), r = r.parent;
  }
}
function lo(e, t, n, s) {
  const r = fn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  Cr(() => {
    $n(s[t], r);
  }, n);
}
function fn(e, t, n = ie, s = !1) {
  if (n) {
    const r = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...o) => {
      He();
      const l = Dt(n), f = Fe(t, n, e, o);
      return l(), Ne(), f;
    });
    return s ? r.unshift(i) : r.push(i), i;
  }
}
const Le = (e) => (t, n = ie) => {
  (!Mt || e === "sp") && fn(e, (...s) => t(...s), n);
}, co = Le("bm"), fo = Le("m"), uo = Le(
  "bu"
), ao = Le("u"), ho = Le(
  "bum"
), Cr = Le("um"), po = Le(
  "sp"
), go = Le("rtg"), mo = Le("rtc");
function _o(e, t = ie) {
  fn("ec", e, t);
}
const bo = /* @__PURE__ */ Symbol.for("v-ndc");
function yo(e, t, n, s) {
  let r;
  const i = n, o = P(e);
  if (o || z(e)) {
    const l = o && /* @__PURE__ */ Qe(e);
    let f = !1, d = !1;
    l && (f = !/* @__PURE__ */ he(e), d = /* @__PURE__ */ $e(e), e = ln(e)), r = new Array(e.length);
    for (let a = 0, p = e.length; a < p; a++)
      r[a] = t(
        f ? d ? ft(me(e[a])) : me(e[a]) : e[a],
        a,
        void 0,
        i
      );
  } else if (typeof e == "number") {
    r = new Array(e);
    for (let l = 0; l < e; l++)
      r[l] = t(l + 1, l, void 0, i);
  } else if (N(e))
    if (e[Symbol.iterator])
      r = Array.from(
        e,
        (l, f) => t(l, f, void 0, i)
      );
    else {
      const l = Object.keys(e);
      r = new Array(l.length);
      for (let f = 0, d = l.length; f < d; f++) {
        const a = l[f];
        r[f] = t(e[a], a, f, i);
      }
    }
  else
    r = [];
  return r;
}
const Mn = (e) => e ? kr(e) ? dn(e) : Mn(e.parent) : null, Tt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ te(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => Mn(e.parent),
    $root: (e) => Mn(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Ar(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      Xn(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Gi.bind(e.proxy)),
    $watch: (e) => to.bind(e)
  })
), xn = (e, t) => e !== V && !e.__isScriptSetup && H(e, t), xo = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: r, props: i, accessCache: o, type: l, appContext: f } = e;
    if (t[0] !== "$") {
      const w = o[t];
      if (w !== void 0)
        switch (w) {
          case 1:
            return s[t];
          case 2:
            return r[t];
          case 4:
            return n[t];
          case 3:
            return i[t];
        }
      else {
        if (xn(s, t))
          return o[t] = 1, s[t];
        if (r !== V && H(r, t))
          return o[t] = 2, r[t];
        if (H(i, t))
          return o[t] = 3, i[t];
        if (n !== V && H(n, t))
          return o[t] = 4, n[t];
        In && (o[t] = 0);
      }
    }
    const d = Tt[t];
    let a, p;
    if (d)
      return t === "$attrs" && Q(e.attrs, "get", ""), d(e);
    if (
      // css module (injected by vue-loader)
      (a = l.__cssModules) && (a = a[t])
    )
      return a;
    if (n !== V && H(n, t))
      return o[t] = 4, n[t];
    if (
      // global properties
      p = f.config.globalProperties, H(p, t)
    )
      return p[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: r, ctx: i } = e;
    return xn(r, t) ? (r[t] = n, !0) : s !== V && H(s, t) ? (s[t] = n, !0) : H(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: r, props: i, type: o }
  }, l) {
    let f;
    return !!(n[l] || e !== V && l[0] !== "$" && H(e, l) || xn(t, l) || H(i, l) || H(s, l) || H(Tt, l) || H(r.config.globalProperties, l) || (f = o.__cssModules) && f[l]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : H(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function _s(e) {
  return P(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let In = !0;
function vo(e) {
  const t = Ar(e), n = e.proxy, s = e.ctx;
  In = !1, t.beforeCreate && bs(t.beforeCreate, e, "bc");
  const {
    // state
    data: r,
    computed: i,
    methods: o,
    watch: l,
    provide: f,
    inject: d,
    // lifecycle
    created: a,
    beforeMount: p,
    mounted: w,
    beforeUpdate: T,
    updated: I,
    activated: F,
    deactivated: G,
    beforeDestroy: k,
    beforeUnmount: R,
    destroyed: W,
    unmounted: O,
    render: Y,
    renderTracked: Ve,
    renderTriggered: _e,
    errorCaptured: Be,
    serverPrefetch: jt,
    // public API
    expose: We,
    inheritAttrs: dt,
    // assets
    components: Ht,
    directives: Nt,
    filters: hn
  } = t;
  if (d && So(d, s, null), o)
    for (const q in o) {
      const B = o[q];
      M(B) && (s[q] = B.bind(n));
    }
  if (r) {
    const q = r.call(n, n);
    N(q) && (e.data = /* @__PURE__ */ Jn(q));
  }
  if (In = !0, i)
    for (const q in i) {
      const B = i[q], ke = M(B) ? B.bind(n, n) : M(B.get) ? B.get.bind(n, n) : Oe, $t = !M(B) && M(B.set) ? B.set.bind(n) : Oe, qe = ol({
        get: ke,
        set: $t
      });
      Object.defineProperty(s, q, {
        enumerable: !0,
        configurable: !0,
        get: () => qe.value,
        set: (be) => qe.value = be
      });
    }
  if (l)
    for (const q in l)
      Er(l[q], s, n, q);
  if (f) {
    const q = M(f) ? f.call(n) : f;
    Reflect.ownKeys(q).forEach((B) => {
      Zi(B, q[B]);
    });
  }
  a && bs(a, e, "c");
  function ne(q, B) {
    P(B) ? B.forEach((ke) => q(ke.bind(n))) : B && q(B.bind(n));
  }
  if (ne(co, p), ne(fo, w), ne(uo, T), ne(ao, I), ne(io, F), ne(oo, G), ne(_o, Be), ne(mo, Ve), ne(go, _e), ne(ho, R), ne(Cr, O), ne(po, jt), P(We))
    if (We.length) {
      const q = e.exposed || (e.exposed = {});
      We.forEach((B) => {
        Object.defineProperty(q, B, {
          get: () => n[B],
          set: (ke) => n[B] = ke,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  Y && e.render === Oe && (e.render = Y), dt != null && (e.inheritAttrs = dt), Ht && (e.components = Ht), Nt && (e.directives = Nt), jt && Sr(e);
}
function So(e, t, n = Oe) {
  P(e) && (e = Rn(e));
  for (const s in e) {
    const r = e[s];
    let i;
    N(r) ? "default" in r ? i = kt(
      r.from || s,
      r.default,
      !0
    ) : i = kt(r.from || s) : i = kt(r), /* @__PURE__ */ ee(i) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (o) => i.value = o
    }) : t[s] = i;
  }
}
function bs(e, t, n) {
  Fe(
    P(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Er(e, t, n, s) {
  let r = s.includes(".") ? vr(n, s) : () => n[s];
  if (z(e)) {
    const i = t[e];
    M(i) && qt(r, i);
  } else if (M(e))
    qt(r, e.bind(n));
  else if (N(e))
    if (P(e))
      e.forEach((i) => Er(i, t, n, s));
    else {
      const i = M(e.handler) ? e.handler.bind(n) : t[e.handler];
      M(i) && qt(r, i, e);
    }
}
function Ar(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: r,
    optionsCache: i,
    config: { optionMergeStrategies: o }
  } = e.appContext, l = i.get(t);
  let f;
  return l ? f = l : !r.length && !n && !s ? f = t : (f = {}, r.length && r.forEach(
    (d) => Qt(f, d, o, !0)
  ), Qt(f, t, o)), N(t) && i.set(t, f), f;
}
function Qt(e, t, n, s = !1) {
  const { mixins: r, extends: i } = t;
  i && Qt(e, i, n, !0), r && r.forEach(
    (o) => Qt(e, o, n, !0)
  );
  for (const o in t)
    if (!(s && o === "expose")) {
      const l = wo[o] || n && n[o];
      e[o] = l ? l(e[o], t[o]) : t[o];
    }
  return e;
}
const wo = {
  data: ys,
  props: xs,
  emits: xs,
  // objects
  methods: bt,
  computed: bt,
  // lifecycle
  beforeCreate: se,
  created: se,
  beforeMount: se,
  mounted: se,
  beforeUpdate: se,
  updated: se,
  beforeDestroy: se,
  beforeUnmount: se,
  destroyed: se,
  unmounted: se,
  activated: se,
  deactivated: se,
  errorCaptured: se,
  serverPrefetch: se,
  // assets
  components: bt,
  directives: bt,
  // watch
  watch: Co,
  // provide / inject
  provide: ys,
  inject: To
};
function ys(e, t) {
  return t ? e ? function() {
    return te(
      M(e) ? e.call(this, this) : e,
      M(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function To(e, t) {
  return bt(Rn(e), Rn(t));
}
function Rn(e) {
  if (P(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function se(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function bt(e, t) {
  return e ? te(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function xs(e, t) {
  return e ? P(e) && P(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : te(
    /* @__PURE__ */ Object.create(null),
    _s(e),
    _s(t ?? {})
  ) : t;
}
function Co(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = te(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = se(e[s], t[s]);
  return n;
}
function Or() {
  return {
    app: null,
    config: {
      isNativeTag: Ws,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let Eo = 0;
function Ao(e, t) {
  return function(s, r = null) {
    M(s) || (s = te({}, s)), r != null && !N(r) && (r = null);
    const i = Or(), o = /* @__PURE__ */ new WeakSet(), l = [];
    let f = !1;
    const d = i.app = {
      _uid: Eo++,
      _component: s,
      _props: r,
      _container: null,
      _context: i,
      _instance: null,
      version: ll,
      get config() {
        return i.config;
      },
      set config(a) {
      },
      use(a, ...p) {
        return o.has(a) || (a && M(a.install) ? (o.add(a), a.install(d, ...p)) : M(a) && (o.add(a), a(d, ...p))), d;
      },
      mixin(a) {
        return i.mixins.includes(a) || i.mixins.push(a), d;
      },
      component(a, p) {
        return p ? (i.components[a] = p, d) : i.components[a];
      },
      directive(a, p) {
        return p ? (i.directives[a] = p, d) : i.directives[a];
      },
      mount(a, p, w) {
        if (!f) {
          const T = d._ceVNode || et(s, r);
          return T.appContext = i, w === !0 ? w = "svg" : w === !1 && (w = void 0), e(T, a, w), f = !0, d._container = a, a.__vue_app__ = d, dn(T.component);
        }
      },
      onUnmount(a) {
        l.push(a);
      },
      unmount() {
        f && (Fe(
          l,
          d._instance,
          16
        ), e(null, d._container), delete d._container.__vue_app__);
      },
      provide(a, p) {
        return i.provides[a] = p, d;
      },
      runWithContext(a) {
        const p = ct;
        ct = d;
        try {
          return a();
        } finally {
          ct = p;
        }
      }
    };
    return d;
  };
}
let ct = null;
const Oo = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${pe(t)}Modifiers`] || e[`${tt(t)}Modifiers`];
function Po(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || V;
  let r = n;
  const i = t.startsWith("update:"), o = i && Oo(s, t.slice(7));
  o && (o.trim && (r = n.map((a) => z(a) ? a.trim() : a)), o.number && (r = n.map(Vn)));
  let l, f = s[l = gn(t)] || // also try camelCase event handler (#2249)
  s[l = gn(pe(t))];
  !f && i && (f = s[l = gn(tt(t))]), f && Fe(
    f,
    e,
    6,
    r
  );
  const d = s[l + "Once"];
  if (d) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[l])
      return;
    e.emitted[l] = !0, Fe(
      d,
      e,
      6,
      r
    );
  }
}
const Fo = /* @__PURE__ */ new WeakMap();
function Pr(e, t, n = !1) {
  const s = n ? Fo : t.emitsCache, r = s.get(e);
  if (r !== void 0)
    return r;
  const i = e.emits;
  let o = {}, l = !1;
  if (!M(e)) {
    const f = (d) => {
      const a = Pr(d, t, !0);
      a && (l = !0, te(o, a));
    };
    !n && t.mixins.length && t.mixins.forEach(f), e.extends && f(e.extends), e.mixins && e.mixins.forEach(f);
  }
  return !i && !l ? (N(e) && s.set(e, null), null) : (P(i) ? i.forEach((f) => o[f] = null) : te(o, i), N(e) && s.set(e, o), o);
}
function un(e, t) {
  return !e || !tn(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), H(e, t[0].toLowerCase() + t.slice(1)) || H(e, tt(t)) || H(e, t));
}
function vs(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: r,
    propsOptions: [i],
    slots: o,
    attrs: l,
    emit: f,
    render: d,
    renderCache: a,
    props: p,
    data: w,
    setupState: T,
    ctx: I,
    inheritAttrs: F
  } = e, G = Xt(e);
  let k, R;
  try {
    if (n.shapeFlag & 4) {
      const O = r || s, Y = O;
      k = Ee(
        d.call(
          Y,
          O,
          a,
          p,
          T,
          w,
          I
        )
      ), R = l;
    } else {
      const O = t;
      k = Ee(
        O.length > 1 ? O(
          p,
          { attrs: l, slots: o, emit: f }
        ) : O(
          p,
          null
        )
      ), R = t.props ? l : Mo(l);
    }
  } catch (O) {
    Ct.length = 0, cn(O, e, 1), k = et(ut);
  }
  let W = k;
  if (R && F !== !1) {
    const O = Object.keys(R), { shapeFlag: Y } = W;
    O.length && Y & 7 && (i && O.some(nn) && (R = Io(
      R,
      i
    )), W = at(W, R, !1, !0));
  }
  return n.dirs && (W = at(W, null, !1, !0), W.dirs = W.dirs ? W.dirs.concat(n.dirs) : n.dirs), n.transition && Zn(W, n.transition), k = W, Xt(G), k;
}
const Mo = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || tn(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Io = (e, t) => {
  const n = {};
  for (const s in e)
    (!nn(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function Ro(e, t, n) {
  const { props: s, children: r, component: i } = e, { props: o, children: l, patchFlag: f } = t, d = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && f >= 0) {
    if (f & 1024)
      return !0;
    if (f & 16)
      return s ? Ss(s, o, d) : !!o;
    if (f & 8) {
      const a = t.dynamicProps;
      for (let p = 0; p < a.length; p++) {
        const w = a[p];
        if (Fr(o, s, w) && !un(d, w))
          return !0;
      }
    }
  } else
    return (r || l) && (!l || !l.$stable) ? !0 : s === o ? !1 : s ? o ? Ss(s, o, d) : !0 : !!o;
  return !1;
}
function Ss(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let r = 0; r < s.length; r++) {
    const i = s[r];
    if (Fr(t, e, i) && !un(n, i))
      return !0;
  }
  return !1;
}
function Fr(e, t, n) {
  const s = e[n], r = t[n];
  return n === "style" && N(s) && N(r) ? !Un(s, r) : s !== r;
}
function Do({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const r = t.subTree;
    if (r.suspense && r.suspense.activeBranch === e && (r.suspense.vnode.el = r.el = s, e = r), r === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const Mr = {}, Ir = () => Object.create(Mr), Rr = (e) => Object.getPrototypeOf(e) === Mr;
function jo(e, t, n, s = !1) {
  const r = {}, i = Ir();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Dr(e, t, r, i);
  for (const o in e.propsOptions[0])
    o in r || (r[o] = void 0);
  n ? e.props = s ? r : /* @__PURE__ */ Ni(r) : e.type.props ? e.props = r : e.props = i, e.attrs = i;
}
function Ho(e, t, n, s) {
  const {
    props: r,
    attrs: i,
    vnode: { patchFlag: o }
  } = e, l = /* @__PURE__ */ j(r), [f] = e.propsOptions;
  let d = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || o > 0) && !(o & 16)
  ) {
    if (o & 8) {
      const a = e.vnode.dynamicProps;
      for (let p = 0; p < a.length; p++) {
        let w = a[p];
        if (un(e.emitsOptions, w))
          continue;
        const T = t[w];
        if (f)
          if (H(i, w))
            T !== i[w] && (i[w] = T, d = !0);
          else {
            const I = pe(w);
            r[I] = Dn(
              f,
              l,
              I,
              T,
              e,
              !1
            );
          }
        else
          T !== i[w] && (i[w] = T, d = !0);
      }
    }
  } else {
    Dr(e, t, r, i) && (d = !0);
    let a;
    for (const p in l)
      (!t || // for camelCase
      !H(t, p) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((a = tt(p)) === p || !H(t, a))) && (f ? n && // for camelCase
      (n[p] !== void 0 || // for kebab-case
      n[a] !== void 0) && (r[p] = Dn(
        f,
        l,
        p,
        void 0,
        e,
        !0
      )) : delete r[p]);
    if (i !== l)
      for (const p in i)
        (!t || !H(t, p)) && (delete i[p], d = !0);
  }
  d && De(e.attrs, "set", "");
}
function Dr(e, t, n, s) {
  const [r, i] = e.propsOptions;
  let o = !1, l;
  if (t)
    for (let f in t) {
      if (yt(f))
        continue;
      const d = t[f];
      let a;
      r && H(r, a = pe(f)) ? !i || !i.includes(a) ? n[a] = d : (l || (l = {}))[a] = d : un(e.emitsOptions, f) || (!(f in s) || d !== s[f]) && (s[f] = d, o = !0);
    }
  if (i) {
    const f = /* @__PURE__ */ j(n), d = l || V;
    for (let a = 0; a < i.length; a++) {
      const p = i[a];
      n[p] = Dn(
        r,
        f,
        p,
        d[p],
        e,
        !H(d, p)
      );
    }
  }
  return o;
}
function Dn(e, t, n, s, r, i) {
  const o = e[n];
  if (o != null) {
    const l = H(o, "default");
    if (l && s === void 0) {
      const f = o.default;
      if (o.type !== Function && !o.skipFactory && M(f)) {
        const { propsDefaults: d } = r;
        if (n in d)
          s = d[n];
        else {
          const a = Dt(r);
          s = d[n] = f.call(
            null,
            t
          ), a();
        }
      } else
        s = f;
      r.ce && r.ce._setProp(n, s);
    }
    o[
      0
      /* shouldCast */
    ] && (i && !l ? s = !1 : o[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === tt(n)) && (s = !0));
  }
  return s;
}
const No = /* @__PURE__ */ new WeakMap();
function jr(e, t, n = !1) {
  const s = n ? No : t.propsCache, r = s.get(e);
  if (r)
    return r;
  const i = e.props, o = {}, l = [];
  let f = !1;
  if (!M(e)) {
    const a = (p) => {
      f = !0;
      const [w, T] = jr(p, t, !0);
      te(o, w), T && l.push(...T);
    };
    !n && t.mixins.length && t.mixins.forEach(a), e.extends && a(e.extends), e.mixins && e.mixins.forEach(a);
  }
  if (!i && !f)
    return N(e) && s.set(e, it), it;
  if (P(i))
    for (let a = 0; a < i.length; a++) {
      const p = pe(i[a]);
      ws(p) && (o[p] = V);
    }
  else if (i)
    for (const a in i) {
      const p = pe(a);
      if (ws(p)) {
        const w = i[a], T = o[p] = P(w) || M(w) ? { type: w } : te({}, w), I = T.type;
        let F = !1, G = !0;
        if (P(I))
          for (let k = 0; k < I.length; ++k) {
            const R = I[k], W = M(R) && R.name;
            if (W === "Boolean") {
              F = !0;
              break;
            } else W === "String" && (G = !1);
          }
        else
          F = M(I) && I.name === "Boolean";
        T[
          0
          /* shouldCast */
        ] = F, T[
          1
          /* shouldCastTrue */
        ] = G, (F || H(T, "default")) && l.push(p);
      }
    }
  const d = [o, l];
  return N(e) && s.set(e, d), d;
}
function ws(e) {
  return e[0] !== "$" && !yt(e);
}
const Qn = (e) => e === "_" || e === "_ctx" || e === "$stable", es = (e) => P(e) ? e.map(Ee) : [Ee(e)], $o = (e, t, n) => {
  if (t._n)
    return t;
  const s = Yi((...r) => es(t(...r)), n);
  return s._c = !1, s;
}, Hr = (e, t, n) => {
  const s = e._ctx;
  for (const r in e) {
    if (Qn(r)) continue;
    const i = e[r];
    if (M(i))
      t[r] = $o(r, i, s);
    else if (i != null) {
      const o = es(i);
      t[r] = () => o;
    }
  }
}, Nr = (e, t) => {
  const n = es(t);
  e.slots.default = () => n;
}, $r = (e, t, n) => {
  for (const s in t)
    (n || !Qn(s)) && (e[s] = t[s]);
}, Lo = (e, t, n) => {
  const s = e.slots = Ir();
  if (e.vnode.shapeFlag & 32) {
    const r = t._;
    r ? ($r(s, t, n), n && Ys(s, "_", r, !0)) : Hr(t, s);
  } else t && Nr(e, t);
}, Vo = (e, t, n) => {
  const { vnode: s, slots: r } = e;
  let i = !0, o = V;
  if (s.shapeFlag & 32) {
    const l = t._;
    l ? n && l === 1 ? i = !1 : $r(r, t, n) : (i = !t.$stable, Hr(t, r)), o = t;
  } else t && (Nr(e, t), o = { default: 1 });
  if (i)
    for (const l in r)
      !Qn(l) && o[l] == null && delete r[l];
}, oe = ko;
function Bo(e) {
  return Uo(e);
}
function Uo(e, t) {
  const n = rn();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: r,
    patchProp: i,
    createElement: o,
    createText: l,
    createComment: f,
    setText: d,
    setElementText: a,
    parentNode: p,
    nextSibling: w,
    setScopeId: T = Oe,
    insertStaticContent: I
  } = e, F = (c, u, h, b = null, g = null, m = null, v = void 0, x = null, y = !!u.dynamicChildren) => {
    if (c === u)
      return;
    c && !_t(c, u) && (b = Lt(c), be(c, g, m, !0), c = null), u.patchFlag === -2 && (y = !1, u.dynamicChildren = null);
    const { type: _, ref: E, shapeFlag: S } = u;
    switch (_) {
      case an:
        G(c, u, h, b);
        break;
      case ut:
        k(c, u, h, b);
        break;
      case Sn:
        c == null && R(u, h, b, v);
        break;
      case ae:
        Ht(
          c,
          u,
          h,
          b,
          g,
          m,
          v,
          x,
          y
        );
        break;
      default:
        S & 1 ? Y(
          c,
          u,
          h,
          b,
          g,
          m,
          v,
          x,
          y
        ) : S & 6 ? Nt(
          c,
          u,
          h,
          b,
          g,
          m,
          v,
          x,
          y
        ) : (S & 64 || S & 128) && _.process(
          c,
          u,
          h,
          b,
          g,
          m,
          v,
          x,
          y,
          pt
        );
    }
    E != null && g ? St(E, c && c.ref, m, u || c, !u) : E == null && c && c.ref != null && St(c.ref, null, m, c, !0);
  }, G = (c, u, h, b) => {
    if (c == null)
      s(
        u.el = l(u.children),
        h,
        b
      );
    else {
      const g = u.el = c.el;
      u.children !== c.children && d(g, u.children);
    }
  }, k = (c, u, h, b) => {
    c == null ? s(
      u.el = f(u.children || ""),
      h,
      b
    ) : u.el = c.el;
  }, R = (c, u, h, b) => {
    [c.el, c.anchor] = I(
      c.children,
      u,
      h,
      b,
      c.el,
      c.anchor
    );
  }, W = ({ el: c, anchor: u }, h, b) => {
    let g;
    for (; c && c !== u; )
      g = w(c), s(c, h, b), c = g;
    s(u, h, b);
  }, O = ({ el: c, anchor: u }) => {
    let h;
    for (; c && c !== u; )
      h = w(c), r(c), c = h;
    r(u);
  }, Y = (c, u, h, b, g, m, v, x, y) => {
    if (u.type === "svg" ? v = "svg" : u.type === "math" && (v = "mathml"), c == null)
      Ve(
        u,
        h,
        b,
        g,
        m,
        v,
        x,
        y
      );
    else {
      const _ = c.el && c.el._isVueCE ? c.el : null;
      try {
        _ && _._beginPatch(), jt(
          c,
          u,
          g,
          m,
          v,
          x,
          y
        );
      } finally {
        _ && _._endPatch();
      }
    }
  }, Ve = (c, u, h, b, g, m, v, x) => {
    let y, _;
    const { props: E, shapeFlag: S, transition: C, dirs: A } = c;
    if (y = c.el = o(
      c.type,
      m,
      E && E.is,
      E
    ), S & 8 ? a(y, c.children) : S & 16 && Be(
      c.children,
      y,
      null,
      b,
      g,
      vn(c, m),
      v,
      x
    ), A && Ge(c, null, b, "created"), _e(y, c, c.scopeId, v, b), E) {
      for (const L in E)
        L !== "value" && !yt(L) && i(y, L, null, E[L], m, b);
      "value" in E && i(y, "value", null, E.value, m), (_ = E.onVnodeBeforeMount) && Se(_, b, c);
    }
    A && Ge(c, null, b, "beforeMount");
    const D = Ko(g, C);
    D && C.beforeEnter(y), s(y, u, h), ((_ = E && E.onVnodeMounted) || D || A) && oe(() => {
      _ && Se(_, b, c), D && C.enter(y), A && Ge(c, null, b, "mounted");
    }, g);
  }, _e = (c, u, h, b, g) => {
    if (h && T(c, h), b)
      for (let m = 0; m < b.length; m++)
        T(c, b[m]);
    if (g) {
      let m = g.subTree;
      if (u === m || Ur(m.type) && (m.ssContent === u || m.ssFallback === u)) {
        const v = g.vnode;
        _e(
          c,
          v,
          v.scopeId,
          v.slotScopeIds,
          g.parent
        );
      }
    }
  }, Be = (c, u, h, b, g, m, v, x, y = 0) => {
    for (let _ = y; _ < c.length; _++) {
      const E = c[_] = x ? Re(c[_]) : Ee(c[_]);
      F(
        null,
        E,
        u,
        h,
        b,
        g,
        m,
        v,
        x
      );
    }
  }, jt = (c, u, h, b, g, m, v) => {
    const x = u.el = c.el;
    let { patchFlag: y, dynamicChildren: _, dirs: E } = u;
    y |= c.patchFlag & 16;
    const S = c.props || V, C = u.props || V;
    let A;
    if (h && Je(h, !1), (A = C.onVnodeBeforeUpdate) && Se(A, h, u, c), E && Ge(u, c, h, "beforeUpdate"), h && Je(h, !0), (S.innerHTML && C.innerHTML == null || S.textContent && C.textContent == null) && a(x, ""), _ ? We(
      c.dynamicChildren,
      _,
      x,
      h,
      b,
      vn(u, g),
      m
    ) : v || B(
      c,
      u,
      x,
      null,
      h,
      b,
      vn(u, g),
      m,
      !1
    ), y > 0) {
      if (y & 16)
        dt(x, S, C, h, g);
      else if (y & 2 && S.class !== C.class && i(x, "class", null, C.class, g), y & 4 && i(x, "style", S.style, C.style, g), y & 8) {
        const D = u.dynamicProps;
        for (let L = 0; L < D.length; L++) {
          const U = D[L], J = S[U], Z = C[U];
          (Z !== J || U === "value") && i(x, U, J, Z, g, h);
        }
      }
      y & 1 && c.children !== u.children && a(x, u.children);
    } else !v && _ == null && dt(x, S, C, h, g);
    ((A = C.onVnodeUpdated) || E) && oe(() => {
      A && Se(A, h, u, c), E && Ge(u, c, h, "updated");
    }, b);
  }, We = (c, u, h, b, g, m, v) => {
    for (let x = 0; x < u.length; x++) {
      const y = c[x], _ = u[x], E = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        y.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (y.type === ae || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !_t(y, _) || // - In the case of a component, it could contain anything.
        y.shapeFlag & 198) ? p(y.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          h
        )
      );
      F(
        y,
        _,
        E,
        null,
        b,
        g,
        m,
        v,
        !0
      );
    }
  }, dt = (c, u, h, b, g) => {
    if (u !== h) {
      if (u !== V)
        for (const m in u)
          !yt(m) && !(m in h) && i(
            c,
            m,
            u[m],
            null,
            g,
            b
          );
      for (const m in h) {
        if (yt(m)) continue;
        const v = h[m], x = u[m];
        v !== x && m !== "value" && i(c, m, x, v, g, b);
      }
      "value" in h && i(c, "value", u.value, h.value, g);
    }
  }, Ht = (c, u, h, b, g, m, v, x, y) => {
    const _ = u.el = c ? c.el : l(""), E = u.anchor = c ? c.anchor : l("");
    let { patchFlag: S, dynamicChildren: C, slotScopeIds: A } = u;
    A && (x = x ? x.concat(A) : A), c == null ? (s(_, h, b), s(E, h, b), Be(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      u.children || [],
      h,
      E,
      g,
      m,
      v,
      x,
      y
    )) : S > 0 && S & 64 && C && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    c.dynamicChildren && c.dynamicChildren.length === C.length ? (We(
      c.dynamicChildren,
      C,
      h,
      g,
      m,
      v,
      x
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (u.key != null || g && u === g.subTree) && Lr(
      c,
      u,
      !0
      /* shallow */
    )) : B(
      c,
      u,
      h,
      E,
      g,
      m,
      v,
      x,
      y
    );
  }, Nt = (c, u, h, b, g, m, v, x, y) => {
    u.slotScopeIds = x, c == null ? u.shapeFlag & 512 ? g.ctx.activate(
      u,
      h,
      b,
      v,
      y
    ) : hn(
      u,
      h,
      b,
      g,
      m,
      v,
      y
    ) : ns(c, u, y);
  }, hn = (c, u, h, b, g, m, v) => {
    const x = c.component = Qo(
      c,
      b,
      g
    );
    if (wr(c) && (x.ctx.renderer = pt), tl(x, !1, v), x.asyncDep) {
      if (g && g.registerDep(x, ne, v), !c.el) {
        const y = x.subTree = et(ut);
        k(null, y, u, h), c.placeholder = y.el;
      }
    } else
      ne(
        x,
        c,
        u,
        h,
        g,
        m,
        v
      );
  }, ns = (c, u, h) => {
    const b = u.component = c.component;
    if (Ro(c, u, h))
      if (b.asyncDep && !b.asyncResolved) {
        q(b, u, h);
        return;
      } else
        b.next = u, b.update();
    else
      u.el = c.el, b.vnode = u;
  }, ne = (c, u, h, b, g, m, v) => {
    const x = () => {
      if (c.isMounted) {
        let { next: S, bu: C, u: A, parent: D, vnode: L } = c;
        {
          const xe = Vr(c);
          if (xe) {
            S && (S.el = L.el, q(c, S, v)), xe.asyncDep.then(() => {
              oe(() => {
                c.isUnmounted || _();
              }, g);
            });
            return;
          }
        }
        let U = S, J;
        Je(c, !1), S ? (S.el = L.el, q(c, S, v)) : S = L, C && Wt(C), (J = S.props && S.props.onVnodeBeforeUpdate) && Se(J, D, S, L), Je(c, !0);
        const Z = vs(c), ye = c.subTree;
        c.subTree = Z, F(
          ye,
          Z,
          // parent may have changed if it's in a teleport
          p(ye.el),
          // anchor may have changed if it's in a fragment
          Lt(ye),
          c,
          g,
          m
        ), S.el = Z.el, U === null && Do(c, Z.el), A && oe(A, g), (J = S.props && S.props.onVnodeUpdated) && oe(
          () => Se(J, D, S, L),
          g
        );
      } else {
        let S;
        const { el: C, props: A } = u, { bm: D, m: L, parent: U, root: J, type: Z } = c, ye = wt(u);
        Je(c, !1), D && Wt(D), !ye && (S = A && A.onVnodeBeforeMount) && Se(S, U, u), Je(c, !0);
        {
          J.ce && J.ce._hasShadowRoot() && J.ce._injectChildStyle(
            Z,
            c.parent ? c.parent.type : void 0
          );
          const xe = c.subTree = vs(c);
          F(
            null,
            xe,
            h,
            b,
            c,
            g,
            m
          ), u.el = xe.el;
        }
        if (L && oe(L, g), !ye && (S = A && A.onVnodeMounted)) {
          const xe = u;
          oe(
            () => Se(S, U, xe),
            g
          );
        }
        (u.shapeFlag & 256 || U && wt(U.vnode) && U.vnode.shapeFlag & 256) && c.a && oe(c.a, g), c.isMounted = !0, u = h = b = null;
      }
    };
    c.scope.on();
    const y = c.effect = new er(x);
    c.scope.off();
    const _ = c.update = y.run.bind(y), E = c.job = y.runIfDirty.bind(y);
    E.i = c, E.id = c.uid, y.scheduler = () => Xn(E), Je(c, !0), _();
  }, q = (c, u, h) => {
    u.component = c;
    const b = c.vnode.props;
    c.vnode = u, c.next = null, Ho(c, u.props, b, h), Vo(c, u.children, h), He(), ps(c), Ne();
  }, B = (c, u, h, b, g, m, v, x, y = !1) => {
    const _ = c && c.children, E = c ? c.shapeFlag : 0, S = u.children, { patchFlag: C, shapeFlag: A } = u;
    if (C > 0) {
      if (C & 128) {
        $t(
          _,
          S,
          h,
          b,
          g,
          m,
          v,
          x,
          y
        );
        return;
      } else if (C & 256) {
        ke(
          _,
          S,
          h,
          b,
          g,
          m,
          v,
          x,
          y
        );
        return;
      }
    }
    A & 8 ? (E & 16 && ht(_, g, m), S !== _ && a(h, S)) : E & 16 ? A & 16 ? $t(
      _,
      S,
      h,
      b,
      g,
      m,
      v,
      x,
      y
    ) : ht(_, g, m, !0) : (E & 8 && a(h, ""), A & 16 && Be(
      S,
      h,
      b,
      g,
      m,
      v,
      x,
      y
    ));
  }, ke = (c, u, h, b, g, m, v, x, y) => {
    c = c || it, u = u || it;
    const _ = c.length, E = u.length, S = Math.min(_, E);
    let C;
    for (C = 0; C < S; C++) {
      const A = u[C] = y ? Re(u[C]) : Ee(u[C]);
      F(
        c[C],
        A,
        h,
        null,
        g,
        m,
        v,
        x,
        y
      );
    }
    _ > E ? ht(
      c,
      g,
      m,
      !0,
      !1,
      S
    ) : Be(
      u,
      h,
      b,
      g,
      m,
      v,
      x,
      y,
      S
    );
  }, $t = (c, u, h, b, g, m, v, x, y) => {
    let _ = 0;
    const E = u.length;
    let S = c.length - 1, C = E - 1;
    for (; _ <= S && _ <= C; ) {
      const A = c[_], D = u[_] = y ? Re(u[_]) : Ee(u[_]);
      if (_t(A, D))
        F(
          A,
          D,
          h,
          null,
          g,
          m,
          v,
          x,
          y
        );
      else
        break;
      _++;
    }
    for (; _ <= S && _ <= C; ) {
      const A = c[S], D = u[C] = y ? Re(u[C]) : Ee(u[C]);
      if (_t(A, D))
        F(
          A,
          D,
          h,
          null,
          g,
          m,
          v,
          x,
          y
        );
      else
        break;
      S--, C--;
    }
    if (_ > S) {
      if (_ <= C) {
        const A = C + 1, D = A < E ? u[A].el : b;
        for (; _ <= C; )
          F(
            null,
            u[_] = y ? Re(u[_]) : Ee(u[_]),
            h,
            D,
            g,
            m,
            v,
            x,
            y
          ), _++;
      }
    } else if (_ > C)
      for (; _ <= S; )
        be(c[_], g, m, !0), _++;
    else {
      const A = _, D = _, L = /* @__PURE__ */ new Map();
      for (_ = D; _ <= C; _++) {
        const ce = u[_] = y ? Re(u[_]) : Ee(u[_]);
        ce.key != null && L.set(ce.key, _);
      }
      let U, J = 0;
      const Z = C - D + 1;
      let ye = !1, xe = 0;
      const gt = new Array(Z);
      for (_ = 0; _ < Z; _++) gt[_] = 0;
      for (_ = A; _ <= S; _++) {
        const ce = c[_];
        if (J >= Z) {
          be(ce, g, m, !0);
          continue;
        }
        let ve;
        if (ce.key != null)
          ve = L.get(ce.key);
        else
          for (U = D; U <= C; U++)
            if (gt[U - D] === 0 && _t(ce, u[U])) {
              ve = U;
              break;
            }
        ve === void 0 ? be(ce, g, m, !0) : (gt[ve - D] = _ + 1, ve >= xe ? xe = ve : ye = !0, F(
          ce,
          u[ve],
          h,
          null,
          g,
          m,
          v,
          x,
          y
        ), J++);
      }
      const is = ye ? Wo(gt) : it;
      for (U = is.length - 1, _ = Z - 1; _ >= 0; _--) {
        const ce = D + _, ve = u[ce], os = u[ce + 1], ls = ce + 1 < E ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          os.el || Br(os)
        ) : b;
        gt[_] === 0 ? F(
          null,
          ve,
          h,
          ls,
          g,
          m,
          v,
          x,
          y
        ) : ye && (U < 0 || _ !== is[U] ? qe(ve, h, ls, 2) : U--);
      }
    }
  }, qe = (c, u, h, b, g = null) => {
    const { el: m, type: v, transition: x, children: y, shapeFlag: _ } = c;
    if (_ & 6) {
      qe(c.component.subTree, u, h, b);
      return;
    }
    if (_ & 128) {
      c.suspense.move(u, h, b);
      return;
    }
    if (_ & 64) {
      v.move(c, u, h, pt);
      return;
    }
    if (v === ae) {
      s(m, u, h);
      for (let S = 0; S < y.length; S++)
        qe(y[S], u, h, b);
      s(c.anchor, u, h);
      return;
    }
    if (v === Sn) {
      W(c, u, h);
      return;
    }
    if (b !== 2 && _ & 1 && x)
      if (b === 0)
        x.beforeEnter(m), s(m, u, h), oe(() => x.enter(m), g);
      else {
        const { leave: S, delayLeave: C, afterLeave: A } = x, D = () => {
          c.ctx.isUnmounted ? r(m) : s(m, u, h);
        }, L = () => {
          m._isLeaving && m[ro](
            !0
            /* cancelled */
          ), S(m, () => {
            D(), A && A();
          });
        };
        C ? C(m, D, L) : L();
      }
    else
      s(m, u, h);
  }, be = (c, u, h, b = !1, g = !1) => {
    const {
      type: m,
      props: v,
      ref: x,
      children: y,
      dynamicChildren: _,
      shapeFlag: E,
      patchFlag: S,
      dirs: C,
      cacheIndex: A,
      memo: D
    } = c;
    if (S === -2 && (g = !1), x != null && (He(), St(x, null, h, c, !0), Ne()), A != null && (u.renderCache[A] = void 0), E & 256) {
      u.ctx.deactivate(c);
      return;
    }
    const L = E & 1 && C, U = !wt(c);
    let J;
    if (U && (J = v && v.onVnodeBeforeUnmount) && Se(J, u, c), E & 6)
      Yr(c.component, h, b);
    else {
      if (E & 128) {
        c.suspense.unmount(h, b);
        return;
      }
      L && Ge(c, null, u, "beforeUnmount"), E & 64 ? c.type.remove(
        c,
        u,
        h,
        pt,
        b
      ) : _ && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !_.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (m !== ae || S > 0 && S & 64) ? ht(
        _,
        u,
        h,
        !1,
        !0
      ) : (m === ae && S & 384 || !g && E & 16) && ht(y, u, h), b && ss(c);
    }
    const Z = D != null && A == null;
    (U && (J = v && v.onVnodeUnmounted) || L || Z) && oe(() => {
      J && Se(J, u, c), L && Ge(c, null, u, "unmounted"), Z && (c.el = null);
    }, h);
  }, ss = (c) => {
    const { type: u, el: h, anchor: b, transition: g } = c;
    if (u === ae) {
      zr(h, b);
      return;
    }
    if (u === Sn) {
      O(c);
      return;
    }
    const m = () => {
      r(h), g && !g.persisted && g.afterLeave && g.afterLeave();
    };
    if (c.shapeFlag & 1 && g && !g.persisted) {
      const { leave: v, delayLeave: x } = g, y = () => v(h, m);
      x ? x(c.el, m, y) : y();
    } else
      m();
  }, zr = (c, u) => {
    let h;
    for (; c !== u; )
      h = w(c), r(c), c = h;
    r(u);
  }, Yr = (c, u, h) => {
    const { bum: b, scope: g, job: m, subTree: v, um: x, m: y, a: _ } = c;
    Ts(y), Ts(_), b && Wt(b), g.stop(), m && (m.flags |= 8, be(v, c, u, h)), x && oe(x, u), oe(() => {
      c.isUnmounted = !0;
    }, u);
  }, ht = (c, u, h, b = !1, g = !1, m = 0) => {
    for (let v = m; v < c.length; v++)
      be(c[v], u, h, b, g);
  }, Lt = (c) => {
    if (c.shapeFlag & 6)
      return Lt(c.component.subTree);
    if (c.shapeFlag & 128)
      return c.suspense.next();
    const u = w(c.anchor || c.el), h = u && u[no];
    return h ? w(h) : u;
  };
  let pn = !1;
  const rs = (c, u, h) => {
    let b;
    c == null ? u._vnode && (be(u._vnode, null, null, !0), b = u._vnode.component) : F(
      u._vnode || null,
      c,
      u,
      null,
      null,
      null,
      h
    ), u._vnode = c, pn || (pn = !0, ps(b), _r(), pn = !1);
  }, pt = {
    p: F,
    um: be,
    m: qe,
    r: ss,
    mt: hn,
    mc: Be,
    pc: B,
    pbc: We,
    n: Lt,
    o: e
  };
  return {
    render: rs,
    hydrate: void 0,
    createApp: Ao(rs)
  };
}
function vn({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function Je({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Ko(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Lr(e, t, n = !1) {
  const s = e.children, r = t.children;
  if (P(s) && P(r))
    for (let i = 0; i < s.length; i++) {
      const o = s[i];
      let l = r[i];
      l.shapeFlag & 1 && !l.dynamicChildren && ((l.patchFlag <= 0 || l.patchFlag === 32) && (l = r[i] = Re(r[i]), l.el = o.el), !n && l.patchFlag !== -2 && Lr(o, l)), l.type === an && (l.patchFlag === -1 && (l = r[i] = Re(l)), l.el = o.el), l.type === ut && !l.el && (l.el = o.el);
    }
}
function Wo(e) {
  const t = e.slice(), n = [0];
  let s, r, i, o, l;
  const f = e.length;
  for (s = 0; s < f; s++) {
    const d = e[s];
    if (d !== 0) {
      if (r = n[n.length - 1], e[r] < d) {
        t[s] = r, n.push(s);
        continue;
      }
      for (i = 0, o = n.length - 1; i < o; )
        l = i + o >> 1, e[n[l]] < d ? i = l + 1 : o = l;
      d < e[n[i]] && (i > 0 && (t[s] = n[i - 1]), n[i] = s);
    }
  }
  for (i = n.length, o = n[i - 1]; i-- > 0; )
    n[i] = o, o = t[o];
  return n;
}
function Vr(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Vr(t);
}
function Ts(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function Br(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Br(t.subTree) : null;
}
const Ur = (e) => e.__isSuspense;
function ko(e, t) {
  t && t.pendingBranch ? P(e) ? t.effects.push(...e) : t.effects.push(e) : zi(e);
}
const ae = /* @__PURE__ */ Symbol.for("v-fgt"), an = /* @__PURE__ */ Symbol.for("v-txt"), ut = /* @__PURE__ */ Symbol.for("v-cmt"), Sn = /* @__PURE__ */ Symbol.for("v-stc"), Ct = [];
let ue = null;
function Ye(e = !1) {
  Ct.push(ue = e ? null : []);
}
function qo() {
  Ct.pop(), ue = Ct[Ct.length - 1] || null;
}
let Ft = 1;
function Cs(e, t = !1) {
  Ft += e, e < 0 && ue && t && (ue.hasOnce = !0);
}
function Go(e) {
  return e.dynamicChildren = Ft > 0 ? ue || it : null, qo(), Ft > 0 && ue && ue.push(e), e;
}
function Xe(e, t, n, s, r, i) {
  return Go(
    X(
      e,
      t,
      n,
      s,
      r,
      i,
      !0
    )
  );
}
function Kr(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function _t(e, t) {
  return e.type === t.type && e.key === t.key;
}
const Wr = ({ key: e }) => e ?? null, Gt = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? z(e) || /* @__PURE__ */ ee(e) || M(e) ? { i: de, r: e, k: t, f: !!n } : e : null);
function X(e, t = null, n = null, s = 0, r = null, i = e === ae ? 0 : 1, o = !1, l = !1) {
  const f = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && Wr(t),
    ref: t && Gt(t),
    scopeId: yr,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: i,
    patchFlag: s,
    dynamicProps: r,
    dynamicChildren: null,
    appContext: null,
    ctx: de
  };
  return l ? (ts(f, n), i & 128 && e.normalize(f)) : n && (f.shapeFlag |= z(n) ? 8 : 16), Ft > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  ue && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (f.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  f.patchFlag !== 32 && ue.push(f), f;
}
const et = Jo;
function Jo(e, t = null, n = null, s = 0, r = null, i = !1) {
  if ((!e || e === bo) && (e = ut), Kr(e)) {
    const l = at(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && ts(l, n), Ft > 0 && !i && ue && (l.shapeFlag & 6 ? ue[ue.indexOf(e)] = l : ue.push(l)), l.patchFlag = -2, l;
  }
  if (il(e) && (e = e.__vccOpts), t) {
    t = zo(t);
    let { class: l, style: f } = t;
    l && !z(l) && (t.class = Bn(l)), N(f) && (/* @__PURE__ */ Yn(f) && !P(f) && (f = te({}, f)), t.style = on(f));
  }
  const o = z(e) ? 1 : Ur(e) ? 128 : so(e) ? 64 : N(e) ? 4 : M(e) ? 2 : 0;
  return X(
    e,
    t,
    n,
    s,
    r,
    o,
    i,
    !0
  );
}
function zo(e) {
  return e ? /* @__PURE__ */ Yn(e) || Rr(e) ? te({}, e) : e : null;
}
function at(e, t, n = !1, s = !1) {
  const { props: r, ref: i, patchFlag: o, children: l, transition: f } = e, d = t ? Yo(r || {}, t) : r, a = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: d,
    key: d && Wr(d),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && i ? P(i) ? i.concat(Gt(t)) : [i, Gt(t)] : Gt(t)
    ) : i,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: l,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== ae ? o === -1 ? 16 : o | 16 : o,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: f,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && at(e.ssContent),
    ssFallback: e.ssFallback && at(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return f && s && Zn(
    a,
    f.clone(a)
  ), a;
}
function Et(e = " ", t = 0) {
  return et(an, null, e, t);
}
function Ee(e) {
  return e == null || typeof e == "boolean" ? et(ut) : P(e) ? et(
    ae,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Kr(e) ? Re(e) : et(an, null, String(e));
}
function Re(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : at(e);
}
function ts(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (P(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const r = t.default;
      r && (r._c && (r._d = !1), ts(e, r()), r._c && (r._d = !0));
      return;
    } else {
      n = 32;
      const r = t._;
      !r && !Rr(t) ? t._ctx = de : r === 3 && de && (de.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else M(t) ? (t = { default: t, _ctx: de }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [Et(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function Yo(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const r in s)
      if (r === "class")
        t.class !== s.class && (t.class = Bn([t.class, s.class]));
      else if (r === "style")
        t.style = on([t.style, s.style]);
      else if (tn(r)) {
        const i = t[r], o = s[r];
        o && i !== o && !(P(i) && i.includes(o)) ? t[r] = i ? [].concat(i, o) : o : o == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !nn(r) && (t[r] = o);
      } else r !== "" && (t[r] = s[r]);
  }
  return t;
}
function Se(e, t, n, s = null) {
  Fe(e, t, 7, [
    n,
    s
  ]);
}
const Xo = Or();
let Zo = 0;
function Qo(e, t, n) {
  const s = e.type, r = (t ? t.appContext : e.appContext) || Xo, i = {
    uid: Zo++,
    vnode: e,
    type: s,
    parent: t,
    appContext: r,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new _i(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(r.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: jr(s, r),
    emitsOptions: Pr(s, r),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: V,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: V,
    data: V,
    props: V,
    attrs: V,
    slots: V,
    refs: V,
    setupState: V,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = Po.bind(null, i), e.ce && e.ce(i), i;
}
let ie = null;
const el = () => ie || de;
let en, jn;
{
  const e = rn(), t = (n, s) => {
    let r;
    return (r = e[n]) || (r = e[n] = []), r.push(s), (i) => {
      r.length > 1 ? r.forEach((o) => o(i)) : r[0](i);
    };
  };
  en = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => ie = n
  ), jn = t(
    "__VUE_SSR_SETTERS__",
    (n) => Mt = n
  );
}
const Dt = (e) => {
  const t = ie;
  return en(e), e.scope.on(), () => {
    e.scope.off(), en(t);
  };
}, Es = () => {
  ie && ie.scope.off(), en(null);
};
function kr(e) {
  return e.vnode.shapeFlag & 4;
}
let Mt = !1;
function tl(e, t = !1, n = !1) {
  t && jn(t);
  const { props: s, children: r } = e.vnode, i = kr(e);
  jo(e, s, i, t), Lo(e, r, n || t);
  const o = i ? nl(e, t) : void 0;
  return t && jn(!1), o;
}
function nl(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, xo);
  const { setup: s } = n;
  if (s) {
    He();
    const r = e.setupContext = s.length > 1 ? rl(e) : null, i = Dt(e), o = Rt(
      s,
      e,
      0,
      [
        e.props,
        r
      ]
    ), l = qs(o);
    if (Ne(), i(), (l || e.sp) && !wt(e) && Sr(e), l) {
      if (o.then(Es, Es), t)
        return o.then((f) => {
          As(e, f);
        }).catch((f) => {
          cn(f, e, 0);
        });
      e.asyncDep = o;
    } else
      As(e, o);
  } else
    qr(e);
}
function As(e, t, n) {
  M(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : N(t) && (e.setupState = pr(t)), qr(e);
}
function qr(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || Oe);
  {
    const r = Dt(e);
    He();
    try {
      vo(e);
    } finally {
      Ne(), r();
    }
  }
}
const sl = {
  get(e, t) {
    return Q(e, "get", ""), e[t];
  }
};
function rl(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, sl),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function dn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(pr($i(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in Tt)
        return Tt[n](e);
    },
    has(t, n) {
      return n in t || n in Tt;
    }
  })) : e.proxy;
}
function il(e) {
  return M(e) && "__vccOpts" in e;
}
const ol = (e, t) => /* @__PURE__ */ Ki(e, t, Mt), ll = "3.5.32";
let Hn;
const Os = typeof window < "u" && window.trustedTypes;
if (Os)
  try {
    Hn = /* @__PURE__ */ Os.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const Gr = Hn ? (e) => Hn.createHTML(e) : (e) => e, cl = "http://www.w3.org/2000/svg", fl = "http://www.w3.org/1998/Math/MathML", Ie = typeof document < "u" ? document : null, Ps = Ie && /* @__PURE__ */ Ie.createElement("template"), ul = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const r = t === "svg" ? Ie.createElementNS(cl, e) : t === "mathml" ? Ie.createElementNS(fl, e) : n ? Ie.createElement(e, { is: n }) : Ie.createElement(e);
    return e === "select" && s && s.multiple != null && r.setAttribute("multiple", s.multiple), r;
  },
  createText: (e) => Ie.createTextNode(e),
  createComment: (e) => Ie.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Ie.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, s, r, i) {
    const o = n ? n.previousSibling : t.lastChild;
    if (r && (r === i || r.nextSibling))
      for (; t.insertBefore(r.cloneNode(!0), n), !(r === i || !(r = r.nextSibling)); )
        ;
    else {
      Ps.innerHTML = Gr(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const l = Ps.content;
      if (s === "svg" || s === "mathml") {
        const f = l.firstChild;
        for (; f.firstChild; )
          l.appendChild(f.firstChild);
        l.removeChild(f);
      }
      t.insertBefore(l, n);
    }
    return [
      // first
      o ? o.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, al = /* @__PURE__ */ Symbol("_vtc");
function dl(e, t, n) {
  const s = e[al];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Fs = /* @__PURE__ */ Symbol("_vod"), hl = /* @__PURE__ */ Symbol("_vsh"), pl = /* @__PURE__ */ Symbol(""), gl = /(?:^|;)\s*display\s*:/;
function ml(e, t, n) {
  const s = e.style, r = z(n);
  let i = !1;
  if (n && !r) {
    if (t)
      if (z(t))
        for (const o of t.split(";")) {
          const l = o.slice(0, o.indexOf(":")).trim();
          n[l] == null && Jt(s, l, "");
        }
      else
        for (const o in t)
          n[o] == null && Jt(s, o, "");
    for (const o in n)
      o === "display" && (i = !0), Jt(s, o, n[o]);
  } else if (r) {
    if (t !== n) {
      const o = s[pl];
      o && (n += ";" + o), s.cssText = n, i = gl.test(n);
    }
  } else t && e.removeAttribute("style");
  Fs in e && (e[Fs] = i ? s.display : "", e[hl] && (s.display = "none"));
}
const Ms = /\s*!important$/;
function Jt(e, t, n) {
  if (P(n))
    n.forEach((s) => Jt(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = _l(e, t);
    Ms.test(n) ? e.setProperty(
      tt(s),
      n.replace(Ms, ""),
      "important"
    ) : e[s] = n;
  }
}
const Is = ["Webkit", "Moz", "ms"], wn = {};
function _l(e, t) {
  const n = wn[t];
  if (n)
    return n;
  let s = pe(t);
  if (s !== "filter" && s in e)
    return wn[t] = s;
  s = zs(s);
  for (let r = 0; r < Is.length; r++) {
    const i = Is[r] + s;
    if (i in e)
      return wn[t] = i;
  }
  return t;
}
const Rs = "http://www.w3.org/1999/xlink";
function Ds(e, t, n, s, r, i = gi(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Rs, t.slice(6, t.length)) : e.setAttributeNS(Rs, t, n) : n == null || i && !Xs(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : Pe(n) ? String(n) : n
  );
}
function js(e, t, n, s, r) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? Gr(n) : n);
    return;
  }
  const i = e.tagName;
  if (t === "value" && i !== "PROGRESS" && // custom elements may use _value internally
  !i.includes("-")) {
    const l = i === "OPTION" ? e.getAttribute("value") || "" : e.value, f = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (l !== f || !("_value" in e)) && (e.value = f), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let o = !1;
  if (n === "" || n == null) {
    const l = typeof e[t];
    l === "boolean" ? n = Xs(n) : n == null && l === "string" ? (n = "", o = !0) : l === "number" && (n = 0, o = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  o && e.removeAttribute(r || t);
}
function rt(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function bl(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const Hs = /* @__PURE__ */ Symbol("_vei");
function yl(e, t, n, s, r = null) {
  const i = e[Hs] || (e[Hs] = {}), o = i[t];
  if (s && o)
    o.value = s;
  else {
    const [l, f] = xl(t);
    if (s) {
      const d = i[t] = wl(
        s,
        r
      );
      rt(e, l, d, f);
    } else o && (bl(e, l, o, f), i[t] = void 0);
  }
}
const Ns = /(?:Once|Passive|Capture)$/;
function xl(e) {
  let t;
  if (Ns.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Ns); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : tt(e.slice(2)), t];
}
let Tn = 0;
const vl = /* @__PURE__ */ Promise.resolve(), Sl = () => Tn || (vl.then(() => Tn = 0), Tn = Date.now());
function wl(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    Fe(
      Tl(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = Sl(), n;
}
function Tl(e, t) {
  if (P(t)) {
    const n = e.stopImmediatePropagation;
    return e.stopImmediatePropagation = () => {
      n.call(e), e._stopped = !0;
    }, t.map(
      (s) => (r) => !r._stopped && s && s(r)
    );
  } else
    return t;
}
const $s = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Cl = (e, t, n, s, r, i) => {
  const o = r === "svg";
  t === "class" ? dl(e, s, o) : t === "style" ? ml(e, n, s) : tn(t) ? nn(t) || yl(e, t, n, s, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : El(e, t, s, o)) ? (js(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ds(e, t, s, o, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (Al(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !z(s))) ? js(e, pe(t), s, i, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), Ds(e, t, s, o));
};
function El(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && $s(t) && M(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const r = e.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return $s(t) && z(n) ? !1 : t in e;
}
function Al(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = pe(t);
  return Array.isArray(n) ? n.some((r) => pe(r) === s) : Object.keys(n).some((r) => pe(r) === s);
}
const Ls = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return P(t) ? (n) => Wt(t, n) : t;
};
function Ol(e) {
  e.target.composing = !0;
}
function Vs(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const Cn = /* @__PURE__ */ Symbol("_assign");
function Bs(e, t, n) {
  return t && (e = e.trim()), n && (e = Vn(e)), e;
}
const Pl = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, r) {
    e[Cn] = Ls(r);
    const i = s || r.props && r.props.type === "number";
    rt(e, t ? "change" : "input", (o) => {
      o.target.composing || e[Cn](Bs(e.value, n, i));
    }), (n || i) && rt(e, "change", () => {
      e.value = Bs(e.value, n, i);
    }), t || (rt(e, "compositionstart", Ol), rt(e, "compositionend", Vs), rt(e, "change", Vs));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: r, number: i } }, o) {
    if (e[Cn] = Ls(o), e.composing) return;
    const l = (i || e.type === "number") && !/^0\d/.test(e.value) ? Vn(e.value) : e.value, f = t ?? "";
    if (l === f)
      return;
    const d = e.getRootNode();
    (d instanceof Document || d instanceof ShadowRoot) && d.activeElement === e && e.type !== "range" && (s && t === n || r && e.value.trim() === f) || (e.value = f);
  }
}, Fl = /* @__PURE__ */ te({ patchProp: Cl }, ul);
let Us;
function Ml() {
  return Us || (Us = Bo(Fl));
}
const Jr = ((...e) => {
  const t = Ml().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const r = Rl(s);
    if (!r) return;
    const i = t._component;
    !M(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
    const o = n(r, !1, Il(r));
    return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), o;
  }, t;
});
function Il(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Rl(e) {
  return z(e) ? document.querySelector(e) : e;
}
const Dl = {
  __name: "TokenCounterButton",
  emits: ["open"],
  setup(e) {
    return (t, n) => (Ye(), Xe("div", {
      id: "token_counter",
      class: "list-group-item flex-container flexGap5",
      onClick: n[0] || (n[0] = (s) => t.$emit("open"))
    }, [
      n[1] || (n[1] = X("div", { class: "fa-solid fa-1 extensionsMenuExtensionButton" }, null, -1)),
      Et(" " + fe(we(Ue)`Token Counter`), 1)
    ]));
  }
}, jl = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [s, r] of t)
    n[s] = r;
  return n;
}, Hl = { class: "wide100p" }, Nl = { class: "justifyLeft flex-container flexFlowColumn" }, $l = { class: "wide100p" }, Ll = { key: 0 }, Vl = ["title"], Bl = {
  class: "wide100p textarea_compact",
  readonly: "",
  rows: "1"
}, Ul = {
  __name: "TokenCounterPopup",
  setup(e) {
    const { tokenizerName: t, tokenizerId: n } = Xr(cs), s = /* @__PURE__ */ Ut(""), r = /* @__PURE__ */ Ut(0), i = /* @__PURE__ */ Ut("—"), o = /* @__PURE__ */ Ut([]), l = ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BFFFBF", "#BAE1FF", "#FFBAF3"], f = Qr(async () => {
      const d = s.value;
      if (!d) {
        r.value = 0, i.value = "—", o.value = [];
        return;
      }
      const a = cs === "openai" ? fs(Zr.OPENAI, d) : fs(n, d);
      if (Array.isArray(a) && a.length > 0) {
        if (i.value = `[${a.join(", ")}]`, r.value = a.length, Object.hasOwnProperty.call(a, "chunks")) {
          const p = Object.getOwnPropertyDescriptor(a, "chunks").value;
          o.value = p.map((w, T) => {
            let I = w.replace(/[\u2581\u0120]/g, " ");
            return /^<0x[0-9A-F]+>$/i.test(I) && (I = String.fromCodePoint(parseInt(I.substring(3, I.length - 1), 16))), { text: I, color: l[T % l.length], id: a[T] };
          });
        }
      } else {
        const p = await Ks(d);
        i.value = "—", r.value = p, o.value = [];
      }
    }, ei.relaxed);
    return qt(s, () => f()), (d, a) => (Ye(), Xe("div", Hl, [
      X("h3", null, fe(we(Ue)`Token Counter`), 1),
      X("div", Nl, [
        X("h4", null, fe(we(Ue)`Type / paste in the box below to see the number of tokens in the text.`), 1),
        X("p", null, [
          X("span", null, fe(we(Ue)`Selected tokenizer:`), 1),
          Et(" " + fe(we(t)), 1)
        ]),
        X("div", null, fe(we(Ue)`Input:`), 1),
        Xi(X("textarea", {
          "onUpdate:modelValue": a[0] || (a[0] = (p) => s.value = p),
          class: "wide100p textarea_compact",
          rows: "1"
        }, null, 512), [
          [Pl, s.value]
        ]),
        X("div", null, [
          X("span", null, fe(we(Ue)`Tokens:`), 1),
          a[1] || (a[1] = Et()),
          X("span", null, fe(r.value), 1)
        ]),
        a[2] || (a[2] = X("hr", null, null, -1)),
        X("div", null, fe(we(Ue)`Tokenized text:`), 1),
        X("div", $l, [
          o.value.length > 0 ? (Ye(!0), Xe(ae, { key: 0 }, yo(o.value, (p, w) => (Ye(), Xe(ae, { key: w }, [
            p.text === `
` ? (Ye(), Xe("br", Ll)) : (Ye(), Xe("code", {
              key: 1,
              style: on({ backgroundColor: p.color }),
              title: String(p.id)
            }, fe(p.text), 13, Vl))
          ], 64))), 128)) : (Ye(), Xe(ae, { key: 1 }, [
            Et("—")
          ], 64))
        ]),
        a[3] || (a[3] = X("hr", null, null, -1)),
        X("div", null, fe(we(Ue)`Token IDs:`), 1),
        X("textarea", Bl, fe(i.value), 1)
      ])
    ]));
  }
}, Kl = /* @__PURE__ */ jl(Ul, [["__scopeId", "data-v-deaaecdf"]]);
function Wl() {
  const e = document.createElement("div"), t = Jr(Kl);
  t.mount(e), ni($(e), si.TEXT, "", {
    wide: !0,
    large: !0,
    allowVerticalScrolling: !0
  }).finally(() => {
    t.unmount();
  });
}
async function kl() {
  const n = ti().chat.filter((r) => r.mes && !r.is_system).map((r) => r.mes).join(" "), s = await Ks(n);
  return toastr.success(`Token count: ${s}`), s;
}
function nc() {
  Jr(Dl, {
    onOpen: () => Wl()
  }).mount("#token_counter_wand_container"), ii.addCommandObject(ri.fromProps({
    name: "count",
    callback: async () => String(await kl()),
    returns: "number of tokens",
    helpString: "Counts the number of tokens in the current chat."
  }));
}
export {
  nc as init
};
