

## Plano: Histórico — download Excel + pesquisa + layout horizontal

### 1. Botão de download Excel por conferência no Histórico

**`src/components/HistoryPanel.tsx`:**
- Adicionar botão `Download` (ícone) em cada `ConferenceCard`, ao lado do botão de deletar
- Ao clicar, gerar Excel usando a mesma lógica do `RightPanel`: `getRegistroColumns` para headers, `XLSX.writeFile` para download
- Nome do arquivo: `conferencia_${folderName}.xlsx`

### 2. Campo de pesquisa na aba Histórico

**`src/components/HistoryPanel.tsx`:**
- Adicionar estado `search` (string)
- Renderizar input de pesquisa no header (ao lado de "Histórico de Conferências")
- Filtrar `history` por: nome da pasta, conferente, itens dos registros (item, nf, lote)
- Pesquisa case-insensitive

### 3. Layout horizontal para tablet/smartphone deitado

**`src/pages/Index.tsx`:**
- Adicionar hook para detectar orientação landscape (`window.innerHeight < window.innerWidth` em mobile/tablet)
- Quando landscape em mobile/tablet: usar layout side-by-side similar ao desktop (`grid-cols-[360px_1fr]`) em vez de abas full-screen
- Reduzir largura do LeftPanel para 360px no landscape para caber melhor

**`src/hooks/use-mobile.tsx`:**
- Adicionar hook `useIsLandscape()` que retorna true quando `window.innerWidth > window.innerHeight`

### Arquivos afetados
- `src/components/HistoryPanel.tsx` — download Excel, campo pesquisa
- `src/pages/Index.tsx` — layout landscape
- `src/hooks/use-mobile.tsx` — hook useIsLandscape

