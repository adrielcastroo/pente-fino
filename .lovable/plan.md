## Problema

O rodapé já lê a versão dinamicamente (`__APP_VERSION__` injetado por `vite.config.ts` a partir do topo de `src/lib/changelog.ts`), mas o changelog está parado em **3.0.0**. Várias mudanças foram entregues depois sem bump de versão, então o rodapé mostra a mesma versão "antiga" — dando a impressão de que o versionamento não funciona.

## Solução

Adotar disciplina SemVer no `CHANGELOG` e bumpar a versão a cada entrega (a infra de exibição já está pronta, não precisa mexer).

### Regra SemVer (a aplicar daqui em diante)

- **MAJOR (X.0.0)** — mudanças amplas / quebra de comportamento.
- **MINOR (x.Y.0)** — nova feature visível ao usuário.
- **PATCH (x.y.Z)** — correção de bug ou ajuste pequeno de UI.

A versão exibida no rodapé = primeira entrada de `CHANGELOG` em `src/lib/changelog.ts`.

### Entradas a adicionar (refletindo o que já foi entregue após 3.0.0)

Empilhar no topo de `CHANGELOG`, mais nova primeiro:

1. **3.2.0** — feature: trava de NF para PVT e Cortina em `/tecido`; improvement: home grid preenche largura total em notebooks/desktops (sem faixa em branco à direita).
2. **3.1.1** — fix: badges do detalhe expandido em `/historico` usam mapa de cores canônico com variantes dark para contraste AA.
3. **3.1.0** — feature: incluir item múltiplas vezes em NFs agrupadas no `/historico`, com auditoria preservada via triggers; improvement: cores padronizadas por tipo (Motor/Controle/Cortina/Coulisse/Rolo/Madeira) e botões do header uniformizados.

Datas: usar `2026-06-25` (hoje) para as três, com a mais alta sendo a "atual".

### Arquivo a alterar

- `src/lib/changelog.ts` — inserir as três entradas no topo de `CHANGELOG`. Nenhum outro arquivo precisa mudar; `vite.config.ts` faz o regex no topo e o `MainLayout` já renderiza `v{LATEST_VERSION}` + tooltip de build.

### Processo daqui em diante

A cada PR/turno que entregar mudança ao usuário:
- adicionar uma nova entrada no topo de `CHANGELOG`;
- escolher o tipo de bump conforme SemVer;
- a versão do rodapé acompanha automaticamente no próximo build.
