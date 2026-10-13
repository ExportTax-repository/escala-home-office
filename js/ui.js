/* =====================================================================
   UI — utilitários de interface (criação de elementos, avisos, senha)
   Depende de: config.js
   ===================================================================== */

const UI = (() => {

    /* Cria um elemento. O texto entra sempre por textContent, então nomes com
       aspas ou apóstrofo não quebram a tela e não injetam HTML. */
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

    const ICONE_LIXEIRA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';

    function botaoExcluir(rotulo, onclick) {
        const b = el('button', { type: 'button', class: 'icon-btn', 'aria-label': rotulo, title: 'Excluir', onclick: onclick });
        b.innerHTML = ICONE_LIXEIRA;
        return b;
    }

    /* Aviso temporário. Com um painel aberto, aparece dentro dele (por cima do fundo escuro). */
    function aviso(texto, tipo, ms) {
        const t = el('div', { class: 'toast' + (tipo === 'error' ? ' error' : ''), role: tipo === 'error' ? 'alert' : 'status', text: texto });
        const dlg = document.querySelector('dialog[open]');
        let host = document.getElementById('toasts');
        if (dlg) {
            host = dlg.querySelector('.toasts');
            if (!host) { host = el('div', { class: 'toasts', 'aria-live': 'polite' }); dlg.append(host); }
        }
        host.append(t);
        setTimeout(() => t.remove(), ms || (tipo === 'error' ? 6000 : 3500));
    }

    /* Pede a senha num modal. Resolve true se correta, false se cancelado. */
    function pedirSenha(mensagem) {
        const dlg = document.getElementById('pwDialog');
        const form = document.getElementById('pwForm');
        const input = document.getElementById('pwInput');
        const erro = document.getElementById('pwErr');
        const cancelar = document.getElementById('pwCancel');
        document.getElementById('pwMsg').textContent = mensagem;
        input.value = '';
        erro.textContent = '';

        return new Promise(resolve => {
            function fim(resultado) {
                form.removeEventListener('submit', enviar);
                cancelar.removeEventListener('click', desistir);
                dlg.removeEventListener('cancel', desistir);
                if (dlg.open) dlg.close();
                resolve(resultado);
            }
            function enviar(e) {
                e.preventDefault();
                if (input.value === String(CONFIG.senhaExclusao)) fim(true);
                else { erro.textContent = 'Senha incorreta. Tente novamente.'; input.select(); }
            }
            function desistir(e) { if (e) e.preventDefault(); fim(false); }
            form.addEventListener('submit', enviar);
            cancelar.addEventListener('click', desistir);
            dlg.addEventListener('cancel', desistir);
            dlg.showModal();
            input.focus();
        });
    }

    return { el, amostra, botaoExcluir, aviso, pedirSenha };
})();
