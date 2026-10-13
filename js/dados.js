/* =====================================================================
   DADOS — armazenamento no navegador (localStorage), backup e cadastro
   Depende de: config.js, escala.js

   Chaves no localStorage:
     escalaData_v2           { teams: string[], people: [{id, name, team, color}] }
                             Formato original, mantido para compatibilidade com
                             os backups e com os dados já salvos.
     escalaData_v2_anterior  cópia dos dados feita antes de restaurar um backup
     escalaConfig_versao     última "versao" do config.js já aplicada
     escalaUI_v1             preferências de tela (pode ser apagada sem perda)
   ===================================================================== */

const Dados = (() => {

    const CHAVE_DADOS = 'escalaData_v2';
    const CHAVE_ANTERIOR = 'escalaData_v2_anterior';
    const CHAVE_VERSAO = 'escalaConfig_versao';
    const CHAVE_TELA = 'escalaUI_v1';

    let times = [];
    let pessoas = [];

    /* ---------- localStorage com proteção contra falhas ---------- */
    function ler(chave) {
        try { return localStorage.getItem(chave); } catch (e) { return null; }
    }
    function gravar(chave, valor) {
        try { localStorage.setItem(chave, valor); return true; } catch (e) { return false; }
    }

    function salvar() {
        return gravar(CHAVE_DADOS, JSON.stringify({ teams: times, people: pessoas }));
    }

    /* ---------- Conversão do config.js para o formato interno ---------- */
    function grupoInterno(grupo) {
        const g = String(grupo || '').toLowerCase();
        return g === 'fixo' ? 'branco' : g;
    }
    function novoId() {
        let id = Date.now();
        while (pessoas.some(p => p.id === id)) id++;
        return id;
    }
    function chavePessoa(nome, time) {
        return String(nome).trim().toLowerCase() + '|' + String(time).trim().toLowerCase();
    }

    /* Acrescenta ao navegador os times e pessoas do config.js que ainda não existem.
       Nunca apaga nem altera quem já está cadastrado. */
    function aplicarConfig() {
        let novosTimes = 0, novasPessoas = 0;
        CONFIG.times.forEach(t => {
            const nome = String(t).trim();
            if (nome && !times.some(x => x.toLowerCase() === nome.toLowerCase())) {
                times.push(nome);
                novosTimes++;
            }
        });
        const existentes = new Set(pessoas.map(p => chavePessoa(p.name, p.team)));
        CONFIG.pessoas.forEach(p => {
            const color = grupoInterno(p.grupo);
            if (!p.nome || !p.time || !Escala.GRUPOS[color]) {
                console.warn('config.js: pessoa ignorada (confira nome, time e grupo):', p);
                return;
            }
            const k = chavePessoa(p.nome, p.time);
            if (existentes.has(k)) return;
            pessoas.push({ id: novoId(), name: String(p.nome).trim(), team: String(p.time).trim(), color: color });
            existentes.add(k);
            novasPessoas++;
        });
        gravar(CHAVE_VERSAO, String(CONFIG.versao));
        return { novosTimes, novasPessoas };
    }

    /* ---------- Carregamento inicial ----------
       Retorna avisos para a tela mostrar. */
    function carregar() {
        const avisos = [];
        const raw = ler(CHAVE_DADOS);
        let temDados = false;

        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                times = Array.isArray(parsed.teams) ? parsed.teams : [];
                pessoas = Array.isArray(parsed.people) ? parsed.people : [];
                temDados = true;
            } catch (e) {
                gravar(CHAVE_DADOS + '_danificado', raw);
                avisos.push({ tipo: 'error', texto: 'Os dados salvos estavam danificados. Uma cópia foi guardada. Restaure um backup em Gerenciar equipe › Backup.' });
            }
        }

        const versaoAplicada = parseInt(ler(CHAVE_VERSAO) || '0', 10);
        if (!temDados) {
            times = []; pessoas = [];
            aplicarConfig();
            salvar();
        } else if (CONFIG.versao > versaoAplicada) {
            const r = aplicarConfig();
            salvar();
            if (r.novosTimes || r.novasPessoas) {
                avisos.push({ tipo: 'ok', texto: 'Configuração atualizada: ' + r.novasPessoas + ' pessoa(s) e ' + r.novosTimes + ' time(s) adicionados.' });
            }
        }
        return avisos;
    }

    /* ---------- Cadastro ---------- */
    function adicionarTime(nome) {
        nome = String(nome || '').trim();
        if (!nome) return { erro: 'Digite o nome do time.' };
        if (times.some(t => t.toLowerCase() === nome.toLowerCase())) return { erro: 'O time "' + nome + '" já existe.' };
        times.push(nome);
        return { ok: true, salvo: salvar() };
    }

    function removerTime(nome) {
        times = times.filter(t => t !== nome);
        pessoas = pessoas.map(p => p.team === nome ? { ...p, team: 'Sem Time' } : p);
        return { ok: true, salvo: salvar() };
    }

    function adicionarPessoa(nome, time, color) {
        nome = String(nome || '').trim();
        if (!nome) return { erro: 'Digite o nome da pessoa.' };
        if (!time) return { erro: 'Escolha o time da pessoa.' };
        if (!Escala.GRUPOS[color]) return { erro: 'Escolha o grupo da pessoa.' };
        if (pessoas.some(p => chavePessoa(p.name, p.team) === chavePessoa(nome, time))) {
            return { erro: nome + ' já está cadastrado(a) em ' + time + '.' };
        }
        pessoas.push({ id: novoId(), name: nome, team: time, color: color });
        return { ok: true, salvo: salvar() };
    }

    function removerPessoa(id) {
        pessoas = pessoas.filter(p => p.id !== id);
        return { ok: true, salvo: salvar() };
    }

    /* ---------- Backup ---------- */
    function nomeArquivoBackup() {
        return 'backup_escala_' + new Date().toISOString().slice(0, 10) + '.json';
    }

    function baixarBackup() {
        const blob = new Blob([JSON.stringify({ teams: times, people: pessoas })], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivoBackup();
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return a.download;
    }

    /* Confere um backup e devolve os dados normalizados (campos extras são mantidos). */
    function validarBackup(parsed) {
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.teams) || !Array.isArray(parsed.people)) {
            throw new Error('O arquivo não é um backup da escala (faltam as listas de times e pessoas).');
        }
        const t = [];
        parsed.teams.forEach(x => {
            if (typeof x === 'string' && x.trim() && !t.includes(x.trim())) t.push(x.trim());
        });
        const p = [];
        const ids = new Set();
        let ignorados = 0;
        parsed.people.forEach(x => {
            if (!x || typeof x.name !== 'string' || !x.name.trim() || !Escala.GRUPOS[x.color]) { ignorados++; return; }
            const copia = { ...x, name: x.name.trim(), team: typeof x.team === 'string' && x.team ? x.team : 'Sem Time' };
            if (typeof copia.id !== 'number' || ids.has(copia.id)) {
                let id = Date.now() + p.length;
                while (ids.has(id)) id++;
                copia.id = id;
            }
            ids.add(copia.id);
            p.push(copia);
        });
        return { teams: t, people: p, ignorados: ignorados };
    }

    function guardarCopiaAtual() {
        gravar(CHAVE_ANTERIOR, JSON.stringify({ savedAt: new Date().toISOString(), teams: times, people: pessoas }));
    }

    function restaurar(validado) {
        guardarCopiaAtual();
        times = validado.teams;
        pessoas = validado.people;
        return { ok: true, salvo: salvar() };
    }

    function copiaAnterior() {
        const raw = ler(CHAVE_ANTERIOR);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function desfazerRestauracao() {
        const anterior = copiaAnterior();
        if (!anterior) return { erro: 'Não há cópia anterior.' };
        try {
            const v = validarBackup(anterior);
            guardarCopiaAtual();
            times = v.teams;
            pessoas = v.people;
            return { ok: true, salvo: salvar() };
        } catch (e) {
            return { erro: 'A cópia anterior não pôde ser lida.' };
        }
    }

    /* ---------- Preferências de tela ---------- */
    function lerTela() {
        try { return JSON.parse(ler(CHAVE_TELA) || '{}'); } catch (e) { return {}; }
    }
    function gravarTela(estado) { gravar(CHAVE_TELA, JSON.stringify(estado)); }

    return {
        CHAVE_DADOS,
        carregar, salvar,
        get times() { return times; },
        get pessoas() { return pessoas; },
        adicionarTime, removerTime, adicionarPessoa, removerPessoa,
        baixarBackup, validarBackup, restaurar, copiaAnterior, desfazerRestauracao,
        lerTela, gravarTela
    };
})();
