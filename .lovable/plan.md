## Remover entradas em /configuracoes

Em `src/pages/SettingsPage.tsx`:

1. Remover os imports `LotesMestresPanel` (linha 62) e `InventorySettingsPanel` (linha 64).
2. Remover as entradas `lotes-mestres` (linha 73) e `inventory-cyclic` (linha 76) do array `categories`.
3. Remover o bloco de render `activeCategory === 'inventory-cyclic'` (linhas 736-737).
4. Remover o bloco de render `activeCategory === 'lotes-mestres'` (linhas 1024-1025) e tirar `'lotes-mestres'` da lista de exclusão do fallback (linha 1028).

Os arquivos `LotesMestresPanel.tsx` e `InventorySettingsPanel.tsx` permanecerão no projeto (apenas desreferenciados da página de configurações), evitando efeito colateral em outros lugares.