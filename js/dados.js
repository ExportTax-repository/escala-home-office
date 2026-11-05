/* =====================================================================
   DADOS — lê times e pessoas direto do config.js (somente consulta)
   Depende de: config.js, escala.js
   ===================================================================== */

const Dados = (() => {

    const times = CONFIG.times.map(t => String(t).trim()).filter(Boolean);
    const pessoas = [];

    CONFIG.pessoas.forEach((p, i) => {
        const color = String(p.grupo || '').toLowerCase() === 'fixo' ? 'branco' : String(p.grupo || '').toLowerCase();
        if (!p.nome || !p.time || !Escala.GRUPOS[color]) {
            console.warn('config.js: pessoa ignorada (confira nome, time e grupo):', p);
            return;
        }
        const time = String(p.time).trim();
        if (!times.includes(time)) times.push(time);
        pessoas.push({ id: i + 1, name: String(p.nome).trim(), team: time, color: color });
    });

    return { times, pessoas };
})();
