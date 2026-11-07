/* Autovalutazione — domande generate del modulo «Ottimizzazione convessa» (convex-optimization).
 * Formato comune: 02_MODULI_TEMATICI/QUIZ_SPEC.md.
 * Ogni generatore: genera(rng, lingua) -> { testo, opzioni[4], corretta, spiegazione, dati }.
 * `dati` (istanza e valori delle 4 opzioni) serve solo al gemello di verifica in quiz/verifica/;
 * l'app lo ignora. Calcoli esatti con frazioni; nessun Math.random.
 * Notazione delle dispense: f(x) = x'Qx (senza 1/2), gradiente 2Qx, Hessiana 2Q, x̃(P), z(P), N(x̄, δ).
 */
(function () {
  "use strict";
  window.QUIZ_GEN = window.QUIZ_GEN || {};
  const LISTA = (QUIZ_GEN["convex-optimization"] = QUIZ_GEN["convex-optimization"] || []);

  const EN = "https://fabiofurini.github.io/convex-optimization/";
  const IT = "https://fabiofurini.github.io/ottimizzazione-convessa/";
  const PAG = {
    c1: ["preliminari/01-insiemi-convessi/", "preliminaries/01-convex-sets/"],
    c2: ["preliminari/02-funzioni-piu-variabili/", "preliminaries/02-functions-several-variables/"],
    c3: ["preliminari/03-funzioni-convesse-concave/", "preliminaries/03-convex-concave-functions/"],
    c4: ["preliminari/04-funzioni-quadratiche/", "preliminaries/04-quadratic-functions/"],
    c5: ["problemi/05-problemi-ottimizzazione/", "problems/05-optimization-problems/"],
    c6: ["problemi/06-problemi-convessi-concavi/", "problems/06-convex-concave-problems/"],
  };
  const CAP = { c1: "01-convex-sets", c2: "02-functions-several-variables", c3: "03-convex-concave-functions",
    c4: "04-quadratic-functions", c5: "05-optimization-problems", c6: "06-convex-concave-problems" };
  const link = (c, ancora) => ({ it: IT + PAG[c][0] + "#" + ancora, en: EN + PAG[c][1] + "#" + ancora });

  /* ---------- utilità ---------- */
  const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
  const sc = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const T = (l, it, en) => (l === "it" ? it : en);
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };

  class Fr {
    constructor(n, d = 1) {
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d); this.n = n / g; this.d = d / g;
    }
    static of(x) { return x instanceof Fr ? x : new Fr(x, 1); }
    add(o) { o = Fr.of(o); return new Fr(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Fr.of(o); return new Fr(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Fr.of(o); return new Fr(this.n * o.n, this.d * o.d); }
    div(o) { o = Fr.of(o); return new Fr(this.n * o.d, this.d * o.n); }
    neg() { return new Fr(-this.n, this.d); }
    eq(o) { o = Fr.of(o); return this.n === o.n && this.d === o.d; }
    lt(o) { o = Fr.of(o); return this.n * o.d < o.n * this.d; }
    s() { return this.d === 1 ? String(this.n) : this.n + "/" + this.d; }
    tex() {
      if (this.d === 1) return String(this.n);
      return (this.n < 0 ? "-" : "") + "\\frac{" + Math.abs(this.n) + "}{" + this.d + "}";
    }
  }
  const F = (n, d) => new Fr(n, d);
  const tx = (v) => (v instanceof Fr ? v.tex() : String(v));
  const vec = (a) => "\\begin{pmatrix} " + a.map(tx).join(" \\\\ ") + " \\end{pmatrix}";
  const mat = (m) => "\\begin{pmatrix} " + m.map((r) => r.map(tx).join(" & ")).join(" \\\\ ") + " \\end{pmatrix}";
  const S = (v) => (Array.isArray(v) ? v.map(S) : v instanceof Fr ? v.s() : v);
  /* polinomio: termini [coefficiente intero o Fr, monomio TeX ("" = costante)] */
  function poly(termini) {
    let out = "";
    for (const [c0, m] of termini) {
      const c = Fr.of(c0);
      if (c.n === 0) continue;
      const neg = c.n < 0, a = neg ? c.neg() : c;
      let corpo = (m === "" ? a.tex() : (a.eq(1) ? "" : a.tex()) + m);
      out += out === "" ? (neg ? "-" + corpo : corpo) : (neg ? " - " + corpo : " + " + corpo);
    }
    return out === "" ? "0" : out;
  }
  const distinte = (opz) => new Set(opz).size === opz.length;
  /* esegue `costruisci` finché le 4 opzioni sono distinte (stesse frasi o stessi valori = rigenera) */
  function ripeti(rng, costruisci) {
    for (let k = 0; k < 500; k++) {
      const r = costruisci();
      if (r && distinte(r.opzioni) && distinte(r.dati.valori.map((v) => JSON.stringify(v)))) return r;
    }
    throw new Error("generatore: nessuna istanza valida");
  }
  const LAMBDA = [F(1, 4), F(1, 3), F(2, 3), F(3, 4), F(1, 5), F(2, 5), F(3, 5), F(4, 5)];
  const X = ["x_1", "x_2"];

  /* ===================== Capitolo 1: insiemi convessi ===================== */

  LISTA.push({
    id: "co-g-cc2", livello: "facile", capitolo: CAP.c1, link: link("c1", "box-1-def-convexcombination"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const p = [ri(rng, -3, 8), ri(rng, -3, 8)], w = [ri(rng, -3, 8), ri(rng, -3, 8)];
        if (p[0] === w[0] || p[1] === w[1]) return null;
        const lam = sc(rng, LAMBDA), mu = F(1).sub(lam);
        const cc = (a, b) => [0, 1].map((i) => a.mul(p[i]).add(b.mul(w[i])));
        const v = [cc(lam, mu), cc(mu, lam), cc(F(1, 2), F(1, 2)), cc(lam, lam)];
        const testo = T(l,
          `Siano ${"${\\boldsymbol p} = " + vec(p) + "$"} e ${"${\\boldsymbol w} = " + vec(w) + "$"}. Qual è la loro combinazione convessa $\\lambda {\\boldsymbol p} + (1-\\lambda){\\boldsymbol w}$ con scalare $\\lambda = ${lam.tex()}$?`,
          `Let ${"${\\boldsymbol p} = " + vec(p) + "$"} and ${"${\\boldsymbol w} = " + vec(w) + "$"}. What is their convex combination $\\lambda {\\boldsymbol p} + (1-\\lambda){\\boldsymbol w}$ with scalar $\\lambda = ${lam.tex()}$?`);
        const sp = T(l,
          `Componente per componente: $${lam.tex()}\\cdot ${p[0]} + ${mu.tex()}\\cdot ${w[0]} = ${v[0][0].tex()}$ e $${lam.tex()}\\cdot ${p[1]} + ${mu.tex()}\\cdot ${w[1]} = ${v[0][1].tex()}$. Errore tipico: scambiare $\\lambda$ e $1-\\lambda$.`,
          `Component by component: $${lam.tex()}\\cdot ${p[0]} + ${mu.tex()}\\cdot ${w[0]} = ${v[0][0].tex()}$ and $${lam.tex()}\\cdot ${p[1]} + ${mu.tex()}\\cdot ${w[1]} = ${v[0][1].tex()}$. Typical mistake: swapping $\\lambda$ and $1-\\lambda$.`);
        return { testo, opzioni: v.map((x) => "$" + vec(x) + "$"), corretta: 0, spiegazione: sp,
          dati: { p, w, lam: lam.s(), valori: S(v) } };
      });
    },
  });

  LISTA.push({
    id: "co-g-cc3", livello: "facile", capitolo: CAP.c1, link: link("c1", "box-3-def-convexcombinationm"),
    genera(rng, l) {
      const PESI = [[F(1, 2), F(1, 4), F(1, 4)], [F(1, 6), F(1, 3), F(1, 2)], [F(1, 5), F(2, 5), F(2, 5)],
        [F(1, 2), F(1, 3), F(1, 6)], [F(3, 5), F(1, 5), F(1, 5)], [F(1, 4), F(1, 4), F(1, 2)]];
      return ripeti(rng, () => {
        const P = [0, 1, 2].map(() => [ri(rng, -2, 9), ri(rng, -2, 9)]);
        const L = sc(rng, PESI);
        const comb = (pesi) => [0, 1].map((i) => pesi.reduce((s, la, k) => s.add(la.mul(P[k][i])), F(0)));
        const v = [comb(L), comb([L[1], L[2], L[0]]), comb([L[2], L[0], L[1]]), comb([F(1, 3), F(1, 3), F(1, 3)])];
        const pts = P.map((x, k) => `${"$" + "{\\boldsymbol p}^{(" + (k + 1) + ")} = " + vec(x) + "$"}`).join(", ");
        const pesi = `$\\lambda_1 = ${L[0].tex()}$, $\\lambda_2 = ${L[1].tex()}$, $\\lambda_3 = ${L[2].tex()}$`;
        const testo = T(l,
          `Qual è la combinazione convessa $\\lambda_1 {\\boldsymbol p}^{(1)} + \\lambda_2 {\\boldsymbol p}^{(2)} + \\lambda_3 {\\boldsymbol p}^{(3)}$ dei punti ${pts}, con scalari ${pesi}?`,
          `What is the convex combination $\\lambda_1 {\\boldsymbol p}^{(1)} + \\lambda_2 {\\boldsymbol p}^{(2)} + \\lambda_3 {\\boldsymbol p}^{(3)}$ of the points ${pts}, with scalars ${pesi}?`);
        const sp = T(l,
          `Il punto è $\\sum_{k=1}^{3} \\lambda_k {\\boldsymbol p}^{(k)} = ${vec(v[0])}$: ogni scalare moltiplica il <em>suo</em> punto. Le altre opzioni associano gli scalari ai punti sbagliati o usano il baricentro (scalari tutti uguali a $\\frac{1}{3}$).`,
          `The point is $\\sum_{k=1}^{3} \\lambda_k {\\boldsymbol p}^{(k)} = ${vec(v[0])}$: each scalar multiplies <em>its own</em> point. The other options pair the scalars with the wrong points or use the centroid (all scalars equal to $\\frac{1}{3}$).`);
        return { testo, opzioni: v.map((x) => "$" + vec(x) + "$"), corretta: 0, spiegazione: sp,
          dati: { P, L: S(L), valori: S(v) } };
      });
    },
  });

  LISTA.push({
    id: "co-g-ball", livello: "facile", capitolo: CAP.c1, link: link("c1", "13-examples-of-convex-sets"),
    linkIt: "13-esempi-di-insiemi-convessi",
    genera(rng, l) {
      return ripeti(rng, () => {
        const q = sc(rng, ["1", "2", "\\infty"]);
        const c = [ri(rng, -2, 4), ri(rng, -2, 4)], r = ri(rng, 2, 4);
        const dist = (d, qq) => (qq === "1" ? Math.abs(d[0]) + Math.abs(d[1])
          : qq === "\\infty" ? Math.max(Math.abs(d[0]), Math.abs(d[1])) : d[0] * d[0] + d[1] * d[1]);
        const dentro = (d, qq) => (qq === "2" ? dist(d, qq) <= r * r : dist(d, qq) <= r);
        const altre = ["1", "2", "\\infty"].filter((x) => x !== q);
        let giusto = null; const sbagli = [];
        for (let t = 0; t < 400 && (giusto === null || sbagli.length < 3); t++) {
          const d = [ri(rng, -r - 1, r + 1), ri(rng, -r - 1, r + 1)];
          if (dentro(d, q)) {
            if (giusto === null && (Math.abs(d[0]) + Math.abs(d[1]) >= r - 1)) giusto = d;
          } else if (sbagli.length < 3 && altre.some((a) => dentro(d, a)) && !sbagli.some((s) => s[0] === d[0] && s[1] === d[1])) {
            sbagli.push(d);
          }
        }
        if (giusto === null || sbagli.length < 3) return null;
        const pts = [giusto, ...sbagli].map((d) => [c[0] + d[0], c[1] + d[1]]);
        const insieme = `\\{ {\\boldsymbol x} \\in \\R^2 : \\|{\\boldsymbol x} - ${vec(c)}\\|_{${q}} \\le ${r} \\}`;
        const testo = T(l, `Quale punto appartiene all'insieme convesso $${insieme}$, cioè alla palla della norma $${q}$ con centro ${"$" + vec(c) + "$"} e raggio $${r}$?`,
          `Which point belongs to the convex set $${insieme}$, that is, to the ball of the norm $${q}$ with center ${"$" + vec(c) + "$"} and radius $${r}$?`);
        const g = giusto;
        const calc = q === "1" ? `|${g[0]}| + |${g[1]}| = ${dist(g, q)} \\le ${r}`
          : q === "2" ? `(${g[0]})^2 + (${g[1]})^2 = ${dist(g, q)} \\le ${r * r}`
          : `\\max\\{|${g[0]}|, |${g[1]}|\\} = ${dist(g, q)} \\le ${r}`;
        const sp = T(l,
          `Per il punto corretto ${"${\\boldsymbol x}$"}, la differenza dal centro è ${"${\\boldsymbol x} - " + vec(c) + " = " + vec(g) + "$"} e $${calc}$. Gli altri punti superano il raggio nella norma $${q}$ (ma starebbero dentro con un'altra norma: errore tipico).`,
          `For the correct point ${"${\\boldsymbol x}$"}, the difference from the center is ${"${\\boldsymbol x} - " + vec(c) + " = " + vec(g) + "$"} and $${calc}$. The other points exceed the radius in the norm $${q}$ (but would be inside with another norm: typical mistake).`);
        return { testo, opzioni: pts.map((x) => "$" + vec(x) + "$"), corretta: 0, spiegazione: sp,
          dati: { q: q === "\\infty" ? "inf" : q, c, r, valori: pts } };
      });
    },
  });

  /* ===================== Capitolo 2: funzioni di più variabili ===================== */

  LISTA.push({
    id: "co-g-grad", livello: "facile", capitolo: CAP.c2, link: link("c2", "box-3-def-gradient"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = sc(rng, [-3, -2, -1, 1, 2, 3]), b = sc(rng, [-2, -1, 1, 2, 3]), c = sc(rng, [-4, -3, -2, 2, 3, 4, 5]);
        const u = sc(rng, [-2, -1, 1, 2, 3]), v = sc(rng, [-2, -1, 1, 2, 3]);
        const g = [2 * a * u * v + c, a * u * u + 2 * b * v];
        const opz = [g, [a * u * v + c, a * u * u + 2 * b * v], [g[1], g[0]], [2 * a * u * v + c, a * u * u + b * v]];
        const f = poly([[a, "x_1^2 x_2"], [b, "x_2^2"], [c, "x_1"]]);
        const testo = T(l,
          `Data $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, qual è il gradiente $\\nabla f$ nel punto ${"$" + vec([u, v]) + "$"}?`,
          `Given $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, what is the gradient $\\nabla f$ at the point ${"$" + vec([u, v]) + "$"}?`);
        const sp = T(l,
          `$\\nabla f({\\boldsymbol x}) = ${vec([poly([[2 * a, "x_1 x_2"], [c, ""]]), poly([[a, "x_1^2"], [2 * b, "x_2"]])])}$, che in ${"$" + vec([u, v]) + "$"} vale $${vec(g)}$. Errori tipici: dimenticare il fattore $2$ delle potenze o scambiare le componenti.`,
          `$\\nabla f({\\boldsymbol x}) = ${vec([poly([[2 * a, "x_1 x_2"], [c, ""]]), poly([[a, "x_1^2"], [2 * b, "x_2"]])])}$, which at ${"$" + vec([u, v]) + "$"} equals $${vec(g)}$. Typical mistakes: forgetting the factor $2$ of the powers or swapping the components.`);
        return { testo, opzioni: opz.map((x) => "$" + vec(x) + "$"), corretta: 0, spiegazione: sp,
          dati: { a, b, c, u, v, valori: opz } };
      });
    },
  });

  LISTA.push({
    id: "co-g-hess", livello: "facile", capitolo: CAP.c2, link: link("c2", "box-4-def-hessian"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = sc(rng, [-2, -1, 1, 2, 3]), b = sc(rng, [-3, -2, -1, 1, 2, 3]), c = sc(rng, [-2, -1, 1, 2]);
        const u = sc(rng, [-2, -1, 1, 2, 3]), v = sc(rng, [-2, -1, 1, 2]);
        const H = [[2 * a * v, 2 * a * u + b], [2 * a * u + b, 6 * c * v]];
        const opz = [H,
          [[2 * a * v, a * u + b], [a * u + b, 6 * c * v]],
          [[2 * a * v, 2 * a * u + b], [2 * a * u + b, 3 * c * v * v]],
          [[6 * c * v, 2 * a * u + b], [2 * a * u + b, 2 * a * v]]];
        const f = poly([[a, "x_1^2 x_2"], [b, "x_1 x_2"], [c, "x_2^3"]]);
        const testo = T(l,
          `Data $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, qual è la matrice Hessiana $\\nabla^2 f$ nel punto ${"$" + vec([u, v]) + "$"}?`,
          `Given $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, what is the Hessian $\\nabla^2 f$ at the point ${"$" + vec([u, v]) + "$"}?`);
        const Hs = mat([[poly([[2 * a, "x_2"]]), poly([[2 * a, "x_1"], [b, ""]])], [poly([[2 * a, "x_1"], [b, ""]]), poly([[6 * c, "x_2"]])]]);
        const sp = T(l,
          `$\\nabla^2 f({\\boldsymbol x}) = ${Hs}$, che in ${"$" + vec([u, v]) + "$"} vale $${mat(H)}$ (simmetrica). Errori tipici: fattore $2$ dimenticato nella derivata mista, derivata prima al posto della seconda, diagonale scambiata.`,
          `$\\nabla^2 f({\\boldsymbol x}) = ${Hs}$, which at ${"$" + vec([u, v]) + "$"} equals $${mat(H)}$ (symmetric). Typical mistakes: factor $2$ forgotten in the mixed derivative, first derivative instead of the second, swapped diagonal.`);
        return { testo, opzioni: opz.map((x) => "$" + mat(x) + "$"), corretta: 0, spiegazione: sp,
          dati: { a, b, c, u, v, valori: opz } };
      });
    },
  });

  LISTA.push({
    id: "co-g-level", livello: "facile", capitolo: CAP.c2, link: link("c2", "box-5-def-levelset"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = ri(rng, -3, 4), b = ri(rng, -3, 4), d = ri(rng, -3, 5);
        if (a === 0 || b === 0) return null;
        const caso = sc(rng, ["cerchio", "cerchio", "cerchio", "punto", "vuoto"]);
        const rr = sc(rng, [2, 3, 4, 5]), rv = sc(rng, [1, 2, 3]);
        const k = caso === "cerchio" ? d + rr * rr : caso === "punto" ? d : d - rv * rv;
        // valori: ["C", c1, c2, raggio] | ["P", c1, c2] | ["V"]
        let v;
        if (caso === "cerchio") v = [["C", a, b, rr], ["C", a, b, rr * rr], ["C", -a, -b, rr], ["V"]];
        else if (caso === "punto") v = [["P", a, b], ["V"], ["P", -a, -b], ["C", a, b, Math.abs(k) || 1]];
        else v = [["V"], ["P", a, b], ["C", a, b, rv], ["C", -a, -b, rv]];
        const fmt = (o) => (o[0] === "V" ? T(l, "l'insieme vuoto", "the empty set")
          : o[0] === "P" ? T(l, `il solo punto $${vec([o[1], o[2]])}$`, `the single point $${vec([o[1], o[2]])}$`)
          : T(l, `la circonferenza di centro $${vec([o[1], o[2]])}$ e raggio $${o[3]}$`, `the circle with center $${vec([o[1], o[2]])}$ and radius $${o[3]}$`));
        const C = vec([a, b]);
        const f = `(x_1 ${a < 0 ? "+ " + (-a) : "- " + a})^2 + (x_2 ${b < 0 ? "+ " + (-b) : "- " + b})^2 ${d < 0 ? "- " + (-d) : d === 0 ? "" : "+ " + d}`;
        const testo = T(l,
          `Per $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, che cos'è l'insieme di livello $L(${k}) = \\{ {\\boldsymbol x} \\in \\R^2 : f({\\boldsymbol x}) = ${k} \\}$?`,
          `For $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, what is the level set $L(${k}) = \\{ {\\boldsymbol x} \\in \\R^2 : f({\\boldsymbol x}) = ${k} \\}$?`);
        const qq = `(x_1 ${a < 0 ? "+ " + (-a) : "- " + a})^2 + (x_2 ${b < 0 ? "+ " + (-b) : "- " + b})^2`;
        const sp = caso === "cerchio"
          ? T(l, `$L(${k})$: $${qq} = ${k - d}$, circonferenza di centro $${C}$ e raggio $\\sqrt{${rr * rr}} = ${rr}$. Errori tipici: raggio $${rr * rr}$ senza radice, segno del centro sbagliato.`,
            `$L(${k})$: $${qq} = ${k - d}$, the circle with center $${C}$ and radius $\\sqrt{${rr * rr}} = ${rr}$. Typical mistakes: radius $${rr * rr}$ without the square root, wrong sign of the center.`)
          : caso === "punto"
            ? T(l, `$L(${k})$: $${qq} = 0$, una somma di quadrati nulla: solo il punto $${C}$.`,
              `$L(${k})$: $${qq} = 0$, a vanishing sum of squares: only the point $${C}$.`)
            : T(l, `$L(${k})$: servirebbe $${qq} = ${k - d} < 0$, impossibile: l'insieme è vuoto.`,
              `$L(${k})$: we would need $${qq} = ${k - d} < 0$, impossible: the set is empty.`);
        return { testo, opzioni: v.map(fmt), corretta: 0, spiegazione: sp, dati: { a, b, d, k, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-descent", livello: "media", capitolo: CAP.c2, link: link("c2", "box-3-def-gradient"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const a1 = sc(rng, [1, 2]), a2 = sc(rng, [1, 2, 3]), h = [ri(rng, -3, 3), ri(rng, -3, 3)];
        const x = [ri(rng, -3, 4), ri(rng, -3, 4)];
        if (x[0] === h[0] || x[1] === h[1]) return null;
        const al = sc(rng, [F(1, 4), F(1, 2), F(1, 8), F(1, 3), F(1, 6)]);
        const g = [2 * a1 * (x[0] - h[0]), 2 * a2 * (x[1] - h[1])];
        const passo = (s, gg, alpha) => [0, 1].map((i) => F(x[i]).add(alpha.mul(gg[i]).mul(s)));
        const opz = [passo(-1, g, al), passo(1, g, al), passo(-1, g, F(1)), passo(-1, g.map((t) => t / 2), al)];
        const f = `${a1 === 1 ? "" : a1}(x_1 ${h[0] < 0 ? "+ " + (-h[0]) : "- " + h[0]})^2 + ${a2 === 1 ? "" : a2}(x_2 ${h[1] < 0 ? "+ " + (-h[1]) : "- " + h[1]})^2`;
        const testo = T(l,
          `Data $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, partendo da $\\bar{\\boldsymbol x} = ${vec(x)}$ ci si sposta di un passo $\\alpha = ${al.tex()}$ nella direzione di massima decrescita, cioè nel punto $\\bar{\\boldsymbol x} - \\alpha\\, \\nabla f(\\bar{\\boldsymbol x})$. Qual è il nuovo punto?`,
          `Given $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, starting from $\\bar{\\boldsymbol x} = ${vec(x)}$ we move by a step $\\alpha = ${al.tex()}$ along the direction of steepest descent, that is, to the point $\\bar{\\boldsymbol x} - \\alpha\\, \\nabla f(\\bar{\\boldsymbol x})$. What is the new point?`);
        const sp = T(l,
          `$\\nabla f(\\bar{\\boldsymbol x}) = ${vec(g)}$, quindi $\\bar{\\boldsymbol x} - ${al.tex()}\\,\\nabla f(\\bar{\\boldsymbol x}) = ${vec(opz[0])}$. Errori tipici: il segno $+$ (direzione di massima crescita), il passo $\\alpha$ dimenticato, il fattore $2$ del gradiente dimenticato.`,
          `$\\nabla f(\\bar{\\boldsymbol x}) = ${vec(g)}$, hence $\\bar{\\boldsymbol x} - ${al.tex()}\\,\\nabla f(\\bar{\\boldsymbol x}) = ${vec(opz[0])}$. Typical mistakes: the sign $+$ (direction of steepest ascent), the step $\\alpha$ forgotten, the factor $2$ of the gradient forgotten.`);
        return { testo, opzioni: opz.map((v) => "$" + vec(v) + "$"), corretta: 0, spiegazione: sp,
          dati: { a1, a2, h, x, al: al.s(), valori: S(opz) } };
      });
    },
  });

  /* ===================== Capitolo 3: funzioni convesse e concave ===================== */

  LISTA.push({
    id: "co-g-norms", livello: "facile", capitolo: CAP.c3, link: link("c3", "box-11-def-pnorms"),
    genera(rng, l) {
      const BASI = [[3, 4], [6, 8], [5, 12], [1, 2, 2], [2, 3, 6], [2, 6, 9], [1, 4, 8], [4, 4, 7], [2, 2, 1], [8, 15]];
      const NORMA2 = { "3,4": 5, "6,8": 10, "5,12": 13, "1,2,2": 3, "2,3,6": 7, "2,6,9": 11, "1,4,8": 9, "4,4,7": 9, "2,2,1": 3, "8,15": 17 };
      return ripeti(rng, () => {
        const base = sc(rng, BASI), n2 = NORMA2[base.join(",")];
        const x = base.map((t) => (rng() < 0.5 ? -t : t));
        for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
        if (!x.some((t) => t < 0)) x[0] = -x[0];
        const ab = x.map(Math.abs);
        const n1 = ab.reduce((s, t) => s + t, 0), ninf = Math.max(...ab), nmin = Math.min(...ab), sgn = x.reduce((s, t) => s + t, 0);
        const v = [[n1, n2, ninf], [sgn, n2, ninf], [n1, n2 * n2, ninf], [n1, n2, nmin]];
        const fm = (t) => `$\\|{\\boldsymbol x}\\|_1 = ${t[0]}$, $\\|{\\boldsymbol x}\\|_2 = ${t[1]}$, $\\|{\\boldsymbol x}\\|_\\infty = ${t[2]}$`;
        const testo = T(l, `Per il vettore ${"${\\boldsymbol x} = " + vec(x) + "$"}, quanto valgono le norme $\\|{\\boldsymbol x}\\|_1$, $\\|{\\boldsymbol x}\\|_2$ e $\\|{\\boldsymbol x}\\|_\\infty$?`,
          `For the vector ${"${\\boldsymbol x} = " + vec(x) + "$"}, what are the norms $\\|{\\boldsymbol x}\\|_1$, $\\|{\\boldsymbol x}\\|_2$ and $\\|{\\boldsymbol x}\\|_\\infty$?`);
        const sp = T(l,
          `$\\|{\\boldsymbol x}\\|_1 = ${ab.join(" + ")} = ${n1}$, $\\|{\\boldsymbol x}\\|_2 = \\sqrt{${ab.map((t) => t * t).join(" + ")}} = ${n2}$, $\\|{\\boldsymbol x}\\|_\\infty = \\max\\{${ab.join(", ")}\\} = ${ninf}$. Errori tipici: valori assoluti dimenticati, radice dimenticata, minimo al posto del massimo.`,
          `$\\|{\\boldsymbol x}\\|_1 = ${ab.join(" + ")} = ${n1}$, $\\|{\\boldsymbol x}\\|_2 = \\sqrt{${ab.map((t) => t * t).join(" + ")}} = ${n2}$, $\\|{\\boldsymbol x}\\|_\\infty = \\max\\{${ab.join(", ")}\\} = ${ninf}$. Typical mistakes: absolute values forgotten, square root forgotten, minimum instead of maximum.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { x, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-chord", livello: "facile", capitolo: CAP.c3, link: link("c3", "box-1-def-convexfunction"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const tipo = sc(rng, ["abs", "sq"]);
        const h = ri(rng, -2, 2);
        const p = ri(rng, -5, 5), w = ri(rng, -5, 5);
        if (p === w) return null;
        const lam = sc(rng, [F(1, 2), F(1, 3), F(2, 3), F(1, 4), F(3, 4)]), mu = F(1).sub(lam);
        const m = lam.mul(p).add(mu.mul(w));
        const fF = (t) => { const z = Fr.of(t).sub(h); return tipo === "abs" ? (z.n < 0 ? z.neg() : z) : z.mul(z); };
        const A = fF(m), B = lam.mul(fF(p)).add(mu.mul(fF(w)));
        if (!A.lt(B)) return null;
        const D4 = tipo === "abs" ? [m.sub(h), B] : [A, lam.mul(fF(p)).add(mu.mul(F(w - h)))];   // valore assoluto / quadrato dimenticato
        const opz = [[A, B], [B, A], [A, fF(p).add(fF(w)).div(2)], D4];
        const fs = tipo === "abs" ? (h === 0 ? "|x|" : `|x ${h < 0 ? "+ " + (-h) : "- " + h}|`) : (h === 0 ? "x^2" : `(x ${h < 0 ? "+ " + (-h) : "- " + h})^2`);
        const fm = (t) => `$f(\\lambda p + (1-\\lambda) w) = ${t[0].tex()}$, $\\lambda f(p) + (1-\\lambda) f(w) = ${t[1].tex()}$`;
        const testo = T(l,
          `Per la funzione convessa $f(x) = ${fs}$, con $p = ${p}$, $w = ${w}$ e $\\lambda = ${lam.tex()}$, quanto valgono i due membri $f(\\lambda p + (1-\\lambda) w)$ e $\\lambda f(p) + (1-\\lambda) f(w)$ della disuguaglianza di convessità?`,
          `For the convex function $f(x) = ${fs}$, with $p = ${p}$, $w = ${w}$ and $\\lambda = ${lam.tex()}$, what are the two sides $f(\\lambda p + (1-\\lambda) w)$ and $\\lambda f(p) + (1-\\lambda) f(w)$ of the convexity inequality?`);
        const sp = T(l,
          `$\\lambda p + (1-\\lambda) w = ${m.tex()}$ e $f(${m.tex()}) = ${A.tex()}$; $\\lambda f(p) + (1-\\lambda) f(w) = ${lam.tex()}\\cdot ${fF(p).tex()} + ${mu.tex()}\\cdot ${fF(w).tex()} = ${B.tex()}$. Come deve essere, $${A.tex()} \\le ${B.tex()}$.`,
          `$\\lambda p + (1-\\lambda) w = ${m.tex()}$ and $f(${m.tex()}) = ${A.tex()}$; $\\lambda f(p) + (1-\\lambda) f(w) = ${lam.tex()}\\cdot ${fF(p).tex()} + ${mu.tex()}\\cdot ${fF(w).tex()} = ${B.tex()}$. As it must be, $${A.tex()} \\le ${B.tex()}$.`);
        return { testo, opzioni: opz.map(fm), corretta: 0, spiegazione: sp,
          dati: { tipo, h, p, w, lam: lam.s(), valori: S(opz) } };
      });
    },
  });

  /* ===================== Capitolo 4: funzioni quadratiche ===================== */

  LISTA.push({
    id: "co-g-sym", livello: "facile", capitolo: CAP.c4, link: link("c4", "box-2-exEquivalent"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = sc(rng, [-3, -2, -1, 1, 2, 3, 4]), d = sc(rng, [-2, -1, 1, 2, 3, 5]);
        const q12 = ri(rng, -6, 6), q21 = ri(rng, -6, 6);
        if (q12 === q21 || (q12 + q21) % 2 !== 0 || q12 + q21 === 0) return null;
        const m = (q12 + q21) / 2;
        const opz = [[[a, m], [m, d]], [[a, q12], [q12, d]], [[a, q21], [q21, d]], [[a, q12 + q21], [q12 + q21, d]]];
        const Q = [[a, q12], [q21, d]];
        const testo = T(l,
          `La matrice non simmetrica ${"${\\boldsymbol Q} = " + mat(Q) + "$"} definisce la funzione quadratica ${"$f({\\boldsymbol x}) = {\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x}$"} di ${"${\\boldsymbol x} \\in \\R^2$"}. Quale matrice simmetrica definisce la stessa funzione?`,
          `The non-symmetric matrix ${"${\\boldsymbol Q} = " + mat(Q) + "$"} defines the quadratic function ${"$f({\\boldsymbol x}) = {\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x}$"} of ${"${\\boldsymbol x} \\in \\R^2$"}. Which symmetric matrix defines the same function?`);
        const sp = T(l,
          `Si sostituisce ogni coppia fuori diagonale con la media: $\\frac{${q12} + (${q21})}{2} = ${m}$, cioè si usa $\\tfrac{1}{2}({\\boldsymbol Q} + {\\boldsymbol Q}')$. Con $${q12 + q21}$ fuori diagonale il coefficiente di $x_1 x_2$ raddoppierebbe.`,
          `Each off-diagonal pair is replaced by its average: $\\frac{${q12} + (${q21})}{2} = ${m}$, that is, we use $\\tfrac{1}{2}({\\boldsymbol Q} + {\\boldsymbol Q}')$. With $${q12 + q21}$ off the diagonal the coefficient of $x_1 x_2$ would double.`);
        return { testo, opzioni: opz.map((x) => "$" + mat(x) + "$"), corretta: 0, spiegazione: sp, dati: { Q, valori: opz } };
      });
    },
  });

  LISTA.push({
    id: "co-g-quadgrad", livello: "facile", capitolo: CAP.c4, link: link("c4", "44-quadratic-functions-with-a-linear-part"),
    linkIt: "44-funzioni-quadratiche-con-una-parte-lineare",
    genera(rng, l) {
      return ripeti(rng, () => {
        const q11 = ri(rng, -3, 4), q22 = ri(rng, -3, 4), q12 = ri(rng, -3, 3);
        const c = [ri(rng, -5, 5), ri(rng, -5, 5)], x = [ri(rng, -2, 3), ri(rng, -2, 3)];
        if (c[0] === 0 && c[1] === 0) return null;
        const Qx = [q11 * x[0] + q12 * x[1], q12 * x[0] + q22 * x[1]];
        const opz = [[2 * Qx[0] + c[0], 2 * Qx[1] + c[1]], [Qx[0] + c[0], Qx[1] + c[1]], [2 * Qx[0], 2 * Qx[1]], [2 * Qx[0] - c[0], 2 * Qx[1] - c[1]]];
        const Q = [[q11, q12], [q12, q22]];
        const testo = T(l,
          `Sia $g({\\boldsymbol x}) = {\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x} + {\\boldsymbol c}' {\\boldsymbol x}$ con ${"${\\boldsymbol Q} = " + mat(Q) + "$"} e ${"${\\boldsymbol c} = " + vec(c) + "$"}. Qual è $\\nabla g$ nel punto ${"$" + vec(x) + "$"}?`,
          `Let $g({\\boldsymbol x}) = {\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x} + {\\boldsymbol c}' {\\boldsymbol x}$ with ${"${\\boldsymbol Q} = " + mat(Q) + "$"} and ${"${\\boldsymbol c} = " + vec(c) + "$"}. What is $\\nabla g$ at the point ${"$" + vec(x) + "$"}?`);
        const sp = T(l,
          `$\\nabla g({\\boldsymbol x}) = 2\\,{\\boldsymbol Q}\\,{\\boldsymbol x} + {\\boldsymbol c}$, con ${"${\\boldsymbol Q}{\\boldsymbol x} = " + vec(Qx) + "$"}: $2${vec(Qx)} + ${vec(c)} = ${vec(opz[0])}$. Errori tipici: fattore $2$ dimenticato, ${"${\\boldsymbol c}$"} dimenticato o sottratto.`,
          `$\\nabla g({\\boldsymbol x}) = 2\\,{\\boldsymbol Q}\\,{\\boldsymbol x} + {\\boldsymbol c}$, with ${"${\\boldsymbol Q}{\\boldsymbol x} = " + vec(Qx) + "$"}: $2${vec(Qx)} + ${vec(c)} = ${vec(opz[0])}$. Typical mistakes: factor $2$ forgotten, ${"${\\boldsymbol c}$"} forgotten or subtracted.`);
        return { testo, opzioni: opz.map((v) => "$" + vec(v) + "$"), corretta: 0, spiegazione: sp, dati: { Q, c, x, valori: opz } };
      });
    },
  });

  LISTA.push({
    id: "co-g-psd", livello: "media", capitolo: CAP.c4, link: link("c4", "box-15-cor-psd"),
    genera(rng, l) {
      const psd = (q) => q[0] >= 0 && q[2] >= 0 && q[0] * q[2] - q[1] * q[1] >= 0;
      const fq = (q) => poly([[q[0], "x_1^2"], [2 * q[1], "x_1 x_2"], [q[2], "x_2^2"]]);
      return ripeti(rng, () => {
        // corretta: semidefinita positiva (a volte singolare)
        const a = ri(rng, 1, 4), b = ri(rng, -3, 3);
        const c = rng() < 0.3 && (b * b) % a === 0 ? (b * b) / a : Math.ceil((b * b) / a) + ri(rng, 0, 2);
        const giusta = [a, b, c];
        if (!psd(giusta) || b === 0) return null;
        // sbagliate: diagonale positiva ma determinante negativo; tutti i coefficienti positivi; un termine negativo in diagonale
        const a2 = ri(rng, 1, 3), c2 = ri(rng, 1, 3);
        const b2 = (Math.floor(Math.sqrt(a2 * c2)) + ri(rng, 1, 2)) * (rng() < 0.5 ? -1 : 1);
        const s1 = [a2, b2, c2];
        const a3 = ri(rng, 1, 2), c3 = ri(rng, 1, 3), b3 = Math.floor(Math.sqrt(a3 * c3)) + ri(rng, 1, 2);
        const s2 = [a3, b3, c3];
        const s3 = rng() < 0.5 ? [ri(rng, 2, 5), ri(rng, -1, 1), -ri(rng, 1, 3)] : [-ri(rng, 1, 3), ri(rng, -1, 1), ri(rng, 2, 5)];
        const tutte = [giusta, s1, s2, s3];
        if (tutte.slice(1).some(psd)) return null;
        const opz = tutte.map((q) => `$f({\\boldsymbol x}) = ${fq(q)}$`);
        const testo = T(l, `Quale delle seguenti funzioni quadratiche $f({\\boldsymbol x}) = {\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x}$, con $\\,{\\boldsymbol x} \\in \\R^2$, è convessa in $\\R^2$?`,
          `Which of the following quadratic functions $f({\\boldsymbol x}) = {\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x}$, with $\\,{\\boldsymbol x} \\in \\R^2$, is convex in $\\R^2$?`);
        // certificato per la corretta: somma di quadrati; per le altre: un vettore con x'Qx < 0
        const r = F(b, a), resto = F(c).sub(F(b * b, a));
        const sq = `${a === 1 ? "" : a}\\left(x_1 ${r.n < 0 ? "-" : "+"} ${(r.n < 0 ? r.neg() : r).eq(1) ? "" : (r.n < 0 ? r.neg().tex() : r.tex())}\\, x_2\\right)^2${resto.n === 0 ? "" : " + " + resto.tex() + "\\, x_2^2"}`;
        const ctr = (q) => (q[0] < 0 ? [1, 0] : q[2] < 0 ? [0, 1] : [-q[1], q[0]]);
        const val = (q, x) => q[0] * x[0] * x[0] + 2 * q[1] * x[0] * x[1] + q[2] * x[1] * x[1];
        const cs = tutte.slice(1).map((q) => { const x = ctr(q); return T(l, `per $${fq(q)}$ il vettore $${vec(x)}$ dà $${val(q, x)} < 0$`, `for $${fq(q)}$ the vector $${vec(x)}$ gives $${val(q, x)} < 0$`); }).join("; ");
        const sp = T(l,
          `La funzione corretta si scrive $${sq} \\ge 0$: ${"${\\boldsymbol Q}$"} è semidefinita positiva e quindi la funzione è convessa (una funzione quadratica è convessa se e solo se ${"${\\boldsymbol Q}$"} è semidefinita positiva). Le altre non hanno ${"${\\boldsymbol Q}$"} semidefinita positiva: ${cs}. Una diagonale positiva non basta.`,
          `The correct function can be written as $${sq} \\ge 0$: ${"${\\boldsymbol Q}$"} is positive semidefinite and hence the function is convex (a quadratic function is convex if and only if ${"${\\boldsymbol Q}$"} is positive semidefinite). The others do not have ${"${\\boldsymbol Q}$"} positive semidefinite: ${cs}. A positive diagonal is not enough.`);
        return { testo, opzioni: opz, corretta: 0, spiegazione: sp, dati: { valori: tutte } };
      });
    },
  });

  /* ===================== Capitolo 5: problemi di ottimizzazione ===================== */

  const fpar = (h, k) => `(x ${h < 0 ? "+ " + (-h) : h === 0 ? "" : "- " + h})^2${k === 0 ? "" : k < 0 ? " - " + (-k) : " + " + k}`.replace("(x )", "x");

  LISTA.push({
    id: "co-g-bounds", livello: "facile", capitolo: CAP.c5, link: link("c5", "box-9-exOptBounds"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const h = ri(rng, -2, 3), k = ri(rng, -3, 3), lo = h - ri(rng, 2, 4), up = h + ri(rng, 2, 4);
        const forma = sc(rng, ["min", "max"]);
        const pts = []; while (pts.length < 3) { const t = ri(rng, lo, up); if (!pts.includes(t)) pts.push(t); }
        const vals = pts.map((t) => (t - h) * (t - h) + k);
        if (new Set(vals).size < 3) return null;
        const mn = Math.min(...vals), mx = Math.max(...vals);
        const opz = forma === "min"
          ? [["UB", mn], ["UB", mx], ["LB", mn], ["LB", mx]]
          : [["LB", mx], ["LB", mn], ["UB", mx], ["UB", mn]];
        const fm = (o) => (o[0] === "UB" ? `$z(P) \\le ${o[1]}$` : `$${o[1]} \\le z(P)$`);
        const pr = `${forma === "min" ? "\\min" : "\\max"}\\{\\, ${fpar(h, k)} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ ${lo} \\le x \\le ${up} \\,\\}`;
        const plist = pts.map((t, i) => `$\\bar{\\boldsymbol x}^{(${i + 1})} = (${t})$`).join(", ");
        const testo = T(l,
          `Per il problema $P$: $${pr}$ si conoscono le soluzioni ammissibili ${plist}. Qual è la migliore limitazione sul valore ottimo $z(P)$ che esse forniscono?`,
          `For the problem $P$: $${pr}$ the feasible solutions ${plist} are known. What is the best bound on the optimal value $z(P)$ that they provide?`);
        const sp = T(l,
          `I valori sono ${vals.map((v) => "$" + v + "$").join(", ")}. In forma di ${forma === "min" ? "minimo ogni soluzione ammissibile dà un upper bound e il migliore è il più piccolo" : "massimo ogni soluzione ammissibile dà un lower bound e il migliore è il più grande"}.`,
          `The values are ${vals.map((v) => "$" + v + "$").join(", ")}. In ${forma === "min" ? "minimization form every feasible solution gives an upper bound and the best one is the smallest" : "maximization form every feasible solution gives a lower bound and the best one is the largest"}.`);
        return { testo, opzioni: opz.map(fm), corretta: 0, spiegazione: sp, dati: { h, k, lo, up, forma, pts, valori: opz } };
      });
    },
  });

  LISTA.push({
    id: "co-g-props", livello: "facile", capitolo: CAP.c5, link: link("c5", "52-properties-of-optimization-problems"),
    linkIt: "52-proprieta-dei-problemi-di-ottimizzazione",
    genera(rng, l) {
      return ripeti(rng, () => {
        const m = ri(rng, -4, 3), M = m + ri(rng, 2, 7);
        const a = sc(rng, [-3, -2, -1, 2, 3, 4]), b = ri(rng, -6, 6);
        if (b === 0) return null;
        const giusto = a > 0 ? a * m + b : a * M + b, altro = a > 0 ? a * M + b : a * m + b;
        const opz = [giusto, altro, giusto - b, -giusto];
        const testo = T(l,
          `Su una regione ammissibile $F$ la funzione obiettivo $f$ ha minimo $${m}$ e massimo $${M}$ (entrambi raggiunti). Qual è il valore ottimo $\\min\\{\\, ${a}\\, f({\\boldsymbol x}) ${b < 0 ? "- " + (-b) : "+ " + b} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ {\\boldsymbol x} \\in F \\,\\}$?`,
          `Over a feasible region $F$ the objective function $f$ has minimum $${m}$ and maximum $${M}$ (both attained). What is the optimal value $\\min\\{\\, ${a}\\, f({\\boldsymbol x}) ${b < 0 ? "- " + (-b) : "+ " + b} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ {\\boldsymbol x} \\in F \\,\\}$?`);
        const sp = a > 0
          ? T(l, `La costante si somma fuori e, con $a = ${a} > 0$, $\\min\\{a f\\} = a \\min\\{f\\}$: $${a}\\cdot(${m}) ${b < 0 ? "- " + (-b) : "+ " + b} = ${giusto}$.`,
            `The constant is added outside and, with $a = ${a} > 0$, $\\min\\{a f\\} = a \\min\\{f\\}$: $${a}\\cdot(${m}) ${b < 0 ? "- " + (-b) : "+ " + b} = ${giusto}$.`)
          : T(l, `La costante si somma fuori e, con $a = ${a} < 0$, $\\min\\{a f\\} = a \\max\\{f\\}$: $${a}\\cdot ${M} ${b < 0 ? "- " + (-b) : "+ " + b} = ${giusto}$. Errore tipico: usare il minimo di $f$.`,
            `The constant is added outside and, with $a = ${a} < 0$, $\\min\\{a f\\} = a \\max\\{f\\}$: $${a}\\cdot ${M} ${b < 0 ? "- " + (-b) : "+ " + b} = ${giusto}$. Typical mistake: using the minimum of $f$.`);
        return { testo, opzioni: opz.map((v) => `$${v}$`), corretta: 0, spiegazione: sp, dati: { m, M, a, b, valori: opz } };
      });
    },
  });

  LISTA.push({
    id: "co-g-neigh", livello: "facile", capitolo: CAP.c5, link: link("c5", "box-15-def-neighborhood"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const c = [ri(rng, -2, 5), ri(rng, -2, 5)], dl = sc(rng, [2, 3, 5]);
        const d2 = (d) => d[0] * d[0] + d[1] * d[1];
        const sg = () => (rng() < 0.5 ? -1 : 1);
        const bordo = dl === 5 && rng() < 0.6 ? (rng() < 0.5 ? [3 * sg(), 4 * sg()] : [4 * sg(), 3 * sg()]) : (rng() < 0.5 ? [dl * sg(), 0] : [0, dl * sg()]);
        let dentro = null, fuori = [];
        for (let t = 0; t < 300 && (dentro === null || fuori.length < 2); t++) {
          const d = [ri(rng, -dl - 1, dl + 1), ri(rng, -dl - 1, dl + 1)];
          if (d2(d) < dl * dl && d2(d) >= (dl - 1) * (dl - 1) && dentro === null) dentro = d;
          else if (fuori.length < 2 && d2(d) > dl * dl && d2(d) <= (dl + 1) * (dl + 1) && !fuori.some((f) => f[0] === d[0] && f[1] === d[1])) fuori.push(d);
        }
        if (dentro === null || fuori.length < 2) return null;
        const pts = [dentro, bordo, ...fuori].map((d) => [c[0] + d[0], c[1] + d[1]]);
        const testo = T(l,
          `Quale punto appartiene all'intorno sferico $N\\left(${vec(c)}, ${dl}\\right)$ di centro ${"$" + vec(c) + "$"} e raggio $${dl}$, cioè l'insieme dei punti a distanza euclidea <em>minore</em> di $${dl}$ dal centro?`,
          `Which point belongs to the spherical neighborhood $N\\left(${vec(c)}, ${dl}\\right)$ with center ${"$" + vec(c) + "$"} and radius $${dl}$, that is, the set of the points at Euclidean distance <em>less</em> than $${dl}$ from the center?`);
        const sp = T(l,
          `Il punto corretto ha distanza al quadrato $${d2(dentro)} < ${dl * dl}$ dal centro. Il punto ${"$" + vec(pts[1]) + "$"} ha distanza esattamente $${dl}$: sta sulla circonferenza, che non appartiene all'intorno (disuguaglianza stretta). Gli altri hanno distanza maggiore di $${dl}$.`,
          `The correct point has squared distance $${d2(dentro)} < ${dl * dl}$ from the center. The point ${"$" + vec(pts[1]) + "$"} has distance exactly $${dl}$: it lies on the circle, which does not belong to the neighborhood (strict inequality). The others have distance greater than $${dl}$.`);
        return { testo, opzioni: pts.map((x) => "$" + vec(x) + "$"), corretta: 0, spiegazione: sp, dati: { c, dl, valori: pts } };
      });
    },
  });

  LISTA.push({
    id: "co-g-interval", livello: "media", capitolo: CAP.c5, link: link("c5", "box-3-exOptSquare"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const h = ri(rng, -3, 4), k = ri(rng, -4, 4), lo = ri(rng, -4, 3), up = lo + ri(rng, 2, 6);
        const forma = sc(rng, ["min", "max"]);
        const f = (t) => (t - h) * (t - h) + k;
        let xs;
        if (forma === "min") xs = h < lo ? lo : h > up ? up : h;
        else { if (f(lo) === f(up)) return null; xs = f(lo) > f(up) ? lo : up; }
        const cand = [[xs, f(xs)]];
        for (const t of [lo, up, h]) if (!cand.some((c) => c[0] === t)) cand.push([t, f(t)]);
        cand.push([xs, (xs + h) * (xs + h) + k]);            // segno sbagliato nel quadrato
        cand.push([xs, f(xs) + 1]);
        const opz = [];
        for (const c of cand) if (!opz.some((o) => o[0] === c[0] && o[1] === c[1]) && opz.length < 4) opz.push(c);
        if (opz.length < 4) return null;
        const pr = `${forma === "min" ? "\\min" : "\\max"}\\{\\, ${fpar(h, k)} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ ${lo} \\le x \\le ${up} \\,\\}`;
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = (${o[0]})$, $z(P) = ${o[1]}$`;
        const testo = T(l, `Quali sono la soluzione ottima e il valore ottimo del problema $P$: $${pr}$ (con $\\tilde{\\boldsymbol x}(P)$ la soluzione ottima e $z(P)$ il valore ottimo)?`,
          `What are the optimal solution and the optimal value of the problem $P$: $${pr}$ (with $\\tilde{\\boldsymbol x}(P)$ the optimal solution and $z(P)$ the optimal value)?`);
        const sp = forma === "min"
          ? (xs === h
            ? T(l, `$f(x) \\ge ${k} = f(${h})$ per ogni $x$ e $${h}$ è ammissibile: $\\tilde{\\boldsymbol x}(P) = (${h})$, $z(P) = ${k}$.`, `$f(x) \\ge ${k} = f(${h})$ for every $x$ and $${h}$ is feasible: $\\tilde{\\boldsymbol x}(P) = (${h})$, $z(P) = ${k}$.`)
            : T(l, `Il punto $${h}$ non è ammissibile; sulla regione ammissibile $(x-${h})^2$ è minimo nell'estremo più vicino a $${h}$, cioè $${xs}$, con $z(P) = ${f(xs)}$.`, `The point $${h}$ is not feasible; over the feasible region $(x-${h})^2$ is smallest at the endpoint closest to $${h}$, that is, $${xs}$, with $z(P) = ${f(xs)}$.`))
          : T(l, `In forma di massimo conta l'estremo più lontano da $${h}$: $f(${lo}) = ${f(lo)}$ e $f(${up}) = ${f(up)}$, quindi $\\tilde{\\boldsymbol x}(P) = (${xs})$ e $z(P) = ${f(xs)}$.`, `In maximization form the endpoint farthest from $${h}$ matters: $f(${lo}) = ${f(lo)}$ and $f(${up}) = ${f(up)}$, hence $\\tilde{\\boldsymbol x}(P) = (${xs})$ and $z(P) = ${f(xs)}$.`);
        return { testo, opzioni: opz.map(fm), corretta: 0, spiegazione: sp, dati: { h, k, lo, up, forma, valori: opz } };
      });
    },
  });

  /* ===================== Capitolo 6: problemi convessi e concavi ===================== */

  LISTA.push({
    id: "co-g-boxproj", livello: "media", capitolo: CAP.c6, link: link("c6", "63-examples-of-convex-and-concave-optimization-problems"),
    linkIt: "63-esempi-di-problemi-di-ottimizzazione-convessi-e-concavi",
    genera(rng, l) {
      return ripeti(rng, () => {
        const lo = [ri(rng, -2, 2), ri(rng, -2, 2)], up = [lo[0] + ri(rng, 2, 4), lo[1] + ri(rng, 2, 4)];
        const fuori = ri(rng, 0, 1), dentro = 1 - fuori;
        const c = [0, 0];
        c[dentro] = ri(rng, lo[dentro] + 1, up[dentro] - 1);
        c[fuori] = rng() < 0.5 ? lo[fuori] - ri(rng, 1, 3) : up[fuori] + ri(rng, 1, 3);
        const clip = (t, i) => Math.min(Math.max(t, lo[i]), up[i]);
        const xs = [clip(c[0], 0), clip(c[1], 1)];
        const z = (x) => (x[0] - c[0]) ** 2 + (x[1] - c[1]) ** 2;
        const vert = [0, 1].map((i) => (i === fuori ? xs[i] : (c[i] - lo[i] <= up[i] - c[i] ? lo[i] : up[i])));
        const lontano = xs.slice(); lontano[fuori] = xs[fuori] === lo[fuori] ? up[fuori] : lo[fuori];
        const opz = [[xs, z(xs)], [vert, z(vert)], [c, 0], [lontano, z(lontano)]];
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = ${vec(o[0])}$, $z(P) = ${o[1]}$`;
        const pr = `\\min\\{\\, (x_1 ${c[0] < 0 ? "+ " + (-c[0]) : "- " + c[0]})^2 + (x_2 ${c[1] < 0 ? "+ " + (-c[1]) : "- " + c[1]})^2 \\ \\text{${T(l, "soggetto a", "subject to")}}\\ ${lo[0]} \\le x_1 \\le ${up[0]},~ ${lo[1]} \\le x_2 \\le ${up[1]} \\,\\}`;
        const testo = T(l,
          `Il problema $P$: $${pr}$ cerca il punto del rettangolo più vicino a ${"$" + vec(c) + "$"}. Quali sono la soluzione ottima e il valore ottimo (con $\\tilde{\\boldsymbol x}(P)$ la soluzione ottima e $z(P)$ il valore ottimo)?`,
          `The problem $P$: $${pr}$ looks for the point of the rectangle closest to ${"$" + vec(c) + "$"}. What are the optimal solution and the optimal value (with $\\tilde{\\boldsymbol x}(P)$ the optimal solution and $z(P)$ the optimal value)?`);
        const sp = T(l,
          `La funzione obiettivo è somma di due termini in variabili diverse, e ciascuno è minimo riportando la coordinata di ${"$" + vec(c) + "$"} dentro il suo intervallo: $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$, $z(P) = ${z(xs)}$. Il punto ${"$" + vec(c) + "$"} non è ammissibile, e il vertice più vicino non è ottimo.`,
          `The objective function is the sum of two terms in different variables, and each is smallest when the coordinate of ${"$" + vec(c) + "$"} is brought back into its interval: $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$, $z(P) = ${z(xs)}$. The point ${"$" + vec(c) + "$"} is not feasible, and the closest vertex is not optimal.`);
        return { testo, opzioni: opz.map(fm), corretta: 0, spiegazione: sp, dati: { c, lo, up, valori: opz } };
      });
    },
  });

  const TIPO = (l, curv, forma) => (l === "it"
    ? `problema di ${forma === "min" ? "minimizzazione" : "massimizzazione"} ${curv === "convessa" ? "convesso" : "concavo"}`
    : `${curv === "convessa" ? "convex" : "concave"} ${forma === "min" ? "minimization" : "maximization"} problem`);

  LISTA.push({
    id: "co-g-1dproblem", livello: "complessa", capitolo: CAP.c6, link: link("c6", "box-4-exConvexMin"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = sc(rng, [1, 2, 3, -1, -2, -3]), h = ri(rng, -3, 4), k = ri(rng, -5, 8);
        const lo = h - ri(rng, 1, 3), up = h + ri(rng, 1, 4);
        const b = -2 * a * h, c0 = k + a * h * h;
        const f = (t) => Fr.of(t).mul(t).mul(a).add(Fr.of(t).mul(b)).add(c0);
        const forma = a > 0 ? "min" : "max", curv = a > 0 ? "convessa" : "concava", altra = a > 0 ? "concava" : "convessa";
        const finto = F(-b, a);                                          // -b/a: fattore 2 dimenticato
        const est = Math.abs(lo - h) >= Math.abs(up - h) ? lo : up;      // estremo
        const opz = [[curv, F(h), f(h)], [altra, F(h), f(h)], [curv, finto, f(finto)], [curv, F(est), f(est)]];
        const fm = (o) => `${T(l, "È un", "It is a")} ${TIPO(l, o[0], forma)}; $\\tilde{\\boldsymbol x}(P) = (${o[1].tex()})$, $z(P) = ${o[2].tex()}$`;
        const pr = `${forma === "min" ? "\\min" : "\\max"}\\{\\, ${poly([[a, "x^2"], [b, "x"], [c0, ""]])} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ ${lo} \\le x \\le ${up} \\,\\}`;
        const testo = T(l, `Si consideri il problema $P$: $${pr}$ (con $\\tilde{\\boldsymbol x}(P)$ la soluzione ottima e $z(P)$ il valore ottimo). Quale affermazione è corretta?`,
          `Consider the problem $P$: $${pr}$ (with $\\tilde{\\boldsymbol x}(P)$ the optimal solution and $z(P)$ the optimal value). Which statement is correct?`);
        const sp = T(l,
          `$f(x) = ${a === 1 ? "" : a === -1 ? "-" : a + "\\,"}(x ${h < 0 ? "+ " + (-h) : "- " + h})^2 ${k < 0 ? " - " + (-k) : k > 0 ? " + " + k : ""}$ è ${curv} e $F = [${lo}, ${up}]$ è convesso: è un ${TIPO(l, curv, forma)}. La derivata $${poly([[2 * a, "x"], [b, ""]])}$ si annulla in $x = ${h}$, ammissibile; $x = ${h}$ è un punto di ${forma === "min" ? "minimo" : "massimo"} locale e quindi ottimo, perché in un ${TIPO(l, curv, forma)} ogni ${forma === "min" ? "minimo" : "massimo"} locale è ottimo: $z(P) = ${f(h).tex()}$.`,
          `$f(x) = ${a === 1 ? "" : a === -1 ? "-" : a + "\\,"}(x ${h < 0 ? "+ " + (-h) : "- " + h})^2 ${k < 0 ? " - " + (-k) : k > 0 ? " + " + k : ""}$ is ${curv === "convessa" ? "convex" : "concave"} and $F = [${lo}, ${up}]$ is convex: it is a ${TIPO(l, curv, forma)}. The derivative $${poly([[2 * a, "x"], [b, ""]])}$ vanishes at $x = ${h}$, which is feasible; $x = ${h}$ is a point of local ${forma === "min" ? "minimum" : "maximum"} and hence optimal, because in a ${TIPO(l, curv, forma)} every local ${forma === "min" ? "minimum" : "maximum"} is optimal: $z(P) = ${f(h).tex()}$.`);
        return { testo, opzioni: opz.map(fm), corretta: 0, spiegazione: sp,
          dati: { a, b, c: c0, lo, up, forma, valori: opz.map((o) => [o[0], o[1].s(), o[2].s()]) } };
      });
    },
  });

  LISTA.push({
    id: "co-g-cubic", livello: "complessa", capitolo: CAP.c6, link: link("c6", "box-7-exConvexMinCubic"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const h = sc(rng, [-2, -1, 1, 2, 3]), s = sc(rng, [1, 2]), k = ri(rng, -4, 6);
        const caso = sc(rng, ["A", "B"]);
        // f(x) = (x-h)^3 - 3 s^2 (x-h) + k
        const f = (t) => (t - h) ** 3 - 3 * s * s * (t - h) + k;
        const c3 = 1, c2 = -3 * h, c1 = 3 * h * h - 3 * s * s, c0 = -(h ** 3) + 3 * s * s * h + k;
        const lo = caso === "A" ? h : h - 2 * s, up = caso === "A" ? h + 2 * s : h;
        const forma = caso === "A" ? "min" : "max", curv = caso === "A" ? "convessa" : "concava", altra = caso === "A" ? "concava" : "convessa";
        const xs = caso === "A" ? h + s : h - s, xo = caso === "A" ? h - s : h + s;
        const e1 = caso === "A" ? lo : up;                    // estremo dove f = k
        const opz = [[curv, xs, f(xs)], [altra, xs, f(xs)], [curv, xo, f(xo)], [curv, e1, f(e1)]];
        const fm = (o) => `${T(l, "È un", "It is a")} ${TIPO(l, o[0], forma)}; $\\tilde{\\boldsymbol x}(P) = (${o[1]})$, $z(P) = ${o[2]}$`;
        const pr = `${forma === "min" ? "\\min" : "\\max"}\\{\\, ${poly([[c3, "x^3"], [c2, "x^2"], [c1, "x"], [c0, ""]])} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ ${lo} \\le x \\le ${up} \\,\\}`;
        const hs = h === 0 ? "x" : `(x ${h < 0 ? "+ " + (-h) : "- " + h})`;
        const testo = T(l,
          `Si consideri il problema $P$: $${pr}$ (con $\\tilde{\\boldsymbol x}(P)$ la soluzione ottima e $z(P)$ il valore ottimo), la cui funzione obiettivo si scrive anche $${hs}^3 - ${3 * s * s}\\,${hs} ${k < 0 ? " - " + (-k) : k > 0 ? " + " + k : ""}$. Quale affermazione è corretta?`,
          `Consider the problem $P$: $${pr}$ (with $\\tilde{\\boldsymbol x}(P)$ the optimal solution and $z(P)$ the optimal value), whose objective function can also be written as $${hs}^3 - ${3 * s * s}\\,${hs} ${k < 0 ? " - " + (-k) : k > 0 ? " + " + k : ""}$. Which statement is correct?`);
        const sp = T(l,
          `Con $a = p ${h < 0 ? "+ " + (-h) : "- " + h}$ e $b = w ${h < 0 ? "+ " + (-h) : "- " + h}$ ${caso === "A" ? "non negativi" : "non positivi"}, la disuguaglianza dei cubi $\\big(\\lambda a + (1-\\lambda) b\\big)^3 ${caso === "A" ? "\\le" : "\\ge"} \\lambda a^3 + (1-\\lambda) b^3$ (la parte restante è lineare) dà che $f$ è ${curv} su $[${lo}, ${up}]$: è un ${TIPO(l, curv, forma)}. La derivata $3${hs}^2 - ${3 * s * s}$ si annulla in $${h - s}$ e $${h + s}$; solo $${xs}$ è ammissibile, è un ottimo locale ed è quindi ottimo (nei problemi di questo tipo gli ottimi locali sono globali), con $z(P) = ${f(xs)}$.`,
          `With $a = p ${h < 0 ? "+ " + (-h) : "- " + h}$ and $b = w ${h < 0 ? "+ " + (-h) : "- " + h}$ ${caso === "A" ? "nonnegative" : "nonpositive"}, the inequality of cubes $\\big(\\lambda a + (1-\\lambda) b\\big)^3 ${caso === "A" ? "\\le" : "\\ge"} \\lambda a^3 + (1-\\lambda) b^3$ (the rest is linear) shows that $f$ is ${curv === "convessa" ? "convex" : "concave"} over $[${lo}, ${up}]$: it is a ${TIPO(l, curv, forma)}. The derivative $3${hs}^2 - ${3 * s * s}$ vanishes at $${h - s}$ and $${h + s}$; only $${xs}$ is feasible, it is a local optimum and hence optimal (in problems of this kind local optima are global), with $z(P) = ${f(xs)}$.`);
        return { testo, opzioni: opz.map(fm), corretta: 0, spiegazione: sp,
          dati: { coef: [c3, c2, c1, c0], lo, up, forma, valori: opz } };
      });
    },
  });

  LISTA.push({
    id: "co-g-sepbox", livello: "complessa", capitolo: CAP.c6, link: link("c6", "63-examples-of-convex-and-concave-optimization-problems"),
    linkIt: "63-esempi-di-problemi-di-ottimizzazione-convessi-e-concavi",
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = [sc(rng, [1, 2]), sc(rng, [1, 2, 3])], h = [ri(rng, -3, 4), ri(rng, -3, 4)];
        const c = [-2 * a[0] * h[0], -2 * a[1] * h[1]];
        if (c[0] === 0 || c[1] === 0) return null;
        const lo = [ri(rng, -2, 2), ri(rng, -2, 2)], up = [lo[0] + ri(rng, 1, 3), lo[1] + ri(rng, 1, 3)];
        const inside = (i) => h[i] >= lo[i] && h[i] <= up[i];
        if (inside(0) && inside(1)) return null;
        const f = (x) => a[0] * x[0] * x[0] + a[1] * x[1] * x[1] + c[0] * x[0] + c[1] * x[1];
        const clip = (t, i) => Math.min(Math.max(t, lo[i]), up[i]);
        const xs = [clip(h[0], 0), clip(h[1], 1)];
        const hw = [-h[0], -h[1]], xw = [clip(hw[0], 0), clip(hw[1], 1)];          // segno sbagliato del centro
        const best = (i) => (Math.abs(lo[i] - h[i]) <= Math.abs(up[i] - h[i]) ? lo[i] : up[i]);
        const ver = [best(0), best(1)];
        const opz = [[xs, f(xs)], [h, f(h)], [xw, f(xw)], [ver, f(ver)]];
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = ${vec(o[0])}$, $z(P) = ${o[1]}$`;
        const fs = poly([[a[0], "x_1^2"], [a[1], "x_2^2"], [c[0], "x_1"], [c[1], "x_2"]]);
        const pr = `\\min\\{\\, ${fs} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ ${lo[0]} \\le x_1 \\le ${up[0]},~ ${lo[1]} \\le x_2 \\le ${up[1]} \\,\\}`;
        const testo = T(l, `Si consideri il problema di minimizzazione convesso $P$: $${pr}$. Quali sono la soluzione ottima e il valore ottimo (con $\\tilde{\\boldsymbol x}(P)$ la soluzione ottima e $z(P)$ il valore ottimo)?`,
          `Consider the convex minimization problem $P$: $${pr}$. What are the optimal solution and the optimal value (with $\\tilde{\\boldsymbol x}(P)$ the optimal solution and $z(P)$ the optimal value)?`);
        const q = (i) => `${a[i] === 1 ? "" : a[i]}(x_${i + 1} ${h[i] < 0 ? "+ " + (-h[i]) : "- " + h[i]})^2`;
        const kk = -(a[0] * h[0] * h[0] + a[1] * h[1] * h[1]);
        const sp = T(l,
          `Completando i quadrati, $f({\\boldsymbol x}) = ${q(0)} + ${q(1)} ${kk < 0 ? "- " + (-kk) : "+ " + kk}$. Il punto ${"$" + vec(h) + "$"} non è ammissibile; ogni termine dipende da una sola variabile ed è minimo riportando $${h[0]}$ in $[${lo[0]}, ${up[0]}]$ e $${h[1]}$ in $[${lo[1]}, ${up[1]}]$: $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$, $z(P) = ${f(xs)}$.`,
          `Completing the squares, $f({\\boldsymbol x}) = ${q(0)} + ${q(1)} ${kk < 0 ? "- " + (-kk) : "+ " + kk}$. The point ${"$" + vec(h) + "$"} is not feasible; each term depends on a single variable and is smallest when $${h[0]}$ is brought back into $[${lo[0]}, ${up[0]}]$ and $${h[1]}$ into $[${lo[1]}, ${up[1]}]$: $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$, $z(P) = ${f(xs)}$.`);
        return { testo, opzioni: opz.map(fm), corretta: 0, spiegazione: sp, dati: { a, c, lo, up, valori: opz } };
      });
    },
  });

  /* ===================== Generatori aggiunti (6 novembre 2026): media/complessa nei capitoli 1, 3, 4, 5 ===================== */

  LISTA.push({
    id: "co-g-ballcap", livello: "media", capitolo: CAP.c1, link: link("c1", "box-12-obs-intersection"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const c1 = [ri(rng, -1, 3), ri(rng, -1, 3)], r1 = ri(rng, 2, 4);
        const c2 = [c1[0] + ri(rng, -2, 2), c1[1] + ri(rng, -2, 2)], r2 = ri(rng, 1, 3);
        const inA = (x) => Math.abs(x[0] - c1[0]) + Math.abs(x[1] - c1[1]) <= r1;
        const inB = (x) => Math.max(Math.abs(x[0] - c2[0]), Math.abs(x[1] - c2[1])) <= r2;
        const both = [], soloA = [], soloB = [];
        for (let x1 = c1[0] - r1 - 1; x1 <= c1[0] + r1 + 1; x1++) for (let x2 = c1[1] - r1 - 1; x2 <= c1[1] + r1 + 1; x2++) {
          const x = [x1, x2];
          if (inA(x) && inB(x)) both.push(x); else if (inA(x)) soloA.push(x); else if (inB(x)) soloB.push(x);
        }
        if (both.length === 0 || soloA.length === 0 || soloB.length === 0 || soloA.length + soloB.length < 3) return null;
        const giusto = sc(rng, both);
        const sb = [sc(rng, soloA), sc(rng, soloB)];
        const resto = soloA.concat(soloB).filter((x) => !sb.some((y) => y[0] === x[0] && y[1] === x[1]));
        if (resto.length === 0) return null;
        sb.push(sc(rng, resto));
        const pts = [giusto, ...sb];
        const A = `\\{ {\\boldsymbol x} \\in \\R^2 : \\|{\\boldsymbol x} - ${vec(c1)}\\|_1 \\le ${r1} \\}`;
        const B = `\\{ {\\boldsymbol x} \\in \\R^2 : \\|{\\boldsymbol x} - ${vec(c2)}\\|_\\infty \\le ${r2} \\}`;
        const testo = T(l,
          `Siano $A = ${A}$ (palla della norma $1$) e $B = ${B}$ (palla della norma $\\infty$). Quale punto appartiene all'insieme convesso $A \\cap B$?`,
          `Let $A = ${A}$ (ball of the norm $1$) and $B = ${B}$ (ball of the norm $\\infty$). Which point belongs to the convex set $A \\cap B$?`);
        const d1 = (x) => Math.abs(x[0] - c1[0]) + Math.abs(x[1] - c1[1]);
        const d2 = (x) => Math.max(Math.abs(x[0] - c2[0]), Math.abs(x[1] - c2[1]));
        const g = giusto;
        const sp = T(l,
          `Per ${"$" + vec(g) + "$"}: distanza in norma $1$ da ${"$" + vec(c1) + "$"} pari a $${d1(g)} \\le ${r1}$ e distanza in norma $\\infty$ da ${"$" + vec(c2) + "$"} pari a $${d2(g)} \\le ${r2}$: sta in entrambi gli insiemi. Ciascuno degli altri punti sta in uno solo dei due (errore tipico: confondere intersezione e unione).`,
          `For ${"$" + vec(g) + "$"}: distance in the norm $1$ from ${"$" + vec(c1) + "$"} equal to $${d1(g)} \\le ${r1}$ and distance in the norm $\\infty$ from ${"$" + vec(c2) + "$"} equal to $${d2(g)} \\le ${r2}$: it belongs to both sets. Each of the other points belongs to only one of the two (typical mistake: confusing intersection and union).`);
        return { testo, opzioni: pts.map((x) => "$" + vec(x) + "$"), corretta: 0, spiegazione: sp,
          dati: { c1, r1, c2, r2, valori: pts } };
      });
    },
  });

  LISTA.push({
    id: "co-g-normchord", livello: "media", capitolo: CAP.c3, link: link("c3", "box-16-exDistance"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const q = sc(rng, ["1", "\\infty"]);
        const c = [ri(rng, -2, 3), ri(rng, -2, 3)], k = sc(rng, [-2, -1, 1, 2, 3]);
        const p = [ri(rng, -3, 5), ri(rng, -3, 5)], w = [ri(rng, -3, 5), ri(rng, -3, 5)];
        const lam = sc(rng, [F(1, 3), F(2, 3), F(1, 4), F(3, 4)]), mu = F(1).sub(lam);
        const ab = (t) => (t.n < 0 ? t.neg() : t);
        const nrm = (x) => { const d = [0, 1].map((i) => ab(Fr.of(x[i]).sub(c[i]))); return q === "1" ? d[0].add(d[1]) : (d[0].lt(d[1]) ? d[1] : d[0]); };
        const f = (x) => nrm(x).add(k);
        const par = (t) => (t.n < 0 ? "(" + t.tex() + ")" : t.tex());
        const m = [0, 1].map((i) => lam.mul(p[i]).add(mu.mul(w[i])));
        const A = f(m), B = lam.mul(f(p)).add(mu.mul(f(w)));
        if (!A.lt(B)) return null;
        const v = [[A, B], [B, A], [A.sub(k), B], [A, mu.mul(f(p)).add(lam.mul(f(w)))]];
        const fm = (t) => T(l, `$${t[0].tex()}$ e $${t[1].tex()}$`, `$${t[0].tex()}$ and $${t[1].tex()}$`);
        const fs = `\\|{\\boldsymbol x} - ${vec(c)}\\|_{${q}} ${k < 0 ? "- " + (-k) : "+ " + k}`;
        const testo = T(l,
          `Per la funzione convessa $f({\\boldsymbol x}) = ${fs}$ in $\\R^2$, con ${"${\\boldsymbol p} = " + vec(p) + "$"}, ${"${\\boldsymbol w} = " + vec(w) + "$"} e $\\lambda = ${lam.tex()}$, quanto valgono (in quest'ordine) i due membri $f(\\lambda {\\boldsymbol p} + (1-\\lambda){\\boldsymbol w})$ e $\\lambda f({\\boldsymbol p}) + (1-\\lambda) f({\\boldsymbol w})$ della disuguaglianza di convessità?`,
          `For the convex function $f({\\boldsymbol x}) = ${fs}$ in $\\R^2$, with ${"${\\boldsymbol p} = " + vec(p) + "$"}, ${"${\\boldsymbol w} = " + vec(w) + "$"} and $\\lambda = ${lam.tex()}$, what are (in this order) the two sides $f(\\lambda {\\boldsymbol p} + (1-\\lambda){\\boldsymbol w})$ and $\\lambda f({\\boldsymbol p}) + (1-\\lambda) f({\\boldsymbol w})$ of the convexity inequality?`);
        const sp = T(l,
          `$\\lambda {\\boldsymbol p} + (1-\\lambda){\\boldsymbol w} = ${vec(m)}$ e $f(${vec(m)}) = ${A.tex()}$; $f({\\boldsymbol p}) = ${f(p).tex()}$, $f({\\boldsymbol w}) = ${f(w).tex()}$ e $${lam.tex()}\\cdot ${par(f(p))} + ${mu.tex()}\\cdot ${par(f(w))} = ${B.tex()}$. Come deve essere, $${A.tex()} \\le ${B.tex()}$. Errori tipici: dimenticare la costante $${k}$, scambiare i pesi $\\lambda$ e $1-\\lambda$.`,
          `$\\lambda {\\boldsymbol p} + (1-\\lambda){\\boldsymbol w} = ${vec(m)}$ and $f(${vec(m)}) = ${A.tex()}$; $f({\\boldsymbol p}) = ${f(p).tex()}$, $f({\\boldsymbol w}) = ${f(w).tex()}$ and $${lam.tex()}\\cdot ${par(f(p))} + ${mu.tex()}\\cdot ${par(f(w))} = ${B.tex()}$. As it must be, $${A.tex()} \\le ${B.tex()}$. Typical mistakes: forgetting the constant $${k}$, swapping the weights $\\lambda$ and $1-\\lambda$.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp,
          dati: { q: q === "1" ? "1" : "inf", c, k, p, w, lam: lam.s(), valori: S(v) } };
      });
    },
  });

  LISTA.push({
    id: "co-g-stationary", livello: "complessa", capitolo: CAP.c4, link: link("c4", "44-quadratic-functions-with-a-linear-part"),
    linkIt: "44-funzioni-quadratiche-con-una-parte-lineare",
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = ri(rng, -2, 3), cc = ri(rng, -2, 3), b = ri(rng, -2, 2);
        const det = a * cc - b * b;
        if (det === 0 || (a === 0 && cc === 0)) return null;
        const conv = a >= 0 && cc >= 0 && det > 0;
        const xs = [ri(rng, -2, 2), ri(rng, -2, 2)];
        if (xs[0] === 0 && xs[1] === 0) return null;
        const Q = [[a, b], [b, cc]], d = ri(rng, -4, 6);
        const Qx = (x) => [a * x[0] + b * x[1], b * x[0] + cc * x[1]];
        const c = Qx(xs).map((t) => -2 * t);
        const g = (x) => { const y = Qx(x); return x[0] * y[0] + x[1] * y[1] + c[0] * x[0] + c[1] * x[1] + d; };
        const x2 = [2 * xs[0], 2 * xs[1]], xm = [-xs[0], -xs[1]];
        const C = conv ? "si" : "no", NC = conv ? "no" : "si";
        const v = [[C, xs, g(xs)], [NC, xs, g(xs)], [C, x2, g(x2)], [C, xm, g(xm)]];
        const fm = (o) => T(l,
          `$g$ ${o[0] === "si" ? "è" : "non è"} convessa; $\\nabla g$ si annulla in $${vec(o[1])}$, dove $g = ${o[2]}$`,
          `$g$ is ${o[0] === "si" ? "" : "not "}convex; $\\nabla g$ vanishes at $${vec(o[1])}$, where $g = ${o[2]}$`);
        const gs = poly([[a, "x_1^2"], [2 * b, "x_1 x_2"], [cc, "x_2^2"], [c[0], "x_1"], [c[1], "x_2"], [d, ""]]);
        const testo = T(l,
          `Sia $g({\\boldsymbol x}) = {\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x} + {\\boldsymbol c}' {\\boldsymbol x} + d = ${gs}$, con ${"${\\boldsymbol Q} = " + mat(Q) + "$"}, ${"${\\boldsymbol c} = " + vec(c) + "$"} e $d = ${d}$. Quale affermazione su convessità e punto in cui il gradiente si annulla è corretta?`,
          `Let $g({\\boldsymbol x}) = {\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x} + {\\boldsymbol c}' {\\boldsymbol x} + d = ${gs}$, with ${"${\\boldsymbol Q} = " + mat(Q) + "$"}, ${"${\\boldsymbol c} = " + vec(c) + "$"} and $d = ${d}$. Which statement on convexity and on the point where the gradient vanishes is correct?`);
        const conT = conv
          ? T(l, `${"${\\boldsymbol Q}$"} è semidefinita positiva ($q_{11}, q_{22} \\ge 0$ e $\\det {\\boldsymbol Q} = ${det} > 0$), quindi $g$ è convessa`,
              `${"${\\boldsymbol Q}$"} is positive semidefinite ($q_{11}, q_{22} \\ge 0$ and $\\det {\\boldsymbol Q} = ${det} > 0$), hence $g$ is convex`)
          : T(l, `${"${\\boldsymbol Q}$"} non è semidefinita positiva (${a < 0 || cc < 0 ? "ha un elemento diagonale negativo" : "$\\det {\\boldsymbol Q} = " + det + " < 0$"}), quindi $g$ non è convessa`,
              `${"${\\boldsymbol Q}$"} is not positive semidefinite (${a < 0 || cc < 0 ? "it has a negative diagonal entry" : "$\\det {\\boldsymbol Q} = " + det + " < 0$"}), hence $g$ is not convex`);
        const sp = T(l,
          `${conT}. $\\nabla g({\\boldsymbol x}) = 2{\\boldsymbol Q}{\\boldsymbol x} + {\\boldsymbol c} = {\\boldsymbol 0}$ dà ${"${\\boldsymbol Q}{\\boldsymbol x} = " + vec(c.map((t) => -t / 2)) + "$"}, cioè ${"${\\boldsymbol x} = " + vec(xs) + "$"}, con $g = ${g(xs)}$. Errori tipici: fattore $2$ dimenticato (${"$" + vec(x2) + "$"}), segno di ${"${\\boldsymbol c}$"} sbagliato (${"$" + vec(xm) + "$"}).`,
          `${conT}. $\\nabla g({\\boldsymbol x}) = 2{\\boldsymbol Q}{\\boldsymbol x} + {\\boldsymbol c} = {\\boldsymbol 0}$ gives ${"${\\boldsymbol Q}{\\boldsymbol x} = " + vec(c.map((t) => -t / 2)) + "$"}, that is, ${"${\\boldsymbol x} = " + vec(xs) + "$"}, with $g = ${g(xs)}$. Typical mistakes: factor $2$ forgotten (${"$" + vec(x2) + "$"}), wrong sign of ${"${\\boldsymbol c}$"} (${"$" + vec(xm) + "$"}).`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { Q, c, d, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-classify", livello: "complessa", capitolo: CAP.c5, link: link("c5", "51-optimization-problems"),
    linkIt: "51-problemi-di-ottimizzazione",
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = sc(rng, [1, -1]), h = ri(rng, -2, 3), k = ri(rng, -4, 5);
        const forma = sc(rng, ["min", "max"]);
        const tipoF = sc(rng, ["cc", "oc", "co", "oo", "cinf", "infc"]);
        const lo = tipoF === "infc" ? null : ri(rng, -4, 2), up = tipoF === "cinf" ? null : (lo === null ? ri(rng, -2, 4) : lo + ri(rng, 2, 5));
        const loC = tipoF === "cc" || tipoF === "co" || tipoF === "cinf", upC = tipoF === "cc" || tipoF === "oc" || tipoF === "infc";
        const f = (t) => a * (t - h) * (t - h) + k;
        // s = +1: si minimizza a(x-h)^2 con a > 0 (oppure si massimizza con a < 0) -> conta il punto più vicino a h
        const vicino = (forma === "min") === (a > 0);
        const ok = (t) => (lo === null || t > lo || (t === lo && loC)) && (up === null || t < up || (t === up && upC));
        let giusto;
        if (vicino) {
          const e = lo !== null && h < lo ? lo : up !== null && h > up ? up : h;
          giusto = ok(e) ? ["O", e, f(e)] : ["N", f(e)];
        } else {
          if (lo === null || up === null) giusto = ["U", forma === "max" ? "+" : "-"];
          else {
            if (Math.abs(lo - h) === Math.abs(up - h)) return null;
            const e = Math.abs(lo - h) > Math.abs(up - h) ? lo : up;
            giusto = ok(e) ? ["O", e, f(e)] : ["N", f(e)];
          }
        }
        const pool = [];
        for (const e of [lo, up, h]) if (e !== null) { pool.push(["O", e, f(e)]); pool.push(["N", f(e)]); }
        pool.push(["U", forma === "max" ? "+" : "-"]);
        const key = (o) => JSON.stringify(o);
        const altri = [];
        for (const o of pool) if (key(o) !== key(giusto) && !altri.some((x) => key(x) === key(o))) altri.push(o);
        if (altri.length < 3) return null;
        // mescola gli errori e prendine 3
        for (let i = altri.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [altri[i], altri[j]] = [altri[j], altri[i]]; }
        const v = [giusto, ...altri.slice(0, 3)];
        const sup = forma === "min" ? T(l, "inferiore", "infimum") : T(l, "superiore", "supremum");
        const fm = (o) => (o[0] === "O"
          ? T(l, `ha soluzione ottima $\\tilde{\\boldsymbol x}(P) = (${o[1]})$, con $z(P) = ${o[2]}$`, `it has optimal solution $\\tilde{\\boldsymbol x}(P) = (${o[1]})$, with $z(P) = ${o[2]}$`)
          : o[0] === "N"
            ? T(l, `ha estremo ${sup} $${o[1]}$ non raggiunto: non esiste soluzione ottima`, `it has an unattainable ${sup} $${o[1]}$: there is no optimal solution`)
            : T(l, `è illimitato, con $z(P) = ${o[1]}\\infty$`, `it is unbounded, with $z(P) = ${o[1]}\\infty$`));
        const Fs = lo === null ? `(-\\infty, ${up}]` : up === null ? `[${lo}, +\\infty)` : `${loC ? "[" : "("}${lo}, ${up}${upC ? "]" : ")"}`;
        const fs = `${a < 0 ? "-" : ""}${fpar(h, 0)}${k === 0 ? "" : k < 0 ? " - " + (-k) : " + " + k}`;
        const pr = `${forma === "min" ? "\\min" : "\\max"}\\{\\, ${fs} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ x \\in ${Fs} \\,\\}`;
        const testo = T(l,
          `Si consideri il problema $P$: $${pr}$, con $\\tilde{\\boldsymbol x}(P)$ la soluzione ottima (se esiste) e $z(P)$ il valore ottimo. Quale affermazione su $P$ è corretta?`,
          `Consider the problem $P$: $${pr}$, with $\\tilde{\\boldsymbol x}(P)$ the optimal solution (if any) and $z(P)$ the optimal value. Which statement on $P$ is correct?`);
        const spG = giusto[0] === "O"
          ? T(l, `il punto migliore della chiusura di $F$ è $x = ${giusto[1]}$, che appartiene a $F$: è la soluzione ottima, con $z(P) = ${giusto[2]}$`, `the best point of the closure of $F$ is $x = ${giusto[1]}$, which belongs to $F$: it is the optimal solution, with $z(P) = ${giusto[2]}$`)
          : giusto[0] === "N"
            ? T(l, `il valore $${giusto[1]}$ si otterrebbe in un estremo escluso da $F$: ci si avvicina quanto si vuole senza raggiungerlo`, `the value $${giusto[1]}$ would be obtained at an endpoint excluded from $F$: we get arbitrarily close without attaining it`)
            : T(l, `$F$ è illimitato e la funzione obiettivo ${forma === "max" ? "cresce" : "decresce"} indefinitamente allontanandosi da $${h}$`, `$F$ is unbounded and the objective function ${forma === "max" ? "increases" : "decreases"} indefinitely moving away from $${h}$`);
        const sp = T(l,
          `La parabola ha vertice in $x = ${h}$ (valore $${k}$) ed è rivolta verso ${a > 0 ? "l'alto" : "il basso"}: in forma di ${forma === "min" ? "minimo" : "massimo"} conta il punto di $F$ ${vicino ? "più vicino al" : "più lontano dal"} vertice. Qui ${spG}. Errori tipici: ignorare se gli estremi appartengono a $F$, o usare il vertice nella forma sbagliata.`,
          `The parabola has vertex at $x = ${h}$ (value $${k}$) and opens ${a > 0 ? "upward" : "downward"}: in ${forma === "min" ? "minimization" : "maximization"} form what matters is the point of $F$ ${vicino ? "closest to" : "farthest from"} the vertex. Here ${spG}. Typical mistakes: ignoring whether the endpoints belong to $F$, or using the vertex in the wrong form.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp,
          dati: { a, h, k, forma, lo, up, loC, upC, valori: v } };
      });
    },
  });

  /* ===================== Generatori aggiunti (7 novembre 2026): parte «Problemi di ottimizzazione» e media/complessa ===================== */

  /* x - h, (x - h), con h intero */
  const xm = (h, v = "x") => (h === 0 ? v : `${v} ${h < 0 ? "+ " + (-h) : "- " + h}`);
  const px = (h, v = "x") => (h === 0 ? v : `(${xm(h, v)})`);
  const sa = (l) => T(l, "soggetto a", "subject to");
  const XT = "$\\tilde{\\boldsymbol x}(P)$", ZP = "$z(P)$";
  const SOLT = (l) => T(l, `(con ${XT} la soluzione ottima e ${ZP} il valore ottimo)`, `(with ${XT} the optimal solution and ${ZP} the optimal value)`);
  const mescolaR = (rng, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- capitolo 5 ---------- */

  LISTA.push({
    id: "co-g-feas", livello: "facile", capitolo: CAP.c5, link: link("c5", "511-feasible-region-and-objective-function"),
    linkIt: "511-regione-ammissibile-e-funzione-obiettivo",
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = sc(rng, [1, 2]), c = [ri(rng, -1, 2), ri(rng, 0, 2)], r = sc(rng, [2, 3]);
        const s = ri(rng, 1, 4);
        const ok = [(x) => x[0] + a * x[1] <= s, (x) => x[1] >= 0, (x) => (x[0] - c[0]) ** 2 + (x[1] - c[1]) ** 2 <= r * r];
        const trova = (viol) => {
          for (let t = 0; t < 300; t++) {
            const x = [ri(rng, c[0] - r - 1, c[0] + r + 1), ri(rng, c[1] - r - 1, c[1] + r + 1)];
            if (ok.every((g, i) => g(x) === (i !== viol))) return x;
          }
          return null;
        };
        const pts = [trova(-1), trova(0), trova(1), trova(2)];
        if (pts.some((x) => x === null)) return null;
        const vinc = `${poly([[1, "x_1"], [a, "x_2"]])} \\le ${s},~ x_2 \\ge 0,~ ${px(c[0], "x_1")}^2 + ${px(c[1], "x_2")}^2 \\le ${r * r}`;
        const testo = T(l,
          `Un problema di ottimizzazione ha regione ammissibile $F = \\{\\, {\\boldsymbol x} \\in \\R^2 : ${vinc} \\,\\}$. Quale punto è una soluzione ammissibile, cioè un punto di $F$?`,
          `An optimization problem has feasible region $F = \\{\\, {\\boldsymbol x} \\in \\R^2 : ${vinc} \\,\\}$. Which point is a feasible solution, that is, a point of $F$?`);
        const nomi = T(l, ["il primo vincolo", "il secondo vincolo", "il terzo vincolo"], ["the first constraint", "the second constraint", "the third constraint"]);
        const sp = T(l,
          `Un punto è ammissibile se soddisfa <em>tutti</em> i vincoli: ${"$" + vec(pts[0]) + "$"} li soddisfa; ${"$" + vec(pts[1]) + "$"} viola ${nomi[0]}, ${"$" + vec(pts[2]) + "$"} viola ${nomi[1]} e ${"$" + vec(pts[3]) + "$"} viola ${nomi[2]}.`,
          `A point is feasible if it satisfies <em>all</em> the constraints: ${"$" + vec(pts[0]) + "$"} satisfies them; ${"$" + vec(pts[1]) + "$"} violates ${nomi[0]}, ${"$" + vec(pts[2]) + "$"} violates ${nomi[1]} and ${"$" + vec(pts[3]) + "$"} violates ${nomi[2]}.`);
        return { testo, opzioni: pts.map((x) => "$" + vec(x) + "$"), corretta: 0, spiegazione: sp, dati: { a, s, c, r, valori: pts } };
      });
    },
  });

  LISTA.push({
    id: "co-g-status", livello: "facile", capitolo: CAP.c5, link: link("c5", "51-optimization-problems"),
    linkIt: "51-problemi-di-ottimizzazione",
    genera(rng, l) {
      return ripeti(rng, () => {
        const m = sc(rng, [-3, -2, -1, 1, 2, 3]), q = ri(rng, -4, 4), forma = sc(rng, ["min", "max"]);
        const tipo = sc(rng, ["cc", "oc", "co", "cinf", "infc", "oinf", "vuoto"]);
        const lo = ri(rng, -3, 2), up = lo + ri(rng, 2, 4);
        const f = (t) => m * t + q;
        const Fs = { cc: `[${lo}, ${up}]`, oc: `(${lo}, ${up}]`, co: `[${lo}, ${up})`, cinf: `[${lo}, +\\infty)`,
          infc: `(-\\infty, ${up}]`, oinf: `(${lo}, +\\infty)`, vuoto: `\\{\\, x \\in \\R : x \\ge ${up},~ x \\le ${lo} \\,\\}` }[tipo];
        // si minimizza g = s f: conta l'estremo sinistro se s m > 0, il destro se s m < 0
        const s = forma === "min" ? 1 : -1, sinistro = s * m > 0;
        const haLo = tipo !== "infc", haUp = !["cinf", "oinf"].includes(tipo);
        const loC = ["cc", "co", "cinf"].includes(tipo), upC = ["cc", "oc", "infc"].includes(tipo);
        let giusto;
        if (tipo === "vuoto") giusto = ["E"];
        else if (sinistro ? !haLo : !haUp) giusto = ["U", forma === "max" ? "+" : "-"];
        else { const e = sinistro ? lo : up, chiuso = sinistro ? loC : upC; giusto = chiuso ? ["O", e, f(e)] : ["N", f(e)]; }
        const eFin = giusto[0] === "O" || giusto[0] === "N" ? (sinistro ? lo : up) : (haLo ? lo : up);
        const cand = {
          O: ["O", eFin, f(eFin)], N: ["N", f(eFin)], U: ["U", forma === "max" ? "+" : "-"], E: ["E"],
        };
        if (tipo === "vuoto") { cand.O = ["O", sinistro ? up : lo, f(sinistro ? up : lo)]; cand.N = ["N", f(sinistro ? lo : up)]; }
        const v = [giusto, ...["O", "N", "U", "E"].filter((k) => k !== giusto[0]).map((k) => cand[k])];
        const sup = forma === "min" ? T(l, "inferiore", "infimum") : T(l, "superiore", "supremum");
        const fm = (o) => (o[0] === "O"
          ? T(l, `ha soluzione ottima $\\tilde{\\boldsymbol x}(P) = (${o[1]})$ e valore ottimo $z(P) = ${o[2]}$`, `it has optimal solution $\\tilde{\\boldsymbol x}(P) = (${o[1]})$ and optimal value $z(P) = ${o[2]}$`)
          : o[0] === "N" ? T(l, `ha estremo ${sup} $${o[1]}$ non raggiunto: nessuna soluzione ottima`, `it has an unattainable ${sup} $${o[1]}$: no optimal solution`)
            : o[0] === "U" ? T(l, `è illimitato: $z(P) = ${o[1]}\\infty$ e nessuna soluzione ottima`, `it is unbounded: $z(P) = ${o[1]}\\infty$ and no optimal solution`)
              : T(l, `è inammissibile: $F = \\emptyset$ e nessuna soluzione ottima`, `it is infeasible: $F = \\emptyset$ and no optimal solution`));
        const pr = `${forma === "min" ? "\\min" : "\\max"}\\{\\, ${poly([[m, "x"], [q, ""]])} \\ \\text{${sa(l)}}\\ x \\in F \\,\\}`;
        const testo = T(l,
          `Si consideri il problema $P$: $${pr}$, con regione ammissibile $F = ${Fs}$, soluzione ottima $\\tilde{\\boldsymbol x}(P)$ (se esiste) e valore ottimo $z(P)$. Quale affermazione è corretta?`,
          `Consider the problem $P$: $${pr}$, with feasible region $F = ${Fs}$, optimal solution $\\tilde{\\boldsymbol x}(P)$ (if any) and optimal value $z(P)$. Which statement is correct?`);
        const dir = T(l, m > 0 ? "crescente" : "decrescente", m > 0 ? "increasing" : "decreasing");
        const spG = giusto[0] === "E" ? T(l, `nessun $x$ soddisfa insieme $x \\ge ${up}$ e $x \\le ${lo}$: $F$ è vuoto`, `no $x$ satisfies both $x \\ge ${up}$ and $x \\le ${lo}$: $F$ is empty`)
          : giusto[0] === "U" ? T(l, `$F$ è illimitato dalla parte in cui la funzione obiettivo migliora`, `$F$ is unbounded on the side where the objective function improves`)
            : giusto[0] === "N" ? T(l, `conta l'estremo $${sinistro ? lo : up}$, che non appartiene a $F$: il valore $${giusto[1]}$ non è raggiunto`, `the endpoint $${sinistro ? lo : up}$ matters, and it does not belong to $F$: the value $${giusto[1]}$ is not attained`)
              : T(l, `conta l'estremo $${giusto[1]}$, che appartiene a $F$`, `the endpoint $${giusto[1]}$ matters, and it belongs to $F$`);
        const sp = T(l,
          `La funzione obiettivo è lineare e ${dir}; in forma di ${forma === "min" ? "minimo" : "massimo"} conviene andare verso ${sinistro ? "sinistra" : "destra"}. Qui ${spG}.`,
          `The objective function is linear and ${dir}; in ${forma === "min" ? "minimization" : "maximization"} form it pays to move to the ${sinistro ? "left" : "right"}. Here ${spG}.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { m, q, forma, tipo, lo, up, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-finite", livello: "facile", capitolo: CAP.c5, link: link("c5", "box-2-def-optimal"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const c = [sc(rng, [-3, -2, -1, 1, 2, 3]), sc(rng, [-3, -2, -1, 1, 2, 3])], q = ri(rng, -3, 3);
        const forma = sc(rng, ["min", "max"]);
        const P = []; while (P.length < 4) { const x = [ri(rng, -2, 4), ri(rng, -2, 4)]; if (!P.some((y) => y[0] === x[0] && y[1] === x[1])) P.push(x); }
        const f = (x) => c[0] * x[0] + c[1] * x[1] + q;
        if (new Set(P.map(f)).size < 4) return null;
        const ord = P.slice().sort((x, y) => (forma === "min" ? f(x) - f(y) : f(y) - f(x)));
        const v = ord.map((x) => [x, f(x)]);
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = ${vec(o[0])}$, $z(P) = ${o[1]}$`;
        const Fs = P.map((x) => vec(x)).join(", ");
        const testo = T(l,
          `Il problema $P$: $${forma === "min" ? "\\min" : "\\max"}\\{\\, ${poly([[c[0], "x_1"], [c[1], "x_2"], [q, ""]])} \\ \\text{${sa(l)}}\\ {\\boldsymbol x} \\in F \\,\\}$ ha la regione ammissibile finita $F = \\left\\{ ${Fs} \\right\\}$. Quali sono la soluzione ottima e il valore ottimo ${SOLT(l)}?`,
          `The problem $P$: $${forma === "min" ? "\\min" : "\\max"}\\{\\, ${poly([[c[0], "x_1"], [c[1], "x_2"], [q, ""]])} \\ \\text{${sa(l)}}\\ {\\boldsymbol x} \\in F \\,\\}$ has the finite feasible region $F = \\left\\{ ${Fs} \\right\\}$. What are the optimal solution and the optimal value ${SOLT(l)}?`);
        const sp = T(l,
          `Si confronta il valore della funzione obiettivo in ogni soluzione ammissibile: ${P.map((x) => "$" + f(x) + "$").join(", ")}. In forma di ${forma === "min" ? "minimo vince il più piccolo" : "massimo vince il più grande"}, $${v[0][1]}$, raggiunto in ${"$" + vec(v[0][0]) + "$"}.`,
          `We compare the value of the objective function at every feasible solution: ${P.map((x) => "$" + f(x) + "$").join(", ")}. In ${forma === "min" ? "minimization form the smallest" : "maximization form the largest"} wins, $${v[0][1]}$, attained at ${"$" + vec(v[0][0]) + "$"}.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { c, q, forma, P, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-neighcap", livello: "facile", capitolo: CAP.c5, link: link("c5", "box-17-def-localopt"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const lo = ri(rng, -3, 2), up = lo + ri(rng, 3, 7), dl = sc(rng, [1, 2, 3]);
        const xb = ri(rng, lo, up);
        const a = Math.max(lo, xb - dl), aC = xb - dl < lo, b = Math.min(up, xb + dl), bC = xb + dl > up;
        if (!aC && !bC && rng() < 0.6) return null;                    // più spesso un caso con un estremo di F
        const I = (o) => `${o[1] ? "[" : "("}${o[0]}, ${o[2]}${o[3] ? "]" : ")"}`;
        const giusto = [a, aC, b, bC];
        const cand = [[a, !aC, b, !bC], [xb - dl, false, xb + dl, false], [xb - dl, true, xb + dl, true], [lo, true, up, true], [a, true, b, true], [a, false, b, false]];
        const k = (o) => JSON.stringify(o), v = [giusto];
        for (const o of cand) if (v.length < 4 && !v.some((x) => k(x) === k(o))) v.push(o);
        if (v.length < 4) return null;
        const testo = T(l,
          `Nella definizione di punto di minimo locale si usa l'intorno sferico $N(\\bar{\\boldsymbol x}, \\delta)$, l'insieme dei punti a distanza minore di $\\delta$ da $\\bar{\\boldsymbol x}$. In $\\R$, con regione ammissibile $F = [${lo}, ${up}]$, $\\bar x = ${xb}$ e $\\delta = ${dl}$, quale insieme è $N\\big((${xb}), ${dl}\\big) \\cap F$?`,
          `The definition of a local minimum point uses the spherical neighborhood $N(\\bar{\\boldsymbol x}, \\delta)$, the set of the points at distance less than $\\delta$ from $\\bar{\\boldsymbol x}$. In $\\R$, with feasible region $F = [${lo}, ${up}]$, $\\bar x = ${xb}$ and $\\delta = ${dl}$, which set is $N\\big((${xb}), ${dl}\\big) \\cap F$?`);
        const sp = T(l,
          `In $\\R$ l'intorno è l'intervallo aperto $(${xb - dl}, ${xb + dl})$; intersecandolo con $F = [${lo}, ${up}]$ si ottiene $${I(giusto)}$: un estremo di $F$ che cade dentro l'intorno resta incluso, un estremo dell'intorno resta escluso.`,
          `In $\\R$ the neighborhood is the open interval $(${xb - dl}, ${xb + dl})$; intersecting it with $F = [${lo}, ${up}]$ gives $${I(giusto)}$: an endpoint of $F$ falling inside the neighborhood stays included, an endpoint of the neighborhood stays excluded.`);
        return { testo, opzioni: v.map((o) => "$" + I(o) + "$"), corretta: 0, spiegazione: sp, dati: { lo, up, xb, dl, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-negprop", livello: "media", capitolo: CAP.c5, link: link("c5", "52-properties-of-optimization-problems"),
    linkIt: "52-proprieta-dei-problemi-di-ottimizzazione",
    genera(rng, l) {
      return ripeti(rng, () => {
        const h = ri(rng, -2, 3), k = ri(rng, -3, 3), lo = ri(rng, -3, h), up = ri(rng, h + 1, h + 4);
        const a = sc(rng, [-3, -2, -1, 2, 3]), b = ri(rng, -6, 6);
        if (b === 0 || Math.abs(lo - h) === Math.abs(up - h)) return null;
        const f = (t) => (t - h) * (t - h) + k;
        const xmin = h, xmax = Math.abs(lo - h) > Math.abs(up - h) ? lo : up;
        const xs = a > 0 ? xmin : xmax, xo = a > 0 ? xmax : xmin;
        const z = a * f(xs) + b;
        const v = [[xs, z], [xo, a * f(xo) + b], [xs, a * f(xs)], [xs, -z]];
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = (${o[0]})$, $z(P) = ${o[1]}$`;
        const pr = `\\min\\{\\, ${a === -1 ? "-" : a + "\\,"}f(x) ${b < 0 ? "- " + (-b) : "+ " + b} \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}`;
        const testo = T(l,
          `Sia $f(x) = ${fpar(h, k)}$. Quali sono la soluzione ottima e il valore ottimo del problema $P$: $${pr}$ ${SOLT(l)}?`,
          `Let $f(x) = ${fpar(h, k)}$. What are the optimal solution and the optimal value of the problem $P$: $${pr}$ ${SOLT(l)}?`);
        const sp = a > 0
          ? T(l, `La costante $${b}$ si somma fuori e, con $a = ${a} > 0$, $\\min\\{a f\\} = a \\min\\{f\\}$: il minimo di $f$ su $[${lo}, ${up}]$ è $${f(h)}$, in $x = ${h}$, quindi $z(P) = ${a}\\cdot(${f(h)}) ${b < 0 ? "- " + (-b) : "+ " + b} = ${z}$.`,
            `The constant $${b}$ is added outside and, with $a = ${a} > 0$, $\\min\\{a f\\} = a \\min\\{f\\}$: the minimum of $f$ over $[${lo}, ${up}]$ is $${f(h)}$, at $x = ${h}$, hence $z(P) = ${a}\\cdot(${f(h)}) ${b < 0 ? "- " + (-b) : "+ " + b} = ${z}$.`)
          : T(l, `La costante $${b}$ si somma fuori e, con $a = ${a} < 0$, $\\min\\{a f\\} = a \\max\\{f\\}$: il massimo di $f$ su $[${lo}, ${up}]$ è $${f(xmax)}$, nell'estremo $x = ${xmax}$ più lontano da $${h}$, quindi $z(P) = ${a}\\cdot ${f(xmax) < 0 ? "(" + f(xmax) + ")" : f(xmax)} ${b < 0 ? "- " + (-b) : "+ " + b} = ${z}$. Errore tipico: usare il minimo di $f$.`,
            `The constant $${b}$ is added outside and, with $a = ${a} < 0$, $\\min\\{a f\\} = a \\max\\{f\\}$: the maximum of $f$ over $[${lo}, ${up}]$ is $${f(xmax)}$, at the endpoint $x = ${xmax}$ farthest from $${h}$, hence $z(P) = ${a}\\cdot ${f(xmax) < 0 ? "(" + f(xmax) + ")" : f(xmax)} ${b < 0 ? "- " + (-b) : "+ " + b} = ${z}$. Typical mistake: using the minimum of $f$.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { h, k, lo, up, a, b, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-localcubic", livello: "media", capitolo: CAP.c5, link: link("c5", "box-17-def-localopt"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const [s, t] = sc(rng, [[1, 3], [2, 3], [2, 5], [1, 4], [3, 4], [3, 5], [3, 7]]), h = ri(rng, -2, 2), k = ri(rng, -3, 6);
        const lo = h - t, up = h + s + ri(rng, 1, 2);
        const f = (x) => (x - h) ** 3 - 3 * s * s * (x - h) + k;
        const xm1 = h + s, xM = h - s;
        if (f(lo) === f(xm1)) return null;
        const best = f(lo) < f(xm1) ? lo : xm1, altro = best === lo ? xm1 : lo;
        const v = [[[lo, xm1], best], [[lo, xm1], altro], [[xm1], xm1], [[xM, up], best === lo ? up : xM]];
        const fs = poly([[1, "x^3"], [-3 * h, "x^2"], [3 * h * h - 3 * s * s, "x"], [-(h ** 3) + 3 * s * s * h + k, ""]]);
        const hs = px(h);
        const fm = (o) => T(l, `punti di minimo locale: $${o[0].join(",\\ ")}$; soluzione ottima $\\tilde{\\boldsymbol x}(P) = (${o[1]})$`, `local minimum points: $${o[0].join(",\\ ")}$; optimal solution $\\tilde{\\boldsymbol x}(P) = (${o[1]})$`);
        const testo = T(l,
          `Si consideri il problema $P$: $\\min\\{\\, ${fs} \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}$, con funzione obiettivo $f(x) = ${hs}^3 - ${3 * s * s}\\,${hs} ${k < 0 ? "- " + (-k) : k > 0 ? "+ " + k : ""}$ e derivata nulla in $x = ${xM}$ e $x = ${xm1}$. Quali sono i punti di minimo locale di $f$ in $F = [${lo}, ${up}]$ e la soluzione ottima $\\tilde{\\boldsymbol x}(P)$?`,
          `Consider the problem $P$: $\\min\\{\\, ${fs} \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}$, with objective function $f(x) = ${hs}^3 - ${3 * s * s}\\,${hs} ${k < 0 ? "- " + (-k) : k > 0 ? "+ " + k : ""}$ and zero derivative at $x = ${xM}$ and $x = ${xm1}$. What are the local minimum points of $f$ in $F = [${lo}, ${up}]$ and the optimal solution $\\tilde{\\boldsymbol x}(P)$?`);
        const sp = T(l,
          `$f$ cresce in $[${lo}, ${xM}]$, decresce in $[${xM}, ${xm1}]$ e cresce in $[${xm1}, ${up}]$: sono punti di minimo locale $x = ${xm1}$ e anche l'estremo $x = ${lo}$ (vicino a esso, in $F$, $f$ non scende sotto $f(${lo})$). Confrontando $f(${lo}) = ${f(lo)}$ e $f(${xm1}) = ${f(xm1)}$, la soluzione ottima è $x = ${best}$. Errore tipico: dimenticare gli estremi della regione ammissibile.`,
          `$f$ increases on $[${lo}, ${xM}]$, decreases on $[${xM}, ${xm1}]$ and increases on $[${xm1}, ${up}]$: the local minimum points are $x = ${xm1}$ and also the endpoint $x = ${lo}$ (near it, in $F$, $f$ does not go below $f(${lo})$). Comparing $f(${lo}) = ${f(lo)}$ and $f(${xm1}) = ${f(xm1)}$, the optimal solution is $x = ${best}$. Typical mistake: forgetting the endpoints of the feasible region.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { h, s, k, lo, up, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-multiopt", livello: "media", capitolo: CAP.c5, link: link("c5", "box-4-exOptMultiple"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const h = ri(rng, -2, 2), r = ri(rng, 1, 2), lo = h - r - ri(rng, -1, 2), up = h + r + ri(rng, 1, 3);
        const f = (t) => Math.max(0, Math.abs(t - h) - r);
        const am = [Math.max(lo, h - r), h + r];
        if (am[0] >= am[1]) return null;
        const M = Math.max(f(lo), f(up)), aM = [lo, up].filter((t) => f(t) === M);
        const altroM = aM.length === 2 ? [up] : [aM[0] === lo ? up : lo];
        const terzoM = aM.length === 2 ? [lo] : [lo, up];
        const taglio = am[0] > h - r;
        const v = [[am, aM], [[h, h], aM], [am, altroM], taglio ? [[h - r, h + r], aM] : [am, terzoM]];
        const I = (a) => (a[0] === a[1] ? `\\{${a[0]}\\}` : `[${a[0]}, ${a[1]}]`);
        const fm = (o) => `$\\arg\\min = ${I(o[0])}$, $\\arg\\max = \\{${o[1].join(", ")}\\}$`;
        const fs = `\\max\\{\\, 0,\\; |${xm(h)}| - ${r} \\,\\}`;
        const testo = T(l,
          `Per la funzione obiettivo $f(x) = ${fs}$ sulla regione ammissibile $F = [${lo}, ${up}]$, quali sono gli insiemi delle soluzioni ottime $\\arg\\min\\{ f(x) \\text{ ${sa(l)} } x \\in F \\}$ e $\\arg\\max\\{ f(x) \\text{ ${sa(l)} } x \\in F \\}$?`,
          `For the objective function $f(x) = ${fs}$ over the feasible region $F = [${lo}, ${up}]$, what are the sets of optimal solutions $\\arg\\min\\{ f(x) \\text{ ${sa(l)} } x \\in F \\}$ and $\\arg\\max\\{ f(x) \\text{ ${sa(l)} } x \\in F \\}$?`);
        const sp = T(l,
          `$f(x) = 0$ per $${h - r} \\le x \\le ${h + r}$ e $f(x) = |${xm(h)}| - ${r}$ altrove: in $F$ il valore minimo $0$ è raggiunto in tutto $${I(am)}$ (infinite soluzioni ottime). Il massimo sta negli estremi: $f(${lo}) = ${f(lo)}$, $f(${up}) = ${f(up)}$.`,
          `$f(x) = 0$ for $${h - r} \\le x \\le ${h + r}$ and $f(x) = |${xm(h)}| - ${r}$ elsewhere: in $F$ the minimum value $0$ is attained on all of $${I(am)}$ (infinitely many optimal solutions). The maximum is at the endpoints: $f(${lo}) = ${f(lo)}$, $f(${up}) = ${f(up)}$.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { h, r, lo, up, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-localglobal", livello: "complessa", capitolo: CAP.c5, link: link("c5", "box-19-exOptLocal"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = ri(rng, -4, -1), b = a + ri(rng, 4, 6), c1 = ri(rng, 0, 3), c2 = ri(rng, 0, 3);
        if (c1 === c2) return null;
        const lo = a - ri(rng, 1, 2), up = b + ri(rng, 1, 2);
        const xg = c1 < c2 ? a : b, xl = c1 < c2 ? b : a, cg = Math.min(c1, c2), cl = Math.max(c1, c2);
        const v = [[xl, cg], [xg, cg], [xl, cl], [xg, cl]];
        const fm = (o) => T(l, `$x = ${o[0]}$; valore ottimo $z(P) = ${o[1]}$`, `$x = ${o[0]}$; optimal value $z(P) = ${o[1]}$`);
        const fs = `\\min\\{\\, ${fpar(a, c1)},\\; ${fpar(b, c2)} \\,\\}`;
        const testo = T(l,
          `Si consideri il problema $P$: $\\min\\{\\, f(x) \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}$ con $f(x) = ${fs}$ e valore ottimo $z(P)$. Quale punto è un punto di minimo locale di $f$ in $[${lo}, ${up}]$ che <em>non</em> è una soluzione ottima, e quanto vale $z(P)$?`,
          `Consider the problem $P$: $\\min\\{\\, f(x) \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}$ with $f(x) = ${fs}$ and optimal value $z(P)$. Which point is a local minimum point of $f$ in $[${lo}, ${up}]$ that is <em>not</em> an optimal solution, and what is $z(P)$?`);
        const sp = T(l,
          `Vicino a $x = ${a}$ vale $f(x) = ${fpar(a, c1)} \\ge ${c1}$ e vicino a $x = ${b}$ vale $f(x) = ${fpar(b, c2)} \\ge ${c2}$: entrambi sono punti di minimo locale, con minimi locali $${c1}$ e $${c2}$. Poiché $f(x) \\ge ${cg}$ ovunque, la soluzione ottima è $x = ${xg}$ con $z(P) = ${cg}$, e $x = ${xl}$ è un minimo locale non globale (gli estremi $${lo}$ e $${up}$ sono punti di massimo locale).`,
          `Near $x = ${a}$ we have $f(x) = ${fpar(a, c1)} \\ge ${c1}$ and near $x = ${b}$ we have $f(x) = ${fpar(b, c2)} \\ge ${c2}$: both are local minimum points, with local minima $${c1}$ and $${c2}$. Since $f(x) \\ge ${cg}$ everywhere, the optimal solution is $x = ${xg}$ with $z(P) = ${cg}$, and $x = ${xl}$ is a local minimum that is not global (the endpoints $${lo}$ and $${up}$ are local maximum points).`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { a, b, c1, c2, lo, up, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-gap", livello: "complessa", capitolo: CAP.c5, link: link("c5", "512-feasible-solutions-and-bounds-on-the-optimal-value"),
    linkIt: "512-soluzioni-ammissibili-e-limitazioni-sul-valore-ottimo",
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = sc(rng, [1, 2, -1, -2]), h = ri(rng, -2, 3), k = ri(rng, -3, 4), forma = sc(rng, ["min", "max"]);
        const lo = ri(rng, -4, 1), up = lo + ri(rng, 3, 6);
        const f = (t) => a * (t - h) * (t - h) + k;
        // punto ottimo: vertice "proiettato" se (min con a > 0) o (max con a < 0), altrimenti estremo più lontano
        const vicino = (forma === "min") === (a > 0);
        if (!vicino && Math.abs(lo - h) === Math.abs(up - h)) return null;
        const clip = Math.min(Math.max(h, lo), up), lont = Math.abs(lo - h) > Math.abs(up - h) ? lo : up;
        const xs = vicino ? clip : lont, z = f(xs);
        const wrong = vicino ? (clip !== h ? k : f(lont)) : (h >= lo && h <= up ? k : f(clip));
        if (wrong === z) return null;
        const pts = []; while (pts.length < 3) { const t = ri(rng, lo, up); if (!pts.includes(t) && t !== xs) pts.push(t); }
        const vals = pts.map(f);
        if (new Set(vals).size < 3) return null;
        const bb = forma === "min" ? Math.min(...vals) : Math.max(...vals), bw = forma === "min" ? Math.max(...vals) : Math.min(...vals);
        const T1 = forma === "min" ? "UB" : "LB", T2 = forma === "min" ? "LB" : "UB";
        const v = [[T1, bb, z], [T1, bw, z], [T1, bb, wrong], [T2, bb, z]];
        const fb = (t, b) => (t === "UB" ? `z(P) \\le ${b}` : `${b} \\le z(P)`);
        const fm = (o) => T(l, `limitazione migliore $${fb(o[0], o[1])}$; valore ottimo $z(P) = ${o[2]}$`, `best bound $${fb(o[0], o[1])}$; optimal value $z(P) = ${o[2]}$`);
        const pr = `${forma === "min" ? "\\min" : "\\max"}\\{\\, ${a === 1 ? "" : a === -1 ? "-" : a}${a === 1 || a === -1 ? "" : "\\,"}${px(h)}^2 ${k < 0 ? "- " + (-k) : k > 0 ? "+ " + k : ""} \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}`;
        const plist = pts.map((t, i) => `$\\bar{\\boldsymbol x}^{(${i + 1})} = (${t})$`).join(", ");
        const testo = T(l,
          `Per il problema $P$: $${pr}$, con valore ottimo $z(P)$, si conoscono le soluzioni ammissibili ${plist}. Qual è la migliore limitazione su $z(P)$ che esse forniscono, e quanto vale $z(P)$?`,
          `For the problem $P$: $${pr}$, with optimal value $z(P)$, the feasible solutions ${plist} are known. What is the best bound on $z(P)$ that they provide, and what is $z(P)$?`);
        const sp = T(l,
          `I valori obiettivo sono ${vals.map((x) => "$" + x + "$").join(", ")}; in forma di ${forma === "min" ? "minimo danno upper bound e il migliore è il più piccolo" : "massimo danno lower bound e il migliore è il più grande"}, $${bb}$. La parabola ha vertice in $x = ${h}$ ed è rivolta verso ${a > 0 ? "l'alto" : "il basso"}: l'ottimo è in $x = ${xs}$, con $z(P) = ${z}$.`,
          `The objective values are ${vals.map((x) => "$" + x + "$").join(", ")}; in ${forma === "min" ? "minimization form they give upper bounds and the best one is the smallest" : "maximization form they give lower bounds and the best one is the largest"}, $${bb}$. The parabola has vertex at $x = ${h}$ and opens ${a > 0 ? "upward" : "downward"}: the optimum is at $x = ${xs}$, with $z(P) = ${z}$.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { a, h, k, forma, lo, up, pts, valori: v } };
      });
    },
  });

  /* ---------- capitolo 6 ---------- */

  LISTA.push({
    id: "co-g-convtype", livello: "facile", capitolo: CAP.c6, link: link("c6", "box-1-def-convexproblem"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const h = ri(rng, -2, 2), forma = sc(rng, ["min", "max"]);
        const ob = sc(rng, ["conv", "conc", "cubo"]), reg = sc(rng, ["int", "int", "unione", "fuori"]);
        const a = ob === "conv" ? sc(rng, [1, 2, 3]) : -sc(rng, [1, 2, 3]), k = ri(rng, -3, 4);
        let lo, up, Fs, Fconv = reg === "int";
        const fs = ob === "cubo" ? `${px(h)}^3 ${k < 0 ? "- " + (-k) : k > 0 ? "+ " + k : ""}` : `${a === 1 ? "" : a === -1 ? "-" : a}${px(h)}^2 ${k < 0 ? "- " + (-k) : k > 0 ? "+ " + k : ""}`;
        if (reg === "int") {
          if (ob === "cubo") { const c = sc(rng, ["d", "s", "m"]), t = ri(rng, 1, 3); lo = c === "d" ? h : c === "s" ? h - t : h - t; up = c === "d" ? h + t : c === "s" ? h : h + ri(rng, 1, 3); }
          else { lo = ri(rng, -3, 1); up = lo + ri(rng, 2, 5); }
          Fs = `[${lo}, ${up}]`;
        } else if (reg === "unione") { lo = ri(rng, -4, -1); const m1 = lo + ri(rng, 1, 2), m2 = m1 + ri(rng, 1, 2); up = m2 + ri(rng, 1, 3); Fs = `[${lo}, ${m1}] \\cup [${m2}, ${up}]`; }
        else { const r = ri(rng, 1, 3); Fs = `\\{\\, x \\in \\R : ${px(h)}^2 \\ge ${r * r} \\,\\}`; }
        let curv;                                                          // curvatura di f sulla regione (se convessa)
        if (ob === "conv") curv = "conv"; else if (ob === "conc") curv = "conc";
        else curv = Fconv ? (lo >= h ? "conv" : up <= h ? "conc" : "nessuna") : "nessuna";
        const giusto = !Fconv ? "Fnc" : curv === "conv" ? "conv" : curv === "conc" ? "conc" : "fnc";
        const v = [giusto, ...["conv", "conc", "Fnc", "fnc"].filter((x) => x !== giusto)];
        const fm = (o) => ({
          conv: T(l, "è un problema convesso: $F$ è convesso e $f$ è convessa su $F$", "it is a convex problem: $F$ is convex and $f$ is convex on $F$"),
          conc: T(l, "è un problema concavo: $F$ è convesso e $f$ è concava su $F$", "it is a concave problem: $F$ is convex and $f$ is concave on $F$"),
          Fnc: T(l, "non è né convesso né concavo, perché $F$ non è convesso", "it is neither convex nor concave, because $F$ is not convex"),
          fnc: T(l, "non è né convesso né concavo, perché $f$ non lo è su $F$", "it is neither convex nor concave, because $f$ is neither on $F$"),
        })[o];
        const testo = T(l,
          `Un problema di ottimizzazione con regione ammissibile convessa è convesso se la funzione obiettivo è convessa sulla regione, concavo se è concava. Che cosa si può dire del problema $P$: $${forma === "min" ? "\\min" : "\\max"}\\{\\, f(x) = ${fs} \\ \\text{${sa(l)}}\\ x \\in F \\,\\}$, con $F = ${Fs}$?`,
          `An optimization problem with a convex feasible region is convex if the objective function is convex on the region, concave if it is concave. What can be said of the problem $P$: $${forma === "min" ? "\\min" : "\\max"}\\{\\, f(x) = ${fs} \\ \\text{${sa(l)}}\\ x \\in F \\,\\}$, with $F = ${Fs}$?`);
        const spF = !Fconv ? T(l, `$F = ${Fs}$ non è convesso (contiene due punti ma non il segmento fra loro)`, `$F = ${Fs}$ is not convex (it contains two points but not the segment between them)`)
          : T(l, `$F = ${Fs}$ è un intervallo, quindi convesso`, `$F = ${Fs}$ is an interval, hence convex`);
        const spf = ob === "cubo" ? T(l, `$${px(h)}^3$ è convessa dove $x \\ge ${h}$ e concava dove $x \\le ${h}$ (disuguaglianza dei cubi)`, `$${px(h)}^3$ is convex where $x \\ge ${h}$ and concave where $x \\le ${h}$ (inequality of cubes)`)
          : T(l, `$${fs}$ è ${a > 0 ? "convessa" : "concava"} (coefficiente di $x^2$ ${a > 0 ? "positivo" : "negativo"})`, `$${fs}$ is ${a > 0 ? "convex" : "concave"} (coefficient of $x^2$ ${a > 0 ? "positive" : "negative"})`);
        const sp = T(l, `${spF}; ${spf}. La forma (minimo o massimo) non conta nella definizione.`, `${spF}; ${spf}. The form (minimization or maximization) does not matter in the definition.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { ob, reg, h, a, k, lo: lo === undefined ? null : lo, up: up === undefined ? null : up, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-cubeineq", livello: "facile", capitolo: CAP.c6, link: link("c6", "box-6-obs-cubes"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const sg = sc(rng, [1, -1]), a = sg * ri(rng, 0, 3), b = sg * ri(rng, 0, 3);
        if (a === b) return null;
        const lam = sc(rng, [F(1, 3), F(2, 3), F(1, 4), F(3, 4)]), mu = F(1).sub(lam);
        const D = lam.mul(mu).mul((a - b) * (a - b)).mul(lam.add(1).mul(a).add(mu.add(1).mul(b)));
        const Dsw = lam.mul(mu).mul((a - b) * (a - b)).mul(mu.add(1).mul(a).add(lam.add(1).mul(b)));
        const Dno = lam.add(1).mul(a).add(mu.add(1).mul(b)).mul((a - b) * (a - b));
        const v = [D, D.neg(), Dsw, Dno];
        const testo = T(l,
          `Per ogni $\\lambda \\in [0,1]$ e $a, b \\in \\R$ vale $\\lambda a^3 + (1-\\lambda) b^3 - \\big(\\lambda a + (1-\\lambda) b\\big)^3 = \\lambda(1-\\lambda)(a-b)^2\\big((1+\\lambda)a + (2-\\lambda)b\\big)$. Quanto vale questa differenza per $a = ${a}$, $b = ${b}$ e $\\lambda = ${lam.tex()}$?`,
          `For every $\\lambda \\in [0,1]$ and $a, b \\in \\R$ we have $\\lambda a^3 + (1-\\lambda) b^3 - \\big(\\lambda a + (1-\\lambda) b\\big)^3 = \\lambda(1-\\lambda)(a-b)^2\\big((1+\\lambda)a + (2-\\lambda)b\\big)$. What is this difference for $a = ${a}$, $b = ${b}$ and $\\lambda = ${lam.tex()}$?`);
        const sp = T(l,
          `$\\lambda(1-\\lambda) = ${lam.mul(mu).tex()}$, $(a-b)^2 = ${(a - b) * (a - b)}$ e $(1+\\lambda)a + (2-\\lambda)b = ${lam.add(1).mul(a).add(mu.add(1).mul(b)).tex()}$: il prodotto è $${D.tex()}$. Con $a, b ${sg > 0 ? "\\ge" : "\\le"} 0$ la differenza è ${sg > 0 ? "non negativa" : "non positiva"}, come afferma l'osservazione sui cubi.`,
          `$\\lambda(1-\\lambda) = ${lam.mul(mu).tex()}$, $(a-b)^2 = ${(a - b) * (a - b)}$ and $(1+\\lambda)a + (2-\\lambda)b = ${lam.add(1).mul(a).add(mu.add(1).mul(b)).tex()}$: the product is $${D.tex()}$. With $a, b ${sg > 0 ? "\\ge" : "\\le"} 0$ the difference is ${sg > 0 ? "nonnegative" : "nonpositive"}, as the observation on cubes states.`);
        return { testo, opzioni: v.map((x) => "$" + x.tex() + "$"), corretta: 0, spiegazione: sp, dati: { a, b, lam: lam.s(), valori: S(v) } };
      });
    },
  });

  LISTA.push({
    id: "co-g-concmin", livello: "facile", capitolo: CAP.c6, link: link("c6", "62-local-optima-of-convex-and-concave-problems"),
    linkIt: "62-ottimi-locali-dei-problemi-convessi-e-concavi",
    genera(rng, l) {
      return ripeti(rng, () => {
        const h = ri(rng, -2, 2), k = ri(rng, -2, 9), lo = h - ri(rng, 1, 3), up = h + ri(rng, 1, 3);
        if (h - lo === up - h) return null;
        const f = (t) => k - (t - h) * (t - h);
        const far = h - lo > up - h ? lo : up, near = far === lo ? up : lo;
        const v = [[[lo, up], far, f(far)], [[h], h, k], [[lo, up], near, f(near)], [[far], far, f(far)]];
        const fm = (o) => T(l, `minimi locali in $x = ${o[0].join("$ e $x = ")}$; $\\tilde{\\boldsymbol x}(P) = (${o[1]})$, $z(P) = ${o[2]}$`, `local minima at $x = ${o[0].join("$ and $x = ")}$; $\\tilde{\\boldsymbol x}(P) = (${o[1]})$, $z(P) = ${o[2]}$`);
        const fs = `${k === 0 ? "" : k + " "}- ${px(h)}^2`;
        const testo = T(l,
          `Nel problema $P$: $\\min\\{\\, ${fs} \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}$ la funzione obiettivo è concava: non è un problema di minimizzazione convesso. Quali sono i punti di minimo locale, la soluzione ottima e il valore ottimo ${SOLT(l)}?`,
          `In the problem $P$: $\\min\\{\\, ${fs} \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}$ the objective function is concave: it is not a convex minimization problem. What are the local minimum points, the optimal solution and the optimal value ${SOLT(l)}?`);
        const sp = T(l,
          `La funzione cresce fino a $x = ${h}$ (punto di massimo, valore $${k}$) e poi decresce: entrambi gli estremi sono punti di minimo locale, con valori $f(${lo}) = ${f(lo)}$ e $f(${up}) = ${f(up)}$. La soluzione ottima è l'estremo più lontano da $${h}$, $x = ${far}$; l'altro è un minimo locale non globale, cosa impossibile in un problema di minimizzazione convesso.`,
          `The function increases up to $x = ${h}$ (maximum point, value $${k}$) and then decreases: both endpoints are local minimum points, with values $f(${lo}) = ${f(lo)}$ and $f(${up}) = ${f(up)}$. The optimal solution is the endpoint farthest from $${h}$, $x = ${far}$; the other is a local minimum that is not global, which is impossible in a convex minimization problem.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { h, k, lo, up, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-lpbox", livello: "facile", capitolo: CAP.c6, link: link("c6", "61-convex-and-concave-optimization-problems"),
    linkIt: "61-problemi-di-ottimizzazione-convessi-e-concavi",
    genera(rng, l) {
      return ripeti(rng, () => {
        const c = [sc(rng, [-3, -2, -1, 1, 2, 3]), sc(rng, [-3, -2, -1, 1, 2, 3])], forma = sc(rng, ["min", "max"]);
        const lo = [ri(rng, -2, 1), ri(rng, -2, 1)], up = [lo[0] + ri(rng, 1, 3), lo[1] + ri(rng, 1, 3)];
        const f = (x) => c[0] * x[0] + c[1] * x[1];
        const s = forma === "min" ? 1 : -1;
        const best = [0, 1].map((i) => (s * c[i] > 0 ? lo[i] : up[i])), opp = [0, 1].map((i) => (best[i] === lo[i] ? up[i] : lo[i]));
        const v = [best, [opp[0], best[1]], [best[0], opp[1]], opp].map((x) => [x, f(x)]);
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = ${vec(o[0])}$, $z(P) = ${o[1]}$`;
        const pr = `${forma === "min" ? "\\min" : "\\max"}\\{\\, ${poly([[c[0], "x_1"], [c[1], "x_2"]])} \\ \\text{${sa(l)}}\\ ${lo[0]} \\le x_1 \\le ${up[0]},~ ${lo[1]} \\le x_2 \\le ${up[1]} \\,\\}`;
        const testo = T(l,
          `La funzione obiettivo lineare del problema $P$: $${pr}$ è sia convessa sia concava, e il rettangolo è convesso. Quali sono la soluzione ottima e il valore ottimo ${SOLT(l)}?`,
          `The linear objective function of the problem $P$: $${pr}$ is both convex and concave, and the rectangle is convex. What are the optimal solution and the optimal value ${SOLT(l)}?`);
        const sp = T(l,
          `Ogni termine dipende da una sola variabile: in forma di ${forma === "min" ? "minimo" : "massimo"}, $x_i$ va all'estremo inferiore se il suo coefficiente è ${forma === "min" ? "positivo" : "negativo"}, a quello superiore altrimenti. Quindi $\\tilde{\\boldsymbol x}(P) = ${vec(best)}$ e $z(P) = ${f(best)}$. Errore tipico: sbagliare il verso per un coefficiente negativo.`,
          `Each term depends on a single variable: in ${forma === "min" ? "minimization" : "maximization"} form, $x_i$ goes to its lower bound if its coefficient is ${forma === "min" ? "positive" : "negative"}, to its upper bound otherwise. Hence $\\tilde{\\boldsymbol x}(P) = ${vec(best)}$ and $z(P) = ${f(best)}$. Typical mistake: getting the direction wrong for a negative coefficient.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { c, forma, lo, up, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-cubicregion", livello: "facile", capitolo: CAP.c6, link: link("c6", "box-6-obs-cubes"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const h = ri(rng, -2, 3), s = sc(rng, [1, 2]), k = ri(rng, -3, 5), t = ri(rng, 2, 4), u = ri(rng, 0, 1);
        const conv = rng() < 0.5;
        const giusto = conv ? [h + u, h + u + t] : [h - u - t, h - u];
        const altri = conv ? [[h - t, h], [h - t + 1, h + 1], [h - u - t - 1, h - u - 1]] : [[h, h + t], [h - 1, h + t - 1], [h + u + 1, h + u + t + 1]];
        const v = [giusto, ...altri];
        const hs = px(h);
        const fs = `${hs}^3 - ${3 * s * s}\\,${hs} ${k < 0 ? "- " + (-k) : k > 0 ? "+ " + k : ""}`;
        const tipo = conv ? T(l, "di minimizzazione convesso", "convex minimization") : T(l, "di massimizzazione concavo", "concave maximization");
        const testo = T(l,
          `Sia $f(x) = ${fs}$. Per quale regione ammissibile $F$ il problema $${conv ? "\\min" : "\\max"}\\{\\, f(x) \\ \\text{${sa(l)}}\\ x \\in F \\,\\}$ è un problema ${tipo}?`,
          `Let $f(x) = ${fs}$. For which feasible region $F$ is the problem $${conv ? "\\min" : "\\max"}\\{\\, f(x) \\ \\text{${sa(l)}}\\ x \\in F \\,\\}$ a ${tipo} problem?`);
        const sp = T(l,
          `Con $a = p ${h < 0 ? "+ " + (-h) : "- " + h}$ e $b = w ${h < 0 ? "+ " + (-h) : "- " + h}$, la disuguaglianza dei cubi dà $\\big(\\lambda a + (1-\\lambda) b\\big)^3 \\le \\lambda a^3 + (1-\\lambda) b^3$ se $a, b \\ge 0$ e $\\ge$ se $a, b \\le 0$; il termine $-${3 * s * s}\\,${hs}$ è lineare. Quindi $f$ è convessa su intervalli con $x \\ge ${h}$ e concava su intervalli con $x \\le ${h}$: serve $F = [${giusto[0]}, ${giusto[1]}]$. Un intervallo che contiene $${h}$ al suo interno non va bene.`,
          `With $a = p ${h < 0 ? "+ " + (-h) : "- " + h}$ and $b = w ${h < 0 ? "+ " + (-h) : "- " + h}$, the inequality of cubes gives $\\big(\\lambda a + (1-\\lambda) b\\big)^3 \\le \\lambda a^3 + (1-\\lambda) b^3$ if $a, b \\ge 0$ and $\\ge$ if $a, b \\le 0$; the term $-${3 * s * s}\\,${hs}$ is linear. Hence $f$ is convex on intervals with $x \\ge ${h}$ and concave on intervals with $x \\le ${h}$: we need $F = [${giusto[0]}, ${giusto[1]}]$. An interval containing $${h}$ in its interior does not work.`);
        return { testo, opzioni: v.map((o) => `$F = [${o[0]}, ${o[1]}]$`), corretta: 0, spiegazione: sp, dati: { h, s, k, conv, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-diskproj", livello: "media", capitolo: CAP.c6, link: link("c6", "63-examples-of-convex-and-concave-optimization-problems"),
    linkIt: "63-esempi-di-problemi-di-ottimizzazione-convessi-e-concavi",
    genera(rng, l) {
      return ripeti(rng, () => {
        const base = sc(rng, [[3, 4], [4, 3]]), sg = [sc(rng, [1, -1]), sc(rng, [1, -1])];
        const u = [base[0] * sg[0], base[1] * sg[1]];
        const rho = sc(rng, [1, 2]), kap = rho + ri(rng, 1, 2), r = 5 * rho;
        const c = [kap * u[0], kap * u[1]], xs = [rho * u[0], rho * u[1]];
        const f = (x) => (x[0] - c[0]) ** 2 + (x[1] - c[1]) ** 2;
        const clip = c.map((t) => Math.max(-r, Math.min(r, t)));
        const v = [[xs, f(xs)], [xs, 5 * (kap - rho)], [c, 0], [clip, f(clip)]];
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = ${vec(o[0])}$, $z(P) = ${o[1]}$`;
        const pr = `\\min\\{\\, ${px(c[0], "x_1")}^2 + ${px(c[1], "x_2")}^2 \\ \\text{${sa(l)}}\\ x_1^2 + x_2^2 \\le ${r * r} \\,\\}`;
        const testo = T(l,
          `Il problema convesso $P$: $${pr}$ cerca il punto del disco di centro ${"$" + vec([0, 0]) + "$"} e raggio $${r}$ più vicino a ${"$" + vec(c) + "$"}. Quali sono la soluzione ottima e il valore ottimo ${SOLT(l)}?`,
          `The convex problem $P$: $${pr}$ looks for the point of the disk with center ${"$" + vec([0, 0]) + "$"} and radius $${r}$ closest to ${"$" + vec(c) + "$"}. What are the optimal solution and the optimal value ${SOLT(l)}?`);
        const sp = T(l,
          `Il punto ${"$" + vec(c) + "$"} ha norma $${5 * kap} > ${r}$, quindi non è ammissibile; il punto del disco più vicino sta sul segmento verso il centro, a distanza $${r}$ dall'origine: $\\tilde{\\boldsymbol x}(P) = \\frac{${r}}{${5 * kap}}${vec(c)} = ${vec(xs)}$. La funzione obiettivo è la distanza <em>al quadrato</em>: $z(P) = ${5 * (kap - rho)}^2 = ${f(xs)}$. Errore tipico: riportare ogni coordinata in $[-${r}, ${r}]$, come per un quadrato.`,
          `The point ${"$" + vec(c) + "$"} has norm $${5 * kap} > ${r}$, so it is not feasible; the closest point of the disk lies on the segment towards the center, at distance $${r}$ from the origin: $\\tilde{\\boldsymbol x}(P) = \\frac{${r}}{${5 * kap}}${vec(c)} = ${vec(xs)}$. The objective function is the <em>squared</em> distance: $z(P) = ${5 * (kap - rho)}^2 = ${f(xs)}$. Typical mistake: bringing each coordinate back into $[-${r}, ${r}]$, as for a square.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { c, r, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-halfplane", livello: "media", capitolo: CAP.c6, link: link("c6", "63-examples-of-convex-and-concave-optimization-problems"),
    linkIt: "63-esempi-di-problemi-di-ottimizzazione-convessi-e-concavi",
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = ri(rng, 1, 5), b = ri(rng, 1, 5), s = ri(rng, 1, 4);
        const d = a + b - s;
        if (d <= 0 || d % 2) return null;
        const t = d / 2, xs = [a - t, b - t];
        if (xs[0] < 0 || xs[1] < 0) return null;
        const f = (x) => (x[0] - a) ** 2 + (x[1] - b) ** 2;
        const w1 = [s - b, b];
        if (w1[0] < 0) return null;
        const v = [[xs, f(xs)], [xs, t * t], [[a, b], 0], [w1, f(w1)]];
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = ${vec(o[0])}$, $z(P) = ${o[1]}$`;
        const pr = `\\min\\{\\, ${px(a, "x_1")}^2 + ${px(b, "x_2")}^2 \\ \\text{${sa(l)}}\\ x_1 + x_2 \\le ${s},~ x_1 \\ge 0,~ x_2 \\ge 0 \\,\\}`;
        const testo = T(l,
          `Il problema convesso $P$: $${pr}$ cerca il punto ammissibile più vicino a ${"$" + vec([a, b]) + "$"}. Quali sono la soluzione ottima e il valore ottimo ${SOLT(l)}?`,
          `The convex problem $P$: $${pr}$ looks for the feasible point closest to ${"$" + vec([a, b]) + "$"}. What are the optimal solution and the optimal value ${SOLT(l)}?`);
        const sp = T(l,
          `${"$" + vec([a, b]) + "$"} viola $x_1 + x_2 \\le ${s}$ ($${a + b} > ${s}$). Il punto più vicino della retta $x_1 + x_2 = ${s}$ si ottiene togliendo la stessa quantità $\\frac{${a + b} - ${s}}{2} = ${t}$ a entrambe le coordinate: $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$, ammissibile, e $z(P) = ${t}^2 + ${t}^2 = ${f(xs)}$. Spostare una sola coordinata dà un punto ammissibile ma più lontano.`,
          `${"$" + vec([a, b]) + "$"} violates $x_1 + x_2 \\le ${s}$ ($${a + b} > ${s}$). The closest point of the line $x_1 + x_2 = ${s}$ is obtained by subtracting the same amount $\\frac{${a + b} - ${s}}{2} = ${t}$ from both coordinates: $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$, which is feasible, and $z(P) = ${t}^2 + ${t}^2 = ${f(xs)}$. Moving a single coordinate gives a feasible but farther point.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { a, b, s, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-meanpoint", livello: "media", capitolo: CAP.c6, link: link("c6", "box-4-exConvexMin"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const A = [ri(rng, -3, 5), ri(rng, -3, 5), ri(rng, -3, 5)].sort((x, y) => x - y);
        if (A[0] === A[2]) return null;
        const lo = ri(rng, -3, 2), up = lo + ri(rng, 2, 5);
        const m = F(A[0] + A[1] + A[2], 3);
        const clip = m.lt(lo) ? F(lo) : F(up).lt(m) ? F(up) : m;
        const f = (x) => A.reduce((s, a) => s.add(Fr.of(x).sub(a).mul(Fr.of(x).sub(a))), F(0));
        const cand = [clip, F(A[1]), m, F(lo), F(up), F(A[0]), F(A[2])];
        const v = [];
        for (const x of cand) if (v.length < 4 && !v.some((y) => y[0].eq(x))) v.push([x, f(x)]);
        if (v.length < 4) return null;
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = (${o[0].tex()})$, $z(P) = ${o[1].tex()}$`;
        const fs = A.map((a) => `${px(a)}^2`).join(" + ");
        const testo = T(l,
          `Il problema $P$: $\\min\\{\\, ${fs} \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}$ è un problema di minimizzazione convesso (somma di funzioni convesse su un intervallo). Quali sono la soluzione ottima e il valore ottimo ${SOLT(l)}?`,
          `The problem $P$: $\\min\\{\\, ${fs} \\ \\text{${sa(l)}}\\ ${lo} \\le x \\le ${up} \\,\\}$ is a convex minimization problem (sum of convex functions over an interval). What are the optimal solution and the optimal value ${SOLT(l)}?`);
        const dentro = clip.eq(m);
        const sp = T(l,
          `La derivata $2\\big(3x - (${A[0]}) - (${A[1]}) - (${A[2]})\\big)$ si annulla nella media $x = ${m.tex()}$, ${dentro ? "che è ammissibile: è un minimo locale e quindi la soluzione ottima" : `che non è ammissibile: la funzione è convessa e decresce fino alla media, quindi l'ottimo è l'estremo più vicino, $x = ${clip.tex()}$`}; $z(P) = ${f(clip).tex()}$. Errore tipico: usare la mediana $${A[1]}$, che minimizza la somma dei valori assoluti, non dei quadrati.`,
          `The derivative $2\\big(3x - (${A[0]}) - (${A[1]}) - (${A[2]})\\big)$ vanishes at the mean $x = ${m.tex()}$, ${dentro ? "which is feasible: it is a local minimum and hence the optimal solution" : `which is not feasible: the function is convex and decreases up to the mean, so the optimum is the closest endpoint, $x = ${clip.tex()}$`}; $z(P) = ${f(clip).tex()}$. Typical mistake: using the median $${A[1]}$, which minimizes the sum of absolute values, not of squares.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { A, lo, up, valori: v.map((o) => [o[0].s(), o[1].s()]) } };
      });
    },
  });

  LISTA.push({
    id: "co-g-eqconstr", livello: "complessa", capitolo: CAP.c6, link: link("c6", "63-examples-of-convex-and-concave-optimization-problems"),
    linkIt: "63-esempi-di-problemi-di-ottimizzazione-convessi-e-concavi",
    genera(rng, l) {
      return ripeti(rng, () => {
        const q = [sc(rng, [1, 2, 3]), sc(rng, [1, 2, 3])], c = [ri(rng, -6, 6), ri(rng, -6, 6)], s = ri(rng, -2, 5);
        const f = (x) => Fr.of(x[0]).mul(x[0]).mul(q[0]).add(Fr.of(x[1]).mul(x[1]).mul(q[1])).add(Fr.of(x[0]).mul(c[0])).add(Fr.of(x[1]).mul(c[1]));
        // g(x1) = f(x1, s - x1): g'(x1) = 2 q1 x1 - 2 q2 (s - x1) + c1 - c2
        const x1 = F(2 * q[1] * s - c[0] + c[1], 2 * (q[0] + q[1])), xs = [x1, F(s).sub(x1)];
        if (x1.d > 4) return null;
        const xu = [F(-c[0], 2 * q[0]), F(-c[1], 2 * q[1])];                     // senza vincolo
        if (xu[0].add(xu[1]).eq(s)) return null;
        if (q[0] === q[1]) return null;
        const x1w = F(-2 * q[1] * s - c[0] + c[1], 2 * (q[0] - q[1])), xw = [x1w, F(s).sub(x1w)];     // segno sbagliato nella derivata di (s - x1)^2
        const x1c = F(2 * q[1] * s - c[0], 2 * (q[0] + q[1])), xc = [x1c, F(s).sub(x1c)];             // termine c2 x2 dimenticato
        if (x1w.d > 6 || x1c.d > 6) return null;
        const v = [[xs, f(xs)], [xu, f(xu)], [xw, f(xw)], [xc, f(xc)]];
        const fm = (o) => `$\\tilde{\\boldsymbol x}(P) = ${vec(o[0])}$, $z(P) = ${o[1].tex()}$`;
        const fs = poly([[q[0], "x_1^2"], [q[1], "x_2^2"], [c[0], "x_1"], [c[1], "x_2"]]);
        const testo = T(l,
          `Il problema $P$: $\\min\\{\\, ${fs} \\ \\text{${sa(l)}}\\ x_1 + x_2 = ${s} \\,\\}$ è convesso (funzione obiettivo convessa, vincolo lineare). Sostituendo $x_2 = ${s} - x_1$ diventa un problema in una variabile. Quali sono la soluzione ottima e il valore ottimo ${SOLT(l)}?`,
          `The problem $P$: $\\min\\{\\, ${fs} \\ \\text{${sa(l)}}\\ x_1 + x_2 = ${s} \\,\\}$ is convex (convex objective function, linear constraint). Substituting $x_2 = ${s} - x_1$ it becomes a problem in one variable. What are the optimal solution and the optimal value ${SOLT(l)}?`);
        const sp = T(l,
          `Con $g(x_1) = f(x_1, ${s} - x_1)$, $g'(x_1) = ${2 * q[0]}x_1 - ${2 * q[1]}(${s} - x_1) ${c[0] - c[1] < 0 ? "- " + (c[1] - c[0]) : "+ " + (c[0] - c[1])} = 0$ dà $x_1 = ${x1.tex()}$, quindi $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$ e $z(P) = ${f(xs).tex()}$; $g$ è convessa, e il minimo locale è la soluzione ottima. Il punto ${"$" + vec(xu) + "$"}, che annulla il gradiente di $f$, non rispetta il vincolo.`,
          `With $g(x_1) = f(x_1, ${s} - x_1)$, $g'(x_1) = ${2 * q[0]}x_1 - ${2 * q[1]}(${s} - x_1) ${c[0] - c[1] < 0 ? "- " + (c[1] - c[0]) : "+ " + (c[0] - c[1])} = 0$ gives $x_1 = ${x1.tex()}$, hence $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$ and $z(P) = ${f(xs).tex()}$; $g$ is convex, and the local minimum is the optimal solution. The point ${"$" + vec(xu) + "$"}, where the gradient of $f$ vanishes, does not satisfy the constraint.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { q, c, s, valori: v.map((o) => [S(o[0]), o[1].s()]) } };
      });
    },
  });

  /* ---------- capitoli 1-4: medie e complesse ---------- */

  LISTA.push({
    id: "co-g-bary", livello: "complessa", capitolo: CAP.c1, link: link("c1", "box-3-def-convexcombinationm"),
    genera(rng, l) {
      const PESI = [[F(1, 2), F(1, 4), F(1, 4)], [F(1, 2), F(1, 2), F(0)], [F(3, 4), F(1, 4), F(0)],
        [F(1, 2), F(3, 4), F(-1, 4)], [F(-1, 2), F(1, 2), F(1)], [F(1, 4), F(1, 2), F(1, 4)], [F(3, 2), F(-1, 4), F(-1, 4)]];
      return ripeti(rng, () => {
        const P = [[0, 0], [ri(rng, 2, 4) * 2, 0], [ri(rng, 0, 2) * 2, ri(rng, 1, 2) * 4]];
        const sh = [ri(rng, -2, 2), ri(rng, -2, 2)];
        for (const p of P) { p[0] += sh[0]; p[1] += sh[1]; }
        const L = sc(rng, PESI).slice();
        mescolaR(rng, L);
        const q = [0, 1].map((i) => L.reduce((s, la, k) => s.add(la.mul(P[k][i])), F(0)));
        if (q.some((x) => x.d !== 1)) return null;
        const conv = L.every((x) => !x.lt(0));
        const perm = [L[1], L[2], L[0]];
        const swap = [L[0], L[2], L[1]];
        const vale = (A) => A.every((x) => !x.lt(0));
        const v = [[L, conv], [L, !conv], [perm, vale(perm)], [swap, vale(swap)]];
        const k = (o) => JSON.stringify([S(o[0]), o[1]]);
        if (new Set(v.map(k)).size < 4) return null;
        const tl = (A) => `(${A.map((x) => x.tex()).join(", ")})`;
        const fm = (o) => T(l, `$(\\lambda_1, \\lambda_2, \\lambda_3) = ${tl(o[0])}$: ${o[1] ? "è" : "non è"} combinazione convessa`, `$(\\lambda_1, \\lambda_2, \\lambda_3) = ${tl(o[0])}$: it ${o[1] ? "is" : "is not"} a convex combination`);
        const pts = P.map((x, i) => `${"$" + "{\\boldsymbol p}^{(" + (i + 1) + ")} = " + vec(x) + "$"}`).join(", ");
        const testo = T(l,
          `Siano ${pts}. Il punto ${"${\\boldsymbol q} = " + vec(q) + "$"} si scrive in un solo modo come $\\lambda_1 {\\boldsymbol p}^{(1)} + \\lambda_2 {\\boldsymbol p}^{(2)} + \\lambda_3 {\\boldsymbol p}^{(3)}$ con $\\lambda_1 + \\lambda_2 + \\lambda_3 = 1$. Quali sono gli scalari, ed è ${"${\\boldsymbol q}$"} una combinazione convessa dei tre punti?`,
          `Let ${pts}. The point ${"${\\boldsymbol q} = " + vec(q) + "$"} can be written in exactly one way as $\\lambda_1 {\\boldsymbol p}^{(1)} + \\lambda_2 {\\boldsymbol p}^{(2)} + \\lambda_3 {\\boldsymbol p}^{(3)}$ with $\\lambda_1 + \\lambda_2 + \\lambda_3 = 1$. What are the scalars, and is ${"${\\boldsymbol q}$"} a convex combination of the three points?`);
        const sp = T(l,
          `Le due equazioni delle coordinate e $\\lambda_1 + \\lambda_2 + \\lambda_3 = 1$ danno $${tl(L)}$. Una combinazione convessa richiede scalari non negativi con somma $1$: ${conv ? "qui sono tutti $\\ge 0$, e ${\\boldsymbol q}$ sta nel triangolo" : "qui uno scalare è negativo, e ${\\boldsymbol q}$ sta fuori dal triangolo"}.`,
          `The two coordinate equations and $\\lambda_1 + \\lambda_2 + \\lambda_3 = 1$ give $${tl(L)}$. A convex combination requires nonnegative scalars summing to $1$: ${conv ? "here they are all $\\ge 0$, and ${\\boldsymbol q}$ lies in the triangle" : "here one scalar is negative, and ${\\boldsymbol q}$ lies outside the triangle"}.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { P, q: S(q), valori: v.map((o) => [S(o[0]), o[1]]) } };
      });
    },
  });

  LISTA.push({
    id: "co-g-levelvert", livello: "complessa", capitolo: CAP.c3, link: link("c3", "box-24-obs-levelconvex"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const nq = sc(rng, ["1", "inf"]), r = ri(rng, 2, 4), s = ri(rng, 1, r - 1), sg = sc(rng, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
        if (nq === "1" && (r + s) % 2) return null;
        const S2 = (A) => A.map((x) => [x[0] * sg[0], x[1] * sg[1]]);          // riflessione: il caso base è x1 + x2 <= s
        const ord = (A) => A.map((x) => x.slice()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        let ver, pall, via, sbagliati, conUno;
        if (nq === "1") {
          const t = (r + s) / 2, u = (s - r) / 2;
          pall = [[r, 0], [0, r], [-r, 0], [0, -r]]; via = [[r, 0], [0, r]];
          ver = [[-r, 0], [0, -r], [t, u], [u, t]];
          sbagliati = [[-r, 0], [0, -r], [s, 0], [0, s]];                        // la retta intersecata con gli assi
          conUno = ver.concat([[r, 0]]);
        } else {
          pall = [[r, r], [r, -r], [-r, r], [-r, -r]]; via = [[r, r]];
          ver = [[-r, -r], [r, -r], [r, s - r], [s - r, r], [-r, r]];
          sbagliati = [[-r, -r], [r, -r], [r, r - s], [r - s, r], [-r, r]];      // segno sbagliato
          conUno = ver.concat([[r, r]]);
        }
        const w = [ver, pall, sbagliati, conUno].map((A) => ord(S2(A)));
        const fm = (o) => "$" + o.map((x) => vec(x)).join(",\\ ") + "$";
        const g1 = nq === "1" ? `|x_1| + |x_2| - ${r} \\le 0` : `\\max\\{|x_1|, |x_2|\\} - ${r} \\le 0`;
        const lin = poly([[sg[0], "x_1"], [sg[1], "x_2"]]);
        const testo = T(l,
          `L'insieme $\\{\\, {\\boldsymbol x} \\in \\R^2 : ${g1},~ ${lin} - ${s} \\le 0 \\,\\}$ è convesso, perché è definito da vincoli $g_i({\\boldsymbol x}) \\le 0$ con funzioni $g_i$ convesse (una norma e una funzione lineare). È un poligono: quali sono i suoi vertici?`,
          `The set $\\{\\, {\\boldsymbol x} \\in \\R^2 : ${g1},~ ${lin} - ${s} \\le 0 \\,\\}$ is convex, because it is defined by constraints $g_i({\\boldsymbol x}) \\le 0$ with convex functions $g_i$ (a norm and a linear function). It is a polygon: what are its vertices?`);
        const tv = fm(ord(S2(via)));
        const sp = T(l,
          `La ${nq === "1" ? "palla di norma $1$ è il rombo" : "palla di norma $\\infty$ è il quadrato"} con vertici ${fm(w[1])}; la retta $${lin} = ${s}$ taglia via ${via.length > 1 ? "i vertici" : "il vertice"} ${tv} e incontra due lati in due nuovi vertici. I vertici sono ${fm(w[0])}.`,
          `The ${nq === "1" ? "ball of norm $1$ is the diamond" : "ball of norm $\\infty$ is the square"} with vertices ${fm(w[1])}; the line $${lin} = ${s}$ cuts off the ${via.length > 1 ? "vertices" : "vertex"} ${tv} and meets two sides at two new vertices. The vertices are ${fm(w[0])}.`);
        return { testo, opzioni: w.map(fm), corretta: 0, spiegazione: sp, dati: { nq, r, s, sg, valori: w } };
      });
    },
  });

  LISTA.push({
    id: "co-g-tangent", livello: "media", capitolo: CAP.c2, link: link("c2", "box-5-def-levelset"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = sc(rng, [1, 2, 3]), b = sc(rng, [1, 2, 3]), x = [sc(rng, [-2, -1, 1, 2]), sc(rng, [-2, -1, 1, 2])];
        const g = [2 * a * x[0], 2 * b * x[1]];
        if (Math.abs(g[0]) === Math.abs(g[1])) return null;
        const d = gcd(g[0], g[1]), gn = [g[0] / d, g[1] / d];
        const v = [[-gn[1], gn[0]], gn, [gn[1], gn[0]], [gn[0], -gn[1]]];
        const lev = a * x[0] * x[0] + b * x[1] * x[1];
        const fs = poly([[a, "x_1^2"], [b, "x_2^2"]]);
        const testo = T(l,
          `Per $f({\\boldsymbol x}) = ${fs}$, il punto ${"$" + vec(x) + "$"} sta sull'insieme di livello $\\{\\, {\\boldsymbol x} \\in \\R^2 : f({\\boldsymbol x}) = ${lev} \\,\\}$. Quale direzione è tangente all'insieme di livello in quel punto?`,
          `For $f({\\boldsymbol x}) = ${fs}$, the point ${"$" + vec(x) + "$"} lies on the level set $\\{\\, {\\boldsymbol x} \\in \\R^2 : f({\\boldsymbol x}) = ${lev} \\,\\}$. Which direction is tangent to the level set at that point?`);
        const sp = T(l,
          `Il gradiente $\\nabla f = ${vec([`${2 * a}x_1`, `${2 * b}x_2`])}$ vale ${"$" + vec(g) + "$"}, parallelo a ${"$" + vec(gn) + "$"}, ed è perpendicolare all'insieme di livello: la tangente è perpendicolare al gradiente, cioè ${"$" + vec(v[0]) + "$"} (prodotto scalare nullo). Le altre direzioni hanno prodotto scalare non nullo con il gradiente.`,
          `The gradient $\\nabla f = ${vec([`${2 * a}x_1`, `${2 * b}x_2`])}$ equals ${"$" + vec(g) + "$"}, parallel to ${"$" + vec(gn) + "$"}, and is perpendicular to the level set: the tangent is perpendicular to the gradient, that is, ${"$" + vec(v[0]) + "$"} (zero dot product). The other directions have a nonzero dot product with the gradient.`);
        return { testo, opzioni: v.map((o) => "$" + vec(o) + "$"), corretta: 0, spiegazione: sp, dati: { a, b, x, valori: v } };
      });
    },
  });

  LISTA.push({
    id: "co-g-cubicchord", livello: "media", capitolo: CAP.c3, link: link("c3", "box-1-def-convexfunction"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const p = ri(rng, -3, -1), w = ri(rng, 1, 3), m = ri(rng, -3, 3);
        const lam = sc(rng, [F(1, 2), F(1, 3), F(2, 3), F(1, 4), F(3, 4)]), mu = F(1).sub(lam);
        const f = (t) => { t = Fr.of(t); return t.mul(t).mul(t).add(t.mul(m)); };
        const x = lam.mul(p).add(mu.mul(w));
        const A = f(x), B = lam.mul(f(p)).add(mu.mul(f(w)));
        if (A.eq(B)) return null;
        const xw = mu.mul(p).add(lam.mul(w)), A2 = f(xw), B2 = mu.mul(f(p)).add(lam.mul(f(w)));
        if (A2.eq(B2) || (A2.eq(A) && B2.eq(B))) return null;
        const c1 = B.lt(A) ? "noconv" : "noconc", c2 = B.lt(A) ? "conc" : "conv", c3 = B.lt(A) ? "noconc" : "noconv";
        const c4 = B2.lt(A2) ? "noconv" : "noconc";
        const v = [[A, B, c1], [A, B, c2], [A, B, c3], [A2, B2, c4]];
        const fr = { noconv: T(l, "$f$ non è convessa su $[p, w]$", "$f$ is not convex on $[p, w]$"), noconc: T(l, "$f$ non è concava su $[p, w]$", "$f$ is not concave on $[p, w]$"),
          conv: T(l, "$f$ è convessa su $[p, w]$", "$f$ is convex on $[p, w]$"), conc: T(l, "$f$ è concava su $[p, w]$", "$f$ is concave on $[p, w]$") };
        const fm = (o) => `$${o[0].tex()}$ ${T(l, "e", "and")} $${o[1].tex()}$: ${fr[o[2]]}`;
        const fs = poly([[1, "x^3"], [m, "x"]]);
        const testo = T(l,
          `Per $f(x) = ${fs}$, con $p = ${p}$, $w = ${w}$ e $\\lambda = ${lam.tex()}$, quanto valgono $f\\big(\\lambda p + (1-\\lambda) w\\big)$ e $\\lambda f(p) + (1-\\lambda) f(w)$, e che cosa se ne conclude?`,
          `For $f(x) = ${fs}$, with $p = ${p}$, $w = ${w}$ and $\\lambda = ${lam.tex()}$, what are $f\\big(\\lambda p + (1-\\lambda) w\\big)$ and $\\lambda f(p) + (1-\\lambda) f(w)$, and what can be concluded?`);
        const sp = T(l,
          `$\\lambda p + (1-\\lambda) w = ${x.tex()}$, $f(${x.tex()}) = ${A.tex()}$, mentre $${lam.tex()} \\cdot (${f(p).tex()}) + ${mu.tex()} \\cdot ${f(w).tex()} = ${B.tex()}$. ${B.lt(A) ? "Il punto del grafico sta sopra la corda: la disuguaglianza di convessità è violata" : "Il punto del grafico sta sotto la corda: la disuguaglianza di concavità è violata"}. Una sola coppia di punti può escludere una proprietà, non dimostrarla.`,
          `$\\lambda p + (1-\\lambda) w = ${x.tex()}$, $f(${x.tex()}) = ${A.tex()}$, while $${lam.tex()} \\cdot (${f(p).tex()}) + ${mu.tex()} \\cdot ${f(w).tex()} = ${B.tex()}$. ${B.lt(A) ? "The point of the graph lies above the chord: the convexity inequality is violated" : "The point of the graph lies below the chord: the concavity inequality is violated"}. A single pair of points can rule out a property, not prove it.`);
        return { testo, opzioni: v.map(fm), corretta: 0, spiegazione: sp, dati: { m, p, w, lam: lam.s(), valori: v.map((o) => [o[0].s(), o[1].s(), o[2]]) } };
      });
    },
  });

  LISTA.push({
    id: "co-g-witness", livello: "media", capitolo: CAP.c4, link: link("c4", "box-12-def-psd"),
    genera(rng, l) {
      return ripeti(rng, () => {
        const a = ri(rng, 0, 3), c = ri(rng, 0, 3), b = sc(rng, [-3, -2, -1, 1, 2, 3]);
        if (b * b <= a * c) return null;
        const qf = (x) => a * x[0] * x[0] + 2 * b * x[0] * x[1] + c * x[1] * x[1];
        const C = [];
        for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if ((i || j) && gcd(i, j) === 1) C.push([i, j]);
        mescolaR(rng, C);
        const neg = C.filter((x) => qf(x) < 0), pos = C.filter((x) => qf(x) >= 0);
        if (!neg.length || pos.length < 3) return null;
        const v = [neg[0], pos[0], pos[1], pos[2]];
        const Q = [[a, b], [b, c]];
        const testo = T(l,
          `Una matrice simmetrica ${"${\\boldsymbol Q}$"} è semidefinita positiva se ${"${\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x} \\ge 0$"} per ogni ${"${\\boldsymbol x} \\in \\R^2$"}. Per ${"${\\boldsymbol Q} = " + mat(Q) + "$"}, quale vettore dimostra che ${"${\\boldsymbol Q}$"} <em>non</em> è semidefinita positiva?`,
          `A symmetric matrix ${"${\\boldsymbol Q}$"} is positive semidefinite if ${"${\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x} \\ge 0$"} for every ${"${\\boldsymbol x} \\in \\R^2$"}. For ${"${\\boldsymbol Q} = " + mat(Q) + "$"}, which vector shows that ${"${\\boldsymbol Q}$"} is <em>not</em> positive semidefinite?`);
        const sp = T(l,
          `${"${\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x} = " + poly([[a, "x_1^2"], [2 * b, "x_1 x_2"], [c, "x_2^2"]]) + "$"}: nei quattro vettori vale ${v.map((x) => "$" + qf(x) + "$").join(", ")}. Basta un vettore con valore negativo, ${"$" + vec(v[0]) + "$"}; un valore non negativo in alcuni vettori non dimostra nulla.`,
          `${"${\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x} = " + poly([[a, "x_1^2"], [2 * b, "x_1 x_2"], [c, "x_2^2"]]) + "$"}: at the four vectors it equals ${v.map((x) => "$" + qf(x) + "$").join(", ")}. One vector with a negative value is enough, ${"$" + vec(v[0]) + "$"}; a nonnegative value at some vectors proves nothing.`);
        return { testo, opzioni: v.map((x) => "$" + vec(x) + "$"), corretta: 0, spiegazione: sp, dati: { Q, valori: v } };
      });
    },
  });

  /* link alle sezioni con ancora diversa nelle due lingue (titoli tradotti) */
  for (const g of LISTA) {
    if (g.linkIt) { g.link = { it: g.link.it.replace(/#.*$/, "#" + g.linkIt), en: g.link.en }; delete g.linkIt; }
  }
})();
