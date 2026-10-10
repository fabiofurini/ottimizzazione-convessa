/* Grafici interattivi di Ottimizzazione convessa, capitoli 2-4 (JSXGraph).
 *
 * Ricette registrate in window.GI_RICETTE per il motore interattivi.js:
 *   livello-gradiente  (cap. 2) insiemi di livello e gradiente
 *   corda              (cap. 3) la definizione di funzione convessa
 *   matrice-q          (cap. 4) la matrice Q di una funzione quadratica
 *
 * I punti trascinabili sono legati ai cursori: trascinandoli si spostano i
 * cursori (il motore riscrive formula e letture), muovendo i cursori si
 * spostano i punti (hook aggiorna).
 * Colori come nelle dispense: grafico blu, corda viola tratteggiata,
 * gradiente blu; verde/rosso per l'esito della disuguaglianza.
 */
(function () {
  "use strict";

  const RICETTE = (window.GI_RICETTE = window.GI_RICETTE || {});

  // ------------------------------------------------------------------ utilità
  // gli helper del motore (caricato prima di questo file), con riserva
  const lingua = () => (document.documentElement.lang || "it").slice(0, 2).toLowerCase();
  const EN = () => (window.GI && "EN" in window.GI ? !!window.GI.EN : lingua() === "en");
  const T = (it, en) => (window.GI && window.GI.T ? window.GI.T(it, en) : EN() ? en : it);
  const num = (x, c = 2) => {
    if (window.GI && window.GI.num) return window.GI.num(x, c);
    if (!isFinite(x)) return isNaN(x) ? "?" : x > 0 ? "+\\infty" : "-\\infty";
    let s = (Math.round(x * 10 ** c) / 10 ** c).toFixed(c);
    if (c > 0) s = s.replace(/\.?0+$/, "");
    if (s === "-0") s = "0";
    return EN() ? s : s.replace(".", "{,}");
  };
  const scuro = () => (document.body && document.body.getAttribute("data-md-color-scheme")) === "slate";
  const COL = () => (scuro()
    ? { rosso: "#FF6B6B", blu: "#4DABF7", viola: "#DA77F2", verde: "#69DB7C", nero: "#E9ECEF", grigio: "#6b7b8f" }
    : { rosso: "#E03131", blu: "#1971C2", viola: "#9C36B5", verde: "#2F9E44", nero: "#212529", grigio: "#9aa5b1" });
  const BV = "\\boldsymbol x";
  // pezzo di formula nel colore del cursore k. Le graffe esterne servono: con
  // il pacchetto «color» di MathJax \color è un interruttore e colorerebbe
  // anche tutto quello che segue.
  const colore = (st, k, tex) => `{${st.col(k, tex)}}`;
  const tinta = (c, tex) => `{\\color{${c}}{${tex}}}`;

  // curva che si ricalcola a ogni aggiornamento: punti() -> [[x, y], ...]
  // (un punto [NaN, NaN] interrompe la curva)
  const spezzata = (board, punti, attr) => {
    const c = board.create("curve", [[0], [0]], Object.assign({ highlight: false, fixed: true }, attr));
    c.updateDataArray = function () {
      const P = punti();
      this.dataX = P.map((q) => q[0]);
      this.dataY = P.map((q) => q[1]);
    };
    return c;
  };

  // Trascinare un punto vuol dire spostare i cursori (arrotondati al passo):
  // i valori si scrivono nei cursori del grafico e si ricalcola tutto una volta.
  const imposta = (st, R, valori) => {
    const inp = Array.from(st.el.querySelectorAll('input[type="range"]'));
    let cambiato = false;
    R.parametri.forEach((q, i) => {
      if (!(q.k in valori) || !inp[i] || !isFinite(valori[q.k])) return;
      let v = Math.min(q.max, Math.max(q.min, valori[q.k]));
      v = q.min + Math.round((v - q.min) / q.step) * q.step;
      if (Math.abs(parseFloat(inp[i].value) - v) > 1e-9) { inp[i].value = v.toFixed(6); cambiato = true; }
    });
    if (cambiato) st.aggiorna();
  };
  // il punto segue il mouse durante il trascinamento e poi si aggancia ai cursori
  const lega = (board, st, R, P, daPunto) => {
    P._trascina = false;
    P.on("down", () => (P._trascina = true));
    P.on("drag", () => imposta(st, R, daPunto(P)));
    const fine = () => { if (!P._trascina) return; P._trascina = false; imposta(st, R, daPunto(P)); st.aggiorna(); };
    P.on("up", fine);
    board.on("up", fine);
  };
  const sposta = (P, x, y) => {
    if (!P || P._trascina) return;
    if (Math.abs(P.X() - x) > 1e-12 || Math.abs(P.Y() - y) > 1e-12) P.setPosition(JXG.COORDS_BY_USER, [x, y]);
  };

  // ------------------------------------------------- curve di livello (marching squares)
  // griglia dei valori di f, calcolata una volta per funzione; un piccolo
  // sfasamento evita che passi esattamente per assi e centri
  const griglia = (f, box, nx, ny) => {
    const [x0, y1, x1, y0] = box;
    const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, ox = x0 + dx * 0.0137, oy = y0 + dy * 0.0071;
    const V = new Float64Array((nx + 1) * (ny + 1));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) V[j * (nx + 1) + i] = f(ox + i * dx, oy + j * dy);
    return { V, nx, ny, ox, oy, dx, dy };
  };
  // segmenti della curva f = k, separati da [NaN, NaN]
  const contorno = (G, k) => {
    const { V, nx, ny, ox, oy, dx, dy } = G, out = [], N = [NaN, NaN];
    const interp = (xa, ya, va, xb, yb, vb) => { const t = (k - va) / (vb - va); return [xa + t * (xb - xa), ya + t * (yb - ya)]; };
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = V[j * (nx + 1) + i], b = V[j * (nx + 1) + i + 1], c = V[(j + 1) * (nx + 1) + i + 1], d = V[(j + 1) * (nx + 1) + i];
        if (!(isFinite(a) && isFinite(b) && isFinite(c) && isFinite(d))) continue;
        const sa = a > k, sb = b > k, sc = c > k, sd = d > k;
        if (sa === sb && sb === sc && sc === sd) continue;
        const X = ox + i * dx, Y = oy + j * dy, X1 = X + dx, Y1 = Y + dy;
        const basso = sa !== sb ? interp(X, Y, a, X1, Y, b) : null;
        const destra = sb !== sc ? interp(X1, Y, b, X1, Y1, c) : null;
        const alto = sd !== sc ? interp(X, Y1, d, X1, Y1, c) : null;
        const sinistra = sa !== sd ? interp(X, Y, a, X, Y1, d) : null;
        const E = [basso, destra, alto, sinistra].filter(Boolean);
        if (E.length === 2) out.push(E[0], E[1], N);
        else if (E.length === 4) {
          // cella a sella: decide il valore al centro
          if (((a + b + c + d) / 4 > k) === sa) out.push(basso, destra, N, alto, sinistra, N);
          else out.push(basso, sinistra, N, alto, destra, N);
        }
      }
    }
    return out;
  };

  /* ==================================================================
   * 1. Insiemi di livello e gradiente (cap. 2)
   * ================================================================== */
  const LIV = {
    sfera: {
      tex: "(x_1-2)^2+(x_2-2)^2+1",
      f: (x, y) => (x - 2) ** 2 + (y - 2) ** 2 + 1,
      g: (x, y) => [2 * (x - 2), 2 * (y - 2)],
      gtex: "\\big(2\\,(x_1-2),\\ 2\\,(x_2-2)\\big)'",
      vista: [-2, 5, 6, -1],
      livelli: [1.25, 2, 3, 5, 7, 10, 13, 17],
      freccia: 2.5,   // lunghezza massima della freccia
    },
    cubica: {
      tex: "x_1^2\\,x_2",
      f: (x, y) => x * x * y,
      g: (x, y) => [2 * x * y, x * x],
      gtex: "\\big(2\\,x_1 x_2,\\ x_1^2\\big)'",
      vista: [-4, 3, 4, -3],
      livelli: [-8, -4, -2, -1, -0.5, 0.5, 1, 2, 4, 8],
      freccia: 1.5,   // lunghezza massima della freccia
      // per k = 0 l'insieme di livello contiene anche la retta x1 = 0, dove f
      // tocca 0 senza cambiare segno (il campionamento non la vede)
      extra: (k) => (Math.abs(k) < 1e-9 ? [[0, -50], [0, 50], [NaN, NaN]] : []),
    },
    esp: {
      tex: "e^{x_1}+x_2^2",
      f: (x, y) => Math.exp(x) + y * y,
      g: (x, y) => [Math.exp(x), 2 * y],
      gtex: "\\big(e^{x_1},\\ 2\\,x_2\\big)'",
      vista: [-3.5, 2.5, 2.5, -2],
      livelli: [0.5, 1, 1.5, 2, 3, 4, 6],
      freccia: 1.2,   // lunghezza massima della freccia
    },
    quad: {
      tex: "2x_1^2-2x_1x_2+2x_2^2",
      f: (x, y) => 2 * x * x - 2 * x * y + 2 * y * y,
      g: (x, y) => [4 * x - 2 * y, -2 * x + 4 * y],
      gtex: "\\big(4x_1-2x_2,\\ -2x_1+4x_2\\big)'",
      vista: [-4, 3, 4, -3],
      livelli: [0.5, 2, 4, 8, 12, 18],
      freccia: 1.5,   // lunghezza massima della freccia
    },
  };
  // oltre la lunghezza «freccia» la freccia del gradiente si accorcia (resta nella vista)
  const statoLiv = (k, x, y) => {
    const F = LIV[k], v = F.f(x, y), [g1, g2] = F.g(x, y);
    return { v, g1, g2, n: Math.hypot(g1, g2) };
  };

  RICETTE["livello-gradiente"] = {
    titolo: T("Insiemi di livello e gradiente", "Level sets and gradient"),
    sottotitolo: T("il gradiente è perpendicolare all'insieme di livello", "the gradient is perpendicular to the level set"),
    funzioni: LIV,
    iniziale: "sfera",
    parametri: [
      { k: "x1", nome: "x_1", colore: "a", min: -4, max: 6, step: 0.05, val: 3,
        descr: T("prima coordinata del punto \\(" + BV + "\\); oppure trascina il punto nel grafico", "first coordinate of the point \\(" + BV + "\\); or drag the point in the plot") },
      { k: "x2", nome: "x_2", colore: "e", min: -3, max: 5, step: 0.05, val: 2,
        descr: T("seconda coordinata del punto \\(" + BV + "\\)", "second coordinate of the point \\(" + BV + "\\)") },
    ],
    vista: (k) => LIV[k].vista,
    stessaScala: true,
    monta(board, st) {
      const R = this, chiave = st.chiave(), F = LIV[chiave], C = COL();
      const [x0, y1, x1, y0] = F.vista, mx = (x1 - x0) * 0.5, my = (y1 - y0) * 0.5;
      const G = griglia(F.f, [x0 - mx, y1 + my, x1 + mx, y0 - my], 240, 180);
      // le curve di livello fisse si calcolano una volta sola
      const fisse = [];
      for (const k of F.livelli) fisse.push(...contorno(G, k), ...(F.extra ? F.extra(k) : []));
      spezzata(board, () => fisse, { strokeColor: C.grigio, strokeWidth: 1.3 });

      const p0 = st.p();
      const X = board.create("point", [p0.x1, p0.x2], {
        name: "x", size: 5, fillColor: C.nero, strokeColor: C.nero, highlightFillColor: C.nero, highlightStrokeColor: C.nero,
        showInfobox: false, layer: 9,
        label: { offset: [-18, -14], fontSize: 16, strokeColor: C.nero, highlightStrokeColor: C.nero, cssStyle: "font-weight:700" },
      });
      lega(board, st, R, X, (P) => ({ x1: P.X(), x2: P.Y() }));
      st.dati.X = X;
      const S = () => statoLiv(chiave, X.X(), X.Y());

      // l'insieme di livello che passa per x (viola)
      let cacheK = NaN, cache = [];
      spezzata(board, () => {
        const k = S().v;
        if (k !== cacheK) { cacheK = k; cache = contorno(G, k).concat(F.extra ? F.extra(k) : []); }
        return cache;
      }, { strokeColor: C.viola, strokeWidth: 3.2 });

      // retta tangente all'insieme di livello in x (tratteggiata)
      spezzata(board, () => {
        const s = S();
        if (s.n < 1e-9) return [];
        const tx = -s.g2 / s.n, ty = s.g1 / s.n, L = 1.2;
        return [[X.X() - L * tx, X.Y() - L * ty], [X.X() + L * tx, X.Y() + L * ty]];
      }, { strokeColor: C.nero, strokeWidth: 1.4, dash: 2, strokeOpacity: 0.7 });

      // il gradiente (freccia blu), accorciato se troppo lungo
      const scala = () => { const s = S(); return s.n > F.freccia ? F.freccia / s.n : 1; };
      const E = board.create("point", [() => X.X() + scala() * S().g1, () => X.Y() + scala() * S().g2], { visible: false, fixed: true, name: "", withLabel: false });
      board.create("arrow", [X, E], {
        strokeColor: C.blu, strokeWidth: 3.5, fixed: true, highlight: false,
        lastArrow: { type: 2, size: 5 }, visible: () => S().n > 1e-9,
      });
      board.create("text", [() => E.X() + 0.12 * Math.sign(S().g1 || 1), () => E.Y() + 0.15, `<span style="color:${C.blu}">∇f(<b>x</b>)</span>`], {
        fixed: true, fontSize: 15, strokeColor: C.blu, highlightStrokeColor: C.blu, cssStyle: "font-weight:700", visible: () => S().n > 1e-9, highlight: false,
        anchorX: "middle", anchorY: "bottom",
      });
    },
    aggiorna(board, st) { const p = st.p(); sposta(st.dati.X, p.x1, p.x2); },
    formula(p, st) {
      const F = LIV[st.chiave()];
      return `\\nabla f(${BV}) = ${F.gtex}`;
    },
    legenda: () => {
      const C = COL();
      return [
        [C.grigio, T("insiemi di livello", "level sets"), ""],
        [C.viola, T("insieme di livello per \\(" + BV + "\\)", "level set through \\(" + BV + "\\)"), ""],
        [C.blu, "\\nabla f(" + BV + ")", ""],
      ];
    },
    letture(p, st) {
      const k = st.chiave(), s = statoLiv(k, p.x1, p.x2), C = COL();
      const vet = `\\begin{pmatrix} ${num(s.g1)} \\\\ ${num(s.g2)} \\end{pmatrix}`;
      let r = `\\(${BV} = \\begin{pmatrix} ${colore(st, "x1", num(p.x1))} \\\\ ${colore(st, "x2", num(p.x2))} \\end{pmatrix}, \\qquad f(${BV}) = ${num(s.v, 3)}\\)<br>${T("il punto sta sull'insieme di livello", "the point lies on the level set")} \\(${tinta(C.viola, `L(${num(s.v, 3)})`)}\\)<br>` +
        `\\(${tinta(C.blu, `\\nabla f(${BV}) = ${vet}`)}\\)<br>\\(\\|\\nabla f(${BV})\\| = ${num(s.n, 3)}\\)`;
      if (s.n < 1e-9) {
        r += `<br><strong>${T("Gradiente nullo", "Zero gradient")}</strong>: ${T("\\(" + BV + "\\) è un punto stazionario e la freccia sparisce.", "\\(" + BV + "\\) is a stationary point and the arrow disappears.")}`;
        if (k === "sfera") r += " " + T("Qui \\(L(1)\\) è il solo punto \\((2,2)\\), il minimo di \\(f\\).", "Here \\(L(1)\\) is the single point \\((2,2)\\), the minimum of \\(f\\).");
        if (k === "quad") r += " " + T("Qui \\(L(0)\\) è il solo punto \\(\\boldsymbol 0\\), il minimo di \\(f\\).", "Here \\(L(0)\\) is the single point \\(\\boldsymbol 0\\), the minimum of \\(f\\).");
      } else if (s.n > LIV[k].freccia) {
        r += `<br><small>${T("La freccia è accorciata a lunghezza", "The arrow is shortened to length")} \\(${num(LIV[k].freccia, 1)}\\) ${T("(stessa direzione e verso).", "(same direction).")}</small>`;
      }
      return r;
    },
    domanda: T(
      "Trascina \\(" + BV + "\\): la freccia è sempre perpendicolare alla curva viola e punta verso i valori più alti. <strong>Dove il gradiente è nullo?</strong> Con \\((x_1-2)^2+(x_2-2)^2+1\\) cerca il punto in cui la freccia sparisce; con \\(x_1^2x_2\\) porta \\(" + BV + "\\) sull'asse \\(x_2\\) (\\(x_1=0\\)): che cosa succede alla freccia e all'insieme di livello? Con \\(e^{x_1}+x_2^2\\) il gradiente può annullarsi?",
      "Drag \\(" + BV + "\\): the arrow is always perpendicular to the violet curve and points towards higher values. <strong>Where is the gradient zero?</strong> With \\((x_1-2)^2+(x_2-2)^2+1\\) look for the point where the arrow disappears; with \\(x_1^2x_2\\) move \\(" + BV + "\\) onto the \\(x_2\\) axis (\\(x_1=0\\)): what happens to the arrow and to the level set? With \\(e^{x_1}+x_2^2\\) can the gradient vanish?"
    ),
  };

  /* ==================================================================
   * 2. La definizione di funzione convessa: la corda (cap. 3)
   * ================================================================== */
  const CORDA = {
    x2: { tex: "x^2", f: (x) => x * x, vista: [-3.5, 10, 3.5, -1.2] },
    abs: { tex: "|x|", f: Math.abs, vista: [-3.5, 3.8, 3.5, -0.8] },
    exp: { tex: "e^x", f: Math.exp, vista: [-3.5, 21, 3.5, -2] },
    x3: { tex: "x^3", f: (x) => x * x * x, vista: [-3.5, 12, 3.5, -12] },
    min: { tex: "\\min\\{x+2,\\, 4-\\tfrac{x}{2}\\}", f: (x) => Math.min(x + 2, 4 - x / 2), vista: [-3.5, 4.6, 3.5, -1.6] },
    neg: { tex: "-x^2", f: (x) => -x * x, vista: [-3.5, 1.2, 3.5, -10] },
    w: { tex: "\\tfrac{1}{8}(x^2-4)^2", f: (x) => (x * x - 4) ** 2 / 8, vista: [-3.5, 3.8, 3.5, -0.8] },
  };
  const conti = (k, p, w, l) => {
    const f = CORDA[k].f, m = l * p + (1 - l) * w, fm = f(m), corda = l * f(p) + (1 - l) * f(w);
    const tol = 1e-9 * Math.max(1, Math.abs(fm), Math.abs(corda));
    return { m, fm, corda, ok: fm <= corda + tol, uguale: Math.abs(fm - corda) <= tol };
  };

  RICETTE.corda = {
    titolo: T("La definizione di funzione convessa", "The definition of convex function"),
    sottotitolo: T("il grafico sta sotto la corda?", "does the graph lie below the chord?"),
    funzioni: CORDA,
    iniziale: "x2",
    parametri: [
      { k: "p", nome: "p", colore: "a", min: -3, max: 3, step: 0.05, val: -2, descr: T("il primo punto; puoi anche trascinarlo sull'asse \\(x\\)", "the first point; you can also drag it along the \\(x\\) axis") },
      { k: "w", nome: "w", colore: "e", min: -3, max: 3, step: 0.05, val: 2.5, descr: T("il secondo punto", "the second point") },
      { k: "l", nome: "\\lambda", colore: "d", min: 0, max: 1, step: 0.01, val: 0.5, descr: T("il peso: \\(\\lambda p+(1-\\lambda)w\\) va da \\(w\\) (\\(\\lambda=0\\)) a \\(p\\) (\\(\\lambda=1\\)); premi ▶", "the weight: \\(\\lambda p+(1-\\lambda)w\\) moves from \\(w\\) (\\(\\lambda=0\\)) to \\(p\\) (\\(\\lambda=1\\)); press ▶") },
    ],
    vista: (k) => CORDA[k].vista,
    monta(board, st) {
      const R = this, chiave = st.chiave(), f = CORDA[chiave].f, C = COL();
      const asse = board.defaultAxes && board.defaultAxes.x;
      const p0 = st.p();
      board.create("functiongraph", [f], { strokeColor: C.blu, strokeWidth: 3.5, highlight: false, fixed: true });

      const crea = (x, nome, k) => {
        const c = st.colore(k);
        const attr = { name: nome, size: 5, fillColor: c, strokeColor: c, highlightFillColor: c, highlightStrokeColor: c, showInfobox: false, layer: 9,
          label: { offset: [6, 12], fontSize: 16, strokeColor: c, highlightStrokeColor: c, cssStyle: "font-weight:700;font-style:italic" } };
        return asse ? board.create("glider", [x, 0, asse], attr) : board.create("point", [x, 0], attr);
      };
      const P = crea(p0.p, "p", "p"), W = crea(p0.w, "w", "w");
      lega(board, st, R, P, (Q) => ({ p: Q.X() }));
      lega(board, st, R, W, (Q) => ({ w: Q.X() }));
      st.dati.P = P; st.dati.W = W;
      const K = () => conti(chiave, P.X(), W.X(), st.p().l);
      const esito = () => (K().ok ? C.verde : C.rosso);
      const fino = { strokeColor: C.nero, strokeWidth: 1, dash: 2, strokeOpacity: 0.55 };

      // tratteggi verticali da p, w e da x_lambda
      spezzata(board, () => [[P.X(), 0], [P.X(), f(P.X())], [NaN, NaN], [W.X(), 0], [W.X(), f(W.X())]], fino);
      spezzata(board, () => { const c = K(); return [[c.m, 0], [c.m, c.fm], [NaN, NaN], [c.m, 0], [c.m, c.corda]]; }, fino);
      // la corda (viola tratteggiata, come nelle dispense)
      spezzata(board, () => [[P.X(), f(P.X())], [W.X(), f(W.X())]], { strokeColor: C.viola, strokeWidth: 3, dash: 2 });
      // fra grafico e corda: verde se il grafico sta sotto, rosso se sta sopra
      spezzata(board, () => { const c = K(); return [[c.m, c.fm], [c.m, c.corda]]; }, { strokeColor: () => esito(), strokeWidth: 5, strokeOpacity: 0.5 });

      const punto = (x, y, colore, size) => board.create("point", [x, y], { name: "", fixed: true, size, fillColor: colore, strokeColor: colore, showInfobox: false, highlight: false, withLabel: false });
      punto(() => P.X(), () => f(P.X()), st.colore("p"), 3.5);
      punto(() => W.X(), () => f(W.X()), st.colore("w"), 3.5);
      punto(() => K().m, 0, C.nero, 3);
      punto(() => K().m, () => K().corda, C.viola, 4.5);
      punto(() => K().m, () => K().fm, () => esito(), 5);
      board.create("text", [() => K().m, 0, "x<sub>λ</sub>"], { fixed: true, highlight: false, fontSize: 14, strokeColor: C.nero, anchorX: "left", anchorY: "bottom", cssStyle: "padding:0 0 3px 5px;font-weight:700" });
    },
    aggiorna(board, st) { const p = st.p(); sposta(st.dati.P, p.p, 0); sposta(st.dati.W, p.w, 0); },
    formula(p, st) {
      const m = p.l * p.p + (1 - p.l) * p.w;
      const fra = (k, x) => (x < 0 ? `(${colore(st, k, num(x))})` : colore(st, k, num(x)));
      return `x_\\lambda = ${colore(st, "l", num(p.l))}\\cdot ${fra("p", p.p)} + ${colore(st, "l", num(1 - p.l))}\\cdot ${fra("w", p.w)} = ${num(m, 3)}`;
    },
    legenda: () => {
      const C = COL();
      return [
        [C.blu, "y = f(x)", ""],
        [C.viola, T("corda", "chord"), "dashed"],
        [C.verde, T("grafico sotto la corda", "graph below the chord"), "punto"],
        [C.rosso, T("grafico sopra la corda", "graph above the chord"), "punto"],
      ];
    },
    letture(p, st) {
      const c = conti(st.chiave(), p.p, p.w, p.l), C = COL();
      const cv = (s) => tinta(c.ok ? C.verde : C.rosso, s), cc = (s) => tinta(C.viola, s);
      let r = `\\(x_\\lambda = \\lambda p+(1-\\lambda)w = ${num(c.m, 3)}\\)<br>\\(f(x_\\lambda) = ${cv(num(c.fm, 3))}\\)<br>` +
        `\\(\\lambda\\,f(p)+(1-\\lambda)\\,f(w) = ${cc(num(c.corda, 3))}\\)<br>`;
      if (Math.abs(p.p - p.w) < 1e-9) r += T("Con \\(p = w\\) la corda è un punto: allontana \\(p\\) e \\(w\\).", "With \\(p = w\\) the chord is a single point: move \\(p\\) and \\(w\\) apart.");
      else if (c.uguale) r += `\\(${cv(num(c.fm, 3))} = ${cc(num(c.corda, 3))}\\): ${T("<strong>uguaglianza</strong>, il grafico tocca la corda; la disuguaglianza vale.", "<strong>equality</strong>, the graph touches the chord; the inequality holds.")}`;
      else if (c.ok) r += `\\(${cv(num(c.fm, 3))} \\le ${cc(num(c.corda, 3))}\\): ${T("la disuguaglianza della definizione <strong>vale</strong> per questi \\(p, w, \\lambda\\).", "the inequality of the definition <strong>holds</strong> for these \\(p, w, \\lambda\\).")}`;
      else r += `\\(${cv(num(c.fm, 3))} > ${cc(num(c.corda, 3))}\\): ${T("la disuguaglianza è <strong>violata</strong>, quindi \\(f\\) non è convessa.", "the inequality is <strong>violated</strong>, so \\(f\\) is not convex.")}`;
      return r;
    },
    domanda: T(
      "\\(f\\) è convessa se il punto resta verde per <em>tutti</em> i \\(p, w\\) e \\(\\lambda\\in[0,1]\\): un solo rosso basta a dire che non lo è. Con \\(x^3\\) trova \\(p\\), \\(w\\) e \\(\\lambda\\) che violano la disuguaglianza (dove il grafico «curva verso il basso»?). Che cosa noti con \\(\\min\\{x+2,4-\\tfrac{x}{2}\\}\\) e con \\(-x^2\\)? E con la funzione a W?",
      "\\(f\\) is convex if the point stays green for <em>all</em> \\(p, w\\) and \\(\\lambda\\in[0,1]\\): a single red is enough to say it is not. With \\(x^3\\) find \\(p\\), \\(w\\) and \\(\\lambda\\) that violate the inequality (where does the graph «bend downwards»?). What do you notice with \\(\\min\\{x+2,4-\\tfrac{x}{2}\\}\\) and with \\(-x^2\\)? And with the W-shaped function?"
    ),
  };

  /* ==================================================================
   * 3. La matrice Q di una funzione quadratica (cap. 4)
   * ================================================================== */
  const EPS = 1e-9;
  // autovalori (l1 >= l2) e autovettori unitari di Q = [[a, b], [b, c]]
  const spettro = (a, b, c) => {
    const tr = a + c, det = a * c - b * b, m = tr / 2;
    let l1, l2;
    if (Math.abs(det) < EPS) {
      if (Math.abs(tr) < EPS) { l1 = 0; l2 = 0; } else if (tr > 0) { l1 = tr; l2 = 0; } else { l1 = 0; l2 = tr; }
    } else {
      const r = Math.sqrt(Math.max(0, m * m - det));
      l1 = m + r; l2 = m - r;
    }
    let v;
    if (Math.abs(b) > EPS) { const n = Math.hypot(b, l1 - a); v = [b / n, (l1 - a) / n]; }
    else v = a >= c ? [1, 0] : [0, 1];
    return { l1, l2, det: Math.abs(det) < EPS ? 0 : det, tr, v1: v, v2: [-v[1], v[0]] };
  };
  const classifica = (s) => {
    const z = (x) => Math.abs(x) < EPS, l1 = s.l1, l2 = s.l2;   // l1 >= l2
    if (z(l1) && z(l2)) return { tipo: "nulla", conv: "entrambe" };
    if (l2 > EPS) return { tipo: "dp", conv: "convessa" };
    if (z(l2)) return { tipo: "sdp", conv: "convessa" };
    if (l1 < -EPS) return { tipo: "dn", conv: "concava" };
    if (z(l1)) return { tipo: "sdn", conv: "concava" };
    return { tipo: "ind", conv: "nessuna" };
  };
  const NOMI_TIPO = {
    dp: ["definita positiva", "positive definite"],
    sdp: ["semidefinita positiva (non definita)", "positive semidefinite (not definite)"],
    dn: ["definita negativa", "negative definite"],
    sdn: ["semidefinita negativa (non definita)", "negative semidefinite (not definite)"],
    ind: ["indefinita", "indefinite"],
    nulla: ["nulla (semidefinita positiva e negativa)", "zero (positive and negative semidefinite)"],
  };
  const NOMI_CONV = {
    convessa: ["\\(f\\) è <strong>convessa</strong>", "\\(f\\) is <strong>convex</strong>"],
    concava: ["\\(f\\) è <strong>concava</strong> (\\(-f\\) è convessa)", "\\(f\\) is <strong>concave</strong> (\\(-f\\) is convex)"],
    nessuna: ["\\(f\\) <strong>non è né convessa né concava</strong>", "\\(f\\) is <strong>neither convex nor concave</strong>"],
    entrambe: ["\\(f = 0\\) è <strong>sia convessa sia concava</strong>", "\\(f = 0\\) is <strong>both convex and concave</strong>"],
  };
  const NOMI_LIV = {
    ellisse: ["un'ellisse", "an ellipse"],
    punto: ["il solo punto \\(\\boldsymbol 0\\)", "the single point \\(\\boldsymbol 0\\)"],
    iperbole: ["un'iperbole", "a hyperbola"],
    incidenti: ["due rette che si incontrano nell'origine", "two lines crossing at the origin"],
    parallele: ["due rette parallele", "two parallel lines"],
    retta: ["una retta per l'origine", "a line through the origin"],
    vuoto: ["vuoto", "empty"],
    piano: ["tutto il piano", "the whole plane"],
  };
  const L = (coppia) => T(coppia[0], coppia[1]);
  // l'insieme di livello x'Qx = k: tipo e punti da disegnare. Nelle coordinate
  // y degli autovettori (x = y1 v1 + y2 v2) l'equazione è l1 y1^2 + l2 y2^2 = k.
  const LONTANO = 40;
  const livelloQ = (a, b, c, k) => {
    const s = spettro(a, b, c), { l1, l2, v1, v2 } = s, z = (x) => Math.abs(x) < EPS;
    const da = (y1, y2) => [y1 * v1[0] + y2 * v2[0], y1 * v1[1] + y2 * v2[1]];
    const retta = (y1, y2, d1, d2) => [da(y1 - LONTANO * d1, y2 - LONTANO * d2), da(y1 + LONTANO * d1, y2 + LONTANO * d2), [NaN, NaN]];
    const ellisse = (A, B) => { const P = []; for (let i = 0; i <= 180; i++) { const t = (2 * Math.PI * i) / 180; P.push(da(A * Math.cos(t), B * Math.sin(t))); } return P; };
    // iperbole con i rami lungo y1 (lungo = 1) o lungo y2 (lungo = 2)
    const iperbole = (A, B, lungo) => {
      const P = [], T0 = Math.asinh(LONTANO / Math.min(A, B));
      for (const sgn of [1, -1]) {
        for (let i = -150; i <= 150; i++) {
          const t = (T0 * i) / 150, ch = sgn * Math.cosh(t), sh = Math.sinh(t);
          P.push(lungo === 1 ? da(A * ch, B * sh) : da(A * sh, B * ch));
        }
        P.push([NaN, NaN]);
      }
      return P;
    };
    let tipo, punti = [], piano = false, origine = false;
    if (z(l1) && z(l2)) {                         // Q = 0
      if (z(k)) { tipo = "piano"; piano = true; } else tipo = "vuoto";
    } else if (l2 > EPS || l1 < -EPS) {           // definita
      if (z(k)) { tipo = "punto"; origine = true; }
      else if (k / l1 > 0) { tipo = "ellisse"; punti = ellisse(Math.sqrt(k / l1), Math.sqrt(k / l2)); }
      else tipo = "vuoto";
    } else if (l1 > EPS && l2 < -EPS) {           // indefinita
      if (z(k)) { const r = Math.sqrt(l1 / -l2); tipo = "incidenti"; punti = [...retta(0, 0, 1, r), ...retta(0, 0, 1, -r)]; }
      else if (k > 0) { tipo = "iperbole"; punti = iperbole(Math.sqrt(k / l1), Math.sqrt(k / -l2), 1); }
      else { tipo = "iperbole"; punti = iperbole(Math.sqrt(-k / l1), Math.sqrt(k / l2), 2); }
    } else {                                      // semidefinita non nulla
      const primo = z(l2), l = primo ? l1 : l2;   // l: l'autovalore non nullo
      if (z(k)) { tipo = "retta"; punti = primo ? retta(0, 0, 0, 1) : retta(0, 0, 1, 0); }
      else if (k / l > 0) {
        const r = Math.sqrt(k / l);
        tipo = "parallele";
        punti = primo ? [...retta(r, 0, 0, 1), ...retta(-r, 0, 0, 1)] : [...retta(0, r, 1, 0), ...retta(0, -r, 1, 0)];
      } else tipo = "vuoto";
    }
    return { s, tipo, punti, piano, origine };
  };

  RICETTE["matrice-q"] = {
    titolo: T("La matrice \\(\\boldsymbol Q\\)", "The matrix \\(\\boldsymbol Q\\)"),
    sottotitolo: T("insiemi di livello e convessità di \\(f(" + BV + ") = " + BV + "'\\boldsymbol Q\\," + BV + "\\)", "level sets and convexity of \\(f(" + BV + ") = " + BV + "'\\boldsymbol Q\\," + BV + "\\)"),
    parametri: [
      { k: "q11", nome: "q_{11}", colore: "a", min: -3, max: 3, step: 0.1, val: 2, descr: T("il coefficiente di \\(x_1^2\\)", "the coefficient of \\(x_1^2\\)") },
      { k: "q12", nome: "q_{12}", colore: "d", min: -3, max: 3, step: 0.1, val: -1, descr: T("fuori diagonale: il coefficiente di \\(x_1x_2\\) è \\(2q_{12}\\)", "off-diagonal: the coefficient of \\(x_1x_2\\) is \\(2q_{12}\\)") },
      { k: "q22", nome: "q_{22}", colore: "e", min: -3, max: 3, step: 0.1, val: 2, descr: T("il coefficiente di \\(x_2^2\\)", "the coefficient of \\(x_2^2\\)") },
      { k: "k", nome: "k", colore: "c", min: -8, max: 8, step: 0.1, val: 2, descr: T("il livello: si disegna \\(L(k) = \\{" + BV + " : f(" + BV + ") = k\\}\\)", "the level: the plot shows \\(L(k) = \\{" + BV + " : f(" + BV + ") = k\\}\\)") },
    ],
    vista: [-4, 3, 4, -3],
    stessaScala: true,
    monta(board, st) {
      const C = COL();
      const Lq = () => { const p = st.p(); return livelloQ(p.q11, p.q12, p.q22, p.k); };
      // direzioni degli autovettori (gli assi della conica)
      spezzata(board, () => {
        const { v1, v2 } = Lq().s, D = LONTANO;
        return [[-D * v1[0], -D * v1[1]], [D * v1[0], D * v1[1]], [NaN, NaN], [-D * v2[0], -D * v2[1]], [D * v2[0], D * v2[1]]];
      }, { strokeColor: C.grigio, strokeWidth: 1.3, dash: 3 });
      // tutto il piano (Q = 0, k = 0)
      board.create("polygon", [[-LONTANO, -LONTANO], [LONTANO, -LONTANO], [LONTANO, LONTANO], [-LONTANO, LONTANO]], {
        fillColor: C.blu, fillOpacity: 0.15, borders: { visible: false }, vertices: { visible: false, withLabel: false }, fixed: true, highlight: false,
        hasInnerPoints: false, visible: () => Lq().piano,
      });
      spezzata(board, () => Lq().punti, { strokeColor: C.blu, strokeWidth: 3.5 });
      board.create("point", [0, 0], { name: "", withLabel: false, fixed: true, size: 5, fillColor: C.blu, strokeColor: C.blu, showInfobox: false, highlight: false, visible: () => Lq().origine });
    },
    formula(p, st) {
      const termine = (x, k, pre) => `${x < 0 ? "-" : "+"} ${pre}${colore(st, k, num(Math.abs(x), 1))}`;
      return `f(${BV}) = ${colore(st, "q11", num(p.q11, 1))}\\,x_1^2 ${termine(p.q12, "q12", "2\\cdot ")}\\,x_1x_2 ${termine(p.q22, "q22", "")}\\,x_2^2 = ${colore(st, "k", num(p.k, 1))}`;
    },
    legenda: () => {
      const C = COL();
      return [
        [C.blu, T("insieme di livello \\(L(k)\\)", "level set \\(L(k)\\)"), ""],
        [C.grigio, T("direzioni degli autovettori", "eigenvector directions"), "dashed"],
      ];
    },
    letture(p, st) {
      const Lq = livelloQ(p.q11, p.q12, p.q22, p.k), s = Lq.s, cl = classifica(s), C = COL();
      const segno = (x) => (Math.abs(x) < EPS ? "= 0" : x > 0 ? "> 0" : "< 0");
      const q = (k) => colore(st, k, num(p[k], 1));
      let r = `\\(\\boldsymbol Q = \\begin{pmatrix} ${q("q11")} & ${q("q12")} \\\\ ${q("q12")} & ${q("q22")} \\end{pmatrix}\\)<br>` +
        `${T("autovalori", "eigenvalues")}: \\(\\lambda_1 = ${num(s.l1, 3)}, \\quad \\lambda_2 = ${num(s.l2, 3)}\\)<br>` +
        `\\(\\det \\boldsymbol Q = q_{11}\\,q_{22} - q_{12}^2 = ${num(s.det, 3)} ${segno(s.det)}\\)<br>` +
        `\\(\\boldsymbol Q\\) ${T("è", "is")} <strong>${L(NOMI_TIPO[cl.tipo])}</strong> &rArr; ${L(NOMI_CONV[cl.conv])}<br>` +
        `\\(${tinta(C.blu, `L(${num(p.k, 1)})`)}\\): ${L(NOMI_LIV[Lq.tipo])}`;
      if (cl.tipo === "sdp")
        r += `<br><strong style="color:${C.verde}">✓ ${T("Convessa ma non strettamente", "Convex but not strictly")}</strong>: ${T("lungo la direzione dell'autovettore di \\(\\lambda_2 = 0\\) la funzione è costante.", "along the direction of the eigenvector of \\(\\lambda_2 = 0\\) the function is constant.")}`;
      return r;
    },
    domanda: T(
      "Gli insiemi di livello sono ellissi quando \\(\\boldsymbol Q\\) è definita (\\(\\det \\boldsymbol Q > 0\\)) e iperboli quando è indefinita (\\(\\det \\boldsymbol Q < 0\\)). <strong>Rendi la funzione convessa ma non strettamente</strong>: scegli \\(q_{11}, q_{12}, q_{22}\\) in modo che \\(\\boldsymbol Q\\) sia semidefinita positiva ma non definita (per esempio \\(\\det \\boldsymbol Q = 0\\) con \\(q_{11}>0\\)). Che cosa diventano le ellissi? E con \\(k = 0\\)?",
      "The level sets are ellipses when \\(\\boldsymbol Q\\) is definite (\\(\\det \\boldsymbol Q > 0\\)) and hyperbolas when it is indefinite (\\(\\det \\boldsymbol Q < 0\\)). <strong>Make the function convex but not strictly convex</strong>: choose \\(q_{11}, q_{12}, q_{22}\\) so that \\(\\boldsymbol Q\\) is positive semidefinite but not definite (for instance \\(\\det \\boldsymbol Q = 0\\) with \\(q_{11}>0\\)). What do the ellipses become? And with \\(k = 0\\)?"
    ),
  };
})();
