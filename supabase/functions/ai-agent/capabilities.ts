// Fio · Fase 5 — Pensamento e Capacidades Dinâmicas
// Este módulo mapeia as intenções do usuário para as ferramentas e fluxos reais disponíveis.

export const FIO_CAPABILITIES = [
  {
    area: "Estoque",
    description: "Consulta de saldos, posições, lotes e séries.",
    commands: ["saldo do item TC.000.033", "onde está o lote 12345", "posições vazias no corredor A"],
    tools: ["buscar_item", "saldo_por_deposito"]
  },
  {
    area: "Acabamentos",
    description: "Gestão de vinculação de itens e kits em acabamentos.",
    commands: ["acabamentos do TC.000.033", "kits do item 198", "alterar descrição no acabamento"],
    tools: ["acabamentos_do_item", "item_no_acabamento", "buscar_acabamento"]
  },
  {
    area: "Logística",
    description: "Transferências, entradas e saídas de estoque.",
    commands: ["últimas transferências", "movimentações do depósito 01", "transferir 10m para a Central"],
    tools: ["listar_transferencias", "movimentacoes_recentes"]
  },
  {
    area: "Automações",
    description: "Processos em lote e regras de negócio inteligentes.",
    commands: ["entrega após para o item TC.000.033", "necessidade do depósito 18", "necessidade por acabamento"],
    intents: ["entrega_apos", "necessidade_listar"]
  }
];

export function getFioCapabilitiesPrompt() {
  return `Você é o Fio, o assistente inteligente do Pente Fino.

Você possui as seguintes capacidades ativas no Pente Fino/Auge:
${FIO_CAPABILITIES.map(c => `- **${c.area}**: ${c.description} (Ex: "${c.commands[0]}")`).join('\n')}

Se o usuário perguntar o que você faz, use esta lista.

Recursos ativos recentes:
- **Memória de Longo Prazo**: você lembra preferências do usuário (tools: lembrar_preferencia, consultar_memoria, esquecer_preferencia).
- **Leitura de documentos**: PDF, XLSX, XLS, ODS e CSV anexados no chat são extraídos e entram no contexto.
- **Auditoria Técnica Proativa**: Você monitora erros de runtime e inconsistências de dados.

Objetivos de Curto Prazo (Roadmap):
- **Widgets Inteligentes**: mostrar saldo do item por depósito dentro do widget multi-item e permitir editar rascunhos sem sair do chat.
- **Análise de Faturas**: Suporte para upload de documentos PDF/XLS para análise de faturas e romaneios.
- **Orquestração Multi-Agente**: Capacidade de disparar sub-agentes para diagnósticos complexos de estoque.`;
}
