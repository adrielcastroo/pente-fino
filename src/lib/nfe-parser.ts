// Parser de NF-e (layout SEFAZ). 100% client-side, sem dependências externas.

export interface NFeItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  ncm: string;
}

export interface NFeData {
  numero: string;
  serie: string;
  chaveAcesso: string;
  dataEmissao: string;
  cnpjEmitente: string;
  nomeEmitente: string;
  cnpjDestinatario: string;
  nomeDestinatario: string;
  valorTotal: number;
  valorProdutos: number;
  valorFrete: number;
  transportadora: string;
  volumes: number;
  pesoLiquido: number;
  pesoBruto: number;
  itens: NFeItem[];
}

const getText = (root: Element | Document, tag: string, parent?: Element | null): string => {
  const scope = parent ?? root;
  const el = scope.getElementsByTagName(tag)[0];
  return el?.textContent?.trim() ?? '';
};

const getNum = (root: Element | Document, tag: string, parent?: Element | null): number => {
  const v = parseFloat(getText(root, tag, parent));
  return Number.isFinite(v) ? v : 0;
};

export function parseNFeXML(xmlString: string): NFeData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('XML inválido.');
  }

  const infNFe = doc.getElementsByTagName('infNFe')[0];
  if (!infNFe) throw new Error('XML não é uma NF-e válida (infNFe ausente).');

  const chaveAcesso = (infNFe.getAttribute('Id') ?? '').replace(/^NFe/i, '');

  const ide = doc.getElementsByTagName('ide')[0] ?? null;
  const emit = doc.getElementsByTagName('emit')[0] ?? null;
  const dest = doc.getElementsByTagName('dest')[0] ?? null;
  const total = doc.getElementsByTagName('ICMSTot')[0] ?? null;
  const transp = doc.getElementsByTagName('transp')[0] ?? null;
  const vol = doc.getElementsByTagName('vol')[0] ?? null;
  const transportaName = transp?.getElementsByTagName('transporta')[0] ?? null;

  const dets = Array.from(doc.getElementsByTagName('det'));
  const itens: NFeItem[] = dets.map((det) => {
    const prod = det.getElementsByTagName('prod')[0] ?? null;
    return {
      codigo: getText(doc, 'cProd', prod),
      descricao: getText(doc, 'xProd', prod),
      quantidade: getNum(doc, 'qCom', prod),
      unidade: getText(doc, 'uCom', prod),
      valorUnitario: getNum(doc, 'vUnCom', prod),
      valorTotal: getNum(doc, 'vProd', prod),
      ncm: getText(doc, 'NCM', prod),
    };
  });

  return {
    numero: getText(doc, 'nNF', ide),
    serie: getText(doc, 'serie', ide),
    chaveAcesso,
    dataEmissao: getText(doc, 'dhEmi', ide) || getText(doc, 'dEmi', ide),
    cnpjEmitente: getText(doc, 'CNPJ', emit),
    nomeEmitente: getText(doc, 'xNome', emit),
    cnpjDestinatario: getText(doc, 'CNPJ', dest) || getText(doc, 'CPF', dest),
    nomeDestinatario: getText(doc, 'xNome', dest),
    valorTotal: getNum(doc, 'vNF', total),
    valorProdutos: getNum(doc, 'vProd', total),
    valorFrete: getNum(doc, 'vFrete', total),
    transportadora: transportaName ? getText(doc, 'xNome', transportaName) : '',
    volumes: vol ? getNum(doc, 'qVol', vol) : 0,
    pesoLiquido: vol ? getNum(doc, 'pesoL', vol) : 0,
    pesoBruto: vol ? getNum(doc, 'pesoB', vol) : 0,
    itens,
  };
}

export function formatBRL(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Tenta vincular uma NF-e a um picking pelo número da NF ou pelo cliente.
 * Retorna o picking_id correspondente ou null.
 */
export function autoVincularPicking<T extends { id: string; numero: string; cliente: string }>(
  nfe: Pick<NFeData, 'numero' | 'nomeDestinatario'>,
  pickings: T[],
): T | null {
  const nfNum = nfe.numero.replace(/^0+/, '');
  const byNF = pickings.find((p) => {
    const pn = p.numero.replace(/^0+/, '');
    return pn === nfNum || pn.includes(nfNum) || nfNum.includes(pn);
  });
  if (byNF) return byNF;

  const dest = nfe.nomeDestinatario.toLowerCase().trim();
  if (!dest) return null;
  return (
    pickings.find((p) => {
      const c = p.cliente.toLowerCase().trim();
      return c && (dest.includes(c) || c.includes(dest));
    }) ?? null
  );
}
