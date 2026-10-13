# Escala Home Office

Ferramenta web para consultar quem está em home office em cada dia útil, no rodízio entre os grupos **Verde** e **Amarelo**. Roda direto no navegador: sem instalação, sem servidor, sem banco de dados e sem bibliotecas externas.

**Acesse:** https://exporttax-repository.github.io/escala-home-office/

## O que a ferramenta faz

- **Hoje:** mostra o grupo e as pessoas em home office no dia (ou no próximo dia útil, no fim de semana).
- **Calendário:** escala por mês ou do ano inteiro, com o dia atual e a semana atual marcados.
- **Destacar pessoa:** ao digitar um nome, os dias de home office da pessoa ficam em destaque e aparece a próxima data dela.
- **Filtros** por time e por ano.
- **Gerenciar equipe:** cadastro e exclusão de pessoas e times. A exclusão pede senha.
- **Backup:** baixa os dados em `.json` e restaura com conferência do arquivo antes de substituir, com opção de desfazer.
- **Impressão** só do calendário. No celular, o calendário vira uma lista por dia.

## Regra do rodízio

A partir de **02/02/2026**, os grupos alternam a cada **3 dias úteis**: 3 dias do Verde, 3 do Amarelo, e assim por diante. Sábados e domingos não contam. Pessoas **Fixo** não entram no rodízio.

> Feriados não são tratados: um feriado conta como dia útil na contagem.

A regra fica em `js/config.js` (`rodizio`) e o cálculo em `js/escala.js` (`grupoDoDia`).

## Estrutura

```
escala-home-office/
├── index.html          estrutura da página
├── css/
│   └── styles.css      visual (cores ADM, layout, celular, impressão)
├── js/
│   ├── config.js       times, pessoas, senha e regra do rodízio  ← edite aqui
│   ├── escala.js       regra do rodízio e calendário
│   ├── dados.js        armazenamento no navegador, backup e restauração
│   ├── ui.js           avisos, janela de senha, criação de elementos
│   └── app.js          monta a tela e liga os botões
├── assets/             logo e faixa de cores
├── docs/preview.png    imagem deste README
├── README.md
└── CHANGELOG.md
```

Os scripts são carregados nesta ordem: `config` → `escala` → `dados` → `ui` → `app`. Cada arquivo depende só dos anteriores.

## Publicar no GitHub Pages

1. Crie um repositório (ex.: `escala-home-office`) e envie **o conteúdo da pasta**, de modo que o `index.html` fique na raiz do repositório.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`. Clique em **Save**.
4. Em um ou dois minutos o site fica disponível em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. Troque o link no topo deste README.

Cada `git push` na `main` atualiza o site.

### Antes de publicar: privacidade

- **Em conta pessoal, o site do GitHub Pages é sempre público.** Publicar a partir de repositório privado exige plano pago, e mesmo assim o site fica aberto a qualquer pessoa com o link. Só contas GitHub Enterprise restringem o acesso ao site.
- O `js/config.js` contém **nomes de colegas**. Avalie com a equipe/gestão antes de publicar. Se preferir, deixe as listas `times` e `pessoas` vazias no repositório e cadastre a equipe pela tela, ou restaure um backup. Assim os nomes ficam só no navegador de cada um.
- A **senha de exclusão** aparece no código-fonte. Ela evita exclusões por engano, mas **não é proteção de segurança**.

### Dados no site publicado

Os dados ficam no **navegador de cada pessoa** (localStorage). Eles **não** são compartilhados entre usuários nem entre computadores. O site do Pages também não enxerga o que foi salvo ao abrir o arquivo localmente. Para levar os dados para o site, baixe um backup na versão local e restaure no site.

## Adicionar pessoas ou times

**Pela tela:** botão **Gerenciar equipe** → aba **Pessoas** ou **Times**.

**Pelo `js/config.js`:**

1. Acrescente a linha da pessoa:
   ```js
   { nome: 'Nova Pessoa', time: 'Export Inventory Control', grupo: 'verde' },
   ```
   Grupos válidos: `'verde'`, `'amarelo'` ou `'fixo'`.
2. Aumente `versao` em 1 (ex.: `versao: 1` → `versao: 2`).
3. Faça o commit/push (ou recarregue a página, se estiver usando localmente).

O sistema só **acrescenta** quem ainda não existe no navegador, comparando nome e time. Ninguém é apagado nem duplicado. Ao excluir alguém pela tela, apague também a linha dela no `config.js`, senão ela volta na próxima mudança de `versao`.

## Onde os dados ficam salvos

| Chave no localStorage | Conteúdo |
|---|---|
| `escalaData_v2` | times e pessoas (mesmo formato do arquivo de backup) |
| `escalaData_v2_anterior` | cópia automática feita antes de cada restauração |
| `escalaConfig_versao` | última versão do `config.js` já aplicada |
| `escalaUI_v1` | preferências de tela (pode ser apagada sem perda) |

Limpar os dados de navegação apaga a escala daquele navegador. **Baixe um backup com frequência.** Os backups das versões anteriores continuam válidos.

## Usar sem internet

Baixe o repositório (**Code → Download ZIP**), extraia a pasta inteira e abra o `index.html` com dois cliques. Não separe os arquivos.

## Compatibilidade e manutenção

- Chrome, Edge e Firefox atuais. O painel lateral usa o elemento `<dialog>`.
- Não use `type="module"` nos scripts: módulos ES não funcionam ao abrir o arquivo direto (`file://`).
- Sem dependências externas. Para manter o projeto simples por muitos anos, evite adicionar frameworks ou bibliotecas sem necessidade real.
- Registre as mudanças no [CHANGELOG.md](CHANGELOG.md).
