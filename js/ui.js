/* =====================================================================
   UI — utilitários de interface
   ===================================================================== */

const UI = (() => {

    /* Cria um elemento. O texto entra sempre por textContent. */
    function el(tag, attrs, filhos) {
        const node = document.createElement(tag);
        if (attrs) {
            for (const k in attrs) {
                const v = attrs[k];
                if (v == null) continue;
                if (k === 'class') node.className = v;
                else if (k === 'text') node.textContent = v;
                else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
                else node.setAttribute(k, v);
            }
        }
        (filhos || []).forEach(c => { if (c != null && c !== false) node.append(c); });
        return node;
    }

    function amostra(grupo) {
        return el('span', { class: 'swatch ' + grupo, 'aria-hidden': 'true' });
    }

    return { el, amostra };
})();
