/* Grafici interattivi del capitolo 1 «Insiemi convessi» (JSXGraph).
 *
 * Ricette registrate in window.GI_RICETTE per il motore interattivi.js
 * (il formato è documentato nel commento in testa al motore):
 *   combinazione     combinazione convessa (e affine) di tre punti, con sfida
 *   test-convessita  la definizione di insieme convesso messa alla prova
 *   palle-norma      la palla { x : ||x - c||_q <= r } al variare di q
 *
 * Gli oggetti liberi (punti trascinabili, insiemi, segmenti) si creano in
 * monta(board, st); le posizioni dei punti vivono in st.dati e sopravvivono
 * al ridisegno della board (cambio di insieme, di tema, «Azzera»).
 * Colori come nelle dispense: insieme rosso («ammissibile»), p e w neri,
 * combinazione convessa blu («ottimo»), punti fuori viola («locale»).
 */
(function () {
  "use strict";
  const GI = window.GI;
  const T = GI.T, num = GI.num;

  // ------------------------------------------------------------ utilità
  // coppia di coordinate: con la virgola decimale (IT) si separa con «;»
  const coppia = (x, y, c = 2) => `\\big(${num(x, c)}${GI.EN ? ",\\ " : ";\\ "}${num(y, c)}\\big)`;
  const segno = (v) => (v < 0 ? "-" : "+");

  const scuro = () => (document.body && document.body.getAttribute("data-md-color-scheme")) === "slate";
  // i colori del grafico: quelli semantici del motore più verde e «nero» (che si schiarisce nel tema scuro)
  const COL = (st) => ({
    rosso: st.colore("ammissibile"), blu: st.colore("ottimo"), viola: st.colore("locale"),
    grigio: st.colore("orig"), bersaglio: st.colore("target"),
    verde: scuro() ? "#69DB7C" : "#2F9E44", nero: scuro() ? "#E9ECEF" : "#212529",
  });
  const tinta = (st, nome, html) => `<strong style="color:${COL(st)[nome]}">${html}</strong>`;

  // punto trascinabile che tiene la sua posizione in st.dati[nome];
  // con «dentro» il punto non può uscire dall'insieme
  function puntoLibero(board, st, nome, etichetta, colore, dentro) {
    const D = st.dati;
    const P = board.create("point", D[nome].slice(), {
      name: etichetta, size: 5, fillColor: colore, strokeColor: colore, highlightFillColor: colore,
      highlightStrokeColor: colore, showInfobox: false,
      label: { offset: [8, 10], fontSize: 15, strokeColor: colore, highlightStrokeColor: colore },
    });
    P.on("drag", () => {
      let x = P.X(), y = P.Y();
      if (dentro && !dentro(x, y)) {
        // sul segmento dall'ultima posizione buona si cerca l'ultimo punto dentro
        const [x0, y0] = D[nome];
        let lo = 0, hi = 1;
        for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (dentro(x0 + m * (x - x0), y0 + m * (y - y0))) lo = m; else hi = m; }
        x = x0 + lo * (x - x0); y = y0 + lo * (y - y0);
        P.setPositionDirectly(JXG.COORDS_BY_USER, [x, y]);
      }
      D[nome] = [x, y];
    });
    return P;
  }

  // colori che dipendono dallo stato: JSXGraph non ricalcola sempre i colori
  // dati come funzione, quindi a ogni aggiornamento della board si rimettono
  // a mano (solo quando cambiano, così setAttribute non si richiama all'infinito)
  function coloreVivo(board, el, colore, campi = ["strokeColor"]) {
    const applica = () => {
      const c = colore();
      if (c === el._giColore) return;
      el._giColore = c;
      const a = {};
      for (const f of campi) { a[f] = c; a["highlight" + f[0].toUpperCase() + f.slice(1)] = c; }
      el.setAttribute(a);
      // dentro l'evento «update» la board non ridisegna: si passa dal renderer
      const rr = board.renderer, vp = el.visProp;
      rr.setObjectStrokeColor(el, c, val(vp.strokeopacity));
      if (campi.includes("fillColor")) rr.setObjectFillColor(el, c, val(vp.fillopacity));
      if (el.label && campi.includes("fillColor")) {
        el.label.setAttribute({ strokeColor: c, highlightStrokeColor: c });
        rr.setObjectStrokeColor(el.label, c, 1);
      }
    };
    applica();
    board.on("update", applica);
    return el;
  }
  const PIENO = ["strokeColor", "fillColor"];
  const val = (v) => (typeof v === "function" ? v() : v);

  const dentroPoligono = (P, x, y) => {
    let d = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [xi, yi] = P[i], [xj, yj] = P[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  const arco = (cx, cy, r, t0, t1, n = 120) => {
    const P = [];
    for (let i = 0; i <= n; i++) { const t = t0 + ((t1 - t0) * i) / n; P.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
    return P;
  };

  window.GI_RICETTE = window.GI_RICETTE || {};

  // ================================================================
  // 1. Combinazione convessa di tre punti
  // ================================================================
  const V0 = [[0.5, 0.8], [5.8, 1.4], [2.4, 4.6]];
  const pesi = (a, b) => [a, b, 1 - a - b];
  const combo = (D, a, b) => {
    const l = pesi(a, b);
    const x = l[0] * D.v1[0] + l[1] * D.v2[0] + l[2] * D.v3[0];
    const y = l[0] * D.v1[1] + l[1] * D.v2[1] + l[2] * D.v3[1];
    return { l, x, y, convessa: l.every((v) => v >= -1e-9) };
  };
  const distBersaglio = (p, b, st) => {
    const X = combo(st.dati, p.a, p.b), B = combo(st.dati, b.a, b.b);
    return Math.hypot(X.x - B.x, X.y - B.y);
  };

  window.GI_RICETTE["combinazione"] = {
    titolo: T("Combinazione convessa di tre punti", "Convex combination of three points"),
    sottotitolo: T("i pesi \\(\\lambda_k \\ge 0\\) con somma \\(1\\) riempiono il triangolo",
      "weights \\(\\lambda_k \\ge 0\\) summing to \\(1\\) fill the triangle"),
    parametri: [
      { k: "a", nome: "\\lambda_1", min: -0.5, max: 1.5, step: 0.01, val: 0.33,
        descr: T("peso di \\(\\boldsymbol p^{(1)}\\)", "weight of \\(\\boldsymbol p^{(1)}\\)") },
      { k: "b", nome: "\\lambda_2", min: -0.5, max: 1.5, step: 0.01, val: 0.5,
        descr: T("peso di \\(\\boldsymbol p^{(2)}\\)", "weight of \\(\\boldsymbol p^{(2)}\\)") },
      { k: "c", nome: "\\lambda_3", min: -0.5, max: 1.5, step: 0.01, val: 0.17,
        descr: T("peso di \\(\\boldsymbol p^{(3)}\\); muovendo un peso gli altri due si adattano in proporzione, così la somma resta \\(1\\)",
          "weight of \\(\\boldsymbol p^{(3)}\\); moving one weight rescales the other two, so the sum stays \\(1\\)") },
    ],
    vista: [-2.2, 6.2, 8.2, -1.6],
    stessaScala: true,
    legenda: [
      ["ammissibile", T("involucro convesso", "convex hull"), "pieno"],
      ["ottimo", T("combinazione convessa", "convex combination"), "punto"],
      ["locale", T("combinazione affine, non convessa", "affine, non-convex combination"), "punto"],
      ["orig", T("rette dei lati", "lines through the sides"), "dashed"],
      ["target", T("bersaglio", "target"), "punto"],
    ],
    monta(board, st) {
      const D = st.dati;
      if (!D.v1) Object.assign(D, { v1: V0[0].slice(), v2: V0[1].slice(), v3: V0[2].slice() });
      const C = COL(st);
      // le rette dei lati: oltre un lato il peso del vertice opposto è negativo
      GI.spezzata(board, () => {
        const P = [], L = 40;
        for (const [a, b] of [[D.v1, D.v2], [D.v2, D.v3], [D.v3, D.v1]]) {
          const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
          P.push([a[0] - (L * dx) / n, a[1] - (L * dy) / n], [b[0] + (L * dx) / n, b[1] + (L * dy) / n], [NaN, NaN]);
        }
        return P;
      }, { strokeColor: C.grigio, strokeWidth: 1, dash: 2, fixed: true });
      // l'involucro convesso: il triangolo rosso
      GI.spezzata(board, () => [D.v1, D.v2, D.v3, D.v1], {
        strokeColor: C.rosso, strokeWidth: 2, fillColor: C.rosso, fillOpacity: 0.16, fixed: true,
      });
      // il bersaglio della sfida
      const B = () => { const b = st.bersaglio(); return b ? combo(D, b.a, b.b) : { x: NaN, y: NaN }; };
      board.create("point", [() => B().x, () => B().y], {
        name: "", fixed: true, size: 9, face: "o", fillOpacity: 0.25, strokeWidth: 3, showInfobox: false, highlight: false,
        fillColor: C.bersaglio, strokeColor: C.bersaglio, visible: () => st.modo() === "sfida" && !!st.bersaglio(),
      });
      puntoLibero(board, st, "v1", "<b>p</b><sup>(1)</sup>", C.nero);
      puntoLibero(board, st, "v2", "<b>p</b><sup>(2)</sup>", C.nero);
      puntoLibero(board, st, "v3", "<b>p</b><sup>(3)</sup>", C.nero);
      const X = () => combo(D, st.p().a, st.p().b);
      coloreVivo(board, board.create("point", [() => X().x, () => X().y], {
        name: "", fixed: true, size: 6, showInfobox: false, highlight: false,
      }), () => (X().convessa ? C.blu : C.viola), PIENO);
    },
    // tre cursori: quando se ne muove uno, gli altri due si riscalano (in proporzione) perché la somma resti 1
    aggiorna(board, st) {
      const D = st.dati, K = ["a", "b", "c"];
      const inp = Object.fromEntries(K.map((k, i) => [k, st.el.querySelectorAll('input[type="range"]')[i]]));
      const v = Object.fromEntries(K.map((k) => [k, parseFloat(inp[k].value)]));
      const prec = D.pesiPrec;
      const mossi = prec ? K.filter((k) => Math.abs(v[k] - prec[k]) > 1e-9) : [];
      if (mossi.length === 1) {
        const k = mossi[0], altri = K.filter((j) => j !== k), resto = 1 - v[k];
        const S = prec[altri[0]] + prec[altri[1]];
        let o0 = Math.abs(S) > 1e-9 ? (prec[altri[0]] * resto) / S : resto / 2;
        o0 = Math.round(o0 * 100) / 100;
        const o1 = Math.round((resto - o0) * 100) / 100;
        if ([o0, o1].every((x) => x >= -0.5 - 1e-9 && x <= 1.5 + 1e-9)) {
          inp[altri[0]].value = o0; inp[altri[1]].value = o1;
          v[altri[0]] = o0; v[altri[1]] = o1;
        } else {
          K.forEach((j) => { inp[j].value = prec[j]; v[j] = prec[j]; });   // fuori dall'intervallo dei cursori: non si muove
        }
      } else if (Math.abs(v.a + v.b + v.c - 1) > 1e-6) {
        v.c = Math.round((1 - v.a - v.b) * 100) / 100; inp.c.value = v.c;
      }
      D.pesiPrec = { ...v };
      st.el.querySelectorAll(".gi-val").forEach((e, i) => { if (i < 3) e.textContent = GI.numTxt ? GI.numTxt(v[K[i]], 2) : String(v[K[i]]); });
    },
    formula(p, st) {
      const { l, x, y, convessa } = combo(st.dati, p.a, p.b);
      const C = COL(st);
      return `${l[0] < 0 ? "-" : ""}${st.col("a", num(Math.abs(l[0]), 2))}\\,\\boldsymbol p^{(1)} ` +
        `${segno(l[1])} ${st.col("b", num(Math.abs(l[1]), 2))}\\,\\boldsymbol p^{(2)} ` +
        `${segno(l[2])} ${st.col("c", num(Math.abs(l[2]), 2))}\\,\\boldsymbol p^{(3)} = ` +
        `\\color{${convessa ? C.blu : C.viola}}{${coppia(x, y)}}`;
    },
    letture(p, st) {
      const { l, convessa } = combo(st.dati, p.a, p.b);
      const neg = [0, 1, 2].filter((i) => l[i] < -1e-9).map((i) => `\\(\\lambda_${i + 1}\\)`);
      const zeri = [0, 1, 2].filter((i) => Math.abs(l[i]) < 1e-9);
      let r = `\\(${st.col("a", num(l[0], 2))} + ${st.col("b", num(l[1], 2))} + ${st.col("c", num(l[2], 2))} = 1\\)` +
        T(": la somma dei pesi resta sempre \\(1\\).<br>", ": the weights always add up to \\(1\\).<br>");
      if (convessa) {
        r += T(`Tutti i pesi sono \\(\\ge 0\\): è una ${tinta(st, "blu", "combinazione convessa")} e il punto sta nel triangolo, l'involucro convesso di \\(\\boldsymbol p^{(1)}, \\boldsymbol p^{(2)}, \\boldsymbol p^{(3)}\\).`,
          `All weights are \\(\\ge 0\\): it is a ${tinta(st, "blu", "convex combination")} and the point lies in the triangle, the convex hull of \\(\\boldsymbol p^{(1)}, \\boldsymbol p^{(2)}, \\boldsymbol p^{(3)}\\).`);
        if (zeri.length === 1) {
          const i = zeri[0], lato = [1, 2, 3].filter((j) => j !== i + 1);
          r += T(` Con \\(\\lambda_${i + 1} = 0\\) il punto è sul lato fra \\(\\boldsymbol p^{(${lato[0]})}\\) e \\(\\boldsymbol p^{(${lato[1]})}\\).`,
            ` With \\(\\lambda_${i + 1} = 0\\) the point is on the side between \\(\\boldsymbol p^{(${lato[0]})}\\) and \\(\\boldsymbol p^{(${lato[1]})}\\).`);
        } else if (zeri.length === 2) {
          r += T(" Due pesi sono nulli: il punto coincide con un vertice.", " Two weights are zero: the point is a vertex.");
        }
      } else {
        r += T(`${neg.join(" e ")} ${neg.length > 1 ? "sono negativi" : "è negativo"}: la somma è ancora \\(1\\), quindi è una combinazione <em>affine</em>, ma ${tinta(st, "viola", "non è una combinazione convessa")}. Il punto esce dal triangolo, oltre il lato opposto al vertice con peso negativo.`,
          `${neg.join(" and ")} ${neg.length > 1 ? "are" : "is"} negative: the sum is still \\(1\\), so it is an <em>affine</em> combination, but ${tinta(st, "viola", "not a convex combination")}. The point leaves the triangle, beyond the side opposite the vertex with negative weight.`);
      }
      return r;
    },
    domanda: T("Metti \\(\\lambda_1 = 1\\): dove finisce il punto? Poi metti \\(\\lambda_3 = 0\\) e muovi \\(\\lambda_1\\): su quale lato si muove il punto? Infine rendi negativo uno dei pesi: da quale lato esce il punto, e perché nessuna combinazione convessa può uscire dal triangolo? Trascina anche i vertici.",
      "Set \\(\\lambda_1 = 1\\): where does the point go? Then set \\(\\lambda_3 = 0\\) and move \\(\\lambda_1\\): along which side does the point move? Finally make one weight negative: across which side does the point leave, and why can no convex combination leave the triangle? Drag the vertices too."),
    sfida: {
      testo: T("Porta il punto sul <strong style=\"color:var(--gi-target)\">bersaglio</strong> muovendo i pesi \\(\\lambda_1, \\lambda_2, \\lambda_3\\): quali pesi servono?",
        "Bring the point onto the <strong style=\"color:var(--gi-target)\">target</strong> by moving the weights \\(\\lambda_1, \\lambda_2, \\lambda_3\\): which weights do you need?"),
      genera() {
        // pesi multipli di 0,05, tutti almeno 0,1: il bersaglio è dentro il triangolo
        let a, b;
        do { a = 0.1 + 0.05 * Math.floor(Math.random() * 15); b = 0.1 + 0.05 * Math.floor(Math.random() * 15); } while (1 - a - b < 0.1 - 1e-9);
        return { a: +a.toFixed(2), b: +b.toFixed(2) };
      },
      vicinanza: (p, b, st) => Math.max(0, 1 - distBersaglio(p, b, st) / 4),
      vinta: (p, b, st) => distBersaglio(p, b, st) < 0.12,
      aiuto(p, b) {
        const k = Math.abs(p.a - b.a) >= Math.abs(p.b - b.b) ? 1 : 2, d = k === 1 ? b.a - p.a : b.b - p.b;
        return d > 0
          ? T(`Il bersaglio è più vicino a \\(\\boldsymbol p^{(${k})}\\): aumenta \\(\\lambda_${k}\\).`, `The target is closer to \\(\\boldsymbol p^{(${k})}\\): increase \\(\\lambda_${k}\\).`)
          : T(`Il bersaglio è più lontano da \\(\\boldsymbol p^{(${k})}\\): diminuisci \\(\\lambda_${k}\\).`, `The target is farther from \\(\\boldsymbol p^{(${k})}\\): decrease \\(\\lambda_${k}\\).`);
      },
    },
  };

  // ================================================================
  // 2. Test della definizione di insieme convesso
  // ================================================================
  const poligono = (P, ext) => Object.assign({ bordo: () => P.concat([P[0]]), dentro: (x, y) => dentroPoligono(P, x, y) }, ext);
  const mezzaluna = (() => {
    // il disco di centro 0 e raggio R meno il disco di centro (d, 0) e raggio r
    const R = 2.5, d = 1.2, r = 2, xi = (R * R - r * r + d * d) / (2 * d), yi = Math.sqrt(R * R - xi * xi);
    const a = Math.atan2(yi, xi), b = Math.atan2(yi, xi - d);
    return {
      bordo: () => arco(0, 0, R, a, 2 * Math.PI - a).concat(arco(d, 0, r, -b, -(2 * Math.PI - b))),
      dentro: (x, y) => x * x + y * y <= R * R + 1e-9 && (x - d) * (x - d) + y * y > r * r,
    };
  })();
  const INSIEMI = {
    disco: { tex: T("\\text{disco}", "\\text{disk}"), convesso: true, p: [-1.2, 0.9], w: [1.3, -0.8],
      bordo: () => arco(0, 0, 2.3, 0, 2 * Math.PI), dentro: (x, y) => x * x + y * y <= 2.3 * 2.3 + 1e-9 },
    ellisse: { tex: T("\\text{ellisse}", "\\text{ellipse}"), convesso: true, p: [-2.2, 0.5], w: [1.8, -0.9],
      bordo: () => arco(0, 0, 1, 0, 2 * Math.PI).map(([x, y]) => [3.2 * x, 1.8 * y]),
      dentro: (x, y) => (x / 3.2) ** 2 + (y / 1.8) ** 2 <= 1 + 1e-9 },
    poligono: poligono([[-2.2, -1.6], [1.8, -2], [2.8, 0.4], [0.6, 2.3], [-2.4, 1.2]],
      { tex: T("\\text{poligono convesso}", "\\text{convex polygon}"), convesso: true, p: [-1.5, 0.8], w: [1.8, -1] }),
    elle: poligono([[-3, -2.5], [3, -2.5], [3, -0.8], [-1.2, -0.8], [-1.2, 2.5], [-3, 2.5]],
      { tex: T("\\text{insieme a L}", "\\text{L-shaped set}"), convesso: false, p: [-2.2, 1.8], w: [2.3, -1.7] }),
    mezzaluna: Object.assign(mezzaluna, { tex: T("\\text{mezzaluna}", "\\text{crescent}"), convesso: false, p: [0.9, 2.15], w: [0.9, -2.15] }),
  };
  const N_PASSI = 300;
  const puntoSeg = (D, l) => [l * D.p[0] + (1 - l) * D.w[0], l * D.p[1] + (1 - l) * D.w[1]];
  // i valori di lambda per cui lambda p + (1 - lambda) w esce dall'insieme
  const fuori = (I, D) => {
    const F = [];
    for (let i = 0; i <= N_PASSI; i++) if (!I.dentro(...puntoSeg(D, i / N_PASSI))) F.push(i / N_PASSI);
    return F;
  };
  // le posizioni di p e w si tengono per ciascun insieme
  const datiInsieme = (st) => {
    const k = st.chiave(), I = INSIEMI[k];
    st.dati[k] = st.dati[k] || { p: I.p.slice(), w: I.w.slice() };
    return st.dati[k];
  };

  window.GI_RICETTE["test-convessita"] = {
    titolo: T("La definizione di convessità alla prova", "Testing the definition of convexity"),
    sottotitolo: T("il segmento fra due punti dell'insieme resta nell'insieme?",
      "does the segment between two points of the set stay in the set?"),
    funzioni: INSIEMI,
    iniziale: "disco",
    etichettaFunzioni: T("Insieme \\(A\\)", "Set \\(A\\)"),
    parametri: [
      { k: "a", nome: "\\lambda", min: 0, max: 1, step: 0.01, val: 0.5,
        descr: T("il punto \\(\\lambda \\boldsymbol p + (1-\\lambda)\\boldsymbol w\\) va da \\(\\boldsymbol w\\) (\\(\\lambda=0\\)) a \\(\\boldsymbol p\\) (\\(\\lambda=1\\)): premi ▶ per farlo scorrere",
          "the point \\(\\lambda \\boldsymbol p + (1-\\lambda)\\boldsymbol w\\) moves from \\(\\boldsymbol w\\) (\\(\\lambda=0\\)) to \\(\\boldsymbol p\\) (\\(\\lambda=1\\)): press ▶ to slide it") },
    ],
    vista: [-4, 3, 4, -3],
    stessaScala: true,
    legenda: (st) => [
      ["ammissibile", T("l'insieme \\(A\\)", "the set \\(A\\)"), "pieno"],
      [COL(st).verde, T("segmento dentro \\(A\\)", "segment inside \\(A\\)"), ""],
      ["locale", T("tratto fuori da \\(A\\)", "part outside \\(A\\)"), ""],
      ["ottimo", "\\lambda \\boldsymbol p + (1-\\lambda)\\boldsymbol w", "punto"],
    ],
    monta(board, st) {
      const I = st.fn(), C = COL(st);
      // si legge st.dati a ogni uso: la voce scelta può cambiare
      const D = () => datiInsieme(st);
      st.dati.p = D().p; st.dati.w = D().w;
      board.create("curve", [I.bordo().map((q) => q[0]), I.bordo().map((q) => q[1])], {
        strokeColor: C.rosso, strokeWidth: 2, fillColor: C.rosso, fillOpacity: 0.16, highlight: false, fixed: true,
      });
      const ok = () => fuori(I, st.dati).length === 0;
      coloreVivo(board, GI.spezzata(board, () => [st.dati.p, st.dati.w], { strokeWidth: 3, fixed: true }), () => (ok() ? C.verde : C.rosso));
      // i tratti fuori dall'insieme, evidenziati
      GI.spezzata(board, () => {
        const P = [];
        for (let i = 0; i <= N_PASSI; i++) { const q = puntoSeg(st.dati, i / N_PASSI); P.push(I.dentro(...q) ? [NaN, NaN] : q); }
        return P;
      }, { strokeColor: C.viola, strokeWidth: 7, strokeOpacity: 0.85, fixed: true });
      puntoLibero(board, st, "p", "<b>p</b>", C.nero, I.dentro).on("drag", () => (D().p = st.dati.p));
      puntoLibero(board, st, "w", "<b>w</b>", C.nero, I.dentro).on("drag", () => (D().w = st.dati.w));
      const Z = () => puntoSeg(st.dati, st.p().a);
      const zin = () => I.dentro(...Z());
      coloreVivo(board, board.create("point", [() => Z()[0], () => Z()[1]], {
        name: "", fixed: true, size: 5, showInfobox: false, highlight: false,
      }), () => (zin() ? C.blu : C.viola), PIENO);
    },
    formula(p, st) {
      const I = st.fn(), D = datiInsieme(st), l = p.a, [x, y] = puntoSeg(D, l), dentro = I.dentro(x, y);
      return `${st.col("a", num(l, 2))}\\,\\boldsymbol p + ${st.col("a", num(1 - l, 2))}\\,\\boldsymbol w = ` +
        `\\color{${dentro ? COL(st).blu : COL(st).viola}}{${coppia(x, y)}} ${dentro ? "\\in" : "\\notin"} A`;
    },
    letture(p, st) {
      const I = st.fn(), D = datiInsieme(st), F = fuori(I, D);
      let r;
      if (!F.length) {
        r = T(`Per questi \\(\\boldsymbol p\\) e \\(\\boldsymbol w\\) ${tinta(st, "verde", "il segmento resta nell'insieme")}.`,
          `For these \\(\\boldsymbol p\\) and \\(\\boldsymbol w\\) ${tinta(st, "verde", "the segment stays in the set")}.`);
        r += I.convesso
          ? T(" Succede per <em>ogni</em> coppia di punti: l'insieme è convesso (ma una coppia sola non basta a dimostrarlo).",
            " It happens for <em>every</em> pair of points: the set is convex (but a single pair is not enough to prove it).")
          : T(" Attenzione: una coppia buona non basta. Cerca due punti per cui il segmento esce.",
            " Careful: one good pair is not enough. Look for two points whose segment leaves the set.");
      } else {
        const a = num(F[0], 2), b = num(F[F.length - 1], 2);
        r = T(`Per questi \\(\\boldsymbol p\\) e \\(\\boldsymbol w\\) ${tinta(st, "rosso", "il segmento esce dall'insieme")} (tratto ${tinta(st, "viola", "viola")}, per \\(\\lambda\\) fra circa \\(${a}\\) e \\(${b}\\)): <strong>l'insieme non è convesso</strong>. Basta una sola coppia così.`,
          `For these \\(\\boldsymbol p\\) and \\(\\boldsymbol w\\) ${tinta(st, "rosso", "the segment leaves the set")} (${tinta(st, "viola", "violet")} part, for \\(\\lambda\\) between about \\(${a}\\) and \\(${b}\\)): <strong>the set is not convex</strong>. A single such pair is enough.`);
      }
      const l = num(p.a, 2);
      r += "<br>" + (I.dentro(...puntoSeg(D, p.a))
        ? T(`Con \\(\\lambda = ${l}\\) il punto ${tinta(st, "blu", "sta nell'insieme")}.`, `With \\(\\lambda = ${l}\\) the point ${tinta(st, "blu", "is in the set")}.`)
        : T(`Con \\(\\lambda = ${l}\\) il punto ${tinta(st, "viola", "è fuori dall'insieme")}.`, `With \\(\\lambda = ${l}\\) the point ${tinta(st, "viola", "is outside the set")}.`));
      return r;
    },
    domanda: T("Con l'insieme a L e con la mezzaluna trova due punti \\(\\boldsymbol p, \\boldsymbol w\\) per cui il segmento esce. Riesci a farlo anche con il disco o con il poligono convesso? Perché per dire che un insieme <em>non</em> è convesso basta una coppia, mentre per dire che lo è bisogna ragionare su tutte le coppie?",
      "With the L-shaped set and the crescent, find two points \\(\\boldsymbol p, \\boldsymbol w\\) whose segment leaves the set. Can you do it with the disk or the convex polygon? Why does a single pair prove that a set is <em>not</em> convex, while proving that it is convex requires an argument for all pairs?"),
  };

  // ================================================================
  // 3. Palle in norma q
  // ================================================================
  const norma = (u, v, q) => (q === Infinity ? Math.max(Math.abs(u), Math.abs(v))
    : Math.pow(Math.pow(Math.abs(u), q) + Math.pow(Math.abs(v), q), 1 / q));
  const NORME = {
    q: { tex: "q", etichetta: T("\\(q\\) dal cursore", "\\(q\\) from the slider") },
    inf: { tex: "q = \\infty" },
  };
  const qDi = (st) => (st.chiave() === "inf" ? Infinity : st.p().a);
  // il bordo della palla: |x1|^q + |x2|^q = r^q in forma parametrica
  const palla = (c, r, q, n = 240) => {
    if (q === Infinity) return [[1, 1], [-1, 1], [-1, -1], [1, -1], [1, 1]].map(([x, y]) => [c[0] + r * x, c[1] + r * y]);
    const P = [];
    for (let i = 0; i <= n; i++) {
      const t = (2 * Math.PI * i) / n, ct = Math.cos(t), s = Math.sin(t);
      P.push([c[0] + r * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / q), c[1] + r * Math.sign(s) * Math.pow(Math.abs(s), 2 / q)]);
    }
    return P;
  };

  window.GI_RICETTE["palle-norma"] = {
    titolo: T("Palle in norma \\(q\\)", "Balls in the \\(q\\)-norm"),
    sottotitolo: T("\\(\\{\\boldsymbol x : \\|\\boldsymbol x - \\boldsymbol c\\|_q \\le r\\}\\): dal rombo al quadrato",
      "\\(\\{\\boldsymbol x : \\|\\boldsymbol x - \\boldsymbol c\\|_q \\le r\\}\\): from diamond to square"),
    funzioni: NORME,
    iniziale: "q",
    etichettaFunzioni: T("Norma", "Norm"),
    parametri: [
      { k: "a", nome: "q", min: 1, max: 10, step: 0.1, val: 2,
        descr: T("\\(q=1\\): rombo, \\(q=2\\): disco, \\(q\\) grande: quasi un quadrato (con «\\(q=\\infty\\)» il quadrato)",
          "\\(q=1\\): diamond, \\(q=2\\): disk, large \\(q\\): almost a square (with «\\(q=\\infty\\)» the square)") },
      { k: "b", nome: "r", min: 0.2, max: 2.5, step: 0.1, val: 1.5,
        descr: T("il raggio della palla", "the radius of the ball") },
    ],
    vista: [-4, 3, 4, -3],
    stessaScala: true,
    legenda: [
      ["ammissibile", "\\|\\boldsymbol x - \\boldsymbol c\\|_q \\le r", "pieno"],
      ["orig", T("palle con \\(q = 1, 2, \\infty\\)", "balls with \\(q = 1, 2, \\infty\\)"), "dashed"],
      ["ottimo", T("\\(\\boldsymbol x\\) dentro", "\\(\\boldsymbol x\\) inside"), "punto"],
      ["locale", T("\\(\\boldsymbol x\\) fuori", "\\(\\boldsymbol x\\) outside"), "punto"],
    ],
    monta(board, st) {
      const D = st.dati;
      if (!D.c) Object.assign(D, { c: [0, 0], x: [1.1, 0.6] });
      const C = COL(st), r = () => st.p().b;
      // riferimento: le palle in norma 1, 2 e infinito con lo stesso raggio
      for (const qq of [1, 2, Infinity]) GI.spezzata(board, () => palla(D.c, r(), qq), { strokeColor: C.grigio, strokeWidth: 1.2, dash: 2, fixed: true });
      GI.spezzata(board, () => palla(D.c, r(), qDi(st)), { strokeColor: C.rosso, strokeWidth: 2.5, fillColor: C.rosso, fillOpacity: 0.16, fixed: true });
      const dentro = () => norma(D.x[0] - D.c[0], D.x[1] - D.c[1], qDi(st)) <= r() + 1e-9;
      const colX = () => (dentro() ? C.blu : C.viola);
      coloreVivo(board, GI.spezzata(board, () => [D.c, D.x], { strokeWidth: 1.5, dash: 1, fixed: true }), colX);
      puntoLibero(board, st, "c", "<b>c</b>", C.nero).label.setAttribute({ offset: [-16, -14] });
      coloreVivo(board, puntoLibero(board, st, "x", "<b>x</b>", C.blu), colX, PIENO);
    },
    formula(p, st) {
      const D = st.dati, q = qDi(st), u = D.x[0] - D.c[0], v = D.x[1] - D.c[1], n = norma(u, v, q), C = COL(st);
      const ok = n <= p.b + 1e-9;
      const esito = `\\color{${ok ? C.blu : C.viola}}{${num(n, 2)}} ${ok ? "\\le" : ">"} ${st.col("b", num(p.b, 1))} = r`;
      if (q === Infinity) return `\\|\\boldsymbol x - \\boldsymbol c\\|_\\infty = \\max\\{|${num(u, 2)}|,\\ |${num(v, 2)}|\\} = ${esito}`;
      const qs = st.col("a", num(q, 1));
      return `\\|\\boldsymbol x - \\boldsymbol c\\|_{${qs}} = \\big(|${num(u, 2)}|^{${qs}} + |${num(v, 2)}|^{${qs}}\\big)^{1/${qs}} = ${esito}`;
    },
    letture(p, st) {
      const D = st.dati, q = qDi(st), u = D.x[0] - D.c[0], v = D.x[1] - D.c[1], n = norma(u, v, q);
      const qtex = q === Infinity ? "\\infty" : num(q, 1);
      let s = n <= p.b + 1e-9
        ? T(`\\(\\|\\boldsymbol x - \\boldsymbol c\\|_{${qtex}} \\le r\\): il punto \\(\\boldsymbol x\\) ${tinta(st, "blu", "sta nella palla")}.`,
          `\\(\\|\\boldsymbol x - \\boldsymbol c\\|_{${qtex}} \\le r\\): the point \\(\\boldsymbol x\\) ${tinta(st, "blu", "is in the ball")}.`)
        : T(`\\(\\|\\boldsymbol x - \\boldsymbol c\\|_{${qtex}} > r\\): il punto \\(\\boldsymbol x\\) ${tinta(st, "viola", "è fuori dalla palla")}.`,
          `\\(\\|\\boldsymbol x - \\boldsymbol c\\|_{${qtex}} > r\\): the point \\(\\boldsymbol x\\) ${tinta(st, "viola", "is outside the ball")}.`);
      s += "<br>" + T("Lo stesso vettore \\(\\boldsymbol x - \\boldsymbol c\\) nelle tre norme delle dispense: ",
        "The same vector \\(\\boldsymbol x - \\boldsymbol c\\) in the three norms of the notes: ") +
        `\\(\\|\\cdot\\|_1 = ${num(norma(u, v, 1), 2)}\\), \\(\\|\\cdot\\|_2 = ${num(norma(u, v, 2), 2)}\\), \\(\\|\\cdot\\|_\\infty = ${num(norma(u, v, Infinity), 2)}\\)` +
        T(" (sempre \\(\\|\\cdot\\|_\\infty \\le \\|\\cdot\\|_2 \\le \\|\\cdot\\|_1\\): per questo le tre palle tratteggiate stanno una dentro l'altra).",
          " (always \\(\\|\\cdot\\|_\\infty \\le \\|\\cdot\\|_2 \\le \\|\\cdot\\|_1\\): this is why the three dashed balls are nested).");
      return s;
    },
    domanda: T("Fai crescere \\(q\\) da \\(1\\) a \\(10\\): come cambia la forma della palla, e verso che cosa tende? Porta \\(\\boldsymbol x\\) vicino a un vertice del quadrato tratteggiato: per quali \\(q\\) sta nella palla? Per ogni \\(q \\ge 1\\) la palla è convessa: quale proprietà della norma lo garantisce?",
      "Increase \\(q\\) from \\(1\\) to \\(10\\): how does the shape of the ball change, and what does it tend to? Move \\(\\boldsymbol x\\) near a corner of the dashed square: for which \\(q\\) is it in the ball? For every \\(q \\ge 1\\) the ball is convex: which property of the norm guarantees it?"),
  };
})();
