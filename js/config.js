/* =====================================================================
   CONFIGURAÇÃO DA ESCALA — este é o único arquivo que você precisa editar
   =====================================================================

   COMO ADICIONAR OU REMOVER PESSOAS
   Edite as listas "times" e "pessoas" abaixo, salve e recarregue a página (F5).

   Grupos válidos:
     "verde"   → home office nos dias do grupo Verde
     "amarelo" → home office nos dias do grupo Amarelo
     "fixo"    → não entra no rodízio
   ===================================================================== */

const CONFIG = {

    /* Nome exibido no rodapé. */
    organizacao: 'Export Inventory Control',

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
        { nome: 'Kathleen Vieira',time: 'Export Inventory Control', grupo: 'amarelo' },
        // Fixos (não entram no rodízio)
        { nome: 'Luana',          time: 'Export Inventory Control', grupo: 'fixo' },
        { nome: 'Sabrina',        time: 'Export Inventory Control', grupo: 'fixo' }
    ]
};
