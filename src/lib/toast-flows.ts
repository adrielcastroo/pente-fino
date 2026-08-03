import { toast } from 'sonner';

/**
 * Toasts padronizados para os fluxos operacionais críticos (bipagem e
 * transferência). Centralizar aqui garante que o operador receba sempre
 * a mesma linguagem, duração e nível de severidade — independente da tela.
 *
 * Convenções de copy (PT-BR, voz do operador):
 * - Sucesso: confirma o que entrou no sistema, sem jargão técnico.
 * - Aviso:   nada foi perdido, apenas ignorado/duplicado.
 * - Erro:    diz o que falhou e o que fazer em seguida.
 */

const DURATION = {
  bip: 2000,
  success: 3500,
  warning: 4000,
  error: 6000,
} as const;

/** Normaliza qualquer erro (Error, string, objeto Supabase) em texto legível. */
export function describeError(e: unknown, fallback = 'Tente novamente em instantes.'): string {
  if (!e) return fallback;
  if (typeof e === 'string') return e.trim() || fallback;
  if (e instanceof Error) return e.message?.trim() || fallback;
  const msg = (e as { message?: unknown }).message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return fallback;
}

type Opts = { id?: string | number };

/* ------------------------------------------------------------------ */
/* Bipagem                                                             */
/* ------------------------------------------------------------------ */

export const bipToast = {
  /** Leitura aceita e registrada. */
  ok(codigo: string, detalhe?: string, opts?: Opts) {
    return toast.success(codigo, {
      description: detalhe ?? 'Leitura registrada.',
      duration: DURATION.bip,
      ...opts,
    });
  },

  /** Código já lido nesta sessão — nada foi duplicado. */
  duplicado(codigo: string, escopo = 'nesta sessão', opts?: Opts) {
    return toast.warning(`${codigo} já foi bipado ${escopo}`, {
      description: 'Nada foi duplicado. Siga para a próxima leitura.',
      duration: DURATION.warning,
      ...opts,
    });
  },

  /** Código lido não existe no cadastro. */
  naoEncontrado(codigo: string, onde = 'no sistema', opts?: Opts) {
    return toast.error(`${codigo} não encontrado ${onde}`, {
      description: 'Confira a etiqueta ou digite o código manualmente.',
      duration: DURATION.error,
      ...opts,
    });
  },

  /** Falha ao gravar a leitura. */
  erro(e: unknown, opts?: Opts) {
    return toast.error('Não foi possível registrar a leitura', {
      description: describeError(e, 'Confira a conexão e bipe novamente.'),
      duration: DURATION.error,
      ...opts,
    });
  },

  /** Resumo de um lote de leituras. */
  lote(sucesso: number, total: number, destino?: string, opts?: Opts) {
    const alvo = destino ? ` em ${destino}` : '';
    if (sucesso === total) {
      return toast.success(`${sucesso} peça(s) registrada(s)${alvo}`, {
        description: 'Tudo conferido.',
        duration: DURATION.success,
        ...opts,
      });
    }
    return toast.warning(`${sucesso} de ${total} peça(s) registrada(s)${alvo}`, {
      description: 'As demais continuam pendentes — bipe novamente.',
      duration: DURATION.warning,
      ...opts,
    });
  },
};

/* ------------------------------------------------------------------ */
/* Transferência                                                       */
/* ------------------------------------------------------------------ */

export const transferToast = {
  /** Loading padrão; devolve o id para reaproveitar no sucesso/erro. */
  enviando(mensagem = 'Enviando transferência para o Auge…') {
    return toast.loading(mensagem);
  },

  criada(documento: string, detalhe?: string, opts?: Opts) {
    return toast.success(`Transferência ${documento} criada`, {
      description: detalhe ?? 'Rascunho disponível no Auge para efetivação.',
      duration: DURATION.success,
      ...opts,
    });
  },

  efetivada(documento: string, opts?: Opts) {
    return toast.success(`Transferência ${documento} efetivada`, {
      description: 'Saldos atualizados nos depósitos de origem e destino.',
      duration: DURATION.success,
      ...opts,
    });
  },

  removida(documento: string, opts?: Opts) {
    return toast.success(`Rascunho ${documento} removido`, {
      description: 'Nenhum saldo foi movimentado.',
      duration: DURATION.success,
      ...opts,
    });
  },

  erro(e: unknown, acao = 'transferência', opts?: Opts) {
    return toast.error(`Não foi possível concluir a ${acao}`, {
      description: describeError(e, 'Nenhum saldo foi movimentado. Tente novamente.'),
      duration: DURATION.error,
      ...opts,
    });
  },
};

/* ------------------------------------------------------------------ */
/* Sincronização do Auge                                               */
/* ------------------------------------------------------------------ */

export const syncToast = {
  /** Sincronização iniciada. */
  iniciado(entidade: string, opts?: Opts) {
    return toast.loading(`Sincronizando ${entidade}…`);
  },

  /** Sucesso na sincronização. */
  ok(entidade: string, quantidade: number, detalhe?: string, opts?: Opts) {
    return toast.success(`${quantidade} ${entidade} sincronizado(s)`, {
      description: detalhe ?? 'Dados atualizados com sucesso.',
      duration: DURATION.success,
      ...opts,
    });
  },

  /** Falha na sincronização. */
  erro(entidade: string, e: unknown, opts?: Opts) {
    return toast.error(`Falha ao sincronizar ${entidade}`, {
      description: describeError(e, 'Verifique a conexão e tente novamente.'),
      duration: DURATION.error,
      ...opts,
    });
  },

  /** Sync em background completado. */
  background(descricao: string, opts?: Opts) {
    return toast.success('Sincronização iniciada em background', {
      description: descricao,
      duration: DURATION.success,
      ...opts,
    });
  },
};
