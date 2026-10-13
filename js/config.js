/* =====================================================================
   CONFIGURAÇÃO DA ESCALA — este é o único arquivo que você precisa editar
   =====================================================================

   COMO ADICIONAR PESSOAS OU TIMES POR AQUI
   1. Acrescente a pessoa na lista "pessoas" (ou o time na lista "times").
   2. Aumente o número de "versao" em 1 (ex.: 1 → 2).
   3. Salve o arquivo e recarregue a página (F5).

   O sistema só ACRESCENTA o que ainda não existe no navegador.
   Ninguém é apagado ou duplicado. Exclusões e mudanças de grupo continuam
   sendo feitas pela tela, em "Gerenciar equipe".
   Ao excluir alguém pela tela, apague também a linha dela aqui; senão ela
   volta na próxima vez que a "versao" for aumentada.

   Também dá para cadastrar direto pela tela, sem mexer neste arquivo.

   Grupos válidos:
     "verde"   → home office nos dias do grupo Verde
     "amarelo" → home office nos dias do grupo Amarelo
     "fixo"    → não entra no rodízio
   ===================================================================== */

const CONFIG = {

    /* Aumente este número sempre que alterar times ou pessoas abaixo. */
    versao: 1,

    /* Nome exibido no rodapé. */
    organizacao: 'Export Inventory Control',

    /* Senha pedida para excluir pessoas e times. */
    senhaExclusao: '1234',

    /* Regra do rodízio. Só altere se a regra da área mudar:
       a partir de "inicio", 3 dias úteis do grupo Verde e 3 do Amarelo, repetindo. */
    rodizio: {
        inicio: '2026-02-02',      // AAAA-MM-DD, deve ser uma segunda-feira
        diasPorGrupo: 3,
        primeiroGrupo: 'verde'
    },

    /* Quantos anos à frente aparecem no seletor de ano. */
    anosAFrente: 2,

    times: [
        'Export Inventory Control'
    ],

    pessoas: [
        // Grupo Verde
        { nome: 'Geraldo',        time: 'Export Inventory Control', grupo: 'verde' },
        { nome: 'Giovanna',       time: 'Export Inventory Control', grupo: 'verde' },
        { nome: 'Giovanni',       time: 'Export Inventory Control', grupo: 'verde' },
        { nome: 'João V Pereira', time: 'Export Inventory Control', grupo: 'verde' },
        { nome: 'Thamirys',       time: 'Export Inventory Control', grupo: 'verde' },

        // Grupo Amarelo
        { nome: 'Adriel',         time: 'Export Inventory Control', grupo: 'amarelo' },
        { nome: 'Felipe',         time: 'Export Inventory Control', grupo: 'amarelo' },
        { nome: 'Gabriel Bauer',  time: 'Export Inventory Control', grupo: 'amarelo' },
        { nome: 'Hanna',          time: 'Export Inventory Control', grupo: 'amarelo' },
        { nome: 'Thaina Bispo',   time: 'Export Inventory Control', grupo: 'amarelo' },
        { nome: 'Thiago A',       time: 'Export Inventory Control', grupo: 'amarelo' },

        // Fixos (não entram no rodízio)
        { nome: 'Luana',          time: 'Export Inventory Control', grupo: 'fixo' },
        { nome: 'Sabrina',        time: 'Export Inventory Control', grupo: 'fixo' }
    ]
};
