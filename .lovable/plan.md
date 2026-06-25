## Problema

Em telas grandes (≥1280px), o grid de ações da `OperacaoHomePage` é limitado por `max-w-5xl` + `lg:grid-cols-3`, deixando a faixa direita vazia (área vermelha do print).

## Causa

`src/pages/OperacaoHomePage.tsx` linha 77:
```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-5xl
```
O `<main>` ocupa toda a largura disponível, mas o grid é travado em ~1024px.

## Opções (escolher 1 antes de implementar)

**A. Centralizar (mínimo esforço, mantém densidade atual)**
- Adicionar `mx-auto` ao grid.
- Resultado: cartões ficam centralizados; some a "faixa" assimétrica à direita.

**B. Esticar para preencher (aproveita o espaço sem novo conteúdo)**
- Remover `max-w-5xl`, manter `lg:grid-cols-3` e adicionar `xl:grid-cols-3 2xl:grid-cols-3` com `gap` maior; cartões ficam mais largos (uniforme 3×2).
- Header também passa a respirar a largura toda.

**C. 4 colunas em telas largas (mais ações visíveis)**
- `lg:grid-cols-3 xl:grid-cols-4` + remover `max-w-5xl`.
- Com 6 itens vira 4+2 (assimetria na 2ª linha). Pode-se compensar com `justify-items-stretch` ou reordenar.

**D. Painel lateral informativo (usa o espaço com conteúdo útil)**
- Em `xl:`, transformar layout em `xl:grid-cols-[1fr_320px]`: à esquerda o grid de ações (3 cols), à direita um cartão "Atividade recente" / "Resumo do dia" (últimas conferências, contagem do turno).
- Mais valor para o usuário, mas requer query (já existe em `useDashboard`/`HistoryPanel`).

## Recomendação

**Opção A** se a prioridade é puramente cosmética (1 linha de código).  
**Opção D** se quiser aproveitar o espaço com algo útil (recomendado, alinhado com padrões SaaS modernos — Linear/Stripe).

Qual aplicar?