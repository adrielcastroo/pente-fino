## Reformulação do Módulo Expedição — Fluxo Linear de 5 Etapas

Refatoração completa: o modelo "picking ↔ carrinho" sai; entra o fluxo **peça → etiqueta → carrinho → double-check → romaneio → NF**. Escopo grande, então proponho fasear em 4 turnos para você validar cada camada antes de avançar.

---

### Turno 1 — Fundação de dados (backend)

Novas tabelas + migrações RLS/GRANT no padrão do projeto:

- `expedicao_pecas` — id, codigo_etiqueta (único), status (`etiquetada|no_carrinho|conferida|no_romaneio|faturada`), embalador_id, carrinho_id (FK nullable), romaneio_id (FK nullable), timestamps.
- `expedicao_carrinhos` — adicionar `status` (`montando|aguardando_conferencia|em_conferencia|conferido|romaneio_gerado`), `conferente_id`.
- `expedicao_romaneios` — id, numero, transportadora_id, status, criado_por, timestamps.
- `expedicao_romaneio_nfe` — tabela associativa N:N (romaneio_id, nfe_id).
- `expedicao_transportadoras` — adicionar `regra_nf` (`uma_nf|multiplas_nf`).
- `expedicao_pecas_historico` — auditoria (peça, ação, usuário, timestamp) para rastreabilidade.

Preserva `expedicao_pickings` como legado (não deletar dados existentes) mas marca a rota atual como deprecated.

### Turno 2 — Etapas 1 e 2 (Embalagem + Carrinhos)

- **`/expedicao/embalagem`** (nova) — campo único de bipagem, gera etiqueta, som/vibração, botão "Reimprimir".
- **`/expedicao/carrinhos`** (refatorada) — bipagem híbrida (peça ou carrinho, qualquer ordem), lista de peças alocadas em tempo real, confirmação de transferência quando peça já está em outro carrinho.
- Hook `useExpedicaoPecas` + mutações `etiquetarPeca`, `alocarPecaCarrinho`, `transferirPeca`.
- Aposentar a UI atual de `/expedicao/pickings` → redireciona para `/expedicao/embalagem` com aviso.

### Turno 3 — Etapa 3 (Double-check com bloqueio)

- **`/expedicao/conferencia`** (refatorada) — lista carrinhos aguardando; ao abrir, mostra checklist de peças esperadas.
- Bipar peça:
  - ✅ correta → verde, contador `X/Y`.
  - ❌ pertence a outro carrinho → **alerta vermelho bloqueante** com ação "Realocar" (abre dialog para escolher carrinho correto).
  - ❌ faltando → destaque pendente, bloqueia fechamento.
- Só fecha com 100%. Registra resultado por peça em `expedicao_conferencias_itens` (nova).

### Turno 4 — Etapas 4 e 5 (Romaneio + NF) + Hub

- **`/expedicao/romaneio`** (refatorada) — gera automaticamente após conferência; lista peças, carrinhos, transportadora; exportar/imprimir.
- Vínculo com NF respeitando `regra_nf` da transportadora (1:1 ou 1:N via `expedicao_romaneio_nfe`).
- Validação: soma peças vs. itens NF → alerta divergência.
- **`/expedicao/operacao`** (hub) — atualizar cards para as 5 etapas + Painel.
- **`ModuleSidebar` Expedição** — renomear "Pickings"→"Embalagem", reordenar itens conforme fluxo.

---

### Perguntas abertas (respondo com defaults se não indicar)

1. **Cancelamento de romaneio/NF**: default = permitir estorno via botão restrito a `supervisor+`, com log em histórico.
2. **Permissões**: default = qualquer `operador` bipa/etiqueta; realocação e fechamento de conferência exigem `supervisor+`.
3. **Rastreabilidade**: default = `expedicao_pecas_historico` grava toda ação (etiquetar, alocar, transferir, conferir, faturar).

### Confirmação

Posso começar pelo **Turno 1 (migrações)** já? Ou prefere ajustar algo na modelagem antes?
