/* =====================================================================
   APP — renderização das telas e eventos (somente consulta)
   Depende de: config.js, escala.js, dados.js, ui.js
   ===================================================================== */

(() => {
    'use strict';

    const { el, amostra } = UI;
    const G = Escala.GRUPOS;
    const $ = id => document.getElementById(id);

    const tela = { team: 'all', year: null, month: null, focusId: null };

    /* ---------- Consultas ---------- */
    const doFiltro = p => tela.team === 'all' || p.team === tela.team;
    const porNome = (a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR');
    const doGrupo = g => Dados.pessoas.filter(p => p.color === g && doFiltro(p)).sort(porNome);
    const pessoaEmFoco = () => Dados.pessoas.find(p => p.id === tela.focusId) || null;

    /* =================================================================
       RENDERIZAÇÃO
       ================================================================= */
    function renderTudo() {
        renderFiltros();
        renderHoje();
        renderAbasMes();
        renderCalendario();
    }

    function renderFiltros() {
        const times = Dados.times;
        if (tela.team !== 'all' && !times.includes(tela.team)) tela.team = 'all';

        const fTime = $('filterTeam');
        fTime.replaceChildren(el('option', { value: 'all', text: 'Todos os times' }), ...times.map(t => el('option', { value: t, text: t })));
        fTime.value = tela.team;

        const fAno = $('yearSelect');
        fAno.replaceChildren(...Escala.anosDisponiveis().map(y => el('option', { value: y, text: y })));
        fAno.value = tela.year;

        $('peopleNames').replaceChildren(...Dados.pessoas.filter(doFiltro).slice().sort(porNome).map(p => el('option', { value: p.name })));
        const foco = pessoaEmFoco();
        const busca = $('personSearch');
        if (document.activeElement !== busca) busca.value = foco ? foco.name : '';
        $('personSearchClear').hidden = !foco;

        $('pageTitle').textContent = tela.team === 'all' ? 'Quem está em home office' : 'Home office · ' + tela.team;
    }

    function renderHoje() {
        const card = $('todayCard');
        card.replaceChildren();

        const t = Escala.hoje();
        const ref = Escala.fimDeSemana(t) ? Escala.proximoDiaUtil(t) : t;
        const grupo = Escala.grupoDoDia(ref);
        const foco = pessoaEmFoco();

        card.className = 'card today-main ' + (grupo ? 'is-' + grupo : 'is-none');
        card.append(el('div', { class: 'today-head' }, [
            el('div', null, [
                el('p', { class: 'today-kicker', text: Escala.mesmoDia(ref, t) ? 'Hoje' : 'Próximo dia útil' }),
                el('p', { class: 'today-date', id: 'todayDate', text: Escala.dataExtenso(ref) })
            ]),
            grupo ? el('span', { class: 'group-pill' }, [amostra(grupo), 'Grupo ' + G[grupo] + ' em home office']) : null
        ]));

        if (!grupo) {
            card.append(el('p', { class: 'today-foot', text: 'A escala começa em ' + Escala.dataExtenso(Escala.INICIO).toLowerCase() + ' de ' + Escala.INICIO.getFullYear() + '.' }));
        } else {
            const emCasa = doGrupo(grupo);
            card.append(emCasa.length
                ? el('ul', { class: 'today-names' }, emCasa.map(p => el('li', { class: p.id === tela.focusId ? 'is-focus' : null, text: p.name })))
                : el('p', { class: 'today-foot', text: 'Ninguém do grupo ' + G[grupo] + ' neste filtro.' }));
            const outro = grupo === 'verde' ? 'amarelo' : 'verde';
            const fixos = doGrupo('branco').length;
            card.append(el('p', { class: 'today-foot', text: 'No escritório: grupo ' + G[outro] + ' (' + doGrupo(outro).length + ')' + (fixos ? ' e fixos (' + fixos + ')' : '') + '.' }));
        }

        if (foco) {
            const prox = Escala.proximoHomeOffice(foco.color, t);
            let texto;
            if (foco.color === 'branco') texto = ' é fixo(a) e não entra no rodízio.';
            else if (prox && Escala.mesmoDia(prox, t)) texto = ' está em home office hoje.';
            else if (prox) texto = ': próximo home office em ' + Escala.dataExtenso(prox).toLowerCase() + '.';
            else texto = ': sem data de home office prevista.';
            card.append(el('div', { class: 'focus-note' }, [el('strong', { text: foco.name }), texto]));
        }
    }

    function renderAbasMes() {
        const abas = $('monthTabs');
        const meses = [...new Set(Escala.semanasDoAno(tela.year).map(w => w.mes))];
        if (tela.month !== 'all' && !meses.includes(tela.month)) tela.month = meses[0];
        const t = Escala.hoje();

        const selecionar = m => () => { tela.month = m; renderAbasMes(); renderCalendario(); };
        abas.replaceChildren(
            ...meses.map(m => {
                const atual = tela.year === t.getFullYear() && m === t.getMonth();
                return el('button', {
                    type: 'button', role: 'tab', class: 'month-tab' + (atual ? ' is-now' : ''),
                    'aria-selected': String(tela.month === m), text: Escala.MESES[m].slice(0, 3),
                    title: Escala.MESES[m] + (atual ? ' (mês atual)' : ''), onclick: selecionar(m)
                });
            }),
            el('button', { type: 'button', role: 'tab', class: 'month-tab', 'aria-selected': String(tela.month === 'all'), text: 'Ano inteiro', onclick: selecionar('all') })
        );
        const sel = abas.querySelector('[aria-selected="true"]');
        if (sel) abas.scrollLeft = sel.offsetLeft - abas.clientWidth / 2 + sel.offsetWidth / 2;
    }

    function renderCalendario() {
        const area = $('calendar');
        area.replaceChildren();
        const semanas = Escala.semanasDoAno(tela.year);
        const t = Escala.hoje();
        const foco = pessoaEmFoco();
        const meses = tela.month === 'all' ? [...new Set(semanas.map(w => w.mes))] : [tela.month];

        $('calTitle').textContent = tela.month === 'all' ? 'Escala de ' + tela.year : Escala.MESES[tela.month] + ' de ' + tela.year;

        if (!Dados.pessoas.filter(doFiltro).some(p => p.color !== 'branco')) {
            area.append(el('div', { class: 'empty-state' }, [
                el('strong', { text: 'Nenhuma pessoa no rodízio' }),
                'Não há pessoas nos grupos Verde ou Amarelo neste filtro.'
            ]));
        }

        const porGrupo = { verde: doGrupo('verde'), amarelo: doGrupo('amarelo') };

        meses.forEach(m => {
            const doMes = semanas.filter(w => w.mes === m);
            const secao = el('section', { class: 'month' + (foco ? ' has-focus' : '') });
            if (tela.month === 'all') {
                secao.append(el('div', { class: 'month-title' }, [el('h3', { text: Escala.MESES[m] }), el('span', { text: doMes.length + ' semanas' })]));
            }
            const grade = el('div', { class: 'grid-scroll' });
            grade.append(el('div', { class: 'week head', role: 'row' },
                ['Período', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map(s => el('div', { role: 'columnheader', text: s }))));

            doMes.forEach(w => {
                const seg = w.dias[0], sex = w.dias[4];
                const dom = new Date(sex); dom.setDate(sex.getDate() + 2);
                const linha = el('div', { class: 'week' + (t >= seg && t <= dom ? ' is-current' : ''), role: 'row' });
                linha.append(el('div', { class: 'period', role: 'rowheader' }, [
                    el('strong', { text: w.numero + 'ª semana' }),
                    el('span', { text: Escala.diaMes(seg) + ' a ' + Escala.diaMes(sex) })
                ]));
                w.dias.forEach(d => linha.append(celulaDia(d, m, t, porGrupo)));
                grade.append(linha);
            });
            secao.append(grade);
            area.append(secao);
        });
    }

    function celulaDia(d, mes, t, porGrupo) {
        const g = Escala.grupoDoDia(d);
        const classes = ['day', g, d.getMonth() !== mes && 'out-month', Escala.mesmoDia(d, t) && 'is-today'].filter(Boolean);
        const lista = g ? porGrupo[g] : [];
        return el('div', { class: classes.join(' '), role: 'cell', 'aria-label': Escala.dataExtenso(d) + (g ? ', grupo ' + G[g] : '') }, [
            el('span', { class: 'day-num' }, [el('span', { class: 'day-wd', text: Escala.DIAS_CURTOS[d.getDay()] }), String(d.getDate())]),
            g ? el('span', { class: 'day-group', text: G[g] }) : null,
            lista.length
                ? el('ul', null, lista.map(p => el('li', { class: p.id === tela.focusId ? 'is-focus' : null, text: p.name })))
                : (g ? el('span', { class: 'empty', text: 'Ninguém neste filtro' }) : null)
        ]);
    }

    /* =================================================================
       EVENTOS
       ================================================================= */
    function aplicarBusca() {
        const v = $('personSearch').value.trim().toLowerCase();
        const achou = Dados.pessoas.filter(doFiltro).find(p => String(p.name).toLowerCase() === v);
        if (achou) tela.focusId = achou.id;
        else if (!v) tela.focusId = null;
        else return;
        renderFiltros(); renderHoje(); renderCalendario();
    }

    function ligarEventos() {
        $('filterTeam').addEventListener('change', e => { tela.team = e.target.value; renderTudo(); });
        $('yearSelect').addEventListener('change', e => {
            tela.year = parseInt(e.target.value, 10);
            const t = Escala.hoje();
            tela.month = tela.year === t.getFullYear() ? t.getMonth() : null;
            renderAbasMes(); renderCalendario();
        });

        const busca = $('personSearch');
        busca.addEventListener('change', aplicarBusca);
        busca.addEventListener('input', () => {
            const v = busca.value.trim().toLowerCase();
            if (!v || Dados.pessoas.some(p => String(p.name).toLowerCase() === v)) aplicarBusca();
        });
        $('personSearchClear').addEventListener('click', () => { busca.value = ''; aplicarBusca(); busca.focus(); });

        $('printBtn').addEventListener('click', () => window.print());
    }

    /* =================================================================
       INÍCIO
       ================================================================= */
    function iniciar() {
        const t = Escala.hoje();
        const anos = Escala.anosDisponiveis();
        tela.year = anos.includes(t.getFullYear()) ? t.getFullYear() : anos[0];
        if (tela.year === t.getFullYear()) tela.month = t.getMonth();

        const r = CONFIG.rodizio;
        $('pageLead').textContent = 'Rodízio de ' + (r.diasPorGrupo * 2) + ' dias úteis entre os grupos Verde e Amarelo, desde '
            + Escala.INICIO.getDate() + ' de ' + Escala.MESES[Escala.INICIO.getMonth()].toLowerCase() + ' de ' + Escala.INICIO.getFullYear() + '.';
        $('footerOrg').textContent = CONFIG.organizacao + ' · Escala de home office';

        ligarEventos();
        renderTudo();
    }

    iniciar();
})();
