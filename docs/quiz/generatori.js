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
          `Qual è la combinazione convessa dei punti ${"$" + vec(p) + "$"} e ${"$" + vec(w) + "$"} con scalare $\\lambda = ${lam.tex()}$, cioè il punto $\\lambda {\\boldsymbol p} + (1-\\lambda){\\boldsymbol w}$?`,
          `What is the convex combination of the points ${"$" + vec(p) + "$"} and ${"$" + vec(w) + "$"} with scalar $\\lambda = ${lam.tex()}$, that is, the point $\\lambda {\\boldsymbol p} + (1-\\lambda){\\boldsymbol w}$?`);
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
          `Qual è la combinazione convessa dei punti ${pts} con scalari ${pesi}?`,
          `What is the convex combination of the points ${pts} with scalars ${pesi}?`);
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
        const testo = T(l, `Quale punto appartiene all'insieme convesso $${insieme}$?`,
          `Which point belongs to the convex set $${insieme}$?`);
        const g = giusto;
        const calc = q === "1" ? `|${g[0]}| + |${g[1]}| = ${dist(g, q)} \\le ${r}`
          : q === "2" ? `(${g[0]})^2 + (${g[1]})^2 = ${dist(g, q)} \\le ${r * r}`
          : `\\max\\{|${g[0]}|, |${g[1]}|\\} = ${dist(g, q)} \\le ${r}`;
        const sp = T(l,
          `Per il punto corretto ${"${\\boldsymbol x} - {\\boldsymbol c} = " + vec(g) + "$"} e $${calc}$. Gli altri punti superano il raggio nella norma $${q}$ (ma starebbero dentro con un'altra norma: errore tipico).`,
          `For the correct point ${"${\\boldsymbol x} - {\\boldsymbol c} = " + vec(g) + "$"} and $${calc}$. The other points exceed the radius in the norm $${q}$ (but would be inside with another norm: typical mistake).`);
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
          `Per $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, che cos'è l'insieme di livello $L(${k})$?`,
          `For $f: \\R^2 \\to \\R$, $f({\\boldsymbol x}) = ${f}$, what is the level set $L(${k})$?`);
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
          `Data $f({\\boldsymbol x}) = ${f}$, partendo da $\\bar{\\boldsymbol x} = ${vec(x)}$ ci si sposta di un passo $\\alpha = ${al.tex()}$ nella direzione di massima decrescita, cioè nel punto $\\bar{\\boldsymbol x} - \\alpha\\, \\nabla f(\\bar{\\boldsymbol x})$. Qual è il nuovo punto?`,
          `Given $f({\\boldsymbol x}) = ${f}$, starting from $\\bar{\\boldsymbol x} = ${vec(x)}$ we move by a step $\\alpha = ${al.tex()}$ along the direction of steepest descent, that is, to the point $\\bar{\\boldsymbol x} - \\alpha\\, \\nabla f(\\bar{\\boldsymbol x})$. What is the new point?`);
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
        const testo = T(l, `Per ${"${\\boldsymbol x} = " + vec(x) + "$"}, quali sono le norme $1$, $2$ e $\\infty$?`,
          `For ${"${\\boldsymbol x} = " + vec(x) + "$"}, what are the norms $1$, $2$ and $\\infty$?`);
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
          `Per la funzione convessa $f(x) = ${fs}$, con $p = ${p}$, $w = ${w}$ e $\\lambda = ${lam.tex()}$, quanto valgono i due membri della disuguaglianza della definizione di funzione convessa?`,
          `For the convex function $f(x) = ${fs}$, with $p = ${p}$, $w = ${w}$ and $\\lambda = ${lam.tex()}$, what are the two sides of the inequality in the definition of convex function?`);
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
          `La matrice non simmetrica $${mat(Q)}$ definisce la funzione quadratica ${"${\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x}$"}. Quale matrice simmetrica definisce la stessa funzione?`,
          `The non-symmetric matrix $${mat(Q)}$ defines the quadratic function ${"${\\boldsymbol x}' {\\boldsymbol Q}\\, {\\boldsymbol x}$"}. Which symmetric matrix defines the same function?`);
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
        const testo = T(l, `Quale delle seguenti funzioni quadratiche è convessa in $\\R^2$?`,
          `Which of the following quadratic functions is convex in $\\R^2$?`);
        // certificato per la corretta: somma di quadrati; per le altre: un vettore con x'Qx < 0
        const r = F(b, a), resto = F(c).sub(F(b * b, a));
        const sq = `${a === 1 ? "" : a}\\left(x_1 ${r.n < 0 ? "-" : "+"} ${(r.n < 0 ? r.neg() : r).eq(1) ? "" : (r.n < 0 ? r.neg().tex() : r.tex())}\\, x_2\\right)^2${resto.n === 0 ? "" : " + " + resto.tex() + "\\, x_2^2"}`;
        const ctr = (q) => (q[0] < 0 ? [1, 0] : q[2] < 0 ? [0, 1] : [-q[1], q[0]]);
        const val = (q, x) => q[0] * x[0] * x[0] + 2 * q[1] * x[0] * x[1] + q[2] * x[1] * x[1];
        const cs = tutte.slice(1).map((q) => { const x = ctr(q); return T(l, `per $${fq(q)}$ il vettore $${vec(x)}$ dà $${val(q, x)} < 0$`, `for $${fq(q)}$ the vector $${vec(x)}$ gives $${val(q, x)} < 0$`); }).join("; ");
        const sp = T(l,
          `La funzione corretta si scrive $${sq} \\ge 0$: ${"${\\boldsymbol Q}$"} è semidefinita positiva e, per il Corollario 4.8, la funzione è convessa. Le altre non hanno ${"${\\boldsymbol Q}$"} semidefinita positiva: ${cs}. Una diagonale positiva non basta.`,
          `The correct function can be written as $${sq} \\ge 0$: ${"${\\boldsymbol Q}$"} is positive semidefinite and, by Corollary 4.8, the function is convex. The others do not have ${"${\\boldsymbol Q}$"} positive semidefinite: ${cs}. A positive diagonal is not enough.`);
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
          `Per il problema $${pr}$ si conoscono le soluzioni ammissibili ${plist}. Qual è la migliore limitazione sul valore ottimo $z(P)$ che esse forniscono?`,
          `For the problem $${pr}$ the feasible solutions ${plist} are known. What is the best bound on the optimal value $z(P)$ that they provide?`);
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
          `Su una regione ammissibile $F$ la funzione $f$ ha minimo $${m}$ e massimo $${M}$ (entrambi raggiunti). Quanto vale $\\min\\{\\, ${a}\\, f({\\boldsymbol x}) ${b < 0 ? "- " + (-b) : "+ " + b} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ {\\boldsymbol x} \\in F \\,\\}$?`,
          `Over a feasible region $F$ the function $f$ has minimum $${m}$ and maximum $${M}$ (both attained). What is $\\min\\{\\, ${a}\\, f({\\boldsymbol x}) ${b < 0 ? "- " + (-b) : "+ " + b} \\ \\text{${T(l, "soggetto a", "subject to")}}\\ {\\boldsymbol x} \\in F \\,\\}$?`);
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
          `Quale punto appartiene all'intorno sferico $N\\left(${vec(c)}, ${dl}\\right)$?`,
          `Which point belongs to the spherical neighborhood $N\\left(${vec(c)}, ${dl}\\right)$?`);
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
        const testo = T(l, `Qual è la soluzione ottima del problema $${pr}$, e quale il valore ottimo?`,
          `What are the optimal solution and the optimal value of the problem $${pr}$?`);
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
          `Il problema $${pr}$ cerca il punto del rettangolo più vicino a ${"$" + vec(c) + "$"}. Quali sono la soluzione ottima e il valore ottimo?`,
          `The problem $${pr}$ looks for the point of the rectangle closest to ${"$" + vec(c) + "$"}. What are the optimal solution and the optimal value?`);
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
        const testo = T(l, `Si consideri il problema $${pr}$. Quale affermazione è corretta?`,
          `Consider the problem $${pr}$. Which statement is correct?`);
        const sp = T(l,
          `$f(x) = ${a === 1 ? "" : a === -1 ? "-" : a + "\\,"}(x ${h < 0 ? "+ " + (-h) : "- " + h})^2 ${k < 0 ? "- " + (-k) : "+ " + k}$ è ${curv} e $F = [${lo}, ${up}]$ è convesso: è un ${TIPO(l, curv, forma)}. La derivata $${poly([[2 * a, "x"], [b, ""]])}$ si annulla in $x = ${h}$, ammissibile; $x = ${h}$ è un punto di ${forma === "min" ? "minimo" : "massimo"} locale e quindi, per ${forma === "min" ? "la Proposizione 6.2" : "il Corollario 6.3"}, ottimo: $z(P) = ${f(h).tex()}$.`,
          `$f(x) = ${a === 1 ? "" : a === -1 ? "-" : a + "\\,"}(x ${h < 0 ? "+ " + (-h) : "- " + h})^2 ${k < 0 ? "- " + (-k) : "+ " + k}$ is ${curv === "convessa" ? "convex" : "concave"} and $F = [${lo}, ${up}]$ is convex: it is a ${TIPO(l, curv, forma)}. The derivative $${poly([[2 * a, "x"], [b, ""]])}$ vanishes at $x = ${h}$, which is feasible; $x = ${h}$ is a point of local ${forma === "min" ? "minimum" : "maximum"} and hence, by ${forma === "min" ? "Proposition 6.2" : "Corollary 6.3"}, optimal: $z(P) = ${f(h).tex()}$.`);
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
          `Si consideri il problema $${pr}$, la cui funzione obiettivo si scrive anche $${hs}^3 - ${3 * s * s}\\,${hs} ${k < 0 ? "- " + (-k) : "+ " + k}$. Quale affermazione è corretta?`,
          `Consider the problem $${pr}$, whose objective function can also be written as $${hs}^3 - ${3 * s * s}\\,${hs} ${k < 0 ? "- " + (-k) : "+ " + k}$. Which statement is correct?`);
        const sp = T(l,
          `Con $a = p ${h < 0 ? "+ " + (-h) : "- " + h}$ e $b = w ${h < 0 ? "+ " + (-h) : "- " + h}$ ${caso === "A" ? "non negativi" : "non positivi"}, l'Osservazione 6.4 dà che $f$ è ${curv} su $[${lo}, ${up}]$: è un ${TIPO(l, curv, forma)}. La derivata $3${hs}^2 - ${3 * s * s}$ si annulla in $${h - s}$ e $${h + s}$; solo $${xs}$ è ammissibile ed è ottimo (per ${caso === "A" ? "la Proposizione 6.2" : "il Corollario 6.3"}), con $z(P) = ${f(xs)}$.`,
          `With $a = p ${h < 0 ? "+ " + (-h) : "- " + h}$ and $b = w ${h < 0 ? "+ " + (-h) : "- " + h}$ ${caso === "A" ? "nonnegative" : "nonpositive"}, Observation 6.4 shows that $f$ is ${curv === "convessa" ? "convex" : "concave"} over $[${lo}, ${up}]$: it is a ${TIPO(l, curv, forma)}. The derivative $3${hs}^2 - ${3 * s * s}$ vanishes at $${h - s}$ and $${h + s}$; only $${xs}$ is feasible and it is optimal (by ${caso === "A" ? "Proposition 6.2" : "Corollary 6.3"}), with $z(P) = ${f(xs)}$.`);
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
        const testo = T(l, `Si consideri il problema di minimizzazione convesso $${pr}$. Quali sono la soluzione ottima e il valore ottimo?`,
          `Consider the convex minimization problem $${pr}$. What are the optimal solution and the optimal value?`);
        const q = (i) => `${a[i] === 1 ? "" : a[i]}(x_${i + 1} ${h[i] < 0 ? "+ " + (-h[i]) : "- " + h[i]})^2`;
        const kk = -(a[0] * h[0] * h[0] + a[1] * h[1] * h[1]);
        const sp = T(l,
          `Completando i quadrati, $f({\\boldsymbol x}) = ${q(0)} + ${q(1)} ${kk < 0 ? "- " + (-kk) : "+ " + kk}$. Il punto ${"$" + vec(h) + "$"} non è ammissibile; ogni termine dipende da una sola variabile ed è minimo riportando $${h[0]}$ in $[${lo[0]}, ${up[0]}]$ e $${h[1]}$ in $[${lo[1]}, ${up[1]}]$: $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$, $z(P) = ${f(xs)}$.`,
          `Completing the squares, $f({\\boldsymbol x}) = ${q(0)} + ${q(1)} ${kk < 0 ? "- " + (-kk) : "+ " + kk}$. The point ${"$" + vec(h) + "$"} is not feasible; each term depends on a single variable and is smallest when $${h[0]}$ is brought back into $[${lo[0]}, ${up[0]}]$ and $${h[1]}$ into $[${lo[1]}, ${up[1]}]$: $\\tilde{\\boldsymbol x}(P) = ${vec(xs)}$, $z(P) = ${f(xs)}$.`);
        return { testo, opzioni: opz.map(fm), corretta: 0, spiegazione: sp, dati: { a, c, lo, up, valori: opz } };
      });
    },
  });

  /* link alle sezioni con ancora diversa nelle due lingue (titoli tradotti) */
  for (const g of LISTA) {
    if (g.linkIt) { g.link = { it: g.link.it.replace(/#.*$/, "#" + g.linkIt), en: g.link.en }; delete g.linkIt; }
  }
})();
