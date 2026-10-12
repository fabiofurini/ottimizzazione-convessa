---
title: "Esercizi · Funzioni di più variabili"
---

# Esercizi · Funzioni di più variabili

<div class="info-capitolo" markdown>

**Esercizi · Capitolo 2** · ogni soluzione si apre con un clic · [:material-book-open-variant: Capitolo 2: Funzioni di più variabili](../preliminari/02-funzioni-piu-variabili.md) · [:material-file-pdf-box: Eserciziario, volume 1 (PDF)](../pdf/esercizi-1-preliminari.pdf)

</div>

<a id="esercizio-2-1"></a>

!!! esercizio "Esercizio 2.1: Funzioni di più variabili (E1)"

    Consideriamo la seguente funzione a valori reali:

    $$
    f: \R^2 \rightarrow \R,~~ f: \begin{pmatrix} x_1 \\ x_2 \end{pmatrix} \mapsto x_1^3 + 2\,x_1 x_2^2 - 3\,x_2
    $$

    **Domande**

    1. Calcolare il valore della funzione nei punti $\begin{pmatrix} 1 \\ 1 \end{pmatrix}$ e $\begin{pmatrix} -1 \\ 2 \end{pmatrix}$.

    2. Calcolare il gradiente della funzione e valutarlo nei due punti.

    3. Calcolare la matrice Hessiana della funzione e valutarla nei due punti.

??? soluzione "Soluzione"

    1. Sostituendo le coordinate dei punti:

        \begin{align*}
        f\left(\begin{pmatrix} 1 \\ 1 \end{pmatrix}\right) &= 1^3 + 2 \cdot 1 \cdot 1^2 - 3 \cdot 1 = 1 + 2 - 3 = 0 \\[2ex]
        f\left(\begin{pmatrix} -1 \\ 2 \end{pmatrix}\right) &= (-1)^3 + 2 \cdot (-1) \cdot 2^2 - 3 \cdot 2 = -1 - 8 - 6 = -15
        \end{align*}

    2. Le derivate parziali sono $\frac{\partial f(\boldsymbol x)}{\partial x_1} = 3\,x_1^2 + 2\,x_2^2$ e $\frac{\partial f(\boldsymbol x)}{\partial x_2} = 4\,x_1 x_2 - 3$, quindi il gradiente è:

        $$
        \nabla f\left(\begin{pmatrix} x_1 \\ x_2 \end{pmatrix}\right) =
        \begin{pmatrix} 3\,x_1^2 + 2\,x_2^2 \\[1ex] 4\,x_1 x_2 - 3 \end{pmatrix}
        $$

        Nei due punti:

        $$
        \nabla f\left(\begin{pmatrix} 1 \\ 1 \end{pmatrix}\right) = \begin{pmatrix} 3 + 2 \\ 4 - 3 \end{pmatrix} = \begin{pmatrix} 5 \\ 1 \end{pmatrix},
        \qquad
        \nabla f\left(\begin{pmatrix} -1 \\ 2 \end{pmatrix}\right) = \begin{pmatrix} 3 + 8 \\ -8 - 3 \end{pmatrix} = \begin{pmatrix} 11 \\ -11 \end{pmatrix}
        $$

    3. Derivando ancora una volta le due derivate parziali:

        $$
        \nabla^2 f\left(\begin{pmatrix} x_1 \\ x_2 \end{pmatrix}\right) =
        \begin{pmatrix} 6\,x_1 & 4\,x_2 \\[1ex] 4\,x_2 & 4\,x_1 \end{pmatrix}
        $$

        che è una matrice simmetrica dipendente dal punto. Nei due punti:

        $$
        \nabla^2 f\left(\begin{pmatrix} 1 \\ 1 \end{pmatrix}\right) = \begin{pmatrix} 6 & 4 \\ 4 & 4 \end{pmatrix},
        \qquad
        \nabla^2 f\left(\begin{pmatrix} -1 \\ 2 \end{pmatrix}\right) = \begin{pmatrix} -6 & 8 \\ 8 & -4 \end{pmatrix}
        $$

<a id="esercizio-2-2"></a>

!!! esercizio "Esercizio 2.2: Funzioni di più variabili (E2)"

    Consideriamo la seguente funzione a valori reali:

    $$
    f: \R^2 \rightarrow \R,~~ f: \begin{pmatrix} x_1 \\ x_2 \end{pmatrix} \mapsto x_1^4 - 2\,x_1^2 x_2 + x_2^2
    $$

    **Domande**

    1. Mostrare che $f({\boldsymbol x}) = (x_1^2 - x_2)^2$.

    2. Calcolare il gradiente e la matrice Hessiana della funzione.

    3. Valutare il gradiente e la matrice Hessiana nei punti $\begin{pmatrix} 1 \\ 1 \end{pmatrix}$ e $\begin{pmatrix} 1 \\ 0 \end{pmatrix}$.

    4. Trovare tutti i punti in cui il gradiente è il vettore nullo, e il valore della funzione in questi punti.

??? soluzione "Soluzione"

    1. Sviluppando il quadrato:

        $$
        (x_1^2 - x_2)^2 = x_1^4 - 2\,x_1^2 x_2 + x_2^2 = f({\boldsymbol x})
        $$

    2. Le derivate parziali sono $\frac{\partial f(\boldsymbol x)}{\partial x_1} = 4\,x_1^3 - 4\,x_1 x_2$ e $\frac{\partial f(\boldsymbol x)}{\partial x_2} = -2\,x_1^2 + 2\,x_2$, quindi:

        $$
        \nabla f\left(\begin{pmatrix} x_1 \\ x_2 \end{pmatrix}\right) =
        \begin{pmatrix} 4\,x_1^3 - 4\,x_1 x_2 \\[1ex] -2\,x_1^2 + 2\,x_2 \end{pmatrix}
        =
        \begin{pmatrix} 4\,x_1\,(x_1^2 - x_2) \\[1ex] -2\,(x_1^2 - x_2) \end{pmatrix}
        $$

        e

        $$
        \nabla^2 f\left(\begin{pmatrix} x_1 \\ x_2 \end{pmatrix}\right) =
        \begin{pmatrix} 12\,x_1^2 - 4\,x_2 & -4\,x_1 \\[1ex] -4\,x_1 & 2 \end{pmatrix}
        $$

    3. Nel punto $\begin{pmatrix} 1 \\ 1 \end{pmatrix}$ abbiamo $x_1^2 - x_2 = 0$, e:

        $$
        \nabla f\left(\begin{pmatrix} 1 \\ 1 \end{pmatrix}\right) = \begin{pmatrix} 0 \\ 0 \end{pmatrix},
        \qquad
        \nabla^2 f\left(\begin{pmatrix} 1 \\ 1 \end{pmatrix}\right) = \begin{pmatrix} 12 - 4 & -4 \\ -4 & 2 \end{pmatrix} = \begin{pmatrix} 8 & -4 \\ -4 & 2 \end{pmatrix}
        $$

        Nel punto $\begin{pmatrix} 1 \\ 0 \end{pmatrix}$ abbiamo $x_1^2 - x_2 = 1$, e:

        $$
        \nabla f\left(\begin{pmatrix} 1 \\ 0 \end{pmatrix}\right) = \begin{pmatrix} 4 \cdot 1 \cdot 1 \\ -2 \cdot 1 \end{pmatrix} = \begin{pmatrix} 4 \\ -2 \end{pmatrix},
        \qquad
        \nabla^2 f\left(\begin{pmatrix} 1 \\ 0 \end{pmatrix}\right) = \begin{pmatrix} 12 & -4 \\ -4 & 2 \end{pmatrix}
        $$

    4. La seconda componente del gradiente è nulla se e solo se $x_2 = x_1^2$, e in questo caso è nulla anche la prima componente $4\,x_1\,(x_1^2 - x_2)$. Quindi, il gradiente è il vettore nullo in tutti i punti della parabola:

        $$
        \left\{~\begin{pmatrix} x_1 \\ x_2 \end{pmatrix} \in \R^2:~ x_2 = x_1^2 ~\right\}
        $$

        (per esempio $\begin{pmatrix} 0 \\ 0 \end{pmatrix}$, $\begin{pmatrix} 1 \\ 1 \end{pmatrix}$ e $\begin{pmatrix} -1 \\ 1 \end{pmatrix}$), che è un insieme infinito di punti. In tutti questi punti il valore della funzione è $f({\boldsymbol x}) = (x_1^2 - x_2)^2 = 0$: questa parabola è l'insieme di livello $L(0)$ della funzione.

<a id="esercizio-2-3"></a>

!!! esercizio "Esercizio 2.3: Funzioni di più variabili (E3)"

    Consideriamo la seguente funzione a valori reali di tre variabili:

    $$
    f: \R^3 \rightarrow \R,~~ f: \begin{pmatrix} x_1 \\ x_2 \\ x_3 \end{pmatrix} \mapsto x_1^2 x_3 + x_2 x_3^2 - 2\,x_1 x_2 + x_3
    $$

    **Domande**

    1. Calcolare il valore della funzione nei punti $\begin{pmatrix} 1 \\ 0 \\ 2 \end{pmatrix}$ e $\begin{pmatrix} 0 \\ 1 \\ -1 \end{pmatrix}$.

    2. Calcolare il gradiente della funzione e valutarlo nei due punti.

    3. Calcolare la matrice Hessiana della funzione e valutarla nei due punti.

??? soluzione "Soluzione"

    1. Sostituendo le coordinate dei punti:

        \begin{align*}
        f\left(\begin{pmatrix} 1 \\ 0 \\ 2 \end{pmatrix}\right) &= 1^2 \cdot 2 + 0 \cdot 2^2 - 2 \cdot 1 \cdot 0 + 2 = 2 + 0 - 0 + 2 = 4 \\[2ex]
        f\left(\begin{pmatrix} 0 \\ 1 \\ -1 \end{pmatrix}\right) &= 0^2 \cdot (-1) + 1 \cdot (-1)^2 - 2 \cdot 0 \cdot 1 + (-1) = 0 + 1 - 0 - 1 = 0
        \end{align*}

    2. Le tre derivate parziali sono:

        $$
        \frac{\partial f(\boldsymbol x)}{\partial x_1} = 2\,x_1 x_3 - 2\,x_2, \qquad
        \frac{\partial f(\boldsymbol x)}{\partial x_2} = x_3^2 - 2\,x_1, \qquad
        \frac{\partial f(\boldsymbol x)}{\partial x_3} = x_1^2 + 2\,x_2 x_3 + 1
        $$

        quindi il gradiente è:

        $$
        \nabla f\left(\begin{pmatrix} x_1 \\ x_2 \\ x_3 \end{pmatrix}\right) =
        \begin{pmatrix} 2\,x_1 x_3 - 2\,x_2 \\[1ex] x_3^2 - 2\,x_1 \\[1ex] x_1^2 + 2\,x_2 x_3 + 1 \end{pmatrix}
        $$

        Nei due punti:

        $$
        \nabla f\left(\begin{pmatrix} 1 \\ 0 \\ 2 \end{pmatrix}\right) = \begin{pmatrix} 4 - 0 \\ 4 - 2 \\ 1 + 0 + 1 \end{pmatrix} = \begin{pmatrix} 4 \\ 2 \\ 2 \end{pmatrix},
        \qquad
        \nabla f\left(\begin{pmatrix} 0 \\ 1 \\ -1 \end{pmatrix}\right) = \begin{pmatrix} 0 - 2 \\ 1 - 0 \\ 0 - 2 + 1 \end{pmatrix} = \begin{pmatrix} -2 \\ 1 \\ -1 \end{pmatrix}
        $$

    3. Derivando ciascuna derivata parziale rispetto a $x_1$, $x_2$ e $x_3$:

        $$
        \nabla^2 f\left(\begin{pmatrix} x_1 \\ x_2 \\ x_3 \end{pmatrix}\right) =
        \begin{pmatrix} 2\,x_3 & -2 & 2\,x_1 \\[1ex] -2 & 0 & 2\,x_3 \\[1ex] 2\,x_1 & 2\,x_3 & 2\,x_2 \end{pmatrix}
        $$

        che è una matrice simmetrica dipendente dal punto. Nei due punti:

        $$
        \nabla^2 f\left(\begin{pmatrix} 1 \\ 0 \\ 2 \end{pmatrix}\right) = \begin{pmatrix} 4 & -2 & 2 \\ -2 & 0 & 4 \\ 2 & 4 & 0 \end{pmatrix},
        \qquad
        \nabla^2 f\left(\begin{pmatrix} 0 \\ 1 \\ -1 \end{pmatrix}\right) = \begin{pmatrix} -2 & -2 & 0 \\ -2 & 0 & -2 \\ 0 & -2 & 2 \end{pmatrix}
        $$

<a id="esercizio-2-4"></a>

!!! esercizio "Esercizio 2.4: Funzioni di più variabili (E4)"

    Consideriamo la seguente funzione a valori reali:

    $$
    f: \R^2 \rightarrow \R,~~ f: \begin{pmatrix} x_1 \\ x_2 \end{pmatrix} \mapsto x_2 - x_1^2
    $$

    **Domande**

    1. Calcolare il gradiente e la matrice Hessiana della funzione.

    2. Descrivere gli insiemi di livello $L(k)$ della funzione per ogni $k \in \R$.

    3. Valutare il gradiente nel punto $\begin{pmatrix} 1 \\ 1 \end{pmatrix}$ dell'insieme di livello $L(0)$ e nel punto $\begin{pmatrix} 0 \\ 2 \end{pmatrix}$ dell'insieme di livello $L(2)$.

    4. Disegnare gli insiemi di livello $L(0)$ e $L(2)$ e i due gradienti della domanda precedente, e verificare che ciascun gradiente è perpendicolare all'insieme di livello passante per il suo punto.

??? soluzione "Soluzione"

    1. Le derivate parziali sono $\frac{\partial f(\boldsymbol x)}{\partial x_1} = -2\,x_1$ e $\frac{\partial f(\boldsymbol x)}{\partial x_2} = 1$, quindi:

        $$
        \nabla f\left(\begin{pmatrix} x_1 \\ x_2 \end{pmatrix}\right) =
        \begin{pmatrix} -2\,x_1 \\[1ex] 1 \end{pmatrix},
        \qquad
        \nabla^2 f\left(\begin{pmatrix} x_1 \\ x_2 \end{pmatrix}\right) =
        \begin{pmatrix} -2 & 0 \\[1ex] 0 & 0 \end{pmatrix}
        $$

        La matrice Hessiana è costante. La seconda componente del gradiente vale sempre $1$, quindi il gradiente non è mai il vettore nullo.

    2. Per ogni $k \in \R$:

        $$
        L(k) = \left\{~\begin{pmatrix} x_1 \\ x_2 \end{pmatrix} \in \R^2:~ x_2 - x_1^2 = k ~\right\}
        = \left\{~\begin{pmatrix} x_1 \\ x_2 \end{pmatrix} \in \R^2:~ x_2 = x_1^2 + k ~\right\}
        $$

        Ogni insieme di livello è una parabola di vertice $\begin{pmatrix} 0 \\ k \end{pmatrix}$, ottenuta traslando la parabola $x_2 = x_1^2$ verticalmente di $k$.

    3. Il punto $\begin{pmatrix} 1 \\ 1 \end{pmatrix}$ appartiene a $L(0)$ poiché $1 - 1^2 = 0$, e il punto $\begin{pmatrix} 0 \\ 2 \end{pmatrix}$ appartiene a $L(2)$ poiché $2 - 0^2 = 2$. I gradienti sono:

        $$
        \nabla f\left(\begin{pmatrix} 1 \\ 1 \end{pmatrix}\right) = \begin{pmatrix} -2 \\ 1 \end{pmatrix},
        \qquad
        \nabla f\left(\begin{pmatrix} 0 \\ 2 \end{pmatrix}\right) = \begin{pmatrix} 0 \\ 1 \end{pmatrix}
        $$

    4. Disegniamo i due insiemi di livello con i gradienti, e poi verifichiamo la perpendicolarità con le direzioni tangenti.

        <strong>Soluzione grafica:</strong> la figura mostra gli insiemi di livello $L(0)$ (in blu) e $L(2)$ (in arancione) e i due gradienti (in rosso), tracciati a partire dai loro punti:

        ![Figura 1](../img/es-02-funzioni-piu-variabili/fig01.svg){ .fig .ovale loading=lazy style="width:50%" }

        La direzione tangente a un insieme di livello $x_2 = x_1^2 + k$ in un punto di prima coordinata $x_1$ è $\begin{pmatrix} 1 \\ 2\,x_1 \end{pmatrix}$ (la derivata di $x_1^2 + k$ è $2\,x_1$):

        - in $\begin{pmatrix} 1 \\ 1 \end{pmatrix}$ la direzione tangente è $\begin{pmatrix} 1 \\ 2 \end{pmatrix}$ e $\begin{pmatrix} -2 & 1 \end{pmatrix} \begin{pmatrix} 1 \\ 2 \end{pmatrix} = -2 + 2 = 0$;

        - in $\begin{pmatrix} 0 \\ 2 \end{pmatrix}$ la direzione tangente è $\begin{pmatrix} 1 \\ 0 \end{pmatrix}$ e $\begin{pmatrix} 0 & 1 \end{pmatrix} \begin{pmatrix} 1 \\ 0 \end{pmatrix} = 0$.

        Quindi, entrambi i gradienti sono perpendicolari all'insieme di livello passante per il loro punto, e puntano verso gli insiemi di livello con valori di $k$ più grandi.
