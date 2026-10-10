/* Grafici interattivi dei capitoli 5-6 di «Ottimizzazione convessa»
 * (Problemi di ottimizzazione; Problemi convessi e concavi).
 *
 * Ricette per il motore interattivi.js: ognuna si registra in window.GI_RICETTE.
 *   ottimo-intervallo  esiti di min e max di f su un intervallo F (cap. 5)
 *   ottimi-locali      ottimi locali e intorni N(x̄, δ) ∩ F (cap. 5)
 *   discesa-locale     un metodo che guarda solo vicino: dove si ferma (cap. 6)
 *
 * Colori come nelle dispense: grafico di f su F e regione ammissibile (parte
 * dell'asse x) rossi, ottimi (globali) blu, ottimi locali non globali viola,
 * estremo che non appartiene a F = pallino vuoto; f fuori da F grigia tratteggiata.
 *
 * Gli oggetti JSXGraph si creano negli hook R.monta(board, st) (una volta per
 * board) e R.aggiorna(board, st) (a ogni cambio dei cursori): gli oggetti che
 * dipendono dai parametri si cancellano e si ricreano, tranne i punti
 * trascinabili, che restano e scrivono il loro valore nel cursore.
 */
(function () {
  "use strict";

  // ------------------------------------------------------------ utilità
  const GI = () => window.GI || {};
  const EN = () => {
    const e = GI().EN;
    if (typeof e === "function") return !!e();
    if (typeof e === "boolean") return e;
    return /^en/i.test(document.documentElement.lang || "");
  };
  const T = (it, en) => (GI().T ? GI().T(it, en) : EN() ? en : it);
  const num = (x, c = 2) => {
    if (GI().num) return GI().num(x, c);
    if (!isFinite(x)) return x > 0 ? "+\\infty" : "-\\infty";
    const p = Math.pow(10, c);
    let s = (Math.round(x * p) / p).toFixed(c);
    if (c > 0) s = s.replace(/\.?0+$/, "");
    if (s === "-0") s = "0";
    return EN() ? s : s.replace(".", "{,}");
  };
  // numero con segno infinito leggibile
  const nInf = (x, c = 3) => (x === Infinity ? "+\\infty" : x === -Infinity ? "-\\infty" : num(x, c));

  // colori delle dispense (macro \blue, \red, \violet di mathjax.js)
  // (valori di riserva; a ogni disegno si leggono dal CSS: --gi-ammissibile, …)
  const C = { amm: "#E03131", ott: "#1971C2", loc: "#9C36B5", orig: "#9aa5b1", muted: "#5b6675", board: "#ffffff", a: "#D9480F", b: "#0E7490" };
  const NOMI = { amm: "ammissibile", ott: "ottimo", loc: "locale", orig: "orig", muted: "muted", board: "board", a: "a", b: "b" };
  const prendiColori = (st) => {
    for (const [k, n] of Object.entries(NOMI)) {
      const v = st && st.colore ? st.colore(n) : "";
      if (v && !/^var\(|^[a-z]+$/.test(v)) C[k] = v;
    }
  };
  // pallino colorato nei testi (colore del CSS del grafico)
  const pallino = (v) => `<span style="color:var(--gi-${v});font-size:1.15em">●</span>`;

  // oggetti che si ricreano a ogni aggiornamento
  const pulisci = (board) => {
    if (board._giDyn) board._giDyn.forEach((o) => { try { board.removeObject(o); } catch (e) { /* già rimosso */ } });
    board._giDyn = [];
  };
  const crea = (board, tipo, args, attr) => {
    const o = board.create(tipo, args, Object.assign({ fixed: true, highlight: false, withLabel: false }, attr || {}));
    board._giDyn.push(o);
    return o;
  };
  const punto = (board, x, y, col, attr) => crea(board, "point", [x, y], Object.assign({
    name: "", size: 4, strokeColor: col, fillColor: col, strokeWidth: 2, showInfobox: false,
  }, attr || {}));
  const vuoto = (board, x, y, col) => punto(board, x, y, col, { fillColor: C.board, size: 4 });

  // scrive un valore nel cursore k (dal trascinamento di un punto sul grafico)
  const imposta = (board, st, R, k, v) => {
    if (st && typeof st.imposta === "function") return st.imposta(k, v);
    if (st && typeof st.set === "function") return st.set(k, v);
    const box = board.containerObj.closest(".gi");
    if (!box) return;
    const i = R.parametri.findIndex((q) => q.k === k);
    const inp = box.querySelectorAll('input[type="range"]')[i];
    if (!inp || +inp.value === v) return;
    inp.value = v;
    inp.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const arrot = (v, passo) => Math.round(v / passo) * passo;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ricerca della sezione aurea del minimo di g su [l, r]
  const aurea = (g, l, r, it = 80) => {
    const k = (Math.sqrt(5) - 1) / 2;
    let a = l, b = r, c = b - k * (b - a), d = a + k * (b - a), gc = g(c), gd = g(d);
    for (let i = 0; i < it && b - a > 1e-13 * (1 + Math.abs(a)); i++) {
      if (gc <= gd) { b = d; d = c; gd = gc; c = b - k * (b - a); gc = g(c); }
      else { a = c; c = d; gc = gd; d = a + k * (b - a); gd = g(d); }
    }
    return gc <= gd ? [c, gc] : [d, gd];
  };

  // il grafico di f su [l, r] (rosso) e la f fuori da F (grigia tratteggiata)
  const grafico = (board, f, l, r, attr) => crea(board, "functiongraph", [f, l, r], Object.assign({ strokeColor: C.amm, strokeWidth: 3.5 }, attr || {}));
  const fuori = (board, f) => crea(board, "functiongraph", [f], { strokeColor: C.orig, strokeWidth: 1.5, dash: 2 });
  // la regione ammissibile sull'asse x
  const regione = (board, l, r, freccia) => crea(board, "segment", [[l, 0], [r, 0]], { strokeColor: C.amm, strokeWidth: 5, lastArrow: freccia ? { type: 2, size: 5 } : false });
  const verticale = (board, x, y, col) => crea(board, "segment", [[x, 0], [x, y]], { strokeColor: col || C.orig, strokeWidth: 1.3, dash: 2 });

  window.GI_RICETTE = window.GI_RICETTE || {};

  /* ====================================================================
   * 1. Esiti di un problema di ottimizzazione su un intervallo
   * ==================================================================== */
  /* Il calcolo è numerico e non conosce la funzione:
   *  - F = [a, b], (a, b], ..., [a, +∞). Inammissibile se a > b, o se a = b e
   *    un estremo è aperto; se F contiene un polo di f (1/x in 0), f non è
   *    definita su F e il problema non si pone.
   *  - Si valuta f su una griglia fine di N+1 punti di [a, X] (X = b, oppure,
   *    se b = +∞, X = max(a, 0) + 12: oltre X tutte le funzioni del menu sono
   *    monotone, quindi la coda è descritta dal limite all'infinito). Gli
   *    estremi aperti si saltano: al loro posto si calcola il limite
   *    f(a + ε), f(b − ε), f(10^7) (|valore| > 10^6 vale come ±∞).
   *  - Per il minimo (per il massimo si lavora con −f) si prende il miglior
   *    punto della griglia e lo si raffina con la sezione aurea fra i due
   *    punti vicini: v = valore raggiunto, L = il limite più piccolo agli
   *    estremi non appartenenti.
   *      L = −∞            -> problema illimitato, z(P) = −∞;
   *      L < v − tol       -> estremo inferiore L non raggiunto;
   *      v < L − tol       -> minimo raggiunto (v è davvero più basso);
   *      |v − L| ≤ tol     -> ambiguo: è raggiunto solo se c'è un punto con
   *                           valore ≈ v lontano (> 2% dell'ampiezza) dagli
   *                           estremi aperti e dalla coda; altrimenti v è solo
   *                           il limite, approssimato da punti vicini
   *                           all'estremo (x² in (0, 2], e^{−x} su [0, +∞)).
   *  - Le soluzioni ottime sono i punti della griglia con valore ≤ v + tol2,
   *    raggruppati in tratti consecutivi: un tratto lungo è un segmento di
   *    ottimi (infinite soluzioni), uno corto è un punto, raffinato.
   */
  const OI = {
    x2: { f: (x) => x * x, tex: "x^2", vista: [-4.8, 13, 6.8, -2.6] },
    x2s: { f: (x) => (x - 2) * (x - 2), tex: "(x-2)^2", vista: [-4.8, 13, 6.8, -2.6] },
    inv: { f: (x) => 1 / x, tex: "\\dfrac{1}{x}", polo: 0, vista: [-4.8, 6, 6.8, -6] },
    x3: { f: (x) => x * x * x, tex: "x^3", vista: [-4.8, 24, 6.8, -24] },
    expm: { f: (x) => Math.exp(-x), tex: "e^{-x}", vista: [-4.8, 9, 6.8, -1.8] },
    multi: { f: (x) => Math.max(0, Math.abs(x) - 1), tex: "\\max\\{0,\\,|x|-1\\}", vista: [-4.8, 6.5, 6.8, -1.5] },
  };
  const N1 = 4000;
  const limite = (f, x) => {
    const y = f(x);
    if (!isFinite(y) || Math.abs(y) > 1e6) return y > 0 ? Infinity : -Infinity;
    return Math.round(y * 1e6) / 1e6;
  };
  const leggiF = (p) => ({ a: p.a, b: p.b, aAp: p.c >= 0.5, bAp: p.d >= 0.5, bInf: p.e >= 0.5 });
  const analisi1 = (key, p) => {
    const fn = OI[key], f = fn.f, F = leggiF(p);
    const ris = { F };
    if (!F.bInf && (F.a > F.b + 1e-12 || (Math.abs(F.a - F.b) < 1e-12 && (F.aAp || F.bAp)))) { ris.vuoto = true; return ris; }
    if (fn.polo !== undefined) {
      const q = fn.polo;
      const dentro = (q > F.a || (q === F.a && !F.aAp)) && (F.bInf || q < F.b || (q === F.b && !F.bAp));
      if (dentro) { ris.nonDef = true; return ris; }
    }
    const a = F.a, X = F.bInf ? Math.max(a, 0) + 12 : F.b, W = X - a;
    if (W < 1e-12) {
      const v = f(a);
      ris.min = ris.max = { esito: "ottimo", z: v, pts: [a], seg: [] };
      return ris;
    }
    const h = W / N1, xs = [], ys = [];
    for (let i = 0; i <= N1; i++) {
      if (i === 0 && F.aAp) continue;
      if (i === N1 && F.bAp && !F.bInf) continue;
      const x = i === N1 ? X : a + i * h;
      xs.push(x); ys.push(f(x));
    }
    const lim = [];
    if (F.aAp) lim.push({ L: limite(f, a + 1e-9 * (1 + Math.abs(a))), dove: "a" });
    if (F.bInf) lim.push({ L: limite(f, 1e7), dove: "inf" });
    else if (F.bAp) lim.push({ L: limite(f, F.b - 1e-9 * (1 + Math.abs(F.b))), dove: "b" });
    // zone "di confine": vicino agli estremi aperti e alla coda verso +∞
    const rho = 0.02 * W;
    const diConfine = (x) => (F.aAp && x - a < rho) || ((F.bAp || F.bInf) && X - x < rho);

    const verso = (s) => {
      const g = (x) => s * f(x);
      let ib = 0;
      for (let i = 1; i < xs.length; i++) if (s * ys[i] < s * ys[ib]) ib = i;
      const l = ib > 0 ? xs[ib - 1] : xs[ib], r = ib < xs.length - 1 ? xs[ib + 1] : xs[ib];
      let [xb, vb] = l < r ? aurea(g, l, r) : [xs[ib], s * ys[ib]];
      if (s * ys[ib] < vb) { xb = xs[ib]; vb = s * ys[ib]; }
      let Lm = Infinity, dove = null;
      for (const q of lim) if (s * q.L < Lm) { Lm = s * q.L; dove = q.dove; }
      const tol = 1e-9 * (1 + Math.abs(vb));
      if (Lm === -Infinity) return { esito: "illimitato", z: s * -Infinity, dove };
      if (Lm < vb - tol) return { esito: "nonRaggiunto", z: s * Lm, dove };
      const tol2 = 1e-6 * (1 + Math.abs(vb));
      const ambiguo = Math.abs(vb - Lm) <= tol;
      // punti ottimi raggruppati in tratti di indici consecutivi
      // (nel caso ambiguo un tratto vale solo se esce dalle zone di confine)
      let tratti = [];
      let cur = null;
      for (let i = 0; i < xs.length; i++) {
        const ok = s * ys[i] <= vb + tol2;
        if (ok) { if (cur && cur.j === i - 1) { cur.j = i; cur.x1 = xs[i]; } else { cur = { i, j: i, x0: xs[i], x1: xs[i], fuori: false }; tratti.push(cur); } }
        if (ok && !(ambiguo && diConfine(xs[i])) && !(F.bInf && X - xs[i] < rho)) cur.fuori = true;
      }
      tratti = tratti.filter((t) => t.fuori);
      if (!tratti.length && !(ambiguo && diConfine(xb)) && !(F.bInf && X - xb < rho)) tratti.push({ i: -1, j: -1, x0: xb, x1: xb });
      if (!tratti.length) return { esito: "nonRaggiunto", z: s * (isFinite(Lm) ? Lm : vb), dove };
      const pts = [], seg = [];
      const soglia = Math.max(0.03 * W, 8 * h);
      for (const t of tratti) {
        if (t.x1 - t.x0 >= soglia) {
          // un segmento di ottimi; se arriva a un estremo aperto, lì è aperto
          const lA = F.aAp && t.x0 - a < 2 * h, uA = !F.bInf && F.bAp && F.b - t.x1 < 2 * h;
          seg.push([lA ? a : t.x0, uA ? F.b : t.x1, lA, uA]);
          continue;
        }
        // un punto: il migliore del tratto, raffinato fra i vicini
        let im = t.i;
        for (let i = t.i; i <= t.j && i >= 0; i++) if (s * ys[i] < s * ys[im]) im = i;
        let x = im >= 0 ? xs[im] : t.x0;
        if (im >= 0) {
          const l2 = xs[Math.max(0, im - 1)], r2 = xs[Math.min(xs.length - 1, im + 1)];
          if (l2 < r2) { const [xr, vr] = aurea(g, l2, r2); if (vr <= s * ys[im]) x = xr; }
        }
        // gli estremi chiusi restano esatti; i valori quasi interi si puliscono
        if (Math.abs(x - a) < 2 * h && !F.aAp && g(a) <= vb + tol2) x = a;
        if (!F.bInf && Math.abs(x - F.b) < 2 * h && !F.bAp && g(F.b) <= vb + tol2) x = F.b;
        if (Math.abs(x - Math.round(x * 1000) / 1000) < 1e-4) x = Math.round(x * 1000) / 1000;
        pts.push(x);
      }
      const z = s * vb;
      return { esito: "ottimo", z: Math.abs(z - Math.round(z * 1e6) / 1e6) < 1e-7 ? Math.round(z * 1e6) / 1e6 : z, pts, seg };
    };
    ris.min = verso(1);
    ris.max = verso(-1);
    return ris;
  };
  // cache: il calcolo si fa una volta per combinazione di parametri
  let cache1 = { k: null, r: null };
  const ris1 = (key, p) => {
    const k = key + JSON.stringify(p);
    if (cache1.k !== k) cache1 = { k, r: analisi1(key, p) };
    return cache1.r;
  };
  const texF = (F) => {
    if (F.bInf) return `${F.aAp ? "(" : "["}${num(F.a, 2)},\\,+\\infty)`;
    if (F.a > F.b || (F.a === F.b && (F.aAp || F.bAp))) return "\\varnothing";
    if (F.a === F.b) return `\\{${num(F.a, 2)}\\}`;
    return `${F.aAp ? "(" : "["}${num(F.a, 2)},\\,${num(F.b, 2)}${F.bAp ? ")" : "]"}`;
  };
  const doveTxt = (d, F) => d === "a" ? `\\(x \\to ${num(F.a, 2)}^{+}\\)` : d === "b" ? `\\(x \\to ${num(F.b, 2)}^{-}\\)` : "\\(x \\to +\\infty\\)";
  const esitoTxt = (r, s, F) => {
    const nome = s > 0 ? "min" : "max";
    const lab = `<strong>${nome}</strong>: `;
    if (r.esito === "illimitato")
      return lab + T(`problema illimitato, \\(z(P) = ${s > 0 ? "-" : "+"}\\infty\\) (per ${doveTxt(r.dove, F)}); nessuna soluzione ottima.`,
        `unbounded problem, \\(z(P) = ${s > 0 ? "-" : "+"}\\infty\\) (as ${doveTxt(r.dove, F)}); no optimal solution.`);
    if (r.esito === "nonRaggiunto") {
      const op = s > 0 ? "\\inf" : "\\sup";
      return lab + T(`\\(${op}_{F} f = ${nInf(r.z)}\\), avvicinato per ${doveTxt(r.dove, F)} ma <em>non raggiunto</em>: nessuna soluzione ottima.`,
        `\\(${op}_{F} f = ${nInf(r.z)}\\), approached as ${doveTxt(r.dove, F)} but <em>not attained</em>: no optimal solution.`);
    }
    const parti = [...r.pts.map((x) => `\\(${num(x, 3)}\\)`), ...r.seg.map(([l, u, lA, uA]) => `\\(${lA ? "(" : "["}${num(l, 2)},\\,${num(u, 2)}${uA ? ")" : "]"}\\)`)];
    const molte = r.seg.length > 0 || r.pts.length > 1;
    const sol = r.seg.length
      ? T(`infinite soluzioni ottime: ${parti.join(", ")}`, `infinitely many optimal solutions: ${parti.join(", ")}`)
      : molte ? T(`soluzioni ottime \\(\\tilde x(P) \\in \\{${r.pts.map((x) => num(x, 3)).join(",\\ ")}\\}\\)`, `optimal solutions \\(\\tilde x(P) \\in \\{${r.pts.map((x) => num(x, 3)).join(",\\ ")}\\}\\)`)
        : T(`soluzione ottima \\(\\tilde x(P) = ${num(r.pts[0], 3)}\\)`, `optimal solution \\(\\tilde x(P) = ${num(r.pts[0], 3)}\\)`);
    return lab + `${pallino("ottimo")} ${sol}, \\(z(P) = ${num(r.z, 3)}\\).`;
  };

  window.GI_RICETTE["ottimo-intervallo"] = {
    titolo: T("Esiti di un problema di ottimizzazione", "Outcomes of an optimization problem"),
    sottotitolo: T("ottimo, illimitato, estremo non raggiunto, inammissibile", "optimal, unbounded, bound not attained, infeasible"),
    funzioni: OI,
    iniziale: "x2",
    parametri: [
      { k: "a", nome: "a", min: -4, max: 6, step: 0.1, val: -1, descr: T("estremo sinistro della regione ammissibile \\(F\\)", "left endpoint of the feasible region \\(F\\)") },
      { k: "b", nome: "b", min: -4, max: 6, step: 0.1, val: 2, descr: T("estremo destro di \\(F\\) (ignorato se \\(b = +\\infty\\))", "right endpoint of \\(F\\) (ignored when \\(b = +\\infty\\))") },
      { k: "c", nome: "a \\notin F", min: 0, max: 1, step: 1, val: 0, tipo: "interruttore", descr: T("0 = estremo sinistro chiuso \\([a\\); 1 = aperto \\((a\\)", "0 = closed left endpoint \\([a\\); 1 = open \\((a\\)") },
      { k: "d", nome: "b \\notin F", min: 0, max: 1, step: 1, val: 0, tipo: "interruttore", descr: T("0 = estremo destro chiuso \\(b]\\); 1 = aperto \\(b)\\)", "0 = closed right endpoint \\(b]\\); 1 = open \\(b)\\)") },
      { k: "e", nome: "b = +\\infty", min: 0, max: 1, step: 1, val: 0, tipo: "interruttore", descr: T("1 = la regione ammissibile è illimitata a destra: \\(F = [a, +\\infty)\\)", "1 = the feasible region is unbounded to the right: \\(F = [a, +\\infty)\\)") },
    ],
    vista: (k) => OI[k].vista,
    legenda: [
      ["ammissibile", T("\\(f\\) su \\(F\\) e \\(F\\) sull'asse", "\\(f\\) over \\(F\\) and \\(F\\) on the axis"), ""],
      ["orig", T("\\(f\\) fuori da \\(F\\)", "\\(f\\) outside \\(F\\)"), "dashed"],
      ["ottimo", T("soluzioni ottime", "optimal solutions"), "punto"],
      ["ottimo", T("inf / sup non raggiunto", "inf / sup not attained"), "dashed"],
      ["muted", T("pallino vuoto: estremo \\(\\notin F\\)", "empty circle: endpoint \\(\\notin F\\)"), "dotted"],
    ],
    aggiorna(board, st) {
      prendiColori(st);
      const key = st.chiave(), p = st.p(), fn = OI[key], f = fn.f, r = ris1(key, p), F = r.F;
      const [vx0, vy1, vx1, vy0] = fn.vista;
      board.suspendUpdate();
      pulisci(board);
      fuori(board, f);
      if (!r.vuoto && !r.nonDef) {
        const lo = F.a, hi = F.bInf ? vx1 + 1 : F.b;
        const l = F.aAp ? lo + 1e-7 : lo, u = !F.bInf && F.bAp ? hi - 1e-7 : hi;
        if (hi > lo) { regione(board, lo, F.bInf ? vx1 - 0.05 : hi, F.bInf); grafico(board, f, l, u); }
        // estremi: pallino pieno se appartiene a F, vuoto altrimenti
        const estremo = (x, ap) => {
          if (ap) vuoto(board, x, 0, C.amm); else punto(board, x, 0, C.amm, { size: 3.5 });
          const y = f(x);
          if (isFinite(y) && y < vy1 && y > vy0) {
            verticale(board, x, y);
            if (ap) vuoto(board, x, y, C.amm); else punto(board, x, y, C.amm, { size: 3 });
          }
        };
        estremo(F.a, F.aAp);
        if (!F.bInf && F.b !== F.a) estremo(F.b, F.bAp);
        // soluzioni ottime e estremi non raggiunti
        for (const [s, o] of [[1, r.min], [-1, r.max]]) {
          const nome = s > 0 ? "min" : "max";
          if (o.esito === "ottimo") {
            for (const x of o.pts) {
              const y = f(x);
              verticale(board, x, y);
              punto(board, x, y, C.ott, { size: 4.5 });
            }
            for (const [x0, x1, lA, uA] of o.seg) crea(board, "functiongraph", [f, lA ? x0 + 1e-6 : x0, uA ? x1 - 1e-6 : x1], { strokeColor: C.ott, strokeWidth: 5, layer: 8 });
          } else if (o.esito === "nonRaggiunto" && isFinite(o.z) && o.z < vy1 && o.z > vy0) {
            const xa = F.a, xb = F.bInf ? vx1 : F.b;
            crea(board, "segment", [[xa, o.z], [xb, o.z]], { strokeColor: C.ott, strokeWidth: 1.5, dash: 3 });
          }
        }
      }
      board.unsuspendUpdate();
    },
    formula(p, st) {
      const key = st.chiave(), col = st.col;
      const F = leggiF(p);
      return `\\min\\ /\\ \\max\\,\\big\\{\\, ${OI[key].tex} \\ :\\ x \\in F \\,\\big\\},\\qquad F = ${texF(F)}`;
    },
    letture(p, st) {
      const key = st.chiave();
      const r = ris1(key, p), F = r.F;
      if (r.vuoto)
        return T(`\\(F = \\varnothing\\): il problema è <strong>inammissibile</strong>, non ha soluzioni ammissibili né ottime (per convenzione \\(z(P) = +\\infty\\) nel minimo e \\(-\\infty\\) nel massimo).`,
          `\\(F = \\varnothing\\): the problem is <strong>infeasible</strong>, it has no feasible and no optimal solutions (by convention \\(z(P) = +\\infty\\) for the minimum and \\(-\\infty\\) for the maximum).`);
      if (r.nonDef)
        return T(`\\(f\\) non è definita in \\(x = 0 \\in F\\): scegli \\(F \\subseteq (0, +\\infty)\\) oppure \\(F \\subseteq (-\\infty, 0)\\).`,
          `\\(f\\) is not defined at \\(x = 0 \\in F\\): choose \\(F \\subseteq (0, +\\infty)\\) or \\(F \\subseteq (-\\infty, 0)\\).`);
      return `${esitoTxt(r.min, 1, F)}<br>${esitoTxt(r.max, -1, F)}`;
    },
    domanda: T(
      "Con \\(\\dfrac{1}{x}\\) trova una regione ammissibile in cui il minimo <em>non</em> è raggiunto perché \\(f\\) si avvicina all'estremo inferiore solo all'infinito, e una in cui il minimo esiste. Poi, con \\(x^2\\), confronta \\(F = [-1, 2]\\) e \\(F = (0, 1]\\): quale esito cambia?",
      "With \\(\\dfrac{1}{x}\\) find a feasible region where the minimum is <em>not</em> attained because \\(f\\) approaches its infimum only at infinity, and one where the minimum exists. Then, with \\(x^2\\), compare \\(F = [-1, 2]\\) and \\(F = (0, 1]\\): which outcome changes?"),
  };

  /* ====================================================================
   * 2. Ottimi locali e intorni
   * ==================================================================== */
  // le funzioni con i loro ottimi locali, noti esattamente (tipo, globale?)
  const OL = {
    note: {
      f: (x) => Math.min((x + 2) * (x + 2), (x - 2) * (x - 2) + 1),
      tex: "\\min\\{(x+2)^2,\\,(x-2)^2+1\\}", F: [-4, 4], vista: [-4.9, 6.6, 4.9, -1.4],
      ottimi: [[-2, "min", true], [2, "min", false], [-4, "max", false], [0.125, "max", false], [4, "max", true]],
    },
    quarta: {
      f: (x) => x ** 4 / 8 - x ** 3 / 12 - x * x + x + 4,
      tex: "\\tfrac{x^4}{8}-\\tfrac{x^3}{12}-x^2+x+4", F: [-3, 3], vista: [-3.7, 7, 3.7, -1.3],
      ottimi: [[-2, "min", true], [2, "min", false], [-3, "max", false], [0.5, "max", false], [3, "max", true]],
    },
    cubica: {
      f: (x) => x ** 3 - 6 * x * x + 9 * x + 2,
      tex: "x^3-6x^2+9x+2", F: [0, 5], vista: [-0.7, 25, 5.7, -3.5],
      ottimi: [[0, "min", true], [3, "min", true], [1, "max", false], [5, "max", true]],
    },
  };
  const intorno = (fd, xb, d) => {
    const [lo, hi] = fd.F;
    return { l: Math.max(lo, xb - d), r: Math.min(hi, xb + d), lChiuso: xb - d < lo, rChiuso: xb + d > hi };
  };
  // confronta f(x̄) con f su (x̄−δ, x̄+δ) ∩ F: griglia fine + ottimi noti nell'intorno
  const analisi2 = (key, p) => {
    const fd = OL[key], f = fd.f, xb = clamp(p.a, fd.F[0], fd.F[1]), d = p.b, fb = f(xb);
    const I = intorno(fd, xb, d), M = 1600, tol = 1e-9 * (1 + Math.abs(fb));
    const xs = [];
    for (let i = 1; i < M; i++) xs.push(I.l + (I.r - I.l) * i / M);
    if (I.lChiuso) xs.push(I.l);
    if (I.rChiuso) xs.push(I.r);
    for (const [x] of fd.ottimi) if (x > xb - d && x < xb + d) xs.push(x);
    let xmin = xb, xmax = xb;
    for (const x of xs) { if (f(x) < f(xmin)) xmin = x; if (f(x) > f(xmax)) xmax = x; }
    const ys = fd.ottimi.map(([x]) => f(x));
    const ott = fd.ottimi.find(([x]) => Math.abs(x - xb) < 1e-6);
    return {
      xb, fb, d, I,
      eMin: f(xmin) >= fb - tol, eMax: f(xmax) <= fb + tol, xmin, xmax,
      ott, gmin: Math.min(...ys), gmax: Math.max(...ys),
      xgmin: fd.ottimi.filter(([x, t, g]) => t === "min" && g).map(([x]) => x),
      xgmax: fd.ottimi.filter(([x, t, g]) => t === "max" && g).map(([x]) => x),
    };
  };
  const intTxt = (I) => `${I.lChiuso ? "[" : "("}${num(I.l, 3)},\\,${num(I.r, 3)}${I.rChiuso ? "]" : ")"}`;

  const R2 = {
    titolo: T("Ottimi locali e intorni", "Local optima and neighborhoods"),
    sottotitolo: T("\\(f(\\bar x) \\le f(x)\\) per ogni \\(x \\in N(\\bar x, \\delta) \\cap F\\)?", "\\(f(\\bar x) \\le f(x)\\) for every \\(x \\in N(\\bar x, \\delta) \\cap F\\)?"),
    funzioni: OL,
    iniziale: "note",
    parametri: [
      { k: "a", nome: "\\bar x", min: -4, max: 5, step: 0.025, val: 2, descr: T("il punto da esaminare (trascinalo anche sull'asse \\(x\\))", "the point under examination (you can also drag it on the \\(x\\)-axis)") },
      { k: "b", nome: "\\delta", min: 0.05, max: 4, step: 0.05, val: 1, descr: T("il raggio dell'intorno \\(N(\\bar x, \\delta) = (\\bar x - \\delta,\\, \\bar x + \\delta)\\)", "the radius of the neighborhood \\(N(\\bar x, \\delta) = (\\bar x - \\delta,\\, \\bar x + \\delta)\\)") },
    ],
    vista: (k) => OL[k].vista,
    legenda: [
      ["ammissibile", T("\\(f\\) su \\(F\\)", "\\(f\\) over \\(F\\)"), ""],
      ["a", "\\(\\bar x\\)", "punto"],
      ["b", T("\\(N(\\bar x, \\delta) \\cap F\\)", "\\(N(\\bar x, \\delta) \\cap F\\)"), "pieno"],
      ["muted", T("punto dell'intorno che esclude un minimo / massimo", "point of the neighborhood that rules out a minimum / maximum"), "punto"],
      ["ottimo", T("ottimi globali", "global optima"), "punto"],
      ["locale", T("ottimi locali non globali", "local, not global, optima"), "punto"],
    ],
    monta(board, st) {
      const R = R2;
      const fd = () => OL[st.chiave()];
      prendiColori(st);
      const ca = C.a;
      const asse = board.create("line", [[0, 0], [1, 0]], { visible: false, fixed: true });
      const P = board.create("glider", [clamp(st.p().a, fd().F[0], fd().F[1]), 0, asse], {
        name: "", withLabel: false, size: 6, strokeColor: ca, fillColor: ca, showInfobox: false,
      });
      P.on("drag", () => {
        const [lo, hi] = fd().F;
        const v = arrot(clamp(P.X(), lo, hi), 0.025);
        imposta(board, st, R, "a", +v.toFixed(3));
      });
      st.dati.P = P;
    },
    aggiorna(board, st) {
      prendiColori(st);
      const key = st.chiave(), fd = OL[key], f = fd.f, p = st.p();
      const [lo, hi] = fd.F;
      // x̄ fuori da F (dopo un cambio di funzione): lo si riporta in F
      if (p.a < lo || p.a > hi) { imposta(board, st, R2, "a", clamp(p.a, lo, hi)); return; }
      const r = analisi2(key, p), [, vy1, , vy0] = fd.vista;
      const ca = C.a, cb = C.b;
      board.suspendUpdate();
      pulisci(board);
      // l'intorno: fascia verticale e tratto sull'asse
      crea(board, "polygon", [[r.I.l, vy0], [r.I.r, vy0], [r.I.r, vy1], [r.I.l, vy1]], {
        fillColor: cb, fillOpacity: 0.12, borders: { visible: false }, vertices: { visible: false }, hasInnerPoints: false,
      });
      for (const [x, ch] of [[r.I.l, r.I.lChiuso], [r.I.r, r.I.rChiuso]]) if (!ch) crea(board, "segment", [[x, vy0], [x, vy1]], { strokeColor: cb, strokeWidth: 1, dash: 2 });
      fuori(board, f);
      regione(board, lo, hi);
      grafico(board, f, lo, hi);
      crea(board, "segment", [[r.I.l, 0], [r.I.r, 0]], { strokeColor: cb, strokeWidth: 8, strokeOpacity: 0.55 });
      if (!r.I.lChiuso) vuoto(board, r.I.l, 0, cb);
      if (!r.I.rChiuso) vuoto(board, r.I.r, 0, cb);
      // tutti gli ottimi locali: blu i globali, viola gli altri
      for (const [x, t, g] of fd.ottimi) punto(board, x, f(x), g ? C.ott : C.loc, { size: 3.5 });
      // il confronto: f(x̄) e la retta orizzontale nell'intorno
      crea(board, "segment", [[r.xb, 0], [r.xb, r.fb]], { strokeColor: ca, strokeWidth: 1.5, dash: 2 });
      crea(board, "segment", [[r.I.l, r.fb], [r.I.r, r.fb]], { strokeColor: ca, strokeWidth: 1.8, dash: 2 });
      const colX = r.ott ? (r.ott[2] ? C.ott : C.loc) : ca;
      punto(board, r.xb, r.fb, colX, { size: 5.5, strokeColor: ca, strokeWidth: 2.5 });
      // un testimone: un punto dell'intorno più basso / più alto di x̄
      const mut = C.muted;
      if (!r.eMin) punto(board, r.xmin, f(r.xmin), mut, { size: 3 });
      if (!r.eMax) punto(board, r.xmax, f(r.xmax), mut, { size: 3 });
      board.unsuspendUpdate();
      if (st.dati.P && Math.abs(st.dati.P.X() - r.xb) > 1e-9) { st.dati.P.moveTo([r.xb, 0]); }
    },
    formula(p, st) {
      const key = st.chiave(), col = st.col;
      const r = analisi2(key, p);
      return `N(${col("a", "\\bar x")}, ${col("b", "\\delta")}) \\cap F = ${intTxt(r.I)},\\qquad f(${col("a", num(r.xb, 3))}) = ${num(r.fb, 3)}`;
    },
    letture(p, st) {
      const key = st.chiave();
      const r = analisi2(key, p), fd = OL[key];
      const righe = [];
      const nb = T("nell'intorno", "in the neighborhood");
      if (r.eMin) righe.push(T(`${nb}: \\(f(\\bar x) \\le f(x)\\) per ogni \\(x\\), quindi \\(\\bar x\\) <strong>è punto di minimo locale</strong>.`, `${nb}: \\(f(\\bar x) \\le f(x)\\) for every \\(x\\), hence \\(\\bar x\\) <strong>is a point of local minimum</strong>.`));
      else righe.push(T(`${nb} c'è \\(x = ${num(r.xmin, 3)}\\) (punto grigio) con \\(f(x) = ${num(fd.f(r.xmin), 3)} \\lt f(\\bar x)\\): questo intorno non mostra un minimo locale.`, `${nb} there is \\(x = ${num(r.xmin, 3)}\\) (grey point) with \\(f(x) = ${num(fd.f(r.xmin), 3)} \\lt f(\\bar x)\\): this neighborhood shows no local minimum.`));
      if (r.eMax) righe.push(T(`${nb}: \\(f(\\bar x) \\ge f(x)\\) per ogni \\(x\\), quindi \\(\\bar x\\) <strong>è punto di massimo locale</strong>.`, `${nb}: \\(f(\\bar x) \\ge f(x)\\) for every \\(x\\), hence \\(\\bar x\\) <strong>is a point of local maximum</strong>.`));
      else righe.push(T(`${nb} c'è \\(x = ${num(r.xmax, 3)}\\) (punto grigio) con \\(f(x) = ${num(fd.f(r.xmax), 3)} \\gt f(\\bar x)\\): questo intorno non mostra un massimo locale.`, `${nb} there is \\(x = ${num(r.xmax, 3)}\\) (grey point) with \\(f(x) = ${num(fd.f(r.xmax), 3)} \\gt f(\\bar x)\\): this neighborhood shows no local maximum.`));
      // il verdetto, che non dipende da δ
      let v;
      if (r.ott) {
        const [, t, g] = r.ott, mn = t === "min";
        const glob = mn ? r.gmin : r.gmax, xs = (mn ? r.xgmin : r.xgmax).map((x) => num(x, 3)).join(",\\ ");
        const tipo = mn ? T("minimo", "minimum") : T("massimo", "maximum");
        v = g
          ? `${pallino("ottimo")} ` + T(`\\(\\bar x\\) è punto di ${tipo} locale <strong>e globale</strong>: \\(f(\\bar x) = ${num(glob, 3)}\\) è il ${tipo} di \\(f\\) su \\(F\\).`, `\\(\\bar x\\) is a point of local <strong>and global</strong> ${tipo}: \\(f(\\bar x) = ${num(glob, 3)}\\) is the ${tipo} of \\(f\\) over \\(F\\).`)
          : `${pallino("locale")} ` + T(`\\(\\bar x\\) è punto di ${tipo} locale ma <strong>non globale</strong>: il ${tipo} su \\(F\\) è \\(${num(glob, 3)}\\), in \\(x = ${xs}\\).`, `\\(\\bar x\\) is a point of local ${tipo} but <strong>not global</strong>: the ${tipo} over \\(F\\) is \\(${num(glob, 3)}\\), at \\(x = ${xs}\\).`);
        if ((mn && !r.eMin) || (!mn && !r.eMax)) v += " " + T("Riduci \\(\\delta\\): basta <em>un</em> intorno in cui la disuguaglianza vale.", "Reduce \\(\\delta\\): <em>one</em> neighborhood where the inequality holds is enough.");
      } else v = T("Verdetto: \\(\\bar x\\) non è né punto di minimo né di massimo locale: anche con \\(\\delta\\) piccolo ci sono punti più bassi e più alti.", "Verdict: \\(\\bar x\\) is neither a point of local minimum nor of local maximum: even with a small \\(\\delta\\) there are lower and higher points.");
      righe.push(v);
      return righe.join("<br>");
    },
    domanda: T(
      "Porta \\(\\bar x\\) in \\(2\\) con la prima funzione: per quali \\(\\delta\\) l'intorno mostra che è un minimo locale? Perché non è globale? Poi metti \\(\\bar x = -4\\): perché un estremo di \\(F\\) può essere un massimo locale?",
      "Move \\(\\bar x\\) to \\(2\\) with the first function: for which \\(\\delta\\) does the neighborhood show a local minimum? Why is it not global? Then set \\(\\bar x = -4\\): why can an endpoint of \\(F\\) be a local maximum?"),
  };
  window.GI_RICETTE["ottimi-locali"] = R2;

  /* ====================================================================
   * 3. Un metodo che guarda solo vicino: dove si ferma?
   * ==================================================================== */
  /* Metodo di discesa a passo fisso con riduzione (usa solo valori di f):
   *   da x con passo s confronta f(x − s) e f(x + s) (troncati a F);
   *   se uno dei due è più basso di f(x) ci si sposta lì, altrimenti s := s/2;
   *   ci si ferma quando s < 0,01. Ogni iterazione è un «passo» (cursore n). */
  const DL = {
    convessa: { f: (x) => (x - 3) * (x - 3) + 1, tex: "(x-3)^2+1", F: [0, 6], vista: [-0.7, 11.5, 6.7, -1.6], convessa: true, minimi: [[3, true]] },
    note: { f: OL.note.f, tex: OL.note.tex, F: [-4, 4], vista: [-4.9, 6.6, 4.9, -1.4], minimi: [[-2, true], [2, false]] },
    cubica: { f: OL.cubica.f, tex: OL.cubica.tex, F: [0, 5], vista: [-0.7, 25, 5.7, -3.5], minimi: [[0, true], [3, true]] },
  };
  const S0 = 0.5, SMIN = 0.01;
  const discesa = (key, x0, n) => {
    const fd = DL[key], f = fd.f, [lo, hi] = fd.F;
    let x = clamp(x0, lo, hi), s = S0, fermo = false;
    const traccia = [{ x, s, mossa: false }];
    for (let k = 0; k < n; k++) {
      if (s < SMIN) { fermo = true; break; }
      const cand = [clamp(x - s, lo, hi), clamp(x + s, lo, hi)].filter((c) => c !== x);
      let best = null;
      for (const c of cand) if (f(c) < f(x) - 1e-12 && (best === null || f(c) < f(best))) best = c;
      if (best !== null) { x = best; traccia.push({ x, s, mossa: true }); }
      else { s /= 2; traccia.push({ x, s, mossa: false }); }
    }
    if (s < SMIN) fermo = true;
    // dove si ferma: il minimo locale noto più vicino
    let vicino = null;
    for (const [m, g] of fd.minimi) if (Math.abs(m - x) < 0.05 && (!vicino || Math.abs(m - x) < Math.abs(vicino[0] - x))) vicino = [m, g];
    const passi = traccia.length - 1;
    return { x, s, fermo, traccia, vicino, passi };
  };

  const R3 = {
    titolo: T("Dove si ferma un metodo locale?", "Where does a local method stop?"),
    sottotitolo: T("nei problemi convessi ogni minimo locale è globale", "in convex problems every local minimum is global"),
    funzioni: DL,
    iniziale: "note",
    parametri: [
      { k: "a", nome: "x_0", min: -4, max: 6, step: 0.05, val: 0.5, descr: T("il punto di partenza (trascinalo anche sull'asse \\(x\\))", "the starting point (you can also drag it on the \\(x\\)-axis)") },
      { k: "b", nome: "n", min: 0, max: 40, step: 1, val: 0, descr: T("i passi eseguiti: con ▶ il metodo procede da solo. A ogni passo confronta \\(f(x \\pm s)\\) con \\(f(x)\\): si sposta se trova un valore più basso, altrimenti dimezza \\(s\\) (da \\(s = 0{,}5\\); si ferma con \\(s \\lt 0{,}01\\))", "the steps performed: with ▶ the method runs by itself. At each step it compares \\(f(x \\pm s)\\) with \\(f(x)\\): it moves if it finds a lower value, otherwise it halves \\(s\\) (from \\(s = 0.5\\); it stops when \\(s \\lt 0.01\\))") },
    ],
    vista: (k) => DL[k].vista,
    legenda: [
      ["ammissibile", T("\\(f\\) su \\(F\\)", "\\(f\\) over \\(F\\)"), ""],
      ["a", T("\\(x_0\\) e il punto corrente", "\\(x_0\\) and the current point"), "punto"],
      ["b", T("i passi del metodo", "the steps of the method"), ""],
      ["ottimo", T("arresto in un minimo globale", "stop at a global minimum"), "punto"],
      ["locale", T("arresto in un minimo locale", "stop at a local minimum"), "punto"],
    ],
    monta(board, st) {
      const R = R3;
      const fd = () => DL[st.chiave()];
      prendiColori(st);
      const ca = C.a;
      const asse = board.create("line", [[0, 0], [1, 0]], { visible: false, fixed: true });
      const P = board.create("glider", [clamp(st.p().a, fd().F[0], fd().F[1]), 0, asse], {
        name: "", withLabel: false, size: 6, strokeColor: ca, fillColor: ca, showInfobox: false,
      });
      P.on("drag", () => {
        const [lo, hi] = fd().F;
        imposta(board, st, R, "a", +arrot(clamp(P.X(), lo, hi), 0.05).toFixed(2));
      });
      st.dati.P = P;
    },
    aggiorna(board, st) {
      prendiColori(st);
      const key = st.chiave(), fd = DL[key], f = fd.f, p = st.p(), [lo, hi] = fd.F;
      if (p.a < lo || p.a > hi) { imposta(board, st, R3, "a", clamp(p.a, lo, hi)); return; }
      const r = discesa(key, p.a, Math.round(p.b));
      const ca = C.a, cb = C.b;
      board.suspendUpdate();
      pulisci(board);
      fuori(board, f);
      regione(board, lo, hi);
      grafico(board, f, lo, hi);
      // la traiettoria: segmenti fra i punti visitati
      const vis = [r.traccia[0].x];
      for (const t of r.traccia) if (t.mossa) vis.push(t.x);
      for (let i = 1; i < vis.length; i++)
        crea(board, "arrow", [[vis[i - 1], f(vis[i - 1])], [vis[i], f(vis[i])]], { strokeColor: cb, strokeWidth: 2.2, lastArrow: { type: 2, size: 4 } });
      for (let i = 0; i < vis.length - 1; i++) punto(board, vis[i], f(vis[i]), cb, { size: 2.5 });
      // finché non si ferma: dove guarda (x ± s), sul grafico e sull'asse
      if (!r.fermo) {
        for (const c of [r.x - r.s, r.x + r.s]) if (c >= lo - 1e-12 && c <= hi + 1e-12) {
          vuoto(board, c, f(c), cb);
          crea(board, "segment", [[c, 0], [c, f(c)]], { strokeColor: cb, strokeWidth: 1, dash: 1 });
        }
        crea(board, "segment", [[Math.max(lo, r.x - r.s), 0], [Math.min(hi, r.x + r.s), 0]], { strokeColor: cb, strokeWidth: 8, strokeOpacity: 0.5 });
        punto(board, r.x, f(r.x), ca, { size: 5 });
      } else {
        const col = r.vicino ? (r.vicino[1] ? C.ott : C.loc) : ca;
        verticale(board, r.x, f(r.x));
        punto(board, r.x, f(r.x), col, { size: 6 });
      }
      board.unsuspendUpdate();
      if (st.dati.P && Math.abs(st.dati.P.X() - clamp(p.a, lo, hi)) > 1e-9) st.dati.P.moveTo([clamp(p.a, lo, hi), 0]);
    },
    formula(p, st) {
      const key = st.chiave(), col = st.col;
      const r = discesa(key, p.a, Math.round(p.b)), f = DL[key].f;
      return `${col("b", `x_{${r.passi}}`)} = ${num(r.x, 3)},\\quad f(x_{${r.passi}}) = ${num(f(r.x), 3)},\\quad s = ${num(r.s, 4)}`;
    },
    letture(p, st) {
      const key = st.chiave();
      const fd = DL[key], r = discesa(key, p.a, Math.round(p.b));
      const tipo = fd.convessa
        ? T("Problema <strong>convesso</strong>: \\(f\\) convessa su \\(F\\) convesso.", "<strong>Convex</strong> problem: \\(f\\) convex over the convex \\(F\\).")
        : T("Problema <strong>non convesso</strong>: \\(f\\) non è convessa su \\(F\\).", "<strong>Non-convex</strong> problem: \\(f\\) is not convex over \\(F\\).");
      if (!r.fermo) {
        const ult = r.traccia[r.traccia.length - 1];
        const cosa = r.passi === 0 ? T("Premi ▶ o muovi \\(n\\): prima prova a indovinare dove si fermerà.", "Press ▶ or move \\(n\\): first try to guess where it will stop.")
          : ult.mossa ? T("all'ultimo passo ha trovato un valore più basso e si è spostato.", "at the last step it found a lower value and moved.")
            : T("all'ultimo passo nessuno dei due vicini era più basso: ha dimezzato \\(s\\).", "at the last step neither neighbor was lower: it halved \\(s\\).");
        return `${tipo}<br>${T("Il metodo guarda solo \\(x - s\\) e \\(x + s\\) (pallini vuoti):", "The method only looks at \\(x - s\\) and \\(x + s\\) (empty circles):")} ${cosa}`;
      }
      const glob = r.vicino && r.vicino[1];
      const zmin = Math.min(...fd.minimi.map(([m]) => fd.f(m)));
      const xg = fd.minimi.filter(([, g]) => g).map(([m]) => num(m, 2)).join(",\\ ");
      const esito = glob
        ? `${pallino("ottimo")} ` + T(`Si ferma in \\(x \\approx ${num(r.x, 2)}\\) dopo ${r.passi} passi: è un <strong>minimo globale</strong>, \\(z(P) = ${num(zmin, 3)}\\).`, `It stops at \\(x \\approx ${num(r.x, 2)}\\) after ${r.passi} steps: a <strong>global minimum</strong>, \\(z(P) = ${num(zmin, 3)}\\).`)
        : `${pallino("locale")} ` + T(`Si ferma in \\(x \\approx ${num(r.x, 2)}\\) dopo ${r.passi} passi: è un <strong>minimo locale non globale</strong>, \\(f = ${num(fd.f(r.x), 3)}\\), mentre \\(z(P) = ${num(zmin, 3)}\\) in \\(x = ${xg}\\).`, `It stops at \\(x \\approx ${num(r.x, 2)}\\) after ${r.passi} steps: a <strong>local, not global, minimum</strong>, \\(f = ${num(fd.f(r.x), 3)}\\), while \\(z(P) = ${num(zmin, 3)}\\) at \\(x = ${xg}\\).`);
      const nota = fd.convessa
        ? T("Da qualunque \\(x_0\\) si arriva qui: nei problemi convessi ogni minimo locale è globale.", "From any \\(x_0\\) it ends here: in convex problems every local minimum is global.")
        : T("Il metodo vede solo i punti vicini: non può sapere se altrove \\(f\\) è più bassa.", "The method only sees nearby points: it cannot know whether \\(f\\) is lower elsewhere.");
      return `${tipo}<br>${esito}<br>${nota}`;
    },
    domanda: T(
      "Indovina dove si ferma: con \\(\\min\\{(x+2)^2,(x-2)^2+1\\}\\) prevedi il punto d'arresto partendo da \\(x_0 = 0{,}5\\) e da \\(x_0 = 0\\), poi premi ▶ su \\(n\\). Con \\((x-3)^2+1\\) esiste un \\(x_0\\) da cui si ferma lontano da \\(3\\)? Con la cubica si ferma in due punti diversi: perché sono entrambi ottimi?",
      "Guess where it stops: with \\(\\min\\{(x+2)^2,(x-2)^2+1\\}\\) predict the stopping point starting from \\(x_0 = 0.5\\) and from \\(x_0 = 0\\), then press ▶ on \\(n\\). With \\((x-3)^2+1\\), is there an \\(x_0\\) from which it stops far from \\(3\\)? With the cubic it stops at two different points: why are both optimal?"),
  };
  window.GI_RICETTE["discesa-locale"] = R3;
})();
