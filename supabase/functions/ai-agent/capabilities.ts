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

Objetivos de Curto Prazo (Roadmap):
- Implementar "Memória de Longo Prazo" para que o Fio lembre de preferências do usuário (ex: depósitos favoritos).
- Adicionar suporte para upload de documentos PDF/XLS para análise de faturas e romaneios.
- Expandir a biblioteca de Widgets interativos para criação direta de transferências via chat.`;
}
