/* =====================================================================
   APP — renderização das telas e eventos
   Depende de: config.js, escala.js, dados.js, ui.js
   ===================================================================== */

(() => {
    'use strict';

    const { el, amostra, botaoExcluir, aviso } = UI;
    const G = Escala.GRUPOS;
    const $ = id => document.getElementById(id);

    /* Estado da tela (lembrado no navegador; os nomes das chaves seguem a v4) */
    const tela = Object.assign({ team: 'all', year: null, month: null, focusId: null }, Dados.lerTela());
    const guardarTela = () => Dados.gravarTela(tela);

    let restauracaoPendente = null;

    /* ---------- Consultas ---------- */
    const doFiltro = p => tela.team === 'all' || p.team === tela.team;
    const porNome = (a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR');
    const doGrupo = g => Dados.pessoas.filter(p => p.color === g && doFiltro(p)).sort(porNome);
    const pessoaEmFoco = () => Dados.pessoas.find(p => p.id === tela.focusId) || null;

    function informarSalvo(resultado) {
        const status = $('saveStatus');
        if (resultado && resultado.salvo === false) {
            status.textContent = 'Não foi possível salvar no navegador';
            aviso('Não foi possível salvar no navegador. Baixe um backup agora para não perder as alterações.', 'error', 8000);
        } else {
            status.textContent = 'Salvo neste navegador às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    }

    /* =================================================================
       RENDERIZAÇÃO
       ================================================================= */
    function renderTudo() {
        renderFiltros();
        renderHoje();
        renderAbasMes();
        renderCalendario();
        renderGerenciar();
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

        const selecionar = m => () => { tela.month = m; guardarTela(); renderAbasMes(); renderCalendario(); };
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
                'Adicione pessoas aos grupos Verde ou Amarelo em Gerenciar equipe.'
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

    function renderGerenciar() {
        const times = Dados.times, pessoas = Dados.pessoas;

        // Select de time no formulário
        const sel = $('teamSelect');
        const atual = sel.value;
        sel.replaceChildren(el('option', { value: '', text: 'Escolha o time' }), ...times.map(t => el('option', { value: t, text: t })));
        if (times.includes(atual)) sel.value = atual;
        else if (tela.team !== 'all') sel.value = tela.team;
        else if (times.length === 1) sel.value = times[0];

        // Contagem por grupo
        $('peopleCounts').replaceChildren(
            el('span', null, [el('b', { text: pessoas.length }), ' pessoas']),
            ...['verde', 'amarelo', 'branco'].map(k => el('span', null, [amostra(k), G[k] + ' ', el('b', { text: pessoas.filter(p => p.color === k).length })]))
        );

        // Tabela de pessoas
        const q = $('peopleFilter').value.trim().toLowerCase();
        const linhas = pessoas
            .filter(p => !q || String(p.name).toLowerCase().includes(q) || String(p.team).toLowerCase().includes(q))
            .slice().sort((a, b) => String(a.team).localeCompare(String(b.team), 'pt-BR') || porNome(a, b));
        $('peopleTbody').replaceChildren(...(linhas.length ? linhas.map(p => el('tr', null, [
            el('td', { text: p.name }),
            el('td', { text: p.team }),
            el('td', null, [el('span', { class: 'tag' }, [amostra(p.color), G[p.color] || p.color])]),
            el('td', { class: 'act' }, [botaoExcluir('Excluir ' + p.name, () => excluirPessoa(p.id))])
        ])) : [el('tr', null, [el('td', { colspan: '4', text: q ? 'Nenhuma pessoa encontrada.' : 'Nenhuma pessoa cadastrada.' })])]));

        // Tabela de times
        $('teamsTbody').replaceChildren(...(times.length ? times.map(t => el('tr', null, [
            el('td', { text: t }),
            el('td', { text: pessoas.filter(p => p.team === t).length }),
            el('td', { class: 'act' }, [botaoExcluir('Excluir time ' + t, () => excluirTime(t))])
        ])) : [el('tr', null, [el('td', { colspan: '3', text: 'Nenhum time cadastrado.' })])]));

        // Desfazer restauração
        const anterior = Dados.copiaAnterior();
        $('undoBlock').hidden = !anterior;
        if (anterior) {
            const quando = anterior.savedAt ? new Date(anterior.savedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
            $('undoInfo').textContent = 'Cópia guardada ' + (quando ? 'em ' + quando + ' ' : '') + 'com ' + (anterior.people ? anterior.people.length : 0) + ' pessoa(s).';
        }
    }

    /* =================================================================
       AÇÕES
       ================================================================= */
    function adicionarTime(e) {
        e.preventDefault();
        const input = $('newTeamInput');
        const r = Dados.adicionarTime(input.value);
        if (r.erro) { aviso(r.erro, 'error'); input.focus(); return; }
        aviso('Time "' + input.value.trim() + '" adicionado.');
        input.value = '';
        informarSalvo(r); renderTudo();
    }

    async function excluirTime(nome) {
        const n = Dados.pessoas.filter(p => p.team === nome).length;
        const msg = 'Excluir o time "' + nome + '"?' + (n ? ' ' + n + (n === 1 ? ' pessoa ficará' : ' pessoas ficarão') + ' como "Sem Time".' : '');
        if (!(await UI.pedirSenha(msg))) return;
        const r = Dados.removerTime(nome);
        if (tela.team === nome) { tela.team = 'all'; guardarTela(); }
        informarSalvo(r); renderTudo();
        aviso('Time "' + nome + '" excluído.');
    }

    function adicionarPessoa(e) {
        e.preventDefault();
        const nome = $('personName');
        const grupo = $('colorSelect').value;
        const r = Dados.adicionarPessoa(nome.value, $('teamSelect').value, grupo);
        if (r.erro) { aviso(r.erro, 'error'); nome.focus(); return; }
        aviso(nome.value.trim() + ' adicionado(a) ao grupo ' + G[grupo] + '.');
        nome.value = '';
        nome.focus();
        informarSalvo(r); renderTudo();
    }

    async function excluirPessoa(id) {
        const p = Dados.pessoas.find(x => x.id === id);
        if (!p) return;
        if (!(await UI.pedirSenha('Excluir ' + p.name + ' (' + p.team + ')?'))) return;
        const r = Dados.removerPessoa(id);
        if (tela.focusId === id) { tela.focusId = null; guardarTela(); }
        informarSalvo(r); renderTudo();
        aviso(p.name + ' excluído(a).');
    }

    function baixarBackup() {
        aviso('Backup baixado: ' + Dados.baixarBackup());
    }

    function lerArquivoRestauracao(e) {
        const caixa = $('restoreSummary');
        const arquivo = e.target.files[0];
        restauracaoPendente = null;
        caixa.hidden = true;
        if (!arquivo) return;

        const leitor = new FileReader();
        leitor.onload = ev => {
            caixa.hidden = false;
            try {
                const v = Dados.validarBackup(JSON.parse(ev.target.result));
                restauracaoPendente = v;
                const n = k => v.people.filter(p => p.color === k).length;
                caixa.className = 'restore-summary';
                caixa.replaceChildren(
                    el('div', { text: 'Arquivo "' + arquivo.name + '": ' + v.teams.length + ' time(s) e ' + v.people.length + ' pessoa(s) — Verde ' + n('verde') + ', Amarelo ' + n('amarelo') + ', Fixo ' + n('branco') + '.' }),
                    v.ignorados ? el('div', { text: v.ignorados + ' registro(s) inválido(s) serão ignorados.' }) : '',
                    el('div', { text: 'Isso substitui os dados atuais (' + Dados.times.length + ' time(s), ' + Dados.pessoas.length + ' pessoa(s)).' }),
                    el('div', { class: 'actions' }, [
                        el('button', { type: 'button', class: 'btn btn-danger', text: 'Substituir dados', onclick: confirmarRestauracao }),
                        el('button', { type: 'button', class: 'btn btn-secondary', text: 'Cancelar', onclick: cancelarRestauracao })
                    ])
                );
            } catch (err) {
                caixa.className = 'restore-summary is-error';
                caixa.replaceChildren(el('div', { text: err instanceof SyntaxError ? 'Não foi possível ler o arquivo. Confira se é o .json baixado pelo sistema.' : err.message }));
            }
        };
        leitor.onerror = () => aviso('Não foi possível abrir o arquivo.', 'error');
        leitor.readAsText(arquivo);
    }

    function cancelarRestauracao() {
        restauracaoPendente = null;
        $('restoreSummary').hidden = true;
        $('restoreFile').value = '';
    }

    function confirmarRestauracao() {
        if (!restauracaoPendente) return;
        const r = Dados.restaurar(restauracaoPendente);
        if (!Dados.pessoas.some(p => p.id === tela.focusId)) tela.focusId = null;
        cancelarRestauracao();
        guardarTela(); informarSalvo(r); renderTudo();
        aviso('Backup restaurado: ' + Dados.pessoas.length + ' pessoa(s).');
    }

    function desfazerRestauracao() {
        const r = Dados.desfazerRestauracao();
        if (r.erro) { aviso(r.erro, 'error'); return; }
        informarSalvo(r); renderTudo();
        aviso('Dados anteriores recuperados.');
    }

    /* =================================================================
       EVENTOS
       ================================================================= */
    function abrirAba(painelId) {
        document.querySelectorAll('.drawer-tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.panel === painelId)));
        document.querySelectorAll('.drawer-body .panel').forEach(p => { p.hidden = p.id !== painelId; });
    }

    function aplicarBusca() {
        const busca = $('personSearch');
        const v = busca.value.trim().toLowerCase();
        const achou = Dados.pessoas.filter(doFiltro).find(p => String(p.name).toLowerCase() === v);
        if (achou) tela.focusId = achou.id;
        else if (!v) tela.focusId = null;
        else return;
        guardarTela(); renderFiltros(); renderHoje(); renderCalendario();
    }

    function ligarEventos() {
        $('filterTeam').addEventListener('change', e => { tela.team = e.target.value; guardarTela(); renderTudo(); });
        $('yearSelect').addEventListener('change', e => {
            tela.year = parseInt(e.target.value, 10);
            const t = Escala.hoje();
            tela.month = tela.year === t.getFullYear() ? t.getMonth() : null;
            guardarTela(); renderAbasMes(); renderCalendario();
        });

        const busca = $('personSearch');
        busca.addEventListener('change', aplicarBusca);
        busca.addEventListener('input', () => {
            const v = busca.value.trim().toLowerCase();
            if (!v || Dados.pessoas.some(p => String(p.name).toLowerCase() === v)) aplicarBusca();
        });
        $('personSearchClear').addEventListener('click', () => { busca.value = ''; aplicarBusca(); busca.focus(); });

        $('printBtn').addEventListener('click', () => window.print());
        $('openManage').addEventListener('click', () => { renderGerenciar(); $('manageDialog').showModal(); });
        $('closeManage').addEventListener('click', () => $('manageDialog').close());
        $('manageDialog').addEventListener('click', e => { if (e.target.id === 'manageDialog') e.target.close(); });
        document.querySelectorAll('.drawer-tabs [role=tab]').forEach(b => b.addEventListener('click', () => abrirAba(b.dataset.panel)));

        $('personForm').addEventListener('submit', adicionarPessoa);
        $('teamForm').addEventListener('submit', adicionarTime);
        $('peopleFilter').addEventListener('input', renderGerenciar);
        $('downloadBtn').addEventListener('click', baixarBackup);
        $('restoreFile').addEventListener('change', lerArquivoRestauracao);
        $('undoRestoreBtn').addEventListener('click', desfazerRestauracao);

        // Outra aba alterou os dados: atualiza esta também
        window.addEventListener('storage', e => { if (e.key === Dados.CHAVE_DADOS) { Dados.carregar(); renderTudo(); } });
    }

    /* =================================================================
       INÍCIO
       ================================================================= */
    function iniciar() {
        const avisos = Dados.carregar();

        const t = Escala.hoje();
        const anos = Escala.anosDisponiveis();
        if (!anos.includes(tela.year)) tela.year = anos.includes(t.getFullYear()) ? t.getFullYear() : anos[0];
        // Ao abrir no ano atual, mostra o mês corrente (mais útil para consulta)
        if (tela.year === t.getFullYear() && tela.month !== 'all') tela.month = t.getMonth();

        // Textos que vêm da configuração
        const r = CONFIG.rodizio;
        $('pageLead').textContent = 'Rodízio de ' + (r.diasPorGrupo * 2) + ' dias úteis entre os grupos Verde e Amarelo, desde '
            + Escala.INICIO.getDate() + ' de ' + Escala.MESES[Escala.INICIO.getMonth()].toLowerCase() + ' de ' + Escala.INICIO.getFullYear() + '.';
        $('footerOrg').textContent = CONFIG.organizacao + ' · Escala de home office';
        $('senhaInfo').textContent = CONFIG.senhaExclusao;

        ligarEventos();
        renderTudo();
        avisos.forEach(a => setTimeout(() => aviso(a.texto, a.tipo, 8000), 300));
    }

    iniciar();
})();
