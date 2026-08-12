# Auditoria e Correção: Erro "Cannot read properties of undefined (reading 'forwardRef')"

O erro `Uncaught TypeError: Cannot read properties of undefined (reading 'forwardRef')` em `charts-vendor-BPTtPYr0.js` geralmente indica que o **Recharts** (ou uma dependência de visualização) está tentando acessar `React.forwardRef`, mas o React não está devidamente carregado ou há um conflito de versões/importações circulares que resulta em um objeto `React` parcial.

## Análise Técnica
- **Causa Provável:** Conflito entre `recharts@3.8.1` e a estrutura de build/importação do projeto.
- **Sintoma:** Tela branca (White Screen of Death) devido a uma falha crítica na inicialização dos componentes de gráfico.
- **Conexão:** O arquivo `src/components/ui/chart.tsx` utiliza `recharts` extensivamente e é importado em diversas páginas globais.

## Plano de Ação

### 1. Auditoria de Dependências
- Verificar se `recharts` e suas dependências (como `react-is`) estão em versões compatíveis com o `react@18.3.1` instalado.
- Investigar se houve uma atualização recente que quebrou a compatibilidade.

### 2. Correção no Componente Base
- Isolar o uso de `RechartsPrimitive` em `src/components/ui/chart.tsx`.
- Adicionar verificações de existência antes de acessar propriedades de objetos importados.
- Envolver componentes problemáticos em `lazy` ou `Suspense` adicionais se necessário.

### 3. Validação de Orquestração
- Corrigir a hierarquia de Provedores no `src/App.tsx` para garantir que o contexto do React esteja estável antes de qualquer componente de gráfico tentar renderizar.

### 4. Testes de Regressão
- Executar scripts automatizados (Playwright) para confirmar que a tela branca desapareceu e os gráficos voltaram a funcionar.

## Relatório de Execução Detalhado (Em andamento)
- **Status:** Identificado.
- **Arquivos sob revisão:** `src/components/ui/chart.tsx`, `src/App.tsx`, `package.json`.
