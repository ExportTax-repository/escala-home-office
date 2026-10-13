/* =====================================================================
   ESCALA — regra do rodízio e calendário (sem tela, sem armazenamento)
   Depende de: config.js
   ===================================================================== */

const Escala = (() => {

    const GRUPOS = { verde: 'Verde', amarelo: 'Amarelo', branco: 'Fixo' };
    const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const [ano, mes, dia] = CONFIG.rodizio.inicio.split('-').map(Number);
    const INICIO = new Date(ano, mes - 1, dia);
    const DIAS_POR_GRUPO = CONFIG.rodizio.diasPorGrupo;
    const PRIMEIRO = CONFIG.rodizio.primeiroGrupo;
    const SEGUNDO = PRIMEIRO === 'verde' ? 'amarelo' : 'verde';

    /* ---------- Datas ---------- */
    function hoje() {
        const t = new Date();
        return new Date(t.getFullYear(), t.getMonth(), t.getDate());
    }
    function mesmoDia(a, b) {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
    function fimDeSemana(d) { return d.getDay() === 0 || d.getDay() === 6; }
    function proximoDiaUtil(d) {
        const n = new Date(d);
        do { n.setDate(n.getDate() + 1); } while (fimDeSemana(n));
        return n;
    }
    function diaMes(d) { return d.getDate() + '/' + (d.getMonth() + 1); }
    function dataExtenso(d) {
        const w = DIAS[d.getDay()];
        return w.charAt(0).toUpperCase() + w.slice(1) + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()].toLowerCase();
    }

    /* ---------- Regra do rodízio ----------
       Mesma lógica da versão original: conta os dias úteis desde o início;
       ciclo de (2 × diasPorGrupo) dias; a primeira metade é do primeiro grupo. */
    function grupoDoDia(date) {
        if (date < INICIO) return null;
        let diasUteis = 0;
        const cur = new Date(INICIO);
        while (cur < date) {
            if (!fimDeSemana(cur)) diasUteis++;
            cur.setDate(cur.getDate() + 1);
        }
        const posicao = diasUteis % (DIAS_POR_GRUPO * 2);
        return posicao < DIAS_POR_GRUPO ? PRIMEIRO : SEGUNDO;
    }

    /* Próximo dia útil (a partir de "desde", inclusive) em que o grupo está em home office. */
    function proximoHomeOffice(grupo, desde) {
        if (grupo !== 'verde' && grupo !== 'amarelo') return null;
        let d = fimDeSemana(desde) ? proximoDiaUtil(desde) : new Date(desde);
        for (let i = 0; i < DIAS_POR_GRUPO * 2 + 2; i++) {
            if (grupoDoDia(d) === grupo) return d;
            d = proximoDiaUtil(d);
        }
        return null;
    }

    /* ---------- Semanas do ano ----------
       No ano de início, começa na data de início; nos demais, na primeira segunda-feira de janeiro.
       Cada semana pertence ao mês da sua segunda-feira. */
    function semanasDoAno(year) {
        let segunda;
        if (year === INICIO.getFullYear()) {
            segunda = new Date(INICIO);
        } else {
            segunda = new Date(year, 0, 1);
            while (segunda.getDay() !== 1) segunda.setDate(segunda.getDate() + 1);
        }
        const semanas = [];
        let ultimoMes = -1, contador = 1;
        while (segunda.getFullYear() === year) {
            const m = segunda.getMonth();
            if (m !== ultimoMes) { ultimoMes = m; contador = 1; }
            const dias = [];
            for (let i = 0; i < 5; i++) {
                const d = new Date(segunda);
                d.setDate(segunda.getDate() + i);
                dias.push(d);
            }
            semanas.push({ mes: m, numero: contador, dias: dias });
            contador++;
            segunda = new Date(segunda);
            segunda.setDate(segunda.getDate() + 7);
        }
        return semanas;
    }

    function anosDisponiveis() {
        const ultimo = Math.max(INICIO.getFullYear() + CONFIG.anosAFrente, hoje().getFullYear() + CONFIG.anosAFrente);
        const anos = [];
        for (let y = INICIO.getFullYear(); y <= ultimo; y++) anos.push(y);
        return anos;
    }

    return {
        GRUPOS, MESES, DIAS_CURTOS, INICIO,
        hoje, mesmoDia, fimDeSemana, proximoDiaUtil, diaMes, dataExtenso,
        grupoDoDia, proximoHomeOffice, semanasDoAno, anosDisponiveis
    };
})();
