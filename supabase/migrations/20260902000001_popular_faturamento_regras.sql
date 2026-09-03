-- ============================================================
-- MIGRATION: População da tabela faturamento_regras
-- Geração automática - 1844 clientes ativos
-- ============================================================

BEGIN;

-- Batch 1/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1739',
    'Monter Automação e Decoração Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA , SEM VALOR MÍNIMO TRANSPORTADORA: EXPRESSO SÃO MIGUEL  --- QUANDO FOB: TRANSPORTADORA RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1655',
    'Mood - Infinitas Possibilidades',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO. SE NECESSÁRIO TRANSPORTADORA: SEMPRE FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1501',
    'Morada Design Cortinas e Persianas Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA SEM VALOR MÍNIMO TRANSPORTADORA CIF E FOB: RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1704',
    'Morrone Cortinas, Pesrianas, Toldos e Decoração Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso M2000',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA , VALOR MÍNIMO R$ 1.500,00 TRANSPRTADORA: JAMEF  FRETE FOB - TRANSPORTADORA EXPRESSO M2000'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0033',
    'Cortikasa Cortinas e Persianas LTDA ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'TERÇA E QUINTA (NO MÍNIMO DE 2 PEDIDOS) ---------------------------------------------------------------------------- MODALIDADE DE FRETE: SEMPRE FOB TRANSPORTADORA: FOB ACEVILLE METRAGEM: ACEVILLE ENTREGA ATÉ 7/8M',
    NULL,
    'ativo',
    NULL,
    '---------------------------------------------------------------------------- FREQUENCIA DE ENVIO:TERÇA E QUINTA (NO MÍNIMO DE 2 PEDIDOS) ---------------------------------------------------------------------------- MODALIDADE DE FRETE: SEMPRE FOB TRANSPORTADORA: FOB ACEVILLE METRAGEM: ACEVILLE ENTREGA ATÉ 7/8M'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0210',
    'MR Comércio de Persianas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0947',
    'MRS Acabamentos e Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0921',
    'MRS MARCOS DECORACOES LTDA - ME',
    'CIF_FOB',
    NULL,
    NULL,
    'QUARTA 29/11 - Fran',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0756',
    'MRW Papelaria Comércio e Importação Ltda',
    'CIF',
    800.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE: CIF - 1X POR SEMANA (ACIMA DE R$ 800,00)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0644',
    'Mulinari Cortinas e Decorações Ltda',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF - 1X POR SEMANA ACIMA DE R$ 1.500,00 TRANSPORTADORA - BAUER FOB: SE NÃO DER O VALOR  *VALOR DO CIF ALTERADO DIA 15/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  ------------------------------------------------------  - INFORMAÇÕES ADICIONAIS:  10/02/2016 - OBRA BNDES FATURAMENTO DIRETO PARA CLEINTE MULINARI FRETE CIF   TRANSPORTADORA: REUNIDAS   9.105,37 - VALOR VENDA -6.562,15 - CUSTO MULINARI ------------  2.543,22 -  457,78 - IMPOSTOS ------------  2.085,44 CRÉDITO PARA MULINARI --------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0017',
    '*desativado*Fabrica de Persianas Sombrio Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0132',
    'Muller Comercio de Vestuario Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0573',
    '3A Acabamentos e Decorações Ltda',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368  ADRIANO INATIVOU CADASTRO EM 27/07/2015 - MOTIVO: LOJA FECHOU'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1578',
    'A4 PISOS E AMBIENTES LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA ACIMA DE R$1.500,00 TRANPORTADORA: JAMEF FRETE FOB - RODONAVES  *TRANSPORTADORA E VALOR DE CIF ALTERADO DIA 17/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO    *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0319',
    '9mm Marketing Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0060',
    'Inside Persianas Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:FOB FREQUENCIA DE ENVIO: 1X NA SEMANA. TRANSPORTADORA:BAUER, SE TIVER ALGUM PROBLEMA PODEMOS EMBARCAR PELA REUNIDAS.   13/01/2016 - DIVÍDA: COMBINADO COM O CLIENTE QUE O MESMO QUANDO PASSAR PEDIDO IRÁ MANDAR O VALOR CHEIO DA VENDA PARA GENTE, PARA QUE ASSIM PAGUE OS PEDIDOS A ABATE A DIVÍDA, COMO TAMBÉM, CHEQUES DE TERCEIROS.  CLIENTE INVATIVO FICOU DEVENDO VER KATIA 04;2016'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0211',
    'Jane Decoração LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1145',
    'A & G COMERCIO VAREJISTA DE ARTIGOS DOMESTICOS EIRELI - EPP',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0941',
    'Multi Decorações Taio Pisos e Persianas Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1079',
    'A Alto Astral Cortinas e Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO ALTERADA PARA ANTECIPADO E LIMITE ZERADO, APÓS REVENDA AUTORIZAR UM CONSERTO NO VALOR DE 30,00. CONSERTO FOI ENVIADO COM FRETE FOB, PQ NÃO TINHA NENHUM PEDIDO PARA ENVIAR JUNTO, INCLUSIVE A REVENDA NÃO ESTÁ MAIS COMPRANDO COM A UNILUX. OFRETE SAIU NO VALOR DE 200,00 E A REVENDA RECUSOU. FICANDO ASSIM A UNILUX COM PREJUIZO DA ASSISTENCIA QUE FOI ENVIADA + O FRETE. POR ESSE MOTIVO ESTÁ SENDO ALTERADA A CONDIÇÃO E LIMITE.  ------------------------------------------------------------------------------------------------------------------------------------------------- FATURAMENTO  JAMEF RODONAVES ACIMA DE 3 METROS FRETE FOB -------------------------------------------------------------------------------------------------------------------------------------------------- COMERCIAL  REFERENCIAS: CORTTEX IND. TEXTIL: NÃO FORNECE INFORMAÇÕES COUSELO :ÓTIMO CLIENTE COMPRA COM BOLETO',
    'JAMEF RODONAVES ACIMA DE 3 METROS FRETE FOB -------------------------------------------------------------------------------------------------------------------------------------------------- COMERCIAL  REFERENCIAS: CORTTEX IND. TEXTIL: NÃO FORNECE INFORMAÇÕES COUSELO :ÓTIMO CLIENTE COMPRA COM BOLETO E PAGA EM DIA.  CLIENTE COM SHOW ROOM KAZZA, VENDE NOSSO PRODUTO EM ALGUNS CASOS ONDE A MARCA KAZZA TEM LIMITAÇÕES, VENDE TAMBÉM A PHM DA PERSOL FICOU DE SE REUNIR COM SÓCIO PARA VER A POSSIBILIDADE '
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1509',
    'A N GUIMARÃES CONSTRUÇÕES',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1462',
    'A.B da Silva Decorações',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0903',
    'AAA Decorcasa Comercio de Persianas Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    ':',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0182',
    'aaa Majestic',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE MERCADORIA, TERÇA E QUINTA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0781',
    'Abdalla Materiais de Construção Ltda - ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0220',
    'Multilux Comercio e Representação de Pers. e Dec. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0234',
    'Mundial Comércio de Tintas ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1726',
    'Abreu Martins & Cia Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE: FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0611',
    'Municipio de Campo Magro',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0077',
    'MV Comercio de Artigos de Dec.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0018',
    'Absoluto Divisorias e Pisos Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1589',
    'MVR SOLUÇÕES EM MOTORHOMES E VEÍCULOS DE GRANDE PORTE EIRELE',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0402',
    'M² Emporio do Arquiteto LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'MODALIDE DE FRETE: 1X CIF SEM VALOR MÍNIMO  TRANSPORTADORA: CIF - REUNIDAS                            FOB - BRASPRESS  (SÓ CARREGA ATÉ 2MTS DE COMPRIMENTO)  PEÇAS MAIORES DE 2M MANDAR POR RODONAVES QUANDO FOB (CONFIRMADO COM LINDA 20/04/2026 EVO-VITOR)  *VALOR DE FRETE CIF ALTERADO DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO --------------------------------------------------------------------------------------------------- COMERCIAL  07/02/2012 - CONSULTA  NADA CONSTA - ADRIANO FUNDADA EM 03/'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1609',
    'Ac Studio Luz iluminação  e materiais elétricos LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0131',
    'Acabamentos e Objetos Conscientes de Arq. e Dec Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0602',
    'Aceville Transportes Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0934',
    'Aceville Transportes Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1286',
    'Aceville Transportes Ltda - ITAJAÌ',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1422',
    'ACM Comércio e Decoração Llda',
    'FOB',
    1000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: RODONAVES SEMPRE FOB ________________________________________________________________________  ANÁLISE DO REPRESENTANTE: PEDIDO PARA NOS AVALIAR. REVENDA DA ZS DO RIO QUE ESTÁ NOS DANDO ABERTURA. POSSIBILIDADE DE AOS POUCOS GANHAR TERRENO. TABELA C - 28 DIAS - CIF ACIMA DE R$ 1.000,00 1 X SEMANA.  *DOCUMENTOS NO PORTAL  ________________________________________________________________________  06/06/2023 - REVENDA INATIVA CONFORME SOLICITADO PELO FERNANDO ABREU'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1181',
    'Márcia Luciano',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1390',
    'Márcio Eduardo Tanjoni & Cia Ltda-ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1534',
    'ADONAE PEREIRA SANTOS',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'RODONAVES FRETE: CIF 1X SEMANA NA QUARTA-FEIRA AGRUPAR TODOS OS PEDIDOS DA SEMANA E ENVIAR 1 VEZ SÓ. FRETE FOB: RODONAVES  ------------------------------------------------------------------------------------------------------------------------ REFERÊNCIAS COMERCIAIS  EMANUEL TURISMO; EMANUEL MODAS; NILSON BRANYL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1099',
    'Serli Aparecida Laroca ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0508',
    'ADORNIE DECORAÇÕES LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '- Sexta  Transportadora - Braspress para FOB   **GRUPO ECONÔMICO** Revenda faz parte do mesmo grupo econômico que C1721; C1542 por isso dividem o mesmo acordo de frete',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1721; C1542 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDE DE FRETE - SOMENTE FOB FREQUÊNCIA DE ENVIO - SEXTA  TRANSPORTADORA - BRASPRESS PARA FOB   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1721; C1542 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS   ----------------------------------------------------------------------------------------------  01/08/2023 - QUEDA DE CATEGORIA - DE FLAGSHIP PARA BASIC  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1721',
    'Adornie Home Decor Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '- Sexta  Transportadora - Expresso São Miguel FOB  **GRUPO ECONÔMICO** Revenda faz parte do mesmo grupo econômico que C1542; C0508 por isso dividem o mesmo acordo de frete',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1542; C0508 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDE DE FRETE - SOMENTE FOB FREQUÊNCIA DE ENVIO - SEXTA  TRANSPORTADORA - EXPRESSO SÃO MIGUEL FOB  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1542; C0508 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS    (MESMA INFORMAÇÃO C0508)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0954',
    'Adriana Altohoff',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1258',
    'ADRIANA DE CASSIA CAMARGO DA SILVA ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1741',
    'Márcio José de Araújo',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1531',
    'Adriana Fernandes de Carvalho',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1263',
    'N.L. AGOSTINI & CIA  LTDA',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 2/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0586',
    'Adriano Giacomet',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0647',
    'AFER ARQUITETURA E CONSTRUÇÕES LTDA - EPP',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'ENDEREÇO DE ENTREGA: R. JÚLIO PERNETA, 407 - MERCÊS, MATRIZ CURITIBA - PR, 80810-110 1X NA SEMANA, FRETE CIF ACIMA DE R$ 700,00 FRETE CIF OU FOB PELA JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1663',
    'Afonso França Construções e Comércio LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'PARA A REDE D''OR SAO LUIZ S.A. FERNANDO ABREU É QUEM ESTÁ A FRENTE, VISITANDO A OBRA E EM CONTATO COM O PESSOAL 12/07/2023 - FEITO CADASTRO COM ALGUMAS INFORMAÇÕES FALTANTES. ENVIADO EMAIL PARA FERNANDO E ELITON SOLICITANDO ESSAS INFORMAÇÕES. --------------------------------------------------------------------------------------- FINANCEIRO:  12/07/2023 - CONSULTA REALIZADA, CONSTA UMA PENDENCIA DE VALOR MUITO PEQUENO. SCORE 0/1000. (ANEXO) 12/07/2023 - CONSULTA REALIZADA NA RED''ODOR, MUITOS PR'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1037',
    'Agape Decorações Comércio e Instalações Eireli',
    'CIF_FOB',
    900.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO ALTERADA PARA ANTECIPADO. 06/06/2018 - CONSULTA REALIZADA, CONSTAM RESTRIÇÕES.   CRISTIANE   LUCAS        (21) 97026-9462   (21) 3416-2389                    ONTATO@AGAPEDECOR.COM.BR FINANCEIRO@AGAPEDECOR.COM.BR         TRANSPORTADORA:  FRETE CIF 1 X SEMANA - ACIMA DE R$ 900,00 31/08/2018 ACORDO DE FRETE FOB: CIF(FOB) COBRAR: ENVIAR CIF E COBRAR NA PROXIMA NF.  **ENDEREÇO DE ENTREGA** ESTRADA DOS BANDEIRANTES Nº 10875  BLOCO: 01 GALPÃO 28',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1303',
    'AGGRUS DO BRASIL',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'PELO BNDES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1685',
    'Namai Decor LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB. TRANSPORTADORA - EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1204',
    'AGIDE MENEGUETTE',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0590',
    'AGOSTINI & GERHARDT LTDA EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1274',
    'Agronorte',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1316',
    'Agropecuária AgroGanchos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1309',
    'Agropecuária da Ilha',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0031',
    'nao usar mais Clinica das Persianas JM Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1304',
    'Agropecuária Dois amigos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1307',
    'Agropecuária Dois Irmãos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1273',
    'Agropecuária Jurerê',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1699',
    'Murilo Ferraz Acabamentos Finos Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1 X NA SEMANA, SEM VALOR MÍNIMO  TRANSPORTADORA CIF E FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1334',
    'Agropecuária Tuiuiú',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1312',
    'Agropet Silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1325',
    'Agropet Sol',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1668',
    'Nathali Passarinho',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MÍNIMO R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL  QUANDO FRETE FOB: TRANSPORTADORA BRASSPRESS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0834',
    'Nathy Decorações Eireli - ME',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    'U UM CHEQUE DE 4K DISSE QUE O DEPOSITO ESTORNOU NA CONTA DELE E QUE ESTAVA MT CORRIDO COM O FINAL DE ANO',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1333',
    'Agroveterinária Brasil',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0148',
    'Ailton Toldo',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0603',
    'Natur Pisos e Revestimentos de Madeira Eireli',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00  TRANSPORTADORA: CIF/FOB JAMEF METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1595',
    'NC DECORACOES LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'TIPO DE FRETE - FOB TRANSPORTADORA - JAMEF *CONFIRMAR COM CLIENTE ANTES*  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0263',
    'M.S.B. Da Silva Decorações - ME',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    'Toda terça e quinta Transportadora: BAUER **Acima de 4,5m solicitar liberação com a transportadora',
    NULL,
    'ativo',
    NULL,
    'MODALIDE DE FRETE: 1X CIF ACIMA DE R$1.500,00 E 1X FOB FREQUÊNCIA DE ENVIO: TODA TERÇA E QUINTA TRANSPORTADORA: BAUER **ACIMA DE 4,5M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. BAUER FAZ ATÉ 4,5M PARA FOZ.  ---------------------------------------------------------------------------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1402',
    'Neide Terezinha Pichler ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'Sempre que estiver pronto   **GRUPO ECONÔMICO** Revenda faz parte do mesmo grupo econômico que C0888 e C1616 por isso dividem o mesmo acordo de frete',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0888 E C1616 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1370',
    'Nelci Aparecida Klaus',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0271',
    'Azimut do Brasil Fabricação de Iates Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'FRETE FOB 2X POR SEMANA - TERÇA/QUINTA  23/11 - JOSI',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0279',
    'Cicero & Delattre Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB SEMPRE, CLIENTE DE TOLDO APENAS.  TRANSPORTADORA: BRASPRESS  11/06/2015 - CONSULTA REALIZADA CFE. DOCUMENTOS NOS ANEXOS - NADA CONSTA.  20/11/2015 - CONSULTA REALIZADA CFE. DOCUMENTOS NOS ANEXOS - NADA CONSTA.  20/01/2016 - CONSULTA RELIAZDA CFE. DOCUMENTOS EM ANEXOS - COM RESTRIÇÃO.  20/04/2016 - CONSULTA RELIAZDA CFE. DOCUMENTOS EM ANEXOS - COM RESTRIÇÃO.  01/07/2016 -  CONSULTA RELIAZDA CFE. DOCUMENTOS EM ANEXOS - COM RESTRIÇÃO.  14/08/2017 - CONSULTA RELIAZDA CFE. DOCUMENTOS EM ANE'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0629',
    'AIRTON LUIZ ROSSETTO INSTALAÇÃO LTDA - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0289',
    'FARIAS E KLEIN LTDA',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 4,5M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'LIGAR PARA TANIA JTB PERGUNTANDO QUANDO SERÁ FEITO DEPÓSITO.   FATURAMENTO: NF  PARA EXPORTAÇÃO SEM ICMS E CODIGO CFOP  6501 UTILIZAÇÃO VENDA.. EXPOR.  MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 4,5M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. BAUER FAZ ATÉ 4,5M PARA FOZ.   26/02 TÂNIA SOLICITOU ENVIAR XML E DANFE PARA O SEU E-MAIL, ALTEREI NO E-MAIL GERAL. GISELE 27/02 - VIDE ANEXO.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0525',
    'Nelson de Camargo Decorações',
    'CIF',
    700.0,
    NULL,
    NULL,
    'DE PEDIDOS 1X POR SEMANA, CIF ACIMA DE R$ 700,00',
    NULL,
    'ativo',
    NULL,
    'ENVIO DE PEDIDOS 1X POR SEMANA, CIF ACIMA DE R$ 700,00. 08/07/13 - ALTERADO PARA BAUER. GISELE ANEXO5 12/06/13 - ENVIO DIRETO PELA ALFA. GISELE ANEXO4'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0869',
    'Alan Castelli - ME',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '---------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0007',
    'Karem Cristina Z. Avila ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0721',
    'NEO DESIGN COMÉRCIO E DECORAÇÕES LTDA',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0694',
    'Alca Network Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0971',
    'Neo Design Decor Comercio e Decorações',
    'FOB',
    NULL,
    NULL,
    'QUARTA 29/11 - Fran',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1293',
    'Aldero Indústria e Comércio de Cortinas Ltda-ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB - SEMPRE QUE ESTIVER PRONTO TRANSPORTADORA: EXPRESSO SÃO MIGUEL   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0142',
    'Aldori Manes de Souza e Cia Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1214',
    'ALESSANDRA MOTTA CORREA SILVANO ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0504',
    'Alex Sandro Fernandes- ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '5 DIAS** 17/10/2018 - IVAN ALTEROU LIMITE, DE 40 MIL PARA 60 MIL, DEVIDO AO PORTAL ESTAR BLOQUEANDO POR CONTA DAS DEVOLUÇÕES',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0733',
    'ALFA DECOR COMERCIO E SERVIÇOS LTDA',
    'CIF_FOB',
    1000.0,
    NULL,
    'Expresso São Miguel',
    '--------------------------------------------------------------------- Frete 2x por semana Frete CIF 1x acima de 1000,00 - SEGUNDA Frete FOB  -  QUARTA 29/11 - Fran   29/08/2018 Acordo frete FOB CIF com cobrança: Enviar CIF e cobrar na proxima NF',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0343',
    'Almefe collor Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0023',
    'Perfect Color Com Car Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0720',
    'NEO INTERIORES COMERCIO E DECORAÇÕES LTDA',
    'CIF_FOB',
    1000.0,
    NULL,
    NULL,
    '----------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1436',
    'Almeida Correa Comercio de Cortinas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1456',
    'ALMODECOR',
    'CIF_FOB',
    1000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1537',
    'NEOLUX PERSIANAS E AUTOMACAO LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1496',
    'Alpex Aluminio S.A',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 3/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1505',
    'Alta Comercio e Decoraçoes',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0030',
    'Elenita Pereira Zacca',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0459',
    'Nercy Barreiros Decorações Ltda Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0003',
    'Altair',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0734',
    'ALTAIR FERREIRA AYRES PERSIANAS ME',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'QUARTA 29/11 - Fran',
    '1x semana ------------------------------------------------------------------------ Frete 2x por semana Frete CIF 1x acima de 1',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0134',
    'Aluvipe Ind. e Com. Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1750',
    'Ozonio Outdoor Living Ltda',
    'CIF',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA  TRANSPORTADORA: JAMEF FRETE CIF 1X POR SEMANA ACIMA R$ 1.500,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1592',
    'Alvarenga e Moreira Projetando Sonhos LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB. TRANSPORTADORA JAMEF.         ____________________________________________________________________________  06/06/2023 - REVENDA INATIVA CONFORME SOLICITADO PELO FERNANDO ABREU'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0414',
    'Alzira & Martins LTDA- ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1528 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0780',
    'Amanda Ambrosio',
    'CIF_FOB',
    700.0,
    NULL,
    'VIP Transportes',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0612',
    'AMAPAR- ASSOCIAÇÃO DOS MAGISTRADOS DO PARANÁ',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1674',
    'NETE E SIL ENXOVAIS LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE FOB 1X NA SEMANA TRANSPORTADORA: REUNIDAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0554',
    'NetSul Informatica LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1580',
    'AMBIENTES & REVESTIMENTOS LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0576',
    'Amboase Manufaturados de Madeira.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1310',
    'Neuhaus Comercio textil e decoracoes eireli',
    'CIF_FOB',
    NULL,
    NULL,
    'CIF a cobrar _____________________________________',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1756',
    'América Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MINIMO R$ 1500,00 TRANSPORTADORA JAMEF  QUANDO FOB: TRANSPORTADORA RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0314',
    'Ana Carolina da Silveira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1295',
    'ANA CRISTINA CARDOSO 04352553980',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0004',
    'Ana Cristina Lubi EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0994',
    'Ana Gardumi Carvalho e Cia ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0338',
    'Ana Karla de Jesus',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0057',
    'Cortinas Rosa Souza Ltda',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    '**DURANTE O MÊS DE NOVEMBRO E DEZEMBRO DESPACHAR OS PEDIDOS CONFORME FICAREM PRONTOS  FRETE CIF - TODA QUARTA-FEIRA. SOLICITAÇÃO DA GISELE EM 17/11/11.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0185',
    'Gliss Indústria e Comércio LTDA EPP',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2x na semana 1 FOB e 1 CIF 1 vez por semana, sem valor mínimo - Cliente Member  Transportadora: Aceville  -----------------------------------------------------------------------------------------------  Informações adicionais:  Das referências comerciais que está na ficha',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0391',
    'Ana Maria da Silva e Silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1610',
    'New Comércio de Produtos para Decoração de Interiores LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0320',
    'Ana Paula da silveira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1416',
    'Ana Paula de Oliveira Xavier da Silva 05064882920',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1253',
    'ANA ROSA MALARA CAPPARELLI',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0066',
    'JM Com. e Prest. de Serviços Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0235',
    'Ana Salete Dos Passos Melo',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1697',
    'NH Comércio de Persianas e Artigos de decoração Eireli',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FOB TRANSPORTADORA JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0560',
    'Niehues e Junkes Decorações LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '05/09/13 Envio de pedidos TERÇAS e QUINTAS, mesma condição da Niehues C0051',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0772',
    'Anderson Cesar Demborguski - MEI',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0051',
    'Niehues Persianas Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'TERÇAS E QUINTAS; -------------------------------------------------- TRANSPORTADORA: OURO NEGRO METRAGEM: ACIMA DE 5,2M SOLICITAR CAMINHÃO MAIOR',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB -------------------------------------------------- FREQUENCIA DE ENVIO: TERÇAS E QUINTAS; -------------------------------------------------- TRANSPORTADORA: OURO NEGRO METRAGEM: ACIMA DE 5,2M SOLICITAR CAMINHÃO MAIOR.  ---------------------------------------------------  ALTERAÇÃO DO LIMITE PARA R$ 10.000,00 (15/08/2018)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0074',
    'Bianca Ampessan - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'TERÇA E QUINTA  TRANSPORTADORA:  REUNIDAS',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB FREQUENCIA DE ENVIO:TERÇA E QUINTA  TRANSPORTADORA:  REUNIDAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0330',
    'Anderson Renato Coelho',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0898',
    'Anderson Thomaz Boeira ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1584',
    'ANDRADE AMBIENTES E REVESTIMENTOS LTDA',
    'CIF_FOB',
    3000.0,
    NULL,
    NULL,
    '– Sexta-feira Transportadora - Rodonaves para CIF e FOB  *Transportadora e valor de CIF alterados dia 17/08/2022 conforme solicitação do Adriano  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'TIPO DE FRETE - CIF 1X SEMANA ACIMA DE R$3.000  FREQUÊNCIA DE ENVIO – SEXTA-FEIRA TRANSPORTADORA - RODONAVES PARA CIF E FOB  *TRANSPORTADORA E VALOR DE CIF ALTERADOS DIA 17/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0081',
    'Decorações Pantanal Ltda EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1300',
    'NILSON DA MOTTA JUNIOR',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0748',
    'Andrade e Ribeiro Persianas Ltda - ME',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '-----------------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    'FRETE: CIF 1 X POR SEMANA, NAS COMPRAS ACIMA R$ 700,00.  BAUER QUANDO FOR CIF. TRANSPORTADORAS, TGM QUANDO FOB. (NÃO ATENDE EM SÃO JOSÉ/ CAROL EXP) ----------------------------------------------------------------------- FREQUÊNCIA DE ENVIO: -----------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1508',
    'NILTON NOGUEIRA',
    'FOB',
    NULL,
    NULL,
    NULL,
    'ASSIM QUE FICAR PRONTO TRANSPORTADORA: RODONAVES PARA FOB  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1288',
    'Andre calderan',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0087',
    'Raras Com. de Tap. Artesanais Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE MERCADORIA, TERÇA E QUINTA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0088',
    'Rarissime Arte e Decoração Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0741',
    'Andre Luis Callegari',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0375',
    'Andre Santiago da Silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0092',
    'Fatima Perdoncini dos Santos ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1740',
    'Nina Carvalho Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0150 ,C1711 E C1451 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FRETE SEMPRE FOB  * ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.  TRANSPORTADORA EXPRESSO SÃO MIGUEL  ***SEMPRE QUE NÃO PUDER ENVIAR PELA EXPRESSO SÃO MIGUEL, ENVIAR PELA ACEVILLE.**NÃO MANDAR POR BAUER   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0150 ,C1711 E C1451 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS'
);

-- Batch 4/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1183',
    'Niplast Assessoria e Comércio Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0831',
    'Nivelux Ind e Com de Cortinas e Persianas Ltda-ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0096',
    'Gabriel Bilck ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1837',
    'Noblesse Luxury Group Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    'Próprio',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA , ACIMA R$ 2.000,00 TRANSPORTADORA : JAMEF  FRETE QUANDO FOB: PRÓPRIO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1700',
    'Andrea L Feine Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE: SEMPRE FOB, TODOS DIAS, QUALQUER DIA SEMANA, TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0476',
    'NOBRE COMERCIO E SERVIÇOS LTDA - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1819',
    'Nobres Cortinas e Persianas Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO TRASNPORTADORA : EXPRESSO SÃO MIGUEL QUANDO FRETE FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0388',
    'ANDREIA BORGES PUBLICIDADE LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1215',
    'Andreia Cristina Waszko ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB TRANSPORTADORA EXPRESSO SÃO MIGUEL    *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0344',
    'Andreia Mara Ramos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0150',
    'Nobri Decor Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    'POR TRANSPORTADORA, ENVIO DAS MECADORIAS APENAS AS TERÇAS E QUINTAS CONFORME SOLICITAÇÃO DO CLIENTE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1711 E C1451 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1469',
    'NOELI ALVES DE ALMEIDA RODRIGUES ENXOVAIS',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0079',
    'Noemi Salete Pinheiro',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0407',
    'Nogara  Comércio de Artigos de Decoração Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'LUIS PREFERE COLETAR OS PEDIDOS AO ENVIAR POR TRANSPORTADORA. GISELE 09/05/13'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0105',
    'Veridiana Wandrei Mafra ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE MERCADORIA, TERÇA E QUINTA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0070',
    'Andreia Regina Duarte ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1296',
    'Andreon & Cia LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1703',
    'Noronha Industria e Comercio de Persianas Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1435',
    'ANDREON DECOR LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1174',
    'NOVO ESPAÇO DECORAÇÃO DE INTERIORES LTDA',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------- 20/0',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0691',
    'Novo Espaço Engenharia Civil Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0439',
    'Novo Visual Cortinas Ltda',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0113',
    'ABC Comercio de Materiais para Escritório LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0692',
    'Andrey de Freitas Eireli - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '--------------------------------------------------------------------  Frete:  FOB  Transportadora: Bauer  07/02/2017 - Condição alterado para antecipado após conversa com Wlademir - Cliente fechou a loja e apenas irá vender direto',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1195',
    'NULLWASTE VENTURE BUILDER TECNOLOGIA E INDUSTRIA DE PERSIANAS EIRELI',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0421',
    'André Bornschein Silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1766',
    'André Rodrigues da Silva 02330729006',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0103',
    'NV Transp. Esc. e Tur. Ltda Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1791',
    'Versateel Envidraçamento de Sacadas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0582',
    'Angelico Francisco Pereira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0123',
    'Maria Adriana Nunes ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0005',
    'Anilton Persianas',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0570',
    'Anna Maya',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0415',
    'NZ Enxovais e Cortinas Ltda ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0712',
    'Antonio Carlos Ferreira Junior - Eireli',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0960',
    'O M Juszkevicz & Cia Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0853',
    'O.J Nascimento Bairfuss',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO DE 10/28/56 PARA ANTECIPADO E LIMITE DE 40K ZERADO. 02/02/2026 - CONSULTA REALIZADA, CONSTAM PENDENCIAS.  SCORE 0/100. (ANEXO) _________________________________________________________________________  REF COMERCIAIS: -STOBAG - CLIENTE DESDE  01/04/2011 BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0089',
    'Antonio Carlos Ribeiro Persianas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0996',
    'Antonio Franceschi',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0426',
    'Ocimar Custódio Cortinas ME',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1x na semana (sexta-feira)  Transportadora: Expresso São Miguel para CIF e FOB *Acima de 3m solicitar liberação com a transportadora',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$1.500 FREQUÊNCIA DE ENVIO: 1X NA SEMANA (SEXTA-FEIRA)  TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB *ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.  *NÃO MANDAR MAIS  PELA JAMEF POIS CLIENTE RECLAMOU QUE DEMORA MUITO  ------------------------------------------------------------------------------------------ *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0080',
    'Odelir Decorações Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'sempre FOB Bauer Express ---------------------------------------------------------  ENVIAR SEMPRE QUE ESTIVER PRONTO',
    NULL,
    'ativo',
    NULL,
    '--------------------------------------------------------- FREQUÊNCIA DE ENVIO:  SEMPRE FOB BAUER EXPRESS ---------------------------------------------------------  ENVIAR SEMPRE QUE ESTIVER PRONTO. 21/11 - FRAN'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1302',
    'ANTONIO MANOEL DE ALMEIDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    'PERSIANA FUNCIONÁRIO VITOR ALMEIDA   ANTONIO MANOEL DE ALMEIDA RG 3424198 1  CPF 430 858 144 34  END: RUA SAO BENEDITO N 144  BAIRRO: SANTOS DUMONT - MACEIO /AL   CEP : 57 075 855',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0642',
    'ANTONIO RESONILDO MONTEIRO ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1275',
    'ANX INCORPORADORA LTDA',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO: _ FORMA DE PAGAMENTO: (  ) CHEQUE PRÓPRIO OU DE CLIENTES? _________________ (X  ) BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0520',
    'Aparatos presentes e decoração Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA METRAGEM:  TRANSPORTADORA: BAUER  24/08/2015 - LIMITE ALTERADO APÓS VERIFICAÇÃO DE ADRIANO E ELITON',
    NULL,
    'ativo',
    NULL,
    'CLIENTE NÃO QUER PAGAR FRETE, PODE AGRUPAR COM O PRÓXIMO SEMPRE. MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA METRAGEM:  TRANSPORTADORA: BAUER  24/08/2015 - LIMITE ALTERADO APÓS VERIFICAÇÃO DE ADRIANO E ELITON. --------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0392',
    'Odorizzi Revestimentos LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X POR SEMANA CIF SEM VALOR MINIMO TODA QUARTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: EXPRESSO SÃO MIGUEL FREQUENCIA DE ENVIO: 1X POR SEMANA CIF SEM VALOR MINIMO TODA QUARTA-FEIRA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1761',
    'Aparecida Fudoli Martins',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0387',
    'APP Escola de Educação Básica Carmem Seara Leite',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0122',
    'AR Persianas Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1320',
    'Aramaico Tapetes e Carpetes Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'AGRUPAR PARA SEXTA-FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL   *VALOR DE FRETE CIF ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    'CONDIÇÃO DE PGOT 10/28/56, APÓS AVALIAÇÃO. 10/06/2025 - ATUALIZAÇÃO CADASTRAL EFETUADA 10/06/2025-  CONSULTA REALIZADA, NADA CONSTA. SCORE 909/1000 27/08/2025 - ALTERAÇÃO CADASTRAL (PRINCIPAL: ENDEREÇO) 27/08/2025 - CONSULTA REALIZADA, NADA CONSTA. SCORE 909/1000 28/01/2026 - CONSULTA REALIZADA, NADA CONSTA. SCORE 742/1000. (ANEXO) 28',
    NULL
);

-- Batch 5/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0708',
    'Aresta Comércio de Persianas Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0215',
    'Argeu & Pereira XXXXX',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0618',
    'Odson Cardoso Filho',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0149',
    'Maria das Graças Mullerxxxxx',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1467',
    'Ari Decor Comércio de Materiais de Construção LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0153',
    'Lobo Alves e Alves Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0129',
    'Aristides Manuel Vilaverde',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0339',
    'Oka Show Room',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1634',
    'ARK ARQUITETOS ASSOCIADOS SS',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1585 E C1634 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'DIRETO PARA LUTAIF  RAZÃO SOCIAL: ARK ARQUITETOS ASSOCIADOS SS CNPJ: 20.858.250/0001-74 ENDEREÇO: RUA ORLANDO PHILLIPI, 100 - SALA 301 - SACO GRANDE - FLORIANÓPOLIS, SC. CEP: 8803-2700 FONE: 48 98816-7114 PAGAMENTO: BOLETO - 28/42/56  INSCRIÇÃO ESTADUAL: ISENTA E-MAIL: ADM.FIN@ARK7.COM.BR ------------------------------------------------------------------------------------------------- FINANCEIRO:  14/02/2023 - CONSULTA REALIZADA, NADA CONSTA. SCORE 934/1000. (ANEXO)  ----------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0137',
    'Okeanos Confecções Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0301',
    'ARMADA YACHTS IND. E COM. DE EMB. NAUTICAS LTDA.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0987',
    'Armazem Decor Ltda ME',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Quinta 17/11 - Fran  -----------------------------',
    'Tentar agrupar os pedidos e enviar juntos 1 x na semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0821',
    'Armazém do Laminado Ltda',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    NULL,
    'Tentar agrupar os pedidos e enviar juntos 1 x na semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO ALTERADA PARA ANTECIPADO. INCLUIDO SERASA E PROTESTADO-  BAIXADO PRA DIVIDA ATIVA8********NAO ATIVAR SEM FALAR COM A KATIA 20/3/18   FUNDAÇÃO EM 04/07/2012 ------------------------------------------ FINANCEIRO: NOVO LIMITE - R$ 15.000,00 - 21/08/14 LIMITE R$ 10.000,00 - ADRIANO - 06/08/14 CONSULTA EM  28',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0479',
    'Olavo Alcides Franke',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0009',
    'Olavo Alcides Franke ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'U EMAIL PARA ADRIANO, REPRESENTANTE E ELITON, DEVIDO AOS ATRASOS FREQUENTES',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0988',
    'Olivio Arnoldo Luzardo',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0186',
    'Olo Comércio Importação e Exportação de Pisos Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0529',
    'Arqdesignrio Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: SEMPRE JAMEF (CIF OU FOB) METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: SEMPRE JAMEF (CIF OU FOB) METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0167',
    'Novos Tempos Com. e Rep Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0006',
    'Arquidesign Com. de Mat. de Acab. Ltda',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'SOMENTE NA SEGUNDAS TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    '03/10/13 ENVIO DE PEDIDO C FRETE CIF ACIMA DE R$ 700,00. ANEXO1 GISELE  FATURAMENTO: MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: SOMENTE NA SEGUNDAS TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1712',
    'ON Projeções Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0404',
    'Arquivo Contabilidade e Consultoria',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1736',
    'Onco Star SP Oncologia LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ONCO STAR SP ONCOLOGIA LTDA CNPJ: 28.290.788/0001-37 R. DR ALCEU DE CAMPOS RODRIGUES, 126 CEP: 04544-000  LOCAL ENTREGA: RUA BANDEIRA PAULISTA, 1189  AS NOTAS FISCAIS E BOLETOS DE COBRANÇA DEVEM SER ENVIADOS PARA O  E-MAIL: RECEBIMENTODENOTAFISCAL@VILANOVASTAR.COM.BR" --------------------------------------------------------------------------------------------  FATURAMENTO: FRETE CIF 1X'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1512',
    'Oneflex Cortinas e Persianas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1624',
    'Orbe comércio de móveis e decoração ltda.',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0176',
    'Ultrapiso Ind, Com, Imp, e Exp. de Pisos e Revest. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0177',
    'Mendes E Santos Ltda Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1631',
    'Orna Decor Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'FOB 1x por semana (toda quinta feira)',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: EXPRESSO SÃO MIGUEL FREQUÊNCIA DE ENVIO: FOB 1X POR SEMANA (TODA QUINTA FEIRA)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0206',
    'Osmar Francisco de Guimarães ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0298',
    'Art & Top Ltda Epp',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0699',
    'Art Kin Enxovais e Confecções Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE: CIF ACIMA DE R$ 700,00.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1376',
    'OSP Indústria de Persianas LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'TODAS AS TERÇAS  - ALTERAÇÃO 13/08/2021 A CIMA DE 3 METROS ENVIAR PELA BAUER ------------------------------------------------------------------------------  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'DOS PEDIDOS, ATÉ REGULARIZAÇÃO DA INSCRIÇÃO ESTADUAL EXUBERANCE. 26/02/2020 - CONSULTA REALIZADA - CONSTAM RESTRIÇÕES  CHEQUES PARA 30/60 DIAS  13/01/2022 - CONSULTA REALIZADA, NADA CONSTA. (ANEXO) SCORE 446/1000. 05/05/2023 - CONSULTA REALIZADA, NADA CONSTA. (ANEXO) SCORE 360/1000. (ANEXO) 25/09/2023 - CONSULTA REALIZADA, CONSTAM PENDENCIAS. SCORE 0/1000. (ANEXO) ___________________________________________________________________________  ACORDO DE FRETE: TRANSPORTADORA CIF E FOB: EXPRESSO SÃO '
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1724',
    'Art Papier Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE: FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1743',
    'Osptecgroup Marketplace ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'TODAS AS TERÇAS   A CIMA DE 3 METROS ENVIAR PELA BAUER  MESMA REVENDA C1376',
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE: TRANSPORTADORA CIF E FOB: EXPRESSO SÃO MIGUEL FRETE CIF  1X SEMANA R$1.500  ENVIO TODAS AS TERÇAS   A CIMA DE 3 METROS ENVIAR PELA BAUER  MESMA REVENDA C1376'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0214',
    'Otto Decorações Ltda EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0631',
    'Ourinhos Decorações Ltda - EPP',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0472',
    'Ozias Wiezel Santos ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    'DE PEDIDOS 1X NA SEMANA, CIF ACIMA DE R$700,00',
    NULL,
    'ativo',
    NULL,
    'ENVIO DE PEDIDOS 1X NA SEMANA, CIF ACIMA DE R$700,00. SEMPRE CIF ENQUANTO FOR POR REDESPACHO, COBRAR ABAIXO DE R$700 ALTERADO PARA BAUER TRANSPORTES, COLOCAR OBS. NA NF **ENTREGAR NA TAP MARINGÁ**. ANEXO2. GISELE 17/04/13 ALTERADO PARA ALFA TRANSPORTES. ANEXO1. GISELE 01/03/13 15/05/13 DIRCE DISSE QUE A BAUER TEM COMO COLETAR NOS SABADOS, NÃO ENTREGAM MAS TEM COMO COLETAR, JÁ A ALFA NÃO TRABALHA NOS SABADOS. BAUER PRAZO DE 4DIAS E ALFA ENTREGA EM 5DIAS. GISELE.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1069',
    'Ozonio Com. e Inst. de Persianas EIRELLI ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0815',
    'Art Persianas e Revestimentos Ltda',
    'FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'TODAS AS QUINTAS TRANSPORTADORA CIF E FOB:  EXPRESSO SÃO MIGUEL 15/08/2022 - FRETE SEMPRE FOB - REVENDA INATIVA ______________________________________________________________________________________  OBS GERAIS (HISTÓRICO) FRETE CIF 1X  SEMANA ACIMA DE R$ 700,00 - CFE',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0874',
    'Douglas Marcelo Almeida',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓSXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL   --------------------------------------------------------------- *DOCUMENTOS NO PORTAL  -----------------------------------------------  19/10/23 - ALTERADA CATEGORIA PARA MEMBER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0194',
    'Jamm Comercio de Cortinas e Divisórias Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1809',
    'P H Oliveira Pereira Comércio de Cortinas e Persianas',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF X NA SEMANA ACIMA R$ 1.500,00 TRANSPORTADORA - EXPRESSO SÃO MIGUEL   FRETE QUANDO FOB: TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1000',
    'Art Windows Ambiente Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1603',
    'Expresso São Miguel Ltda / Palhoca',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0202',
    'Erik Alfredo Barbosa Tabosa – ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1202',
    'Arte da Casa Decorações LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA CIF E FOB: JAMEF FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO  ---------------------------------------------------------------------------------------------------- DADOS DO SOCIO: NOME DO DONO (ÚNICO SÓCIO) - EDUARDO FERRARI ROCHA  CPF: 014.069.396-33 CELULAR: (31) 99589-1881 E-MAIL: EDUARDO@ARTEDACASA.COM.BR  OBS: LOJA FECHA AS 17HRS.  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1744',
    'Exuberance Industria e Comércio de Cortinas e Persianas Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE: CLIENTE NA NOVA MODALIDADE DE FRETE NÃO AGRUPAR  CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0986',
    'D''Antigaria Ltda',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'VIP Transportes',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0204',
    'Andréia Weber Berk ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1718',
    'Arte Decorações Cortinas e Persianas Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X SEMANA SEM VALOR MÍNIMO TRANSPORTADORA: JAMEF  QUANDO FOB TRANSPORTADORA ATUAL CARGAS  ***** A UNILUX LEVA O MATÉRIA ATÉ SÃO PAULO NA TRANSPORTADO PARCEIRA DA REVENDA E O CLIENTE ASSUME O TRANSPORTE DE SP A PALMAS CAPITAL. ******'
);

-- Batch 6/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1485',
    'PADRÃO ARTE E DECORAÇÕES LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0730',
    'ARTE DESIGN MÓVEIS E DECORAÇÕES LTDA EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0669',
    'Arte e Classe Atelier de Cortinas Ltda EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    '-----------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0310',
    'Topfix Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1516 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1854',
    'Paim Cortinas e Persianas Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1272 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL   ----------------------------------------------------------- **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1272 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA SEM VALOR MÍNIMO, É PARA AMBAS. E NÃO 1 CIFS PARA CADA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0209',
    'BM Brasil Comercio de Móveis Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1646',
    'Paim Cortinas LTDA',
    'CIF',
    2000.0,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1272 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL  -------------------------------------------------------------  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1272 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA SEM VALOR MÍNIMO, É PARA AMBAS. E NÃO 1 CIFS PARA CADA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0416',
    'Tibaflex Com. de Pers. e Toldos Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - JAMEF METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - JAMEF METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1219',
    'Pano & Cor a moda em tecidos ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0213',
    '*M&C Decorações e Artesanatos Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1808',
    'GPO Comércio e Representações Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Transmissan',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF X NA SEMANA, VALOR MÍNIMO R$ 1.500,00 TRANSPORTADORA : JAMEF   QUANDO FRETE FOB : TRANSMISSAN'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0419',
    'Papirus Móveis Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1114',
    'ARTE NOSSA SOLUÇÕES PARA HOME & OFFICE LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO:** _ FORMA DE PAGAMENTO**: (   ) CHEQUE PRÓPRIO OU DE CLIENTES? _________________  (X   ) BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0098',
    'Artefatos Prod. e Serv. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0797',
    'PASQUINI, GONCALVES & CIA. LTDA.',
    'CIF',
    700.0,
    NULL,
    NULL,
    'QUINTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0901',
    'Artur Junior da Silva Teixeira',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0425',
    'Decorações Marisa Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    'agrupar para toda SEGUNDA, inclusive ASSISTÊNCIAS',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1687 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X CIF ACIMA DE R$1.500   *SE NÃO ATINGIR CIF, ENVIAR FOB FREQUÊNCIA DE ENVIO: AGRUPAR PARA TODA SEGUNDA, INCLUSIVE ASSISTÊNCIAS. TRANSPORTADORA: BAUER METRAGEM: ACIMA DE 4M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. BAUER CONSEGUE LEVAR ATÉ 4M PARA O CENTRO DE CASCAVEL.  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1687 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00, É PARA AMBAS. E NÃO 1 CIF ACIMA DE 1.500,00 PARA CADA.  '
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0517',
    'AS Comécio de artigos para decoração Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0217',
    'Anderson de Souza Ignacio',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1515',
    'PASSAREDO INDUSTRIA E COMERCIO DE MOVEIS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1690 E C1084 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'DE PEDIDO DIRETO PARA CLIENTE DA REVENDA BGT C1084*  *DOCUMENTOS NO PORTAL  --------------------------------------------------------------------------- EXPEDIÇÃO:  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1690 E C1084 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 2X NA SEMANA SEM VALOR MÍNIMO, É PARA TODAS. E NÃO 2 CIFS PARA CADA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1078',
    'Patricia de S. Simões - ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0008',
    'Astoria Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'RETIRA NA FABRICA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0739',
    'AT Home Decor Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'conforme fica pronto ------------------------------------------------------------------ Transportadora: Ligeirex  Frete FOB 2x por semana - TERÇA/SEXTA  Referencias comerciais:  CATEXTIL COM',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO PARA ANTECIAPDO. 22/01/2020 - ADRIANO RETORNOU EMAIL E AUTORIZOU TROCA DE CONDIÇÃO DE PGTO P/ ANTECIPADO.  03/06/2020 - REGISTRO SPC. (VOCÊ TBM PODE) PRI.  REFERÊNCIA COMERCIAL: BOAS INDICAÇÕES, BOM VOLUME DE COMPRA E PAGAMENTTOS.   FRETE: FOB LISANDRO COLOCOU A INFORMAÇÃO  NÃO APRESENTANDO PELO REPRESENTANTE MODELO A SE TRABALHAR, EMPRESA PARCEIRA DO CLIENTE - MHR EXPRESS. ------------------------------------------------------------------ FREQUÊNCIA DE ENVIO: CONFORME FICA PRONTO ------------------------------------------------------------------ TRANSPORTADORA: LIGEIREX  FRETE FOB 2X POR SEMANA - TERÇA/SEXTA  REFERENCIAS COMERCIAIS:  CATEXTIL COM. DE TEXTEIS - EIRELI: CLIENTE DESDE:2014 ATÉ JAN 2016                 LIMITE DE CRÉDITO: R$ 5.000,00 MÉDIA MENSAL COMPRA:  A CADA 2 MESES COMPRAVAM 3.000,00 CONDIÇÃO DE PAGAMENTO: 60 DIA BOL FORMA DE PAGAMENTO: (  ) CHEQUE PRÓPRIO OU DE CLIENTES? _________________ (X ) BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1224',
    'Atelie By Home Eireli',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1797',
    'Ateliê Design Comercio Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MÍNIMO R$ 2.000,00 TRANSPORTADORA: JAMEF  FRETE FOB: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0219',
    'Patricia Pedra',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0269',
    'Ateliê e Com. de Cortinas Eliane de Paula Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ALTERADA TRANSPORTADORA PARA BAUER - 31/01  07/08/2015 - CONSULTA REALIZADA CFE. DOCUMENTO NOS ANEXOS - CONSTAM PENDÊNCIAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0242',
    'Patricia Tereza ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0816',
    'Ateliê Interiores Decorações Santos Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0423',
    'PAU CANELA MÓVEIS E DECORAÇÕES LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1616',
    'Atena Componentes Textil Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1402 E C1616 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1753',
    'Di Cortinare Ltda - Filial SC',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO: 1606 ------------------------------------ FINANCEIRO  27/11/2024 - CONSULTA REALIZADA, NADA CONSTA',
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MINIMO TRANSPORTADORA SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0444',
    'Paula Costa',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1128',
    'Paula Cristina Coutinho',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1533',
    'ATOS CORTINAS EIRELI',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE: CIF 1X SEMANA NA QUARTA-FEIRA AGRUPAR TODOS OS PEDIDOS DA SEMANA E ENVIAR 1 VEZ SÓ. FRETE FOB: PAULINERIS  ------------------------------------------------------------------------------------------------------------------------ REFERÊNCIAS COMERCIAIS:  ADONAE CORTINAS E BH DECORAÇÕES LTDA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1335',
    'Paulette Renault de Carvalho Pelizzon ME',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0395',
    'ATP DE CAMARGO PERSIANAS ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0819',
    'Paulo César Thum - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1064',
    'Atrio Comércio de Persianas LTDA',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1270',
    'Atualize Decorações LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0670',
    'Paulo Henrique Fernandes Simoes Bezerra',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0356',
    'Arte Cortinas Ltda Me',
    'FOB',
    NULL,
    NULL,
    NULL,
    'DE PEDIDOS 1X NA SEMANA',
    NULL,
    'ativo',
    NULL,
    '16/01/14 ENVIO DE PEDIDOS 1X NA SEMANA. SEMPRE FOB. GI'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0283',
    'Paulo Roberto Pereiraxxxx',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1759',
    'Atualle Design Comercial Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Rodsul',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF, SEM VALOR MÍNIMO TRANSPORTADORA: SÃO MIGUEL  FRETE QUABDO FOB: RODSUL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1826',
    'Audiogene Comercio Importação e Expotação de Produtos Eletronicos Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0805',
    'Augusto Cesár de Souza',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0601',
    'PAULO SERGIO ALVES MADEIRA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0782',
    'PC de Carvalho Junior - ME',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1846',
    'Aviva Decor e Cortina Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO  TRANSPORTADORA : REUNIDAS  QUANDO FRETE FOB: TRANSPORTADORA JERIMIAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1240',
    'PEDRA DA JOAQUINA CONFECCOES E PRESENTES LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 7/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1418',
    'Pedro Arnaldo Anastacio 39283216172',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0248',
    'Elenice Terezinha Nemitz Decorações',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368 ATENÇÃO: PARA NOTAS COM FRETE CIF ATÉ R$ 1.000,00 SEMPRE ENVIAR PELA BAUER.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1774',
    'AVOC Reparação e Manutenção Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE FOB 1X NA SEMANA, SEM VALOR MÍNIMO. TRANSPORTADORA: RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1815',
    'AVR Industrial LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0083',
    'Pedro Joenck ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0162',
    'Pedro Manoel Filho Comercio ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0085',
    'Azenate Altamiro Ferreira ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0723',
    'Pellegrinelli Distibuidora de Madeiras LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1608 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0775',
    'Kappadecor Comércio de Artigos para Decorações Ltda - ME',
    'CIF_FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    '1X NA SEMANA TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB   ------------------------------------------------------------------------------------------------------- *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF SEM VALOR MINIMO FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB   ------------------------------------------------------------------------------------------------------- *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1686',
    'B. Transportes LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0505',
    'Pereira Goulart & Silva LTDA',
    'CIF',
    700.0,
    NULL,
    NULL,
    'DE PEDIDOS 1X NA SEMANA, FRETE CIF ACIMA DE R$ 700,00',
    NULL,
    'ativo',
    NULL,
    'ENVIO DE PEDIDOS 1X NA SEMANA, FRETE CIF ACIMA DE R$ 700,00. GISELE 26/04/13. ANEXO4'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1716',
    'B. Transportes LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c1230',
    'B. Transportes ltda. - Curitiba / PR',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0120',
    'Adriana de Fatima Vanelli & Cia Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    'toda segunda-feira Transportadora: Expresso São Miguel para CIF e FOB  *Valor de frete CIF alterado dia 26/08/2022 conforme solicitação do Adriano  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$1.500,00 FREQUÊNCIA DE ENVIO: TODA SEGUNDA-FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB  *VALOR DE FRETE CIF ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0133',
    'Perfil Persianas Ltda ME INATIVO',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1290',
    'B.Transportes Ltda. Chapecó',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1575',
    'PerfilMaster',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1524',
    'B.Transportes Ltda. Chapecó',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1622',
    'B2haus Decoração Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0972',
    'Bacre Construções Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1342',
    'BADEN INTERIORES LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1185',
    'BANCO BMG SA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1024',
    'Baptista Cortinas Eireli',
    'CIF_FOB',
    1000.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1255',
    'BARACCHINI TOLDOS E PERSIANAS LTDA-ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1443',
    'BARBARA RODRIGUES',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0274',
    'Lucy Aparecida Rocha Marcondes',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0275',
    'Renova Persianas e Cortinas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0991',
    'Perfiltec Tecnologia em Aluminios e Vidros Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1389',
    'Barbara Rodrigues Eirele',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0620',
    'Rodrigues & Nuguli Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1X NA SEMANA TODA QUARTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF ACIMA DE R$1.500 FREQUENCIA DE ENVIO: 1X NA SEMANA TODA QUARTA-FEIRA. TRANSPORTADORA: REUNIDAS  FRETE QUANDO FOB? TRANSPORTADORA APUCARANA.  *MODALIDADE DE FRETE ALTERADA DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0464',
    'SORIAN CORTINAS E DECORAÇÕES LTDA - ME',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    '----------------------------------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    '29/08/13 - ALTERADO PARA BAUER POR SOLICITAÇÃO DA CLIENTE. FALEI COM JOSI. GISELE FRTE: FOB ---------------------------------------------------------------------------------------- FREQUÊNCIA DE ENVIO: ----------------------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1755',
    'Barolo Alimentos Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO CLIENTE FINAL - REVENDA AMÉRICA DECORAÇÕES  PAGAMENTO: SINAL R$ 20.361,58, SALDO EM 28/56/84  -------------------------------- FATURAMENTTO  FRETE SEMBRE FOB TRANSPORTADORA JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1829',
    'Pergosystem Comércio e Importação de Pergolas Toldos e Acessórios',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    'GRUPO ECONÔMICO : PERGOSYSTEM (C1829,C1829 E C1830)  ------------------------------------------ FINANCEIRO  24/02/2026: CONSULTA REALIZADA, CONSTAM PENDÊNCIAS',
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA TERÇA E QUINTA TRANSPORTADORA : RODONAVES QAUNDO FRET FOB: RODONAVES   *****SEMPRE QUE FOR ALGO DA UNISP, SAIR COMO CIF*******'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1305',
    'Perka zza Tecidos e Persianas',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1135',
    'Barrahouse Cortinas LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'DO KIT NO VALOR DE R$ 970,00  COM ELAS',
    NULL,
    'ativo',
    'CONDIÇÃO 10/28/56 DIAS. PRAZO PARA NOVA AVALIAÇÃO 90 DIAS"  TRANSPORTADORA: JAMEF FRETE CIF 1X POR SEMANA ACIMA DE 1.000,00 30/08/2018 ACORDO DE FRETE FOB: CIF(FOB) COBRAR: ENVIAR CIF E COBRAR NA PROXIMA NF.  ANALISE DO REPRESENTANTE: BARRA HOUSE, A MELHOR REVENDA CRIATIVA NO RJ, A INTENÇÃO DE UMA DAS SÓCIAS É TRABALHAR COM EXCLUSIVIDADE, JÁ A OUTRA, POR AINDA NÃO NOS CONHECER QUER COMEÇAR SE COMPROMETENDO EM 50%, OU SEJA, VÃO TROCAR METADE DO SHOW-ROOM, EXPOR NOSSOS PRODUTOS NOS PONTOS PRINCIPAIS DA LOJA. A LOJA ESTÁ NA BARRA DA TIJUCA COM EXCELENTE LOCALIZAÇÃO. TABELA 20% + TABELA 3. NA CRIATIVA TINHA PRAZO DE 28/56/84.ESTANDO TUDO OK ME INFORME PARA EU PODER ALINHAR O ENVIO DO KIT NO VALOR DE R$ 970,00  COM ELAS.  REFERENCIA COMERCIAL: BUCALO: "O CLIENTE: BARRAHOUSE COMPRA CONOSCO: MARÇO/2013 ÚLTIMA COMPRA: 06/2017 – R$ 157,00 MAIOR COMPRA: 01/2017 – R$ 4.400,00 FORMA DE PAGAMENTO: BOLETO PRAZOS: 30/60',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0466',
    'Codalle Cortinas e Decorações Ltda - ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'EMITIR PICKING SEMPRE POR PEDIDO, EMBALAGEM SEPARADA DE PEDIDOS; _____________________________________________________________  ACORDO DE FRETE:    FRETE CIF 1X POR SEMANA TRANSPORTADORA CIF: RODONAVES TRANSPORTADORA FOB: RODONAVES  PEÇAS A CIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0191',
    'PERSIANAS CRISDAN LTDA EPP',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    'DE PEDIDOS 2X NA SEMANA, CIF ACIMA DE R$ 700,00 - SÃO MIGUEL FRETE CIF ACIMA DE 3,00 DE LARGURA, ENVIAR PELA BAUER,',
    NULL,
    'ativo',
    NULL,
    '15/08/2022 - ALTERADO MODALIDADE DE FRETE PARA FOB FRETE FOB ENVIAR POR FLASH.   ENVIO DE PEDIDOS 2X NA SEMANA, CIF ACIMA DE R$ 700,00 - SÃO MIGUEL FRETE CIF ACIMA DE 3,00 DE LARGURA, ENVIAR PELA BAUER,'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0285',
    'Vivenda Litalia Decorações Ltda EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0287',
    'Sales Com. e Inst. de Divisórias',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1321',
    'BARROS IMPRESSAO DIGITAL EIRELLI EPP',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0842',
    'Barroso Artes e Decorações Ltda Me',
    'FOB',
    NULL,
    NULL,
    NULL,
    'Tentar agrupar os pedidos da semana e enviar 1x FOB',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0364',
    'Bauer Transportes Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0967',
    'Bay Window Cortinas e Persianas Ltda',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0290',
    'LPF Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1573',
    'BCCB COMERCIO DE TECIDOS DECORATIVOS LTDA EPP',
    'FOB',
    NULL,
    NULL,
    'Alfa Transportes',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0010',
    'BD Detalhes  Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0801',
    'Beare Decor Persianas Cortinas e Revestimentos Decorativos Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x na semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1730',
    'Solange Demartini',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓSXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0369',
    'Beatriz & Mariana Correia Arquitetas Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0502',
    'Persianas Elmo LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);

-- Batch 8/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1764',
    'Beatriz Cortinas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1149',
    'BEATRIZ SCARAMUSSA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO, CLIENTE FINA DA REVENDA CASA TOME. SERÁ UMA ÚNICA COMPRA E O PAGAMENTO ANTECIPADO.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0681',
    'PERSIANAS KAZZA LTDA - EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1799',
    'Beau Blanc Home Por Paula Martendal Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO. TRANSPORTADORA: EXPRESSO SÃO MIGUEL  TRANSPORTADORA FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0592',
    'Casa a Caso LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1213',
    'Becker Moveis Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1284',
    'Persianas Persibento LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0072',
    'Persianas Sudan e Luzia Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0114',
    'Bella C. e Acessórios Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE MERCADORIA, TERÇA E QUINTA',
    NULL,
    'ativo',
    NULL,
    'ENVIO DE MERCADORIA, TERÇA E QUINTA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0227',
    'Persianas Super Luxo Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1715',
    'Bella Cortinas e Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'U EMAIL PARA ADRIANO, REPRESENTANTE E ELITON SOBRE OS ATRASOS FREQUENTES',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0012 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA,SEM VALOR MINIMO - QUINTA FEIRA TRANSPORTADORA :  EXPRESSO SÃO MIGUEL METRAGEM: ACIMA DE 5,20M SOLICITAR CAMINHÃO MAIOR COM A REUNIDAS.   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0012 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE.   ---------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0742',
    'Bella Decor Decorações Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1683',
    'Bellary Home Decor LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Águia Azul',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X CIMA DE R$1.500,00 TRANSPORTADORA CIF: JAMEF TRANSPORTADORA FOB: AGUIA AZUL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0351',
    'Bellas Cortinas Ltda ME',
    'CIF',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA ACIMA DE R$1.500 - QUINTA FEIRA TRANSPORTADORA: BAUER METRAGEM: ACIMA DE 5,20M SOLICITAR CAMINHÃO MAIOR COM A REUNIDAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1098',
    'BELMOBILE COMERCIO DE MOVEIS E DECORAÇÕES',
    'CIF',
    700.0,
    NULL,
    NULL,
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    'CONDIÇÃO DE PGTO ALTERADOS DE ANTECIPADO PARA 10/28/56 LIMITE 20MIL VERIFICAR ANEXO REF  EMAIL  DE CREDITO   16/03/2018 - CONSULTA REALIZADA, CONSTAM RESTRIÇÕES. (ANEXO) 21/03/2018 - CONDIÇÃO DE PAGAMENTO ALTERADA PARA ANTECIPADO. CLIENTE TEM BOLETO DE R$585,00 VENCIDOS DESDE 15/03 E HOJE ENTROU EM CONTATO QUERENDO PRORROGAR POR MAIS 20 DIAS.  09/04/2018 - CONSULTA REALIZADA, CONSTAM RESTRIÇÕES.    TRANSPORTADORA: EXPRESSO SÃO MIGUEL FRETE CIF 1X POR SEMANA ACIMA DE R$ 700,00  ANALISE DO REPRESENTANTE: LOJISTA TRABALHA ATUALMENTE SOMENTE COM PERSOL, NÃO POSSUI PEDIDOS TODAS AS SEMANAS, MAS SUAS VENDAS SÃO DE BOM VALOR. SUGESTÕES: LIMITE DE CREDITO DE R$ 10.000,00. FRETE CIF 1X POR SEMANA (ACIMA DE 700). TABELA PROMO.  REFERENCIAS COMERCIAIS: MADELEI NÃO PASSA REFERENCIA COMERCIAL.  ALUMIGLASS: A EMPRESA TEM POR POLITICA NÃO FORNECER VALORES DAS COMPRAS REALIZADAS, MAS SEGUE ABAIXO INFORMAÇÕES QUE FORNECEMOS: 1ª COMPRA 12/05/2010 ÚLTIMA COMPRA 20/03/2017 PAGTO POR BOLETO 28',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1723',
    'RCL Gessos Decorativos Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO. TRANSPORTADORA JAMEF PARA CIF E FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0233',
    'PERSIANAS VERTISUL INDÚSTRIA E COMÉRCIO LTDA -ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0922',
    'Benir Decor Persianas Cortinas e Revestimento Decorativos Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x na semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0606',
    'Benjamim Guerra Junior',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1346',
    'Bernardo Robaskewicz Eireli Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0216',
    'PERSIFLEX IND. E COM. DE PERSIANAS DECORAÇÕES E CONFEC  LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0719',
    'Berté & Braun Ltda ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA   TRANSPORTADORA: BAUER',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA   TRANSPORTADORA: BAUER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0810',
    'Persilex Comércio de Decorações de Interiores Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0812',
    'Bervas Comercio de Pisos e Cortinas Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1047',
    'BETH SALLOUM DECORAÇÕES EIRELI - ME',
    'CIF_FOB',
    NULL,
    NULL,
    'CIF com cobrança na proxima NF',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0465',
    'Donassolo e Ramos Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    'PEDIDOS TODA SEGUNDA METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: PEDIDOS TODA SEGUNDA METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0136',
    'Persipólis Ind. e Com. LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1676',
    'BETTIO COMERCIO DE MOVEIS LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1052 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA (SEM VALOR MINIMO )   **AGRUPAR SEMPRE QUE POSSIVEL**  CIF E FOB -  SÃO MIGUEL.  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1052 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 2X NA SEMANA SEM VALOR MÍNIMO, É PARA AMBAS. E NÃO 2 CIFS PARA CADA.  -----------------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0951',
    'Persolflex ind e Comercio de Persianas LDTA.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1176',
    'Persolle Industria e Comércio de Persianas ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1810',
    'Linea Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MÍNIMO R$ 1.500,00 TRANSPORTADORA : JAMEF   QUANDO FRETE FOB: MELHOR CONDIÇÃO DE FRETE.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0357',
    'PERSONAL ART LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0437',
    'Bilha e Silva LTDA ME',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB  *VALOR DE FRETE CIF ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO   *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 1.500,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB  *VALOR DE FRETE CIF ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0514',
    'Bilmayer e Bilmayer LTDA ME',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0420',
    'AFFARI VIVENDA INDUSTRIA E COMÉRCIO LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0548',
    'Bisa Persianas e Decoração e Prestação de Serviços Eireli ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1124',
    'Bless Decorações LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0646',
    'PERVILLE ENGENHARIA E EMPREENDIMENTOS S/A',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0858',
    'Bloedow e Medina comercio de moveis planejados LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1294',
    'Pet Mania Clínica Veterinária e Pet Shop',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1831',
    'Blue Sea Hotel Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DE UMA RMA DO CLIENTE FINAL DA SPATHER. LIVANOS QUIS ATENDER, JÁ QUE A REVENDA ENROLOU, E O CLIENTE FINAL ESTAVA COM PROBLEMAS. CLIENTE FINAL É UM HOTEL.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1186',
    'BMG SEGUROS S.A',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0489',
    'MD Ambiental Decoração e Lazer  Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: SEMPRE JAMEF (BAUER NÃO ATENDE TAUBATÉ/SP) METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE CIF E COBRAR FRETE POSTERIORMENTE NAS NOTAS ABAIXO DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: SEMPRE JAMEF (BAUER NÃO ATENDE TAUBATÉ/SP) METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0350',
    'Karine Suzana da Silva Mota ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c0376',
    'Bograntex Indústria do Vestuário Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1262',
    'PETIT DECOR COMERCIO E DECORAÇÕES LTDA',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0711',
    'Bonilha e Machado Ltda - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0913',
    'Bracale & Bracale Ltda.',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0410',
    'Petróleo Brasileiro SA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0518',
    'Ph Decor Comercio de Cortinas e Decorações',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 9/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0014',
    'Phillippe S. de Souza ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0324',
    'Braghini & Celante Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1503',
    'PINCELAR COMERCIO DE REVESTIMENTOS DE PAREDE LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1696',
    'Braho Administrção de Bens LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    '---------------------------------------------------------------------------------------- FATURAMENTO:  FRETE FOB TRANSP: EXPRESSO SÃO MIGUEL  -------------------------------------------- 11/04/24  REVENDA INATIVADA - SOLICITADO PELO ADRIANO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1611',
    'PINTURA STORE - TINTA, REVESTIMENTO E DECORACAO EIRELI',
    'CIF',
    NULL,
    NULL,
    NULL,
    '– Sempre que estiver pronto Transportadora - Expresso São Miguel',
    NULL,
    'ativo',
    NULL,
    'TIPO DE FRETE - FRETE CIF 1X POR SEMANA SEM VALOR MINIMO FREQUÊNCIA DE ENVIO – SEMPRE QUE ESTIVER PRONTO TRANSPORTADORA - EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1404',
    'Pintura Store - Tinta, Revestimento e Decoração Ltda - Matriz',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1 X NA SEMANA SEM VALOR MÍNIMO TRANSPORTADORA EXPRESSO SÃO MIGUEL   QUANDO FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0594',
    'Brasília Empreendimentos Serviços e Participações LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO ANTECIPADO PELO REPRESENTANTE RICARDO   -------------------------------------------------------------------------------------------------------------------- FATURAMENTO:  TRANSPORTADORA: JAMEF - FOB METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368 ********************* ENDEREÇO DE ENTREGA: SHN QUADRA 05 LOTE L BLOCO J ASA NORTE BRASILIA / DF – CEP 70.705.000.  ----------  10/06/2024 - REVENDA REATIVADA CONFORME SOLICITADO PELO REPRESENTANTE. PAGAMENTO ANTECIPADO',
    'TRANSPORTADORA: JAMEF - FOB METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368 ********************* ENDEREÇO DE ENTREGA: SHN QUADRA 05 LOTE L BLOCO J ASA NORTE BRASILIA / DF – CEP 70.705.000.  ----------  10/06/2024 - REVENDA REATIVADA CONFORME SOLICITADO PELO REPRESENTANTE. PAGAMENTO ANTECIPADO. 09/07/2024 -  REVENDA INATIVADA CONFORME SOLICITADO PELO REPRESENTANTE'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0512',
    'Brise Comercio de Tecidos e Decorações',
    'CIF',
    700.0,
    NULL,
    NULL,
    'DE PEDIDOS 1X POR SEMANA CIF ACIMA DE R$ 700,00',
    NULL,
    'ativo',
    NULL,
    'ENVIO DE PEDIDOS 1X POR SEMANA CIF ACIMA DE R$ 700,00. GISELE 17/04/13 - ANEXO 4 03/03/2014- MUDANÇA DE ENDEREÇO, EM ANEXO***MANUELA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1194',
    'BRISE DECOR EIRELI ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0462',
    'Pisos & Formas Eireli LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1725 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0370',
    'CAJOMAR COM DE MAT DE CONST LTDA EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1347',
    'Bruna Can.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1725',
    'Bruno Patrício Tavares',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0462 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0454',
    'Pizzolatti Com. de Equip. Ltda ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'SOMENTE NAS SEXTAS ----------------------------------------------------- TRANSPORTADORA: BRASIL SUL AGORA É ACEVILLE  FRETE: 30/07/2015 - CONFORME DOCUMENTO NOS ANEXOS, SOLICITADO PELO CLIENTE, MUDAR PARA TRANSPORTADORA BRASIL SUL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB ----------------------------------------------------- FREQUENCIA DE ENVIO:SOMENTE NAS SEXTAS ----------------------------------------------------- TRANSPORTADORA: BRASIL SUL AGORA É ACEVILLE  FRETE: 30/07/2015 - CONFORME DOCUMENTO NOS ANEXOS, SOLICITADO PELO CLIENTE, MUDAR PARA TRANSPORTADORA BRASIL SUL.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0212',
    'Bucaro Artes y Flores Com Importação e Exportações Artisticas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0228',
    'Piú Bello Decorações de Interiores Ltda - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana  Transportadora: Bauer, sempre FOB',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1318',
    'Bueno Pet''s',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0535',
    'Bugay Acabamentos Especiais LTDA -ME',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'UMA VEZ SEMANA  ------------------------------------------------- TRANSPORTADORA: BAUER (CIF OU FOB) -------------------------------------------------  20/05/19 - CADASTRO ATIVADO (AUTORIZADO ADRIANO) COND',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB ------------------------------------------------- FREQUENCIA DE ENVIO: UMA VEZ SEMANA  ------------------------------------------------- TRANSPORTADORA: BAUER (CIF OU FOB) -------------------------------------------------  20/05/19 - CADASTRO ATIVADO (AUTORIZADO ADRIANO) COND. DE PG ANTECIPADO  *** INATIVADA POR ADRIANO/RICARDO EM 15/01/21'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1256',
    'PLANEJ DECORAÇÕES PIRACICABA ME LTDA',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1751',
    'Byesol Cortinas e Persianas Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO: C1332, C1158  ----------------------------------- FINANCEIRO  28/10/2024: CONSULTA REALIZADA,NADA CONSTA',
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA , VALOR MÍNIMO R$ 1.500,00 TRANSPORTADORA JAMEF QUANDO FOB: RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0485',
    'Búzios Incorporação Imobiliaria Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0082',
    'PN Comercio e Serviços Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0914',
    'C & E Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'FRETE CIF 1 VEZ POR SEMANA, SEM VALOR MÍNIMO - CLIENTE MEMBER QUANDO FOR FOB - EXPRESSO SÃO MIGUEL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1494',
    'Poieses Decorações LTDA ME',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1306',
    'Point Transportes LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0384',
    'HF cortinas e persianas LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: ALVORADA SOLICITAÇÃO DE COLETA: SOLICITAR A COLETA ATÉ NO MÁXIMO 17HS, CASO A TRANSPORTADORA NÃO CUMPRA ESTE HORÁRIO, OS PEDIDOS PODEM SER DESPACHADOS PELA BAUER',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: ALVORADA SOLICITAÇÃO DE COLETA: SOLICITAR A COLETA ATÉ NO MÁXIMO 17HS, CASO A TRANSPORTADORA NÃO CUMPRA ESTE HORÁRIO, OS PEDIDOS PODEM SER DESPACHADOS PELA BAUER. METRAGEM: ACIMA DE 4M VERIFICAR COM A TRANSPORTADORA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0936',
    'C E L M de Souza Leão',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1171',
    'POLIDUR COMERCIO DE TINTAS LTDA',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0181',
    'Polimetas eng. e Repres. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0626',
    'C. Barbosa Branco Cortinas - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'POR TRANSPORTADORA 1X NA SEMANA, AS VEZES COLETA NO BALCÃO, MAS AGENDA COM ANTECEDÊNCIA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1850',
    'C. Estilo Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA , QUARTA-FEIRA, SEM VALOR MÍNIMO TRANSPORTADORA : REUNIDAS  QUANDO FRETE FOB: ARLETE'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1131',
    'C. M. C. MATTOS COMÉRCIO VAREJISTA DE ARTIGOS DE TAPEÇARIA, CORTINAS',
    'CIF_FOB',
    NULL,
    NULL,
    'CIF com cobrança na proxima NF',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0528',
    'Paula e Soraya Acabamentos e Decorações Ltda-Me',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: BRASPESS  METRAGEM: ATÉ 2M BRASPRESS T007, ATÉ 4,5M JAMEF T0308',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: BRASPESS  METRAGEM: ATÉ 2M BRASPRESS T007, ATÉ 4,5M JAMEF T0308'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1599',
    'C.VALE - Cooperativa Agroindustrial',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1041; C1654; C1692 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0428',
    'Pollyane Keterine Verplotz',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0649',
    'Pollyane Keterine Verplotz',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1654',
    'C.VALE - COOPERATIVA AGROINDUSTRIAL',
    'CIF',
    NULL,
    NULL,
    NULL,
    'U A FICHA CADASTRAL CORRETA',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1599; C1041; C1692 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1692',
    'C.VALE - COOPERATIVA AGROINDUSTRIAL',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1599; C1654; C1041 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FRETE 1X FOB EXPRESSO SÃO MIGUEL   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1599; C1654; C1041 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00, É PARA TODAS. E NÃO 1 CIF ACIMA DE 1.500,00 PARA CADA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0931',
    'Cadona e Lunardi Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '-----------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0910',
    'Power Garcia Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x semana   ----------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1559',
    'CAIO OLIVEIRA FLORES',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0241',
    'Calegari Comercio de Decorações Ltda EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ALTERADO PARA TRANSPORTADORA OURO NEGRO QUANDO FOB  ______________________________________________________________________________  ACORDO DE FRETE:  21/11/23 - *** CLIENTE RETIRA MATERIAL (EMABALADO) NO BALCÃO - CLIENTE VEM BUSCAR TODAS AS QUINTAS  16/10/2019 - CASO NECESSÁRIO - FRETE FOB (TRANSPORTADORA OURO NEGRO QUANDO FOB)  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0716',
    'Calver Diniz',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1784',
    'Camila Fernanda Oliveira Hespanhol',
    'FOB',
    NULL,
    NULL,
    'Avaliar',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB: AVALIAR'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0396',
    'Camila Santiago da Silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1648',
    'PREFEITURA MUNICIPAL DE ERVAL GRANDE',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1395',
    'Caminho Novo Comércio Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1535',
    'CAMPFLEX MÓVEIS PARA ESCRITÓRIO EIRELLI',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0300',
    'Prefeitura Municipal de Paulo Lopes - SC',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0299',
    'Prefeitura Municipal de Sao Joao Batista',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 10/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0372',
    'Campos de Oliveira Decorações LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    'ENVIO 1X NA SEMANA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB  ------------------------------------------------------------------------------------- FREQUENCIA DE ENVIO: ENVIO 1X NA SEMANA. ACORDO ELIS. GISELE 19/05/14 ------------------------------------------------------------------------------------- TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 4,5M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. BAUER FAZ ATÉ 4,5M PARA FOZ. ACIMA DE 4,5M REUNIDAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1338',
    'Canassa e Medeiros Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'QUANDO FICAR PRONTO TRANSPORTADORA: JAMEF  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB FREQUENCIA DE ENVIO: QUANDO FICAR PRONTO TRANSPORTADORA: JAMEF  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0399',
    'Adonis Alvarenga',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0668',
    'Candida Terezinha da Silva Bruchado - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0363',
    'Premium Comércio de Persianas, cortinas e Papéis de parede EIRELI- ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    '29/07 FERNANDA SOLICITOU ALTERAÇÃO DE E-MAIL PRINCIPAL DO CADASTRO. GISELE.  PROMOÇÃO 10% DESCONTO NO PRODUTOS ROLLO/ROMANA/PHA50 CODIGO: PROMO 10 VALIDA ATÉ 15/03'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1232',
    'Cantinho da Maria',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0550',
    'Colorata Decorações LTDA.',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB ( BRASSPRESS )   --------------------------------------------------------- TRANSPORTADORA: PARA PEÇAS DA ASSISTENCIA ENVIAR FRETE CIF ( BAUER )  METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0985',
    'CANTO VERDE COMERCIO DE ARTIGOS DE ILUMINAÇÃO MÓVEIS DECORAÇÕES E PAISAGISMO LTDA EPP',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0455',
    'Capital Pisos e Decoraçoes LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1087',
    'Primuss Persianas Especiais Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO :BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c0524',
    'Priscila  Abi-Zaid',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1091',
    'Santa Decor Comercio de Artigos de Decoração EIRELI-EPP',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA SEXTA (CIF) TRANSPORTADORA BRISTOT  ---------------------------------------------------------------------------------------------------------------------------------- ANÁLISE REPRESENTANTE  OBS',
    NULL,
    'ativo',
    NULL,
    'FREQUENCIA DE ENVIO: 1X NA SEMANA TODA SEXTA (CIF) TRANSPORTADORA BRISTOT  ---------------------------------------------------------------------------------------------------------------------------------- ANÁLISE REPRESENTANTE  OBS.REVENDA RECÉM ABERTA, PORÉM DE UMA PARCERIA JÁ CONSOLIDADA. NÃO TEM REFERÊNCIAS COMERCIAIS COM ESTE CNPJ. POIS A EMPRESA AINDA NÃO FOI INAUGURADA. REVENDA EXCLUSIVA UNILUX EM RONDONÓPOLIS E REGIÃO METROPOLITANA. INICIALMENTE TRABALHAREMOS COM NEGOCIAÇÃO ANTECIPADA. C'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0961',
    'Carioca Christiani Nielsen Engenharia',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0143',
    'Carlos Alberto Marques Machado EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1606',
    'Di Cortinare LTDA',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0977',
    'Priscila Cardoso Vieira ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0927',
    'Carlos Mello da Silva',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA -----------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0656',
    'Carol Comércio de Cortinas EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1278',
    'Carolina Monteiro de Barros Piran',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA QUINTA-FEIRA',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO:   30/60',
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: 1X NA SEMANA TODA QUINTA-FEIRA. TRANSPORTADORA: RODONAVES  *TIPO DE FRETE CIF ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  ----------------------------------------------------------------------------- REFERENCIA COMERCIAL:  R CERVELLINI: CLIENTE DESDE: ABRIL 2017                 LIMITE DE CRÉDITO: R$  10.000,00 MÉDIA MENSAL COMPRA: 1.000,00 A 2.000,00 MAIOR COMPRA: 23/06/2017  = 3088,00 CONDIÇÃO DE PAGAMENTO:   30/60/90 FORMA DE PA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0917',
    'Progetto Persianas Sob Medida Ltda - EPP',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1282',
    'CARVALHO ALMEIDA SERVIÇOS MÉDICOS',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1630',
    'Casa A  Interiores Móveis e Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA:  TRANPORTADORA FOB: VPEX'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0990',
    'Casa Antiga Serviços Web',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO 7.692,47   - VALOR DE CUSTO REVENDA ------------- 6.099,36 1.036,89 - IMPOSTO ------------- 5.062,46 - CREDITO PARA REVENDA OM JUCKEWIKS    FINANCEIRO: CONSULTA SERASA EM 25/10/16 - NADA CONSTA.   SÓCIOS:  ÉDER MAPELLI   BIBIANE SARTORI   MARCELO MORAES DAS NEVES   (54) 3905.3700   (54) 3905.3700   (54) 3905.3700   EDER@CASAANTIGA.RS   BIBIANE@CASAANTIGA.RS  MARCELO@CASAANTIGA.RS   899.977.190-34   528.178.810-87   003.571.340-28   RUA SENADOR SALGADO FILHO, 447 CENTRO RUA SENADOR SALGADO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0256',
    'Casa Bela Cortinas e Persianas Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'TERÇA E QUINTA METRAGEM: ENVIAR NO MÍNIMO 2 PEDIDOS***   24/08/2015 - CONSULTA REALIZADA CFE',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:  FOB   TRANSPORTADORA: OURO NEGRO FREQUENCIA DE ENVIO: TERÇA E QUINTA METRAGEM: ENVIAR NO MÍNIMO 2 PEDIDOS***   24/08/2015 - CONSULTA REALIZADA CFE. DOCUMENTO NOS ANEXOS - CONSTAM PENDÊNCIAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0431',
    'Casa Sato Ltda',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF -1X SEMANA - ACIMA DE R$ 700,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1250',
    'CASA BONITA COMÉRCIO DE CORTINAS LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1673',
    'PROJETO ALUMINIO LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0486',
    'Casa Bonita Decorações Ltda ME',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: SE FOB/CIF BAUER METRAGEM:',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: SE FOB/CIF BAUER METRAGEM:'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0510',
    'Promacal Comercio de Tecidos LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0442',
    'Rozainski & Zeni Decorações LTDA Me',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: BAUER METRAGEM: ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: BAUER METRAGEM: ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0443',
    'Via Decorações Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0050',
    'Estaleiro Schaefer Yachts S/A',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0446 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FRETE FOB: TRANSPORTADORA FOB: DISK & TENHA    LLUI"REGIME DE ICMS-ST NÃO APLICÁVEL CONFORME ART. 228, INCISO LL, ANEXO 3 DO RICMS-SC" "ICMS PRÓPRIO DIFERIDO CONFORME ART.177, INCISO LL, ANEXO 2 DO RICMS-SC". PROCESSO Nº SEF 22218/2010 TTD DO DESTINATÁRIO Nº 105000001169000  COLOCAR OBS DE IMPOSTO NA NF ________________________________________________________________________________________________ EXPEDIÇÃO:  CLIENTE BALCÃO. CASO PRECISE ENVIAR: FOB  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0400',
    'Pronto Revestimentos LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0537',
    'Raquel Palombo Bacaleinik',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368 ATENÇÃO: PARA NOTAS COM FRETE CIF ATÉ R$ 1.000,00 SEMPRE ENVIAR PELA BAUER.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0353',
    'Casa das Cadeiras Moveis e Objetos Ltda',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF- 1 X POR SEMANA ACIMA DE R$ 700,00, ACERTO C/ CLEIDE- 23/08/2012-MANUELA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1530',
    'Casa Decor AN LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1593',
    'Casa Decorada Artigos de Decoração LTDA - ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0126',
    'Casa Decorada Moveis e decorações Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0939',
    'Pura Industria e Comercio de Agua Mineral Ltda',
    'CIF',
    NULL,
    '--------------------------------------------------',
    NULL,
    '-----------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1602',
    'Casa Del Fiore Decorações LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0794 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0667',
    'Quantity Serviços e Comércio de produtos para a saúde Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1018',
    'Casa do Sono Industria Cortinas Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1268',
    'Querello Tenczna ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0836',
    'R & P Comercio de Persianas e Revestimentos Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1446 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1446',
    'R & P Comércio de Persianas e Revestimentos Ltda FILIAL',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0836 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0982',
    'R Cervellini Revestimentos Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0532',
    'Persianas e Persianas Comércio de Persianas Eireli',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0983',
    'R CERVELLINI REVESTIMENTOS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    'ASSIM QUE FICAR PRONTO TRANSPORTADORA: EXPRESSO SÃO MIGUEL   *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1023',
    'R Cervellini Revestimentos Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X NA SEMANA TODA QUARTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, SEM VALOR MÍNIMO FREQUENCIA DE ENVIO: 1X NA SEMANA TODA QUARTA-FEIRA. TRANSPORTADORA:   CIF - EXPRESSO SÃO MIGUEL FOB  - EXPRESSO SÃO MIGUEL  ----------------------------------------------------------------------------------------------------------------------------------------------------- ANÁLISE REPRESENTANTE  EMPRESA DO GRUPO CERVELLINE, MUITO FORTE. DIZ TER FATURADO R$ 600.000,00 EM 2016. TRABALHA COM HUNTER AINDA, MAS QUER EXPERIMENTAR OUTRA MARCA.  -----'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1187',
    'R CERVELLINI REVESTIMENTOS LTDA',
    'CIF_FOB',
    1000.0,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 11/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1642',
    'CASA E CORTINA DECOR LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: EXPRESSO SÃO MIGUEL FOB 1X SEMANA (TODA SEGUNDA FEIRA)  -------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0468',
    'OR GUIMARÃES - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0584',
    'FABIO MANCHUR & CIA LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA - ENVIO SOMENTE SEGUNDAS OU TERÇAS - AGRUPAR PARA UM DESSES DIAS TRANSPORTADORA: CIF/FOB BAUER METRAGEM: ACIMA DE 3M VERIFICAR COM TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'FREQUENCIA DE ENVIO: 1X NA SEMANA - ENVIO SOMENTE SEGUNDAS OU TERÇAS - AGRUPAR PARA UM DESSES DIAS TRANSPORTADORA: CIF/FOB BAUER METRAGEM: ACIMA DE 3M VERIFICAR COM TRANSPORTADORA.  BAUER ENTREGA EM 2 DIAS, FREQUENCIA DE ENTREGA SOMENTE NAS QUINTAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0587',
    'Guilherme Augusto Oliveira Marins EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'MODALIDADE: FOB FREQUENCIA: CONFORME OS PEDIDOS FICAM PRONTOS TRANSPORATADORA: T0007 BRASPRESS OU T0079 CARVALIMA METRAGEM: BRASPRESS ATÉ 2M, CAVALIMA VERIFICAR.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1188',
    'R CERVELLINI REVESTIMENTOS LTDA',
    'CIF_FOB',
    1000.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1189',
    'R CERVELLINI REVESTIMENTOS LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1X NA SEMANA TODA SEGUNDA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, PEDIDOS ACIMA DE R$1.500 *FRETE FOB MANDAR CIF A COBRAR FREQUENCIA DE ENVIO: 1X NA SEMANA TODA SEGUNDA-FEIRA. TRANSPORTADORA: RODONAVES PARA CIF  *VALOR DE FRETE CIF ALTERADO DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  --------------------------------------------------------------------------------------------------------------------------- ANALISE DO REPRESENTANTE  "CADASTRAR TABELA MAIO 17 / DESCONTO 20% / CONDIÇÃO DE PAGAMENTO 28 DIAS "  *DOCUMENTOS NO P'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0880',
    'Casa e Paredes Redecor Ltda - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '- Sempre que estiver pronto as mercadorias ENVIAR',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1460',
    'Casa em Cores Comercio de Objetos e Decorações EIRELI',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0460',
    'R. Guimarães',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0025',
    'Casa Estilo Decorações',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1210',
    'Casa Fiora Decorações Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1319',
    'CASA FORTALEZA COMÉRCIO DE TECIDOS LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO DE PGTO ALTERADA DE 10/28/56 PRA 28 DIAS. EMAIL ERNANI EM ANEXO. _____________________________________________________________  ACORDO DE FRETE: FRETE CIF ACIMA DE R$1.500,00 - JAMEF FRETE FOB - RODONAVES   _____________________________________________________________  REFERENCIA COMERCIAL: FORBO PISOS LTDA  CLIENTE DESDE: 2014            LIMITE DE CRÉDITO: R$ 150MIL MÉDIA MENSAL COMPRA: R$ 160MIL CONDIÇÃO DE PAGAMENTO: 30/60',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0189',
    'GHM Comércio De Persianas E Prestação De Serviços Ltda - Me',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1196',
    'Casa Mix Comércio e Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1657 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0774',
    'R.A. Artigos de Decoração Ltda - ME',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1680 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FRETE FOB: TRANSPORTADORA EXPRESSO SÃO MIGUEL   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1680 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA SEM VALOR MÍNIMO, É PARA AMBAS. E NÃO 1 CIF PARA CADA.   --------------------------------------------------- *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1657',
    'Casa Mix Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'TODA QUARTA FEIRA TRANSPORTADORA REUNIDAS  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1196 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1196 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'SEMPRE FOB  FREQUENCIA DE ENVIO: TODA QUARTA FEIRA TRANSPORTADORA REUNIDAS  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1196 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0945',
    'Brafor Moveis e Revestimentos Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO ALTERADA P/ ANTECIPADO. FIZEMOS ACORDO, CONFORME EMAIL EM ANEXO. 28/07/2020 - CONSULTA REALIZADA: NADA CONSTA (ANEXO) 16/11/2021 - CONSULTA REALIZADA, NADA CONSTA. SCORE 794/1000. (ANEXO) 22/11/2021 - LIMITE ALTERADO DE 15K PARA 25K. (ADRIANO) APÓS ANÁLISE COMERCIAL E FINANCEIRO, LIMITE ALTERADO PARA 40 MIL. 28',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1301',
    'R.M.DA S. BONILHA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0636',
    'R.S DALL''IGNA E CIA LTDA',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0684',
    'Casa Nobre Móveis Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '-------------------------------------------------------------------------------------------  Transportadora: TSV Transportes Rápidos  16/09/2016- Enviar sempre CIF e cobrar do cliente',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1242',
    'Casa Nova Comercio e Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1633',
    'R.S.V.DOMINGUES - SERVIÇOS DE DECORAÇÃO',
    'FOB',
    NULL,
    NULL,
    NULL,
    'FOB Prata Cargas  ----------------------------------------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: FREQUÊNCIA DE ENVIO: FOB PRATA CARGAS  ----------------------------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0593',
    'A & N Decorações e Paisagismo LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1339',
    'Casa Panorâmica Comércio de Acessórios Decorativos LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '- CIF 1X NA SEMANA ACIMA DE 1',
    NULL,
    'ativo',
    NULL,
    '21/06/2023: FREQUENCIA DE ENVIO - CIF 1X NA SEMANA ACIMA DE 1.500K TODA QUARTA-FEIRA. TRANSPORTADORA: RODONAVES  ------------------------------------------------------------------------------------------------------------------ COMENTÁRIOS DO REPRESENTANTE  LOJA NOVA COM DIVERSOS PRODUTOS PARA DECORAÇÃO DE INTERIORES, ATENDE TODO O NORTE DE MINAS, INICIALMENTE VAI TRABALHAR COM DUAS MARCAS, SENDO A UNILUX E A KAZZA PERSIANAS. NO DECORRER DA PARCERIA VAI ANALIZAR A QUE MELHOR ATENDE AS ESPECTATIV'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1123',
    'CASA TOMÉ LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0735',
    'CASA VESTIDA COM. DE CONFEC. DE COLCHAS CORTINAS E ALMOFADAS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA ACIMA DE 1.000,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1452',
    'Rafael Porfirio',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0503',
    'zanini*',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X SEMANA  TRANSPORTADORA: PARA NOTAS COM FRETE CIF - ALFA E PARA FRETE FOB - BAUER-------PRAZO DE ENTREGA DA ALFA É DE 3 DIAS E A FREQUENCIA É SEGUNDA, QUARTA E SEXTA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X SEMANA  TRANSPORTADORA: PARA NOTAS COM FRETE CIF - ALFA E PARA FRETE FOB - BAUER-------PRAZO DE ENTREGA DA ALFA É DE 3 DIAS E A FREQUENCIA É SEGUNDA, QUARTA E SEXTA. METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.  ATENÇÃO: PARA NOTAS COM FRETE CIF ATÉ R$ 1.000,00 SEMPRE ENVIAR PELA BAUER.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0203',
    'Casandro Schmitz ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0118',
    'Raimundos Aviamentos e Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0655',
    'CASHMERE TECIDOS E ACESSÓRIOS PARA DECORAÇÃO LTDA.',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'sempre que ficar pronto',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1861',
    'Cassiano Arruda de Araújo',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0047',
    'Rainti Com. de Tec. e Conf. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1034',
    'Cateli e Soares Materiais de Construção Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'Frete FOB 2x por semana - TERÇA/SEXTA  22/11 - Josi',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1344',
    'Cattan Decorações LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'TODAS AS SEGUNDAS    *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0608',
    'Katia C. D. Splendor - ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA ---------------------------------------------- METRAGEM:  TRANSPORTADORA:   FOB  BAUER',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:  FOB ---------------------------------------------- FREQUENCIA DE ENVIO: 1X NA SEMANA ---------------------------------------------- METRAGEM:  TRANSPORTADORA:   FOB  BAUER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1568',
    'CBA AMBIENTES E ACABAMENTOS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    'Assim que ficar pronto, 1x na semana TRANSPORTADORA: Rodonaves  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE FRETE: CIF A COBRAR FREQUÊNCIA DE ENVIO: ASSIM QUE FICAR PRONTO, 1X NA SEMANA TRANSPORTADORA: RODONAVES  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0707',
    'CC Lima & Parolo Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1579',
    'CCI COMERCIO DE CARENAGENS INTERNAS LTDA',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1157',
    'Ramazi Decorações Ltda - ME',
    'CIF_FOB',
    1000.0,
    NULL,
    '--------------------------------------------------',
    '1X NA SEMANA TODA TERÇA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, PEDIDOS ACIMA DE R$1.000,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TODA TERÇA-FEIRA. TRANSPORTADORA: BAUER PARA CIF E RODONAVES PARA FOB  ------------------------------------------------------------------ REFERÊNCIA COMERCIA  RC TECIDOS CLIENTE DESDE**: 04/2015       LIMITE DE CRÉDITO**: R$ 7.000,00 MÉDIA MENSAL COMPRA**: R$ 1.000,00 FORMA DE PAGAMENTO**BOLETO PAGAMENTOS*:PONTUAIS CONCEITO**: ÓTIMO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1125',
    'CDL PARTICIPAÇOES',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1009',
    'Ramona Seger Feltes',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1825',
    'RBS & GBS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DE SUCATAS.   ---------------------------------- FATURAMENTO  RETIRADA DA SUCATA NA FÁBRICA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1265',
    'CDP COMÉRCIO E SERVIÇOS EIRELI',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1207',
    'CELINA ZHANG HUAN',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0908',
    'RCC Materiais de Cosntr. e Ferr.Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0839',
    'RD Acabamentos',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '--------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0526',
    'Camargo & Garcia Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    'DE PEDIDOS 1X POR SEMANA, CIF ACIMA DE R$ 700,00',
    NULL,
    'ativo',
    NULL,
    'ENVIO DE PEDIDOS 1X POR SEMANA, CIF ACIMA DE R$ 700,00.  08/07/13 - ALTERADO PARA BAUER. GISELE ANEXO5 12/06/13 - ENVIO DIRETO PELA ALFA. GISELE ANEXO4'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1208',
    'RDESIGN DECORACAO DE INTERIORES LTDA ME',
    'CIF_FOB',
    1000.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0680',
    'Real Ind Pers Cort Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 12/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0226',
    'Celso Gaudencio de Souza ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0337',
    'Central Color Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1396',
    'Centro de estudos Miguel Salles Cavalcanti',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1811',
    'Realiza Cortinas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1628',
    'Rede D''or São Luiz S.A.',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1664',
    'Centro Multidiciplinar  Coração Autista LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0534',
    'Aviva Ambientes e decoração EIRELI - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE PEDIDOS SOMENTE SEGUNDAS OU QUARTAS, POIS A BAUER SÓ ENTREGA TERÇAS E QUINTAS EM BARRA VELHA, NÃO ADIANTA MANDAR EM OUTROS DIAS DA SEMANA',
    NULL,
    'ativo',
    NULL,
    '13/08/2013 - ENVIO DE PEDIDOS SOMENTE SEGUNDAS OU QUARTAS, POIS A BAUER SÓ ENTREGA TERÇAS E QUINTAS EM BARRA VELHA, NÃO ADIANTA MANDAR EM OUTROS DIAS DA SEMANA. FALEI COM SAMUEL. GISELE'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1012',
    'Cerarte Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1464',
    'Cercal Soluções Residenciais LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'SE,PRE FOB  TRANSPORTADORA: EXPRESSO SÃO MIGUEL -------------------------------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0536',
    'Jaquelina Paganoti Ferraz',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE PEDIDOS 1X NA SEMANA, FRETE CIF DE R$ 700,00',
    NULL,
    'ativo',
    NULL,
    'ENVIO DE PEDIDOS 1X NA SEMANA, FRETE CIF DE R$ 700,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0268',
    'Cesar Antonio Cardoso ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1044',
    'Cesar Ricardo de Jesus Ramos',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1678',
    'Lateli Comércio e Serviços de Persianas e Decorações LTDA',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0715',
    'Refinatto Acabamentos Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0795',
    'Regina Pereira da Silva Taubaté - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1713',
    'CGC Box e Persianas Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB - TRANSPORTADORA EXPRESSO SÃO MIGUEL - ENVIAR SEMPRE QUANDO ESTIVER PRONTO    OBC.: CADASTRO AUTORIDADO POR ADRIANO> ELITON> PRICILA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1441',
    'CHAFFIN & MARINI DOS LAGOS DECORAÇÕES EIRELI',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0628',
    'Chaiana Móveis e Decoração Eireli',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA TERÇA-FEIRA',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0628; C1689  POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    'CONDIÇÃO DA REVENDA É ANTECIPADO. PORÉM ADRIANO ACORDOU E AUTORIZOU 50% PARA ENTRAR EM PRODUÇÃO E 50% NA EXPEDIÇÃO. MESMO CLIENTE NÃO CUMPRINDO A CONDIÇÃO ACORDADA POR INÚMERAS VEZES. (PRI.) 23/02/2022 - CHAIANA ACORDOU UMA CONDIÇÃO COM ADRIANO, APÓS NÃO CUMPRIR. DETERMINADO: ANTECIPADO',
    'MODALIDADE DE FRETE: 1X FRETE CIF, SEM VALOR MÍNIMO FREQUENCIA DE ENVIO: 1X NA SEMANA TODA TERÇA-FEIRA. TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB *VALOR DE FRETE ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0628; C1689  POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00, É PARA AMBAS. E NÃO 1 CIF ACIMA DE 1.500,00 PARA CADA.   --------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1480',
    'REGINALDO CHAGAS',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1689',
    'Chaiana Office Decor LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA TERÇA-FEIRA',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0628; POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, SEM VALOR MÍNIMO. FREQUENCIA DE ENVIO: 1X NA SEMANA TODA TERÇA-FEIRA. TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB *VALOR DE FRETE ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0628; POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00, É PARA AMBAS. E NÃO 1 CIF ACIMA DE 1.500,00 PARA CADA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0569',
    'Fabiana de Cassia Santos ME',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368 PRAZO DE ENTREGA: JAMEF ATÉ 2 DIAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0381',
    'Reginaldo da Silva Regis Dec ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0574',
    'Lais Regina Wroblewski ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0732',
    'Chana Balog Jancu ME',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA - ACIMA DE R$ 1000,00  CADASTRO - NADA CONSTA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0933',
    'Regine de Souza Brognoli ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1322',
    'Charles Gomes dos Santos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0497',
    'Reinaldo de Oliveira e CIA LTDA',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: BAUER METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:CIF ACIMA R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: BAUER METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0225',
    'Charles Henrique da Rosa 92161308904',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0865',
    'Cheila A. Kehl - ME',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    '1x por semana ------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1236',
    'REINO MAGICO COMERCIAL LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    '--------------------------------------------------',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA JAMEF FRETE CIF 1X NA SEMANA ACIMA DE R$1.500,00 TRANSPORTADORA: BRASPRESS - PARA FRETE FOB   --------------------------------------------------------------------------------------------------------------       ANALISE DO REPRESENTANTE  LOJA BEM COMPLETA EM ARTIGOS PARA DECORAÇÃO DE INTERIORES QUE VAI DE ALGUNS TIPOS DE MÁVEIS ATÉ UM SIMPLES ADORNO. JÁ REVENDEM HUNTER DOUGLAS E UMA OUTRA MARCA MUITO INFERIRO. O OBJETIVO É DEIXAR APENAS UNILUX E HUNTER DOUGLAS.  CLIENTE EM BUSCA DE'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1067',
    'Renan Duarte Viana ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGTO: 30X60',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0867',
    'Chrislar Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0895',
    'Chrissi e Douglas Tonietto Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0312',
    'Christian Adriano Souza',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1471',
    'Christian de Souza Lima',
    'CIF_FOB',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0579',
    'Ideal aquitetura e interiores',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'SEMPRE NAS SEXTAS - BAUER ENTREGA SOMENTE NAS SEGUNDAS***FRETE CIF - 1X POR SEMANA (ACIMA DE R$ 700,00)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0317',
    'Christiane Bonckewitz da Rosa Villalba',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0862',
    'Christiane Farias Coelho - ME',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1X NA SEMANA ----------------------------------------------------------------------',
    NULL,
    'ativo',
    'CONDIÇÃO DE PG DE 28/42/56 P/ ANTECIPADO E ZERADO LIMITE DE 10MIL - FICOU DEVENDO MAIS D 1 MES KATIA 02/03/2017   REFERÊNCIA COMERCIAL: AMBOS TRABALHAM COM BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0677',
    'JC Ferreira Persianas Guaratuba -ME',
    'CIF',
    1500.0,
    NULL,
    NULL,
    '- 1x na semana - SEMPRE SEGUNDA Modalidade de frete - 1x frete CIF acima de R$1',
    NULL,
    'ativo',
    NULL,
    'FREQUÊNCIA DE ENVIO - 1X NA SEMANA - SEMPRE SEGUNDA MODALIDADE DE FRETE - 1X FRETE CIF ACIMA DE R$1.500  TRANSPORTADORA - REUNIDAS  ----------------------------------------------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0029',
    'Cia da Cortina XXX',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0161',
    'CIA Decor',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0115',
    'Cid Confecções e Bordados Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0678',
    'Helena Deloni de Souza Nazario',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0591',
    'Juliana Giovanella Zanelato',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA, ACORDADO COM JULIANA 24/04',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0693',
    'Cidivaldo Oseliere-ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    'DE MERCADORIA: 1X NA SEMANA ---------------------------------------------- FRETE CIF COM COMPRAS ACIMA DE R$ 700,00',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1228',
    'CINARA STIEHLER MEI',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1581',
    'Cintas Y Pasamaneria',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0597',
    'SIBELE REGINA DE LA VEGA  FABRICAÇÃO DE ARTEFATOS TEXTEIS ME',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1653',
    'CJ Cleia verificando dados',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0686',
    'André Ambrosio Waszko - ME',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1 X POR SEMANA COMPRA ACIMA DE R$ 700,00 - BAUER  FRETE FOB - BAUER CONFORME SOLICITAÇÃO POR EMAIL DIA 26/04/17  FINANCEIRO:  CONFORME CONSULTA REALIZADA NO DIA 28/05/2015 - CONSTAM PROTESTO NO CADASTRO DO CLIENTE CONFORME DOCUMENTO NOS ANEXOS.  CONSULTA SERASA EM:  31/08/2016 - NADA CONSTA.  CONSULTA SERASA DESATUALIZADA HÁ MAIS DE 6 MESES; 22/01/2019 --------------------------------------------------- FRETE CIF 1X POR SEMANA ACIMA DE 700,00 -'
);

-- Batch 13/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0687',
    'Helder Soares Silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1450',
    'RENOVE CASA DESIGN DE INTERIORES LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0689',
    'Juliano Pedro de Sene',
    'FOB',
    NULL,
    NULL,
    NULL,
    '-------------------------------------------------------------------------  Transportadora: Bauer',
    NULL,
    'ativo',
    NULL,
    'FOB  28/10/2015 - CONDIÇÃO DE PAGAMENTO ALTERADO PARA ANTECIPADO, DEVIDO AO NÃO PAGAMENTO DOS BOLETOS EM DIA. ELITON.  FEITO BOLETO DE SHOWRROM E NAO PAGOU ATRASOU MAIS DE 30 DIAS, NAO FAZER CONDICAO DE BOLETO PRA ESSE CLIENTE KATIA 23/05/2016 ------------------------------------------------------------------------- FREQUÊNCIA DE ENVIO: -------------------------------------------------------------------------  TRANSPORTADORA: BAUER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0604',
    'ELP Comércio de Cortinas e Decorações Ltda ME.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0172',
    'Representações W & K Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1438',
    'Claudete Aparecida da Costa Custódio Olsen',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1412',
    'Claudete Schambeck Mattos',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1308; C1175 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0302',
    'Claudineia Vieira Salvalaio ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0016',
    'Claudio Daniel Olivo ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO PAGAMENTO PARA 28/42/56 - 22/07 - ADRIANO CONSULTA SPC 22/02/2011 NADA CONSTA. CADASTRO REVISADO EM 22/02/2011. ALTERADO LIMITE PARA 15.000,00 EM 12/11/10.  FINANCEIRO: DEVIDO ATRASOS EM BOLETO',
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0870',
    'Claumar Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '-------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0859',
    'CLEAN TEXTIL COMERCIO E SERVICOS EIRELI',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0698',
    'Simone Maria Barbieri Damião - ME',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF: ACIMA DE R$ 700,00 - 1X POR SEMANA TRANSPORTADORA: FRETE CIF PELA BAUER E FRETE FOB PELA REUNIDAS  20/10/2015 - OBS.: CLIENTE ESTÁ ATRASANDO OS PGTOS.   28/10/2015 - CONDIÇÃO DE PAGAMENTO ALTERADO PARA ANTECIPADO, DEVIDO AO NÃO PAGAMENTO DOS BOLETOS EM DIA. ELITON.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0665',
    'Paulo Gbur',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1821',
    'Michele da Silva Machado 58.710.694',
    'CIF_FOB',
    2000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE NÃO AGRUPAR FRETE CIF - 2X NA SEMANA ACIMA R$ 2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL FRETE QUANDO FOB: EXPRESSO SÃO MIGUEL/BRASSPRESS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0675',
    'Cleiton Carteri',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1411',
    'REQUINTE DECORAÇÕES',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0247',
    'Cleo Cortinas Presentes e decorações LTDA- ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0861',
    'Cleonice Ines Freitag',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB 2X POR SEMANA TRANSPORTADO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C9999',
    'Cliente Padrão XXX',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1792',
    'JDO Comércio de papel de Parede Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA ACIMA DE 1.500 K TRANSPORTADORA JAMEF (12/12) FOB - JAMEF PEÇAS MAIORES DE 3M - MOBILE'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1201',
    'COELHO E FONTORA LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0863',
    'Requinte Persianas e Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0481',
    'COFERCAN COML DE FERROS CANOENSE LTDA.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0648',
    'Reunidas Transporte Rod. de Cargas Ltda - Caçador/SC',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0706',
    'TOP Móveis e Acabamentos Eireli',
    'FOB',
    NULL,
    NULL,
    NULL,
    '---------------------------------------------------------------------- Frete; FOB  Transportadora: Expresso São Miguel Ltda / Palhoca (Lisandro)',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0429',
    'Columbia Decor Comércio de Cortinas Ltda - ME',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c0307',
    'Colégio Sadalla Amim Ghanem',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0710',
    'Cristiane Medina Menin - MEI',
    'FOB',
    NULL,
    NULL,
    NULL,
    'CONFORME DATA DE ENTREGA DOS PEDIDOS TRANSPORTADORA: BRASPRESS',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB FREQUENCIA DE ENVIO: CONFORME DATA DE ENTREGA DOS PEDIDOS TRANSPORTADORA: BRASPRESS. METRAGEM:'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0475',
    'Com. de Cortinas e Enxovais Silveira Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA ---------------------------------------------- TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 ---------------------------------------------- FREQUENCIA DE ENVIO: 1X NA SEMANA ---------------------------------------------- TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.  --------------------------------------------------- FREQUENCIA DE ENVIO: SEXTA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0267',
    'Revestir Comércio de Carpetes Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'TERÇAS E QUINTAS ----------------------------------------------- TRANSPORTADORA: ACEVILLE  --------------------------------------------- FREQUENCIA DE ENVIO: FRETE FOB 2X POR SEMANA - TERÇA/QUINTA  22/11 - JOSI   ACERTO CLIENTE 30/09/2019 BOA TARDE!  CONFORME CONVERSA COM IVAN, VAMOS MANTER O LIMITE DE R$20',
    NULL,
    'ativo',
    NULL,
    '------------------------------------ MODALIDADE DE FRETE: FOB ----------------------------------------------- FREQUENCIA DE ENVIO: TERÇAS E QUINTAS ----------------------------------------------- TRANSPORTADORA: ACEVILLE  --------------------------------------------- FREQUENCIA DE ENVIO: FRETE FOB 2X POR SEMANA - TERÇA/QUINTA  22/11 - JOSI   ACERTO CLIENTE 30/09/2019 BOA TARDE!  CONFORME CONVERSA COM IVAN, VAMOS MANTER O LIMITE DE R$20.000,00, MESMA CONDIÇÃO DE BOLETO PARA 7/28/56 DIAS. ATRASOU '
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0766',
    'REX Decor Comércio de Artigos de Decoração Ltda -ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0714',
    'Eduardo Oliveira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0281',
    'REX DÉCOR COMÉRCIO DE ARTIGOS DE DECORAÇÃO LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1031',
    'RF Martins',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA SEXTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: 1X NA SEMANA TODA SEXTA-FEIRA. TRANSPORTADORA: REUNIDAS  **DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0246',
    'Casa Doze Atelier LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    'Frete CIF 2 vezes por semana, sem valor mín imo **TENTAR AGRUPAR QUANDO POSSÍVEL - Segundas e Quintas - Cliente Select Ouro Negro -----------------------------------------------  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0717',
    'Petroski Ind e Com. de Perfis de PVC Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0718',
    'COMERCIAL FARINELLA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO  FRETE R$ 118,73  VALORES  VENDA R$ 9.600,00 --------------------- CUSTO R$ 5.243,00 IPI R$ 291,25 IMP R$ 653,00 (SOBRE DIFERENÇA) FRETE R$ 118,73 _________________ R$ 3.294,00 - CRÉDITO PARA IVI'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1636',
    'Comercial Silva Peres Ltda - EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1272',
    'COMERCIO DE CORTINAS ALVES E LOPES LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1646 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    '01/08/2019 - REVENDA NÃO QUER QUE AGRUPE NOTAS NUM MESMO BOLETO. _____________________________________________________________________  ACORDO DE FRETE: FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO - EXPRESSO SÃO MIGUEL  NÃO ENVIAR FOB SEM QUESTIONAR - AGRUPAR SE POSSÍVEL PEÇAS MAIORES DE 3 MTS MANDAR PELA REUNIDAS  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1646 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA SEM VALOR MÍNIMO, É PARA AMBAS. E NÃO 1 CIFS PARA CADA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1231',
    'COMERCIO E CONFECCOES FIORENTHINNA',
    'FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1130',
    'Ricardo Armondes 02416503642',
    'FOB',
    NULL,
    NULL,
    NULL,
    'DE CHEQUE COM PRAZO DE ATÉ 90 DIAS SEM JUROS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1649',
    'Ricardo Claro de Abreu',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF TRANSPORTADORA JAMEF  ---------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1097',
    'Ricardo Correa Vieira',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0117',
    'Complemento Interires Comércio Repres. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0610',
    'Ricardo Dias',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1516',
    'Labareda Home LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0310 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0355',
    'Conceito 21 Decorações e Design LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'SEMPRE QUE FICAR PRONTO',
    NULL,
    'ativo',
    NULL,
    'ENVIO SEMPRE QUE FICAR PRONTO.  FRETE FOB TRANSPORTADORA:  OURO NEGRO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0979',
    'Conceito Ativo Comercial Importadora Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0997',
    'Condominio Residencial Linda Koerich',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1233',
    'CONDOMINIO SC401 SQUARE CORPORATE',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO - ENTREGA EM FLORIANÓPOLIS NO SC 401 CORPORATE - FRETE UNILUX CIF  PAGAMENTO - 50% DIA 28/11 - 50% 28/01'
);

-- Batch 14/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0726',
    'Cerqueira Leite Advogados Associados',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO, CLIENTE FINAL.   CLIENTE FINAL NEO DESIGN'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0728',
    'Karina Winter Arquitetura Ltda',
    'CIF_FOB',
    1000.0,
    NULL,
    NULL,
    'CIF 1 X POR SEMANA, NAS COMPRAS ACIMA DE R$ 1',
    NULL,
    'ativo',
    NULL,
    'ENVIO: CIF 1 X POR SEMANA, NAS COMPRAS ACIMA DE R$ 1.000,00. FRETE: FOB BRASPRESS, CIF JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1115',
    'Ricardo Soares Barbosa',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0956',
    'Condomínio Horizontal Everest',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0822',
    'confecc',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0635',
    'CONFECCOES DE CAMPOS LTDA - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB  TRANSPORTADORA: BAUER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1163',
    'Confecções Alexandre Diniz LTDA ME',
    'CIF',
    1500.0,
    NULL,
    NULL,
    'Todas as Terças  Cliente tem cadastro com a transportadora: JAMEF --------------------------------------------------------------------------------------------------------------------------------- ANÁLISE DO REPRESENTANTE  SEGUNDA LOJA DA REDE SC CORTINAS  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'DAS NFS TAXA DE JUROS 2,1% PARA PAGAMENTOS ACIMA DO PRAZO LIMITE: 40K 12/05/2020 - COSULTA REALIZADA, NADA CONSTA. (ANEXO) 07/04/2021 - LIMITE ALTERADO DE 40K PARA 60K (EMAIL ADRIANO) 18/02/2022 - CONSULTA REALIZADA, NADA CONSTA. SCORE 665/1000. (ANEXO) 14/11/2025 - CONSULTA REALZADA, CONSTAM PENDENCIAS. SCORE 0/1000 (ANEXO) 25/11/2025 - LIMITE ZERADO E CONDIÇÃO ANTECIPADO POIS MUDOU A RAZÃO SOCIAL PARA CONFECÇÕES SIQUEIRA  ------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1708',
    'Rich House Comércio de Móveis e Decoração ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X POR SEMANA, VALO MÍNIMO R$ 2.000,00, TRANSPORTADORA JAMEF FOB TRANSPORTADORA EXPRESSO M2 MIL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0341',
    'Confecções Capri Ltda Epp',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0121',
    'Confecções DallaDias Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0580',
    'Confiança Cia de Seguros',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0690',
    'Conselho de Arquitetura e Urbanismo de Santa Catarina',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO UNILUX ACERTO PEDIDO CLIENTE ROSEMAR LIVRAMENTO  R$ 7500,00 - VENDA FINAL R$ 5566,00 - CUSTO REVENDA ------------------------ R$ 1934,00 - LUCRO BRUTO R$ 290,00  - IMPORTOS SOBRE DIFERENÇA ------------------------ R$ 1644,00 - CRÉDITO PARA REVENDA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0107',
    'RMH Persianas e Revestimentos Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE PEDIDOS 1X NA SEMANA CIF ACIMA DE R$ 700,00, FALEI COM RODRIGO',
    NULL,
    'ativo',
    NULL,
    'ENVIO DE PEDIDOS 1X NA SEMANA CIF ACIMA DE R$ 700,00, FALEI COM RODRIGO. GISELE 04/03/13'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1574',
    'Constru Poços de Caldas Comércio e Representação LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE: CIF 1X NA SEMANA TRANSPORTADORA: RODONAVES PARA CIF E FOB   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1113',
    'CONSTRURENO LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1429',
    'Construtora e Incorporadora Milano',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1432',
    'CONSTRUTORA E INCORPORADORA SANTA EDWIGES EIRELI',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1615',
    'CONSTRUTÍLIAS COMÉRCIO DE MATERIAIS DE CONSTRUÇÃO LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '– Segunda  Transportadora - Expresso São Miguel',
    NULL,
    'ativo',
    NULL,
    'TIPO DE FRETE - FOB FREQUÊNCIA DE ENVIO – SEGUNDA  TRANSPORTADORA - EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1804',
    'Contemporane Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA TRANSPORTADORA: RODONAVES  QUANDO FRETE FOB: RODONAVES (SILVIA 27/05-EVO VITOR) TRANSPORTADORA CAIAPÓ CARGAS (NÃO ATENDE SC)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0223',
    'RN Ribeiro ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1558 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0441',
    'RO2 Com. e Imp. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0806',
    'Roberta Martins da Silva- Me',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    'TODAS AS QUINTAS FRETE FOB - EXPRESSO SÃO MIGUEL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0944',
    'Coobrastur Viagens e Turismo Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1070',
    'Coop. De Credito de Livre Admissão Altos da Serra',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0585',
    'COOPERATIVA AGROINDUSTRIAL LAR',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0995',
    'Roberta Tieko Matsunaga',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1056',
    'Cooperativa de Credito de Livre Admissão da Região da Produção',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0838',
    'Roberto Luiz Dutra Amann',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1816',
    'COOPERATIVA DE CREDITO, POUPANCA E INVESTIMENTO GRANDES LAGOS DO PARANA E LITORAL PAULISTA -',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1746',
    'Cooperativa de Trabalho Médico de Concordia e Região',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA (SEM VALOR MINIMO) -  TRANSPORTADORA: BAUER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0032',
    'Coprel Com. e Serv. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1620',
    'COR & AMBIENTE DECORACOES EIRELI',
    'FOB',
    NULL,
    NULL,
    NULL,
    'QUARTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0703',
    'Cor & Arte Revestimentos Ltda - ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0561',
    'Coralflex Persianas LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '- Toda quarta Modalidade de frete - CIF 1x por semana, sem valor mínimo Transportadoras: - CIF Reunidas - FOB: Expresso São Miguel  -------------------------------------------------------------------------------------  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'FREQUÊNCIA DE ENVIO - TODA QUARTA MODALIDADE DE FRETE - CIF 1X POR SEMANA, SEM VALOR MÍNIMO TRANSPORTADORAS: - CIF REUNIDAS - FOB: EXPRESSO SÃO MIGUEL  -------------------------------------------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0127',
    'Cordec Cortinas e Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0224',
    'Roberto Novaes Guedes Jr',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0767',
    'Reni do Rocio Mottin',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0855',
    'Correa Artigos  de Decoração Eireli',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE NÃO AGRUPAR  CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1786',
    'Roberto Rodrigues da Cunha Filho',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE FOB1X POR SEMANA, SEM VALOR MÍNIMO TRANSPORADOTA:RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0044',
    'ROBERTO SEBASTIAO DE SOUZA JUNIOR - EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0424',
    'CORTIFADE - COMÉRCIO DE DECORAÇÕES LTDA',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0034',
    'Cortina & Cia',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1720',
    'Cortina & Cia Comércio e Industria Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'CORDO DE FRETE: MODALIDADE DE FRETE: FOB - SEMPRE QUE ESTIVER PRONTO TRANSPORTADORA: BAUER (ALTERADO DIA 26/08 CONFORME EMAIL CLIENTE) *METRAGEM: ACIMA DE 3M VERIFICAR. (INFORMAÇÕES OBTIDAS CADASTRO C0034)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1136',
    'CORTINARE AMBIENTES LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0846',
    'Cortinas & Cortinas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0575',
    'Cortinas e Decorações Balneário Camboriú.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1105',
    'Cortinas Ávila LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0383',
    'Robson Bogo ME',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE FOB - -------------------------------------------------------------  FRETE FOB 2X POR SEMANA - TERÇA/SEXTA  20/11 - FRAN'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1782',
    'Decor Pato Branco Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA, SEM VALOR MÍNIMO -(TERÇA E QUINTA) INDEPENDENTE DO VALOR AGRUPAR SEMPRE QUE POSSÍVEL TRANSPORTADORA SÃO MIGUEL  *QUANDO HOUVER VALOR DE FRETE A COBRAR DO CLIENTE, NÃO ACRESCENTAR ESTE NA NF, ACUMULAR E COBRAR MENSALMENTE EM UM BOLETO SEPARADO APENAS DOS FRETES A COBRAR.*'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1126',
    'Rodonaves - Biguaçu',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 15/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c0935',
    'Costa Azul Materiais de Construção Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '-----------------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1621',
    'RODONAVES TRANSPORTES E ENCOMENDAS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1517',
    'COTRIPAL AGROPECUARIA COOPERATIVA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0843; C1536; C1538; C1540; C1612 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1612',
    'COTRIPAL AGROPECUARIA COOPERATIVA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0843; C1517; C1536; C1540; C1540 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1536',
    'Cotripal Agropecuária Cooperativa',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0843; C1517; C1538; C1540; C1612 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1538',
    'Cotripal Agropecuária Cooperativa',
    'CIF',
    NULL,
    '--------------------------------------------------',
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0843; C1517; C1536; C1540; C1612 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1691',
    'Rodonaves Transportes e Encomendas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0943',
    'Rodotista Transportes Ltda',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1540',
    'Cotripal Agropecuária Cooperativa',
    'CIF',
    NULL,
    '--------------------------------------------------',
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0843; C1517; C1536; C1538; C1612 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1216',
    'Rodrigo Daniel de Araújo',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1050',
    'CRD Bianchi',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0793',
    'Alamanda Decorações Ltda',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    ':',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1356',
    'Rodrigo Rodrigues',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0027',
    'Rogerio Luis Pellisoli ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0800',
    'A Cortinaria Comércio de Artigos de Decoração Ltda',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0335',
    'Rogério Rodrigues Filho',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0882',
    'Creici Redin Brixner -ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0751',
    'Crestof Ind. Com. Est. Ltda - EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0487',
    'ROKIA COMERCIO ATACADISTA E IMPORTAÇÃO LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1470',
    'Criar e Realizar Decorações Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA, ACIMA DE R$1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL  FRETE QUANDO FOB TRANSPORTADORA : BRASPRESS/ ACEVILLE/ EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0427',
    'Romilda Alves da Costa Ganzer',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA ---------------------------------------------- TRANSPORTADORA: FRETE CIF OU FOB - BAUER  METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA  11/09/2015 - CONSULTA REALIZADA CFE',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 ---------------------------------------------- FREQUENCIA DE ENVIO: 1X NA SEMANA ---------------------------------------------- TRANSPORTADORA: FRETE CIF OU FOB - BAUER  METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA  11/09/2015 - CONSULTA REALIZADA CFE. DOCUMENTO NOS ANEXOS - NADA CONSTA.  --------------------------------------------------- FREQUENCIA DE ENVIO: SEMPRE QUE FICAR PRONTO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0035',
    'Criativa Confecções Textil Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0752',
    'Ronald Reeve Gunn',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1681',
    'Keterine Persianas e Decorações Comercio e Serviços Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA. TERÇA-FEIRA, ACIMA R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL.  QUANDO FRETE FOB: TRANSPORTADORA:  EXPRESSO SÃO MIGUEL.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0848',
    'Roni Comércio de Tapetes e Decorações Ltda.',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    NULL,
    'Tentar agrupar os pedidos na semana e enviar juntos',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0963',
    'Criativa Cortinas Ltda',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1527',
    'Crie Seu Móvel Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'POR TRANSPORTADORA, CLIENTE SOLICITA COLETA E FRETE SERÁ FOB',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1688 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0128',
    'crisdan',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0286',
    'Cristal Com. de Div. Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1147',
    'Cristalle Interiores Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'CIF com cobrança na proxima NF',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1063',
    'Rosane de Fatima Marcon 47849207068',
    'CIF',
    2000.0,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1362; C1440',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0876',
    'Cristiane Ancheta Campos',
    'FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0094',
    'Roseli Lurdes Jesus Stake ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0288',
    'Cristiane Aparecida Krull',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1437',
    'Cristiane Gonçalves MEI',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0879',
    'CRISTIANE JARDIM FERNANDES',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1368',
    'CRISTINA ABREU VIEIRA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'PEDIDO VLB.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1199',
    'CRS Representações Comerciais',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1694',
    'CS Borges e Coppini Persianas e Acabamentos LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    'U A BAIXA DO PORTESTO DESCRITO ACIMA',
    NULL,
    'ativo',
    NULL,
    'FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0272',
    'CYM Arquitetura & Interiores Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0975',
    'D & W Decorações LTDA EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1354',
    'D M DE PAULA PROJETOS E DECORAÇÕES ME',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0386',
    'Becker Ambientes Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1244',
    'ROSI DE OLIVEIRA GOMES',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0192',
    'D. E. Lunkes & Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1 VEZ POR SEMANA - ACIMA DE 700,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0501',
    'D7 Interiores LTDA ME.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1491',
    'Rosicler Mews',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0835',
    'Paulo Waldeson Rauta - ME',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    'agrupar os pedidos e enviar 1 vez por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0837',
    'JK Comércio',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CONSULTA SERASA EM 21/03/16 - OK  - NADA CONSTA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0864',
    'Rossini & Dornelles Ltda EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x semana ------------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 16/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0452',
    'Rotta Materiais de Construção Ltda',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0840',
    'Ilone Braun',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1311',
    'Da Patinha Pet Shop',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1122',
    'Da Vinci Home Decor Comércio de Artigos Decorativos LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE ACORDO: TABELA 20% + TABELA 3 . PRAZO DE PAGAMENTO SE POSSÍVEL 30/60',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1506',
    'DAC AMANCIO COMERCIO E SERVIÇOS EIRELI',
    'CIF_FOB',
    NULL,
    NULL,
    'Alfa Transportes',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1276',
    'DAIANA BERLESI SENDESKI',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0850',
    'Roznieski e Barros Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1 vez semana - tentar agrupar e enviar juntos os pedidos',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1656',
    'Daneluzzi Móveis Planejados LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA, TODA SEGUNDA FEIRA',
    NULL,
    'ativo',
    NULL,
    'CIF 1X POR SEMANA  TRANSPORTADORA - EXPRESSO SÃO MIGUEL FREQUENCIA DE ENVIO 1X NA SEMANA, TODA SEGUNDA FEIRA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0208',
    'RT Decorações Ltda – ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0316',
    'daniel cri',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE: CLIENTE BALCÃO QUANDO NECESSÁRIO FRETE: FOB __________________________________________________________________________________________ COMERCIAL  REALIZOU TREINAMENTO DE MOTORIZAÇÃO DIA 06/09/2022  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0873',
    'Rubeal Decorações Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1772',
    'Daniel Crispim 59.864.270',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE: CLIENTE BALCÃO QUANDO NECESSÁRIO FRETE: FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0854',
    'Suprema Soluções em Esquadrias Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0784',
    'Daniel Fernandes',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0889',
    'RUDIMAR GUGEL 31050646053',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0769',
    'Daniel Miranda - ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1734',
    'Daniela Barbosa Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1735',
    'Daniela Barbosa Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1732',
    'Daniela Barbosa, Luz, Casa e Decoração Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE NÃO AGRUPAR FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO TRANSPORTADORA: EXPRESSO SÃO MIGUEL TRANSPORTADORA QUANDO FOB: TRANPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0321',
    'Rui Vasco Bernardo',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1733',
    'Daniela Barbosa, Luz, Casa, e Decoração Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1374',
    'DANIELA ROSA ME',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0902',
    'Rusticare Comercio de Moveis e Decorações Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1192',
    'Sueli Manjabosco Nunes Comércio de Cortinas e Persianas LTDA',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1013',
    'Daspengler Cortinas e Persianas Eirelli Epp',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1206',
    'Davidson Gonçalves Pires de Melo',
    'FOB',
    NULL,
    NULL,
    NULL,
    '- Toda terça Transportadora -  Transoliveira  *Documentos no portal  INATIVADO 17/01/2023 CONFORME SOLICITAÇÃO DO CÉLIO',
    NULL,
    'ativo',
    NULL,
    'TIPO DE FRETE - FOB  FREQUÊNCIA DE ENVIO - TODA TERÇA TRANSPORTADORA -  TRANSOLIVEIRA  *DOCUMENTOS NO PORTAL  INATIVADO 17/01/2023 CONFORME SOLICITAÇÃO DO CÉLIO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1184',
    'S R L Teixeira Portas, Pisos e Revestimentos',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1X NA SEMANA TODA SEGUNDA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, PEDIDOS ACIMA DE R$1.500,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TODA SEGUNDA-FEIRA. TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB *VALOR DE FRETE CIF ALTERADO DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO -------------------------------------------------------------------------------- ANALISE REPRESENTANTE  - INDICAÇÃO DA R CERVELLINE, TEIXEIRA É UM CLIENTE QUE TRABALHA COM PISOS, PORTAS E REVESTIMENTOS. TEM UMA LOJA BEM BACANA, TODA DE VIDRO EM UM PONTO MU'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0544',
    'Dayane Aparecida Rozin',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1203',
    'S.F. COMÉRCIO DE ARTIGOS PARA DECORAÇÃO LTDA',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0624',
    'S.M. da Silva Decorações',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1608',
    'S.R. COMERCIO DE CARPETES EM GERAL LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0723 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0158',
    'DB DECORAÇÕES LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0881',
    'Flavio Luiz F.Teixeira Cia Ltda - ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0759',
    'DBM Call Center Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0886',
    'Davi Dutra de Avila - ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1 x semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1117',
    'SABREVEST COMERCIO E DECORACOES LTDA - EPP',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0522',
    'DDC Decorações Interiores',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF OU BAUER E PARA FRETE FOB - ACEVILLE METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF OU BAUER E PARA FRETE FOB - ACEVILLE METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1052',
    'De Bett Comercio Artigos de Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1676 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1457',
    'DEALER ONE',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0984',
    'Debacco Materiais de Construção Ltda.',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1020',
    'Deboita Tapetes Moveis e Decorações Ltda',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1035',
    'Declesio Mioteli Mei',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA -  EXPRESSO SÃO MIGUEL MODALIDADE: FOB  *VALOR DO CIF ALTERADO DIA 15/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  ----------------------------------------------------------------------- INFORMAÇÕES ADICIONAIS  SÓCIOS:   DECLESIO MIOTELI   49 99970 3785   DECLESIOMIOTELLI23@HOTMAIL.COM   084.441.089-60   EST. LIN. SANGALETTI  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1705',
    'Decolar Comércio de Produtos de Decoração Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X SEMANA SEM VALOR MINIMO  TRANSP JAMEF  FRETE FOB TRANSP EUREKA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1361',
    'Decor Casa materiais de construção Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0037',
    'Decor Center Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ENTREGA DE MERCADORIA (TERÇA E QUINTA)- 23/08/2012- MANUELA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1398',
    'Sabrina Enxovais LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2x na semana 1 FOB e 1 CIF 1 vez por semana, sem valor mínimo - Cliente Member Acima de 3m - Rodonaves  **** NÃO ENVIAR PELA BAUER *****  ---------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1111',
    'DECOR HOME AMERICANA LTDA - ME',
    'CIF_FOB',
    NULL,
    NULL,
    'CIF com cobrança na proxima NF   07/12/2017 - Cons',
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO: CLIENTE TEM NA HD O PRAZO DE 30/60',
    'PARA 12 MESES, EXCETO NA MOTORIZAÇÃO, QUE SERÁ FATURADO COM PRAZO A COMBINAR, PORÉM PARA SHOW-ROOM DEPENDENDO DO PROJETO, PODEMOS CONCEDER 15% SOBRE O VALOR DE TABELA. DURANTE ESTE PERÍODO DE 12 MESES LOJA DEVERÁ ATINGIR UM VOLUME MÍNIMO DE R$ 200.000,00; ALCANÇANDO ESTE OBJETIVO O BOLETO É CANCELADO.  CONDIÇÃO DE PAGAMENTO: CLIENTE TEM NA HD O PRAZO DE 30/60/90/120, EFETUA AS VENDAS EM ATÉ 10X. PRECISAMOS ESTUDAR ALGO PRÓXIMO DO QUE TEM HOJE.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1556',
    'Decor House & Cia LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    NULL,
    '- toda quinta Modalidade de frete - 1x FOB  Transportadora: CIF Expresso São Miguel e FOB Princesa dos campos / Brasspress / Expresso São Miguel *Valor do CIF alterado dia 15/08/2022 conforme solicitação do Adriano  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'FREQUÊNCIA DE ENVIO - TODA QUINTA MODALIDADE DE FRETE - 1X FOB  TRANSPORTADORA: CIF EXPRESSO SÃO MIGUEL E FOB PRINCESA DOS CAMPOS / BRASSPRESS / EXPRESSO SÃO MIGUEL *VALOR DO CIF ALTERADO DIA 15/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0499',
    'Decor in BooK Decoração Ltda-Me',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA METRAGEM:',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA METRAGEM:'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1544',
    'Decor Life Comercio e Serviços LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 17/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1474',
    'SALAMANDRA PERSIANAS E CORTINAS EIRELI',
    'CIF_FOB',
    NULL,
    NULL,
    'Alfa Transportes',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0946',
    'Salaverry e Roos Ltda Me',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'TODAS AS QUARTAS* ---------------------------- 15/08/2022 - INATIVAR AO ZERAR SALDO   ***REVENDA FECHOU***',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0907',
    'Joselaine Beatriz de Oliveira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c0445',
    'Samuel Tavares',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1552',
    'SANDRA MARIA ARCENO',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0243',
    'Sandra Regina de Souza Dec. Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0847',
    'Decor Prime Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0760',
    'Decora Móveis Mirassol Ltda - ME',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    'SEXTA ----------------------------------------------------------- 09/07/2019 - COND DE PGTO ALTERADA PARA ANTECIPADO, LIMITE ZERADO',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0557',
    'Santa Decor Ltda Me',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X SEMANA  TRANSPORTADORA: BAUER ATÉ 5M',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X SEMANA  TRANSPORTADORA: BAUER ATÉ 5M. METRAGEM: ACIMA DE 5M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0825',
    'Decora Persianas LTDA-ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'U O ACORODO FEITO COM O FORNECEDOR QUE CONSTA NO SERASA DELES, VOLTAMOS COM A CONDIÇÃO E LIMITES ANTIGOS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1360',
    'Santo Encanto Indústria Têxtil LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0783',
    'JJM Comercio e Produtos de Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'REVENDA SELECT - FRETE CIF 2 VEZESPOR SEMANA, sem valor mínimo - terça e Sexta-feira **TENTAR AGRUPAR QUANDO POSSÍVEL  **GRUPO ECONÔMICO** Revenda faz parte do mesmo grupo econômico que C1483; C0093; C1682 por isso dividem o mesmo acordo de frete',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1483; C0093; C1682 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0511',
    'SantoPiso Comercial LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'QUANDO ESTIVER PRONTO',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: BAUER FOB METRAGEM: ATÉ 6M.  -----------------------------------------------  FREQUENCIA DE ENVIO: QUANDO ESTIVER PRONTO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1600',
    'Decorar Persianas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0705',
    'Santos Comércio de Persianas Ltda - ME',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    NULL,
    'PELA BAUER',
    NULL,
    'ativo',
    NULL,
    'FRETE: CIF 1X POR SEMANA COMPRAS ACIMA DE R$ 700,00. TRANSPORTADORA: CIF/FOB ENVIO PELA BAUER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1251',
    'DECORART REVESTIMENTOS INTERIORES & COMERCIO LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'DIRETO. MAS ISTO FICARÁ A CRITÉRIO DA REVENDA QUE VAI NOS INFORMAR. QUANTO A TABELA: TABELA PROMOCIOAL + TABELA A. QUANTO À PRAZO: SE TUDO ESTIVER OK, 10/28/56. MAS EM GRANDES OBRAS, NEGOCIAREOS DE FORMA PONTUAL. ENVIAR KIT NO VALOR DE R$ 970,00 EM 3X.  REFERENCIA COMERCIAL DA JVN: "NÃO FORNECEMOS INFORMAÇÕES COMERCIAIS ATENDO ESTE CLIENTE E O QUE POSSO INFORMAR E QUE NUNCA TIVE PROBLEMAS COM RELAÇÃO A PENDÊNCIAS FINANCEIRAS DESDE JA AGRADEÇO A COMPREENSÃO "'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1133',
    'SAP Brasil Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    'DIRETO ------------------------------------ ENVIO TODAS AS QUINTAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1340',
    'DECORARTS IND E COM DE CORTINAS LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1407',
    'Decorações JVR Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1068',
    'Saturnuna Engracia Vicente',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1005',
    'Saude Suplementar Soluçoes em Gestão e Consultoria Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO MANDAR EMAIL DA NF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0474',
    'Decorações Kayukawa',
    'FOB',
    NULL,
    NULL,
    NULL,
    'RMA (FRETE FOB E ANTECIPAÇÃO)  ---------------------------------------------------------------------------------- FATURAMENTO  FRETE SOMENTE FOB',
    NULL,
    'ativo',
    NULL,
    'FRETE SOMENTE FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1314',
    'Sauer Grings e Cia LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'JUNTO COM PEDIDOS DA VANIA SIGNORI - CADASTRO VINCULADO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0661',
    'SAVES ADMINISTRADORA DE BENS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1139',
    'SC Cortinas e Persianas LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'Terça e Quinta - AGRUPAR SEMPRE QUE POSSIVEL  -------------------------------------------------------------------------------------------------------------------------------- Analise do representante: Empresa de grande potencial e visibilidade muito voltada para profissionais especificares',
    NULL,
    'ativo',
    NULL,
    'DAS NFS TAXA DE JUROS 2,1% PARA PAGAMENTOS ACIMA DO PRAZO LIMITE: 40K  DATA: 24/06/2020 - CONSULTA REALIZADA NO SERASA NADA CONSTA. 07/04/2021 - LIMITE ALTERADO DE 40K PARA 60K (EMAIL ADRIANO) 12/01/2022 - ALTERAÇÃO CONTRATUTAL, FIM DE SOCIEDADE. AGORA A EMPRESA PERTENCE SOMENTE A JOSÉ CLÁUDIO RIBEIRO, NÃO TEM MAIS LIGAÇÃO COM CONFECÇÕES ALEXANDRE - EM ANEXO 18/02/2022 - CONSULTA REALIZADA, NADA CONSTA. SCORE 514/1000. (ANEXO) 25/04/2022 - CONSULTA REALIZADA, CONSTAM PENDENCIAS. SCORE 326/1000. '
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1200',
    'DECORAÇÕES MANJABOSCO LTDA',
    'FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0616',
    'Decorações Maringa Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1688',
    'Indústrias Lonn Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1527 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'CLIENTE BALCÃO SE NECESSÁRIO TRANSPORTADORA: FOB  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1527 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1702',
    'Guinza Café Decor Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2X POR SEMANA - TERÇA/QUINTA - 1 FRETE CIF (SEM VALOR MÍNIMO) E UM FOB FOB ARLETE OU OURO NEGRO CIF OU MERCADORIAS ACIMA DE 3MTS ENVIAR POR OURO NEGRO  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1008 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1008 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FREQUENCIA DE ENVIO:  2X POR SEMANA - TERÇA/QUINTA - 1 FRETE CIF (SEM VALOR MÍNIMO) E UM FOB FOB ARLETE OU OURO NEGRO CIF OU MERCADORIAS ACIMA DE 3MTS ENVIAR POR OURO NEGRO  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1008 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA SEM VALOR MÍNIMO, É PARA AMBAS. E NÃO 1 CIF PARA CADA.   ------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1222',
    'SC Premium Promotora de Eventos LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1566',
    'JLLF Soluções e Revestimentos para Construções LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0866',
    'Decorações Nunes e Borges Ltda - ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'cif acima de 700 ex s miguel fob braspress ---------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0308',
    'Scenarius Decoração Ltda EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA - TERÇA OU QUINTA (SALVO AUTORIZAÇOES DE 2 ENVIOS NA SEMANA)   ---------------------------------------------  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    'CONDIÇÃO PARA ANTECIPADO E LIMITE ZERADO. (KÁTIA E PRICILA). 09/07/2018 - ALTERADO LIMITE PARA 10MIL E CONDIÇÃO DE PGTO 10/28/56. (ADRIANO) 18/09/2018 - CONSULTA REALIZADA, NADA CONSTA. (ANEXO)  30/01/2020 - CONSULTA REALIZADA, NADA CONSTA. 21/05/2020 - LIMITE ALTERADO DE 10K PARA 20K. - IVAN 31/01/2020 - ALTERADO LIMITE: 10.000,00 - 28',
    'MODALIDADE: FOB   FREQUENCIA DE ENVIO: 1X NA SEMANA - TERÇA OU QUINTA (SALVO AUTORIZAÇOES DE 2 ENVIOS NA SEMANA)   ---------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0138',
    'Decore Com. de Dec. para Interiores Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1178',
    'SCHARNOVEBER PERSIANAS LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0038',
    'Decorenzi Dec. Com. Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0959',
    'SDI Comércio de Decoração de Interiores Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0641',
    'SEAP Construção e Comércio Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'terças e quintas ------------------------------------------------  03/08 - alterado de 10/28/56 para antecipado devido a protestos',
    NULL,
    'ativo',
    NULL,
    '/EXPEDIÇÃO: BAUER PRAZO: 24HS -------------------------------- FRETE: FOB TRANSPORTADORA: BAUER  ------------------------------------------------ FREQUÊNCIA DE ENVIO: TERÇAS E QUINTAS ------------------------------------------------  03/08 - ALTERADO DE 10/28/56 PARA ANTECIPADO DEVIDO A PROTESTOS. E ZERADO LIMITE DE 10MIL KATIA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0198',
    'Decoreolar Dec. de Interiores Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1045',
    'Sebastiany Comercio de Cortinas e Revestimentos Ltda',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0039',
    'Decores Cortinas e Dec. Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0091',
    'Sedaflex Persianas Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0193',
    'Decori Cortinas e Persianas  LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1243',
    'DECORI CORTINAS E PERSIANAS LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0627',
    'Decormix Móveis Decorações  Informatica  e Telefonia LTDA ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'PEDIDOS INFERIORES A 500,00" TRANSPORTADORA - DISK&TENHA  PEÇAS ACIMAS DE 2 METROS TRANSPORTADORA ACEVILLE',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1259',
    'Decorwall Com. Decoração LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0973',
    'Deisy CT Aprato ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0722',
    'Dekora Indústria e Comércio de cortinas Ltda - ME',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE: FRETE CIF - 1X POR SEMANA (ACIMA DE R$ 700,00)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1297',
    'DEL ROYALE EIRELI- ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0974',
    'Delan Moveis e Decorações',
    'CIF',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF NAS COMPRAS ACIMA DE R$ 700,00 ENTREGA UMA VEZ POR SEMANA.'
);

-- Batch 18/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1789',
    'Automatika Controls Serviços e Comércio Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MÍNIMO R$ 2.000,00 TRANSPORTADORA: JAMEF QUANDO FOB: LOGBG EXPRESS LTDA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1362',
    'Delvo Zappani Junior  - MEI',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1063; C1440',
    'ativo',
    NULL,
    'ACORDO DE FRETE: FRETE CIF 1X NA SEMANA, QUARTA-FEIRA, ACIMA R$ 1.500,00 TRASPORTADORA : SÃO MIGUEL   FRETE QUANDO FOB: TRANSPORTADORA SÃO MIGUEL   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1063; C1440. C1518 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00, É PARA TODAS. E NÃO 1 CIF ACIMA DE 1.500,00 PARA CADA.    -----------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c0297',
    'Selbetti gestão de documentos S/A',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0084',
    'Sergio Zanella Junior ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0794',
    'Blum Haus Interiores Ltda.',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA:   BRASPRESS PARA FOB. MOBILE PARA CIF OU PARA FOB MAIOR DE 2M FRETE CIF 1X NA SEMANA ACIMA DE 1.500,00   __________________________________________________________________  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0745',
    'Denilson Persianas e Cortinas Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'REVER MODALIDADE DE FRETE COM KATIA -----CLIENTE NAO FEZ MAIS COMPRAS ----  MODALIDADE DE FRETE - 1X FOB TRANSPORTADORA - BAUER *VALOR DO CIF ALTERADO DIA 15/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL  ---------------------- 14/06/24 - INATIVADA CONFORME SOLICITADO PELO RICARDO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1451',
    'Denise Freitas Felix Silva LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    'SEMPRE TERÇAS E QUINTAS   ** ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0150 E C1711 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1466',
    'Sertori Artigos de Decoração e Manutenção Limitada',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALO MÍNIMO R$ 1.500,00 TRANSPORTADORA : JAMEF  TRANSPORTADORA FOB: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0663',
    'DENISE ZINI PACHECO ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0015',
    'Denize Soares',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1349',
    'Design Clean Móveis e Soluções para Escritório Ltda – EPP',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0976',
    'NEO DESIGN COMÉRCIO E DECORAÇÕES LTDA',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0652',
    'SEVILLE PARK HOTEL LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0371',
    'Destra Industria de Plasticos LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1532',
    'Detalli Cortinas Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'RODONAVES FRETE: CIF 1X SEMANA NA TERÇA-FEIRA AGRUPAR TODOS OS PEDIDOS DA SEMANA E ENVIAR 1 VEZ SÓ. FRETE FOB: RODONAVES   ------------------------------------------------------------------------- REFERÊNCIAS COMERCIAIS  PERSOL PERSIANAS; TAPEÇARIA AMERICANA E BUCALO PAPÉIS DE PAREDE.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0043',
    'DFP- Forros e Divisorias LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE MERCADORIA, TERÇA E QUINTA -------------------------------------------- CADASTRO MODIFICADO 22/02/2011,  LOJA FOI VENDIDA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1246',
    'Shadow Comercio de Persianas e Toldos LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1046',
    'Dictor Maquinas e Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1211',
    'Dienifer Dedeco Sangoi',
    'CIF',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0860; C1363 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'ACORDO DE FRETE TRANSPORTADORA CIF E FOB: EXPRESSO SÃO MIGUEL. FRETE SEMPRE CIF 1X NA SEMANA, QUARTA-FEIRA, SEM VALOR MÍNIMO  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0860; C1363 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE.   ------------------------------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0276',
    'Shepherd Negócios Internacionais Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'DE MERCADORIA, TERÇA CIF (ACIMA DE R$ 500,00, VALOR ABAIXO DE R$500,00 FRETE FOB)  ------------------------------------------------------------------------- REUNIÃO JEAN - 09/08 JEAN FALOU QUE CLIENTE NÃO VAI MAIS COMPRAR COM UNILUX - VAI COMPRAR COM COLUMBIA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1383',
    'Lacasa Presentes e Decoracoes LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA SEXTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: 1X NA SEMANA TODA SEXTA-FEIRA. TRANSPORTADORA: EXPRESSO SÃO MIGUEL   ---------------------------------------------------------------------------- *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0899',
    'Dilmar Cesar Zardo ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0001',
    'Unilux Ind. e Comércio de Persianas Eireli',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0019',
    'Dilnei Niehues ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1479',
    'Dimel Materiais de Embalagens LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1027',
    'Dinovar Persianas Cortinas e Pisos Me',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x na semana fob  (acordado Gustavo/ Carol exp 03/03/2017)',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0964',
    'Diventare Pisos e Decorações Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0998',
    'Revesty Empreendimentos LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'FRETE FOB 2X POR SEMANA - TERÇA/SEXTA  22/11 - JOSI',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0496',
    'Divina arte decorações LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1221',
    'Divina Kelly da Silva Santos 30257204172',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1488',
    'Silmara M. A. de Oliveira Decorações',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA ACIMA DE R$1.500,00 TRANSPORTADORA CIF E FOB - JAMEF 14/02/2024  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0637',
    'Divinitá Presentes Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1004',
    'Silvia Santos Coltro ME',
    'CIF_FOB',
    800.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1140',
    'SILVA & NEGRELLI LTDA ME',
    'CIF_FOB',
    NULL,
    NULL,
    'CIF com cobrança na proxima NF ___________________',
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO DE PGTO ALTERADO DE ANTECIPADO PARA 10/28/56 _____________________________________________________________________  ACORDO DE FRETE:  TRANSPORTADORA: RODONAVES (29/08/2022) 01/10/2018 - ACORDO DE FRETE FOB: CIF COM COBRANÇA NA PROXIMA NF _____________________________________________________________________  ANALISE REPRESENTANTE: ESTA ERA A PRINCIPAL REVENDA CRIATIVA EM SJRP, TRABALHAVA DE FORMA EXCLUSIVA ATÉ MEADOS DE 2016. LOJA TRADICIONAL NA CIDADE, MUITO ATUANTE NO SEGMENTO DE CONFECÇÃO DE CORTINAS EM TECIDO. VAMOS TRABALHAR DE FORMA EXCLUSIVA. TABELA 20% + TABELA 3. CONDIÇÃO DE PAGAMENTO ATUAL COM A COLUMBIA É DE 30/60/90, SE POSSÍVEL, VAMOS CADASTRAR EM 28',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0841',
    'Divinorte Comércio de divisórias Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0045',
    'Divipiso Divisórias e Pisos Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1010',
    'Homens da Casa Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0614',
    'SILVA & OLIVEIRA BOUTIQUE DECOR LTDA - ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA ACIMA DE R$ 700,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1526',
    'DIVISA BRASIL INDUSTRIA DE DIVISÓRIAS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1807',
    'Kza Interiores Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MÍNIMO R$ 1.500,00 TRANSPORTADORA: JAMEFE  QUANDO FRETE FOB : TRANSPORTADORA RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1229',
    'SILVA & RAMOS DECORAÇOES LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1016',
    'Adriano Cleber Miranda Toldos ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0327',
    'Divisórias Urussanga Ltda - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1019',
    'Residencial Andrade Neves Empreendimentos Imobiliarios Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0915',
    'DLD Materiais de Construção Eireli',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1021',
    'Easyblind Ind.Com.Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1571',
    'SILVANA CAMPANI MAINIERI',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0909',
    'DMG Moveis e Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0771',
    'DMX Revestimentos Ltda -EPP',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1160',
    'SILVANA CRISTINA ZANOTI BIAGIOTTI - ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 19/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1026',
    'Donizete Antonio Batalha',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1025',
    'Dora Beatriz Gamarra Medina Me',
    'CIF_FOB',
    900.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0020',
    'Dotti e Silva Ltdaxxxx',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1015',
    'Douglas  Neves da Silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1029',
    'Ars Moveis Planejados Ltda',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1445',
    'Silvana Scariot Piano',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0700',
    'Criativa Cortinas Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1618',
    'Silvana Ziegler Haselein',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0679',
    'Douglas Soares Fernandes',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1706',
    'Douglas Vinicius Stankievicz 83640495004',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1666',
    'DP Gastronomia LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DOS TOLDOS PARA A PIZZARIA. MESMAS CONDIÇÕES, TABELAS E LIMITE QUE TELA E DECOR.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0471',
    'DR Industria e Com de Pers. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1777',
    'Duarte Cortinare Cortinas e Persianas Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0405',
    'Due Sorelle Cortinas e Decorações Ltda Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ENDEREÇO DE ENTREGA:  RUA ALFREDO SCHNEIDER, 58 EDIFÍCIO DONA NOEMIA, SALA 06 BAIRRO: CANTA GALO RIO DO SUL - SC CEP: 89.163-086'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0048',
    'DV PERSIANAS xxx',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1835',
    'D´Arte Home Solution Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, ACIMA R$ 1.500,00. TRANSPORTADORA JAMEF  QUANDO FRETE FOB: TRASPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1317',
    'Décio Agropecuária e Floricultura',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0456',
    'SILVANIA SEVERGNINI PERSIANAS',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0168',
    'E. COSTA REPRESENTAÇÕES',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1090',
    'E.G.M. de Souza Ebenezer Comercial - ME',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0379',
    'Edgar monteiro Presentes',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    'enviar quando ficar pronto',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA - ACIMA DE R$ 700,00 TRANSPORTADORA:  BAUER FRETE FOB - BAUER -------------------------------------------------------- FREQUÊNCIA DE ENVIO: ENVIAR QUANDO FICAR PRONTO. ------------------------------------------------------------------  DAR CREDITO REF PEDIDO MC INCOPORADORA APÓS PAGAR TODOS OS BOLETOS 1.       VALOR DO PEDIDO R$ 49,300,00. 2.       VALOR QUE DEVE SAIR NA NOTA R$ 57,000,00 3.       IMPOSTOS À DESCONTAR DO LOJISTA PELA DIFERENÇA R$ 1.350,00 (18%) 4.       C'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0773',
    'Edi Zenaide Klosowski Ribeiro - ME',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0640',
    'SILVANO DE ALMEIDA MACHADO E CIA LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1054',
    'Cunha Tecidos e Tapeçaria Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0932',
    'Silver Bell Papel de Parede Ltda',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1051',
    'Ediliana Zimmer Pereira Me',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0633',
    'Edinaldo Carlos Cabral ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1560',
    'Silvio José Rossetto Neto',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1120',
    'Edlo Mendes Baião Neto',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1576',
    'Simone Ines de Souza',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0139',
    'Edson Decorações e Revestimentos ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0778',
    'Edson Edelcio Boesing ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0054',
    'Edson Evaldo da Silva ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1182',
    'SIMONE KETHERINE MATOS ARAGÃO ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1439',
    'E L dos Santos Decorações',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0325',
    'Edson Luiz Cidral',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1071',
    'Fraga e Melo Tec. e Revestimentos',
    'FOB',
    NULL,
    NULL,
    NULL,
    'FRETE FOB 2X POR SEMANA - TERÇA/SEXTA  22/11 - JOSI',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1072',
    'Persianas Luxline Ltda EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1073',
    'Regina Celi Squassante Cipriano EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1507',
    'Simone Maria Guimarães Dutra da Rosa',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB TRANSPORTADORA: PAJUCATA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1075',
    'Tom Sobre Tom Ind. e Com. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1076',
    'Drywall Decor Pisos e Revestimentos Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    'SEXTA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1388',
    'Edson Luiz Cidral',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0483',
    'Sinflex Ind. e Com. de Persianas Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0630',
    'SINGOLO COMÉRCIO DE MÓVEIS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1249',
    'Singular Simone Jardim LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0326',
    'Eduardo Bolfoni Vargas',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1424',
    'Eduardo Braga Tabajara',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1083',
    'Marcio Custodio Ferreira ME',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0925',
    'Sirlene Mara Henrique Castilho ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 20/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0309',
    'Efigenia Silverio ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1337',
    'EJS Consultoria Fiscal',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0826',
    'Elaine Lamb ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'SÃO MIGUEL   CLAUDIONOR RGP TRANSPORTES - 8521-4141 MARCOS - 9221-2095'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1763',
    'Electron Parts Comércio de Produtos de Iluminação Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO. TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0155',
    'SJP Persianas ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1489',
    'ELENITA GONÇALVES PEREIRA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0183',
    'Eliezer Santos Serra & Cia Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0820',
    'Eliria Cortinas e Decorações Ltda Me',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1093',
    'L.Dan Bauer Moveis EIRELI EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    'S SEMPRE NA TERÇA - FOB ******************** 26/08/2021 - ALTERADO CONDIÇÃO DE PAGAMENTO PARA ANTECIPADO E FRETE TEM QUE SER FOB (ORIENTAÇÕES ADRIANO)******************  ____________________________________________________________________________________  ANALISE DO REPRESENTANTE: REVENDA COM FOCO TAMBÉM NO SEGMENTO CORPORATIVO, EM 2016 INVESTIU R$ 2',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1378',
    'ELISIANE RODRIGUES SOUSA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1487',
    'Elite Transportes LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0238',
    'Smart Haus Acab. & Int. Ltda me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1820',
    'Smart Touch Automação Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Jadlog',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA , VALOR MÍNIMO R$ 1.500,00 TRANSPORTADORA JAMEF FRETE QUANDO FOB: JADLOG'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0342',
    'Elizangela M. Reischardt ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0645',
    'Eloilton Domingos Ramos Junior - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1101',
    'W S Tecidos e Confecções LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0942',
    'Elton Pereira de Souza',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1737',
    'Emanuel Arte e Decor Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1475',
    'Snege e Snege Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0565',
    'Emarts Cortinas e Decorações LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'SEMPRE FOB  TRANSPORTADORA BRASPRESS METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368  *VALOR DO CIF ALTERADO DIA 15/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1680',
    'EMPREENDIMENTOS IMOBILIARIOS INGA LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0774 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0190',
    'Soares e Silva Rodrigues Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c0398',
    'SOC EDUC DE SANTA CATARINA (MO)',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0803',
    'Empório Village da Barra Comércio e Decorações Ltda - ME',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1152',
    'ENCANTOS DECOR LTDA ME',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1419',
    'Energiluz Comércio de Materiais  Elétricos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1092',
    'Enki Ind. E Com. De Móveis e Cortinas Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1227',
    'ENTREART DESIGN',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'DIRETO NAS OBRAS EM QUE NOS TROUXER. FATURAMOS PRODUTO E ELA SERVIÇO. REVENDA JÁ ATUANTE COM OUTROS CONCORRENTES MAS IRÁ TRABALHAR 100% UNILUX. ESTAMOS COM INÚMEROS PROJETOS EM ANDAMENTO. ENVIAR BOOK E-CONTRACT COM BOLETO PARA 28 DIAS. NOS PEDIDOS CUJO FATURAMENTO FOR DIRETO NO CUSTO FÁBRICA, O FRETE SERÁ CIF. ENVIAR 4 BOOKS E-CONTRACT - R$ 150,00 CADA."'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1241',
    'ERICSSON GESTAO E SERVICOS DE TELECOMUNICACOES LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1752',
    'Arte Center Decoração de Interiores e Revestimentos Ltda',
    'CIF',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MÍNIMO R$ 1.500,00 TRANSPORTADORA: JAMEF ACIMA DE 3M - TRANSOLIVEIRA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0145',
    'ERIKA TECIDOS',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0871',
    'Ernani Coelho & Cia Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1283',
    'Eronildes Holub Bussolo',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0365',
    'ERVIEGAS Instrumental Cirúrgico Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0844',
    'Espaço Ambiente Comercio de Matriais de Construção',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0765',
    'Soeli Ingracio de Silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1137',
    'Sol Comércio de Cortinas e Persianas LTDA',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    '- Somente Quarta - feira Frete sempre FOB  ----------------------------------------------------------------------------------------------------------- INFORMAÇÕES ADICIONAIS:  Acordo fechado em 30/06/2019',
    'GRUPO ECONÔMICO : GRUPO SOL (C1137 E C1806) 29/09/2025 - CONSULTA REALIZADA, NADA CONSTA',
    'ativo',
    'CONDIÇÃO DE PAGAMENTO. 14/06/2018 - CONSULTA REALIZADA, NADA CONSTA. (ANEXO) 02/07/2018 - EMAIL COM ACERTO SOL (ANEXO) 14/08/2018 - EMAIL COM ACERTO SOL (ANEXO) 03/07/2019 - CONSULTA REALIZADA, NADA CONSTA (ANEXO)  MARÇO 2020 RENEGOCIAÇÃO COVID-19: TODOS OS BOLETO',
    'TRANSPORTADORA - EXPRESSO SÃO MIGUEL FREQUÊNCIA DE ENVIO - SOMENTE QUARTA - FEIRA FRETE SEMPRE FOB  ----------------------------------------------------------------------------------------------------------- INFORMAÇÕES ADICIONAIS:  ACORDO FECHADO EM 30/06/2019. CONFORME VOCÊ SOLICITOU, SEGUE ABAIXO ACORDO DÍVIDA SOL PERSIANAS: - DÍVIDA: R$28.197,87 - JUROS DÍVIDA 1,5% A.M.: R$6.599,43 - TOTAL: R$34.695,79 - JUROS PARA PARCELAMENTO EM 12X COM TAXA DE 1,0% A.M.: R$1.908,63 - 12X DE R$3.050,36 UMA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0457',
    'Belo Ambiente Tecidos LTDA ME',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0144',
    'Espaço Decor Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0695',
    'Espaço Design Class Comércio de Móveis Eireli  - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0221',
    'Espaço Divano Floripa Moveis e Objetos Ltda Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1830',
    'Solar System Produtos para Proteção Solar Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    'GRUPO ECONÔMICO : PERGOSYSTEM (C1829,C1829 E C1830)   --------------------------------------- FATURAMENTO  FRETE CIF, 2X NA SEMANA TRANSPORTADORA: RODONAVES QUANDO FRETE FOB: RODONAVES',
    'ativo',
    NULL,
    'FRETE CIF, 2X NA SEMANA TRANSPORTADORA: RODONAVES QUANDO FRETE FOB: RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1381',
    'Espaço Fino Cortinas e Decorações LTDA-ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1142',
    'Arte e Consertos Comercio de Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0024',
    'Solenir Muller ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1754',
    'Espaço Sala - Decorações e Revestimentos Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO: C1404  --------------------------------- FINACEIRO  2/11/2024: CONSULTA RELAIZADA, NADA CONSTA',
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO TRANSPORTADORA : EXPRESSO SÃO MIGUEL QUANDO FRETE FOB: TRANSPORTADORA SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1557',
    'Sollana Atelie LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'Quarta Modalidade de frete: 1 CIF por semana  sem valor minimo  Transportadora FOB: Rodonaves  *Transportadora e valor de frete CIF alterados dia 18/08/2022 conforme solicitação do Adriano ------------------------------------------------------------------------------------------------- COMERCIAL  *Atualizado para tabela A dia 16/05/2022 -  Autorizado Adriano',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA CIF: RODONAVES FREQUÊNCIA DE ENVIO: QUARTA MODALIDADE DE FRETE: 1 CIF POR SEMANA  SEM VALOR MINIMO  TRANSPORTADORA FOB: RODONAVES  *TRANSPORTADORA E VALOR DE FRETE CIF ALTERADOS DIA 18/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO ------------------------------------------------------------------------------------------------- COMERCIAL  *ATUALIZADO PARA TABELA A DIA 16/05/2022 -  AUTORIZADO ADRIANO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0408',
    'Somfy Brasil Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0278',
    'Espaço Sensory Obj. Dec. Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA --------------------------------------------- METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB (ALTERADO EM 07/08/18) --------------------------------------------- FREQUENCIA DE ENVIO: 1X NA SEMANA --------------------------------------------- METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368  TRANSPORTADORA: BAUER (FOB) -----------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0493',
    'Soneide Alexandre ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE: CLIENTE RETIRA NA FABRICA'
);

-- Batch 21/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0802',
    'Espirito Santo Centrais Eletricas S.A.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0347',
    'Esquadrirmãos Esquadrias de Alumínios e Vidros Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    '04/09/2015 - LIMITE ALTERADO PARA R$ 5.000,00 APÓS ANÁLISE ENTRE ADRIANO E ELITON.  FRETE: FOB TRANSPORTADORA: OURO NEGRO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0683',
    'Spather Persianas e Papeis Ltda - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1030',
    'Spazi Decor',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0361',
    'Spazio Bello Decorações LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0389',
    'ESTALEIRO SCHAEFER YACHTS',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1036',
    'V Ambience Comercio e Instalação de Cortinas Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓSXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0446',
    'Estaleiro Schaefer Yachts S/A',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0050 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'LLUI"REGIME DE ICMS-ST NÃO APLICÁVEL CONFORME ART. 228, INCISO LL, ANEXO 3 DO RICMS-SC" "ICMS PRÓPRIO DIFERIDO CONFORME ART.177, INCISO LL, ANEXO 2 DO RICMS-SC". PROCESSO Nº SEF 22218/2010 TTD DO DESTINATÁRIO Nº 105000001169000  TRANSPORTADORA FOB: DISK TENHA   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0251',
    'Sportcasa Decorações LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1514',
    'Viviane Andrea Rivoiro Mata 07479669828',
    'CIF',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: JAMEF CIF 1X NA SEMANA ACIMA DE R$1.500,00.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1173',
    'Squadro Móveis',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'SEMPRE QUE ESTIVER PRONTO  ANÁLISE DO REPRESENTANTE:  REVENDA COORPORATIVA PARA COMPRA DE EXCLUSIVAS DE PEÇAS PH ENTRE VIDROS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0492',
    'Starcolor Proteção e Decoração de Alumínios',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0095',
    'Stilus Comercio de Decorações Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DA NF. MANUELA 18/01/2013  FATURAMENTO:'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1248',
    'Estrutural Cwb Comércio e Serviços Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0666',
    'Euro Decor Móveis e Decorações Ltda',
    'CIF_FOB',
    70000.0,
    '--------------------------------------------------',
    NULL,
    'FRETE 2X POR SEMANA - TERÇA/SEXTA FRETE CIF 1X ACIMA DE 700,00 FRETE FOB   22/11 - JOSI',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0823',
    'Evandro Luis Brun',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0059',
    'Evaril Vestuario ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1874',
    'Entreluz LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'PARA QUINTAS-FEIRAS PARA PEDIDOS PARTIR DE 10/08/2026',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MINIMO R$ 1.500,00. REVENDA SOLICITOU ALTERAR DIA DE ENVIO PARA QUINTAS-FEIRAS PARA PEDIDOS PARTIR DE 10/08/2026.  TRANSPORTADORA: RODONAVES.  FRETE FOB: RODONAVES.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0724',
    'Eveline Schissi Teixeira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0937',
    'Everaldo Som e Automaçao Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1191',
    'EVIAN EMPREENDIMENTO IMOBILIARIO SPE LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0052',
    'EVM Fabrica de Reboques Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0753',
    'Evolução Pisos e Decorações Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1156',
    'Construtora e Incorporadora Rabello Zanella Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0674',
    'Storebox Importação e Comércio LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: ACEVILLE FRETE CIF 1X POR SEMANA SEM VALOR MÍNIMO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0900',
    'Exclusiva Revestimentos e Acabamentos',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    'Agrupar os pedidos 1 x semana - frete CIF - R$ 700,00 ---------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1190',
    'STUDIO 27 COM. DE ARTIGOS DE DECORAÇÃO LTDA ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1710',
    'Expomarcas Comercial Exportadora de Manufaturados Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2X NA SEMANA (TERÇA/QUINTA) TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1151 E C1062 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1151 E C1062 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FATURAMENTO    MODALIDADE DE FRETE: CIF 2X POR SEMANA INDEPENTENDE DO VALOR (AGRUPAR SE POSSÍVEL) FREQUENCIA DE ENVIO: 2X NA SEMANA (TERÇA/QUINTA) TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1151 E C1062 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 2X NA SEMANA SEM VALOR MÍNIMO, É PARA TODAS. E NÃO 2 CIFS PARA CADA.   *DOCUMENTOS NO PORTAL  --------------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0196',
    'Danny Confecções Ltda ME',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF, 1 X NA SEMANA ACIMA DE R$ 1.500,00 - EXPRESSO SÃO MIGUEL ACIMA DE 4,00 METROS E FRETE FOB - EXPRESSO SÃO MIGUEL ----------------------------------------- REVENDA BASIC (SOLICITADO PELO LIVANOS 06/12/24)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1770',
    'Expresso EJL transportes LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1442',
    'Expresso São Miguel - Matriz LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1384',
    'Lohanna de Miranda Coelho 10606615601',
    'CIF_FOB',
    2000.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA CIF : JAMEF 21/06/2023: FRETE CIF 1X POR SEMANA TODA QUARTA, ACIMA DE R$2.000,00 QUANDO FOB JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1757',
    'Expresso São Miguel S/A',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0567',
    'Studio Carlos Aberto Costa LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE: CIF  TRANSPORTADORA: BAUER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0830',
    'Exuberance Concept Decorações LTDA.',
    'CIF',
    NULL,
    NULL,
    NULL,
    'TODAS AS QUINTAS  ------------------------------------------------------------------------------------ *05/04/2022 - CADASTRO INATIVADO CONFORME SOLICITAÇÃO ADRIANO',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0605',
    'STUDIOS BALDANZA - PRODUTOS PARA DECORAÇÃO LTdA.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1103',
    'STYLE DESIGN DECORAÇÃO E ESQUADRIAS LTDA',
    'CIF_FOB',
    1000.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO NA AMORIM: 28/56',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1787',
    'Sua Casa Decoração ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X SEMANA, VALOR MÍNIMO R$ 2.000,00 TRANSPORTADORA: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1425',
    'SUELAINE SILVA NERI',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0639',
    'EZEQUIEL GENCIO 05112187964',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0513',
    'Lass Decorações e Serviços LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '- Segunda Modalidade de frete - 1x CIF sem valor mínimo *NÃO ENVIAR FOB - AGRUPAR PARA PRÓXIMA SEMANA Transportadora - Expresso São Miguel  ----------------------  METRAGEM: Acima de 3m solicitar liberação com a transportadora',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0163',
    'Suellen de Jesus Vieira ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0949',
    'Suelyn Baldo Artigos de Decoração ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1235',
    'Sunfix Comércio de Produtos Arquitetônicos Ltda – ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB: TRANSPORTADORA EXPRESSO SÃO MIGUE  14/06/24 - INATIVADA CONFORME SOLICITADO PELO RICARDO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1385',
    'SUPER BAG',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1271',
    'SUPER PET SHOW COMERCIO DE RACOES LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0322',
    'F&A Comércio de Persianas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ALTERADO TRANSPORTADORA PARA REUNIDAS - SOLICITAÇÃO DO CLIENTE - ADRIANO 01/08   CONSULTA A SPC E SERASA REALIZADO NO DIA 24/03/2014, COM RESULTADO CONFORME DOCUMENTO EM ANEXOS: PENDÊNCIA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0653',
    'F&C Representações comerciais',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0097',
    'Superflex Catarinense de Persianas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0170',
    'Sweet Home',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 22/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1405',
    'Havina Decor Comercio Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1180',
    'SWEET MARY DECOR EIRELI ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0041',
    'Fabi Decorações Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0368',
    'Fabiana Sellmer',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1775',
    'Fabiano Gomes dos Santos',
    'CIF_FOB',
    2000.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE FOB TRANSPOSTADORA : GERENORSO (PARA PEDIDOS DE TOLDOS ) QUANDO FRETE CIF: TRANSPORTADORA RODONOVAES (PEDIDOS DE PERSIANAS), 1X NA SEMANA, SEGUNDA FEIRA, VALOR MÍNIMO R$ 2.000,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1329',
    'FABIO AVELINO PINTO',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Transfloripa',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1355',
    'Fabio Mattioli Gonçalves Filho',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0042',
    'Fabio Oliveira de Freitas Interiori ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENDE COM DIVIDA DE 8064,94 BAIXADO EM DIVIDA NAO RECEBIDA KATIA 13/10'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0076',
    'Fabio Rogerio Oliveira Otharan',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0378',
    'Fabiola Rampanelli ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0021',
    'Fabricio da Costa Meira ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1209',
    'FAMILIA PETRY PRODUCOES E EVENTOS S.A',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0377',
    'Farmácia e Drogaria Nissei Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1778',
    'T & A tecidos Comércio e Serviços Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'TERÇA-FEIRA TRANSPORTADORA: RODONAVES',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF X NA SEMANA SEM VALOR MÍNIMO FEREQUENCIA DE ENVIO: TERÇA-FEIRA TRANSPORTADORA: RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1167',
    'FCA FIAT CHRYSLER AUTOMOVEIS BRASIL LTDA.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0768',
    'FDB Cortinas e Persianas Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1239',
    'FELIPE FRANKLIN CENATTI - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1326',
    'Fermak Comercial de Maquinas e Ferramentas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0261',
    'T Chaves Com e Rep Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0547',
    'Fernanda Coelho Koerich',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0346',
    'Fernanda Freitas Vieira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0022',
    'Fernanda M da Silva ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0638',
    'Fernanda Ribas Mira Ferreira 02640153986',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF ACIMA DE R$ 700,00, 1X NA SEMANA. JAMEF FOB - BAUER  ADRIANO INATIVOU EM 27/07/15 - MOTIVO: NÃO TEM MOVIMENTAÇÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0169',
    'Fernandes Cortinas ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0704',
    'Fernando Abreu',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1225',
    'Fernando Alves de Oliveira Decorações ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1803',
    'T H Becker & Cia Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓSXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0671',
    'FERNANDO GOLCALVES PACHECO 08410469995',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'MODALIDADE: SEMPRE FOB FREQUENCIA: CONFORME OS PEDIDOS FICAM PRONTOS TRANSPORTADORA: FOB BAUER (BAUER ENTREGA APENAS TERÇAS E QUINTAS EM CORREIA PINTO)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1690',
    'FERNANDO JORGE WOSNIAK STELER',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1084 E C1515 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'CLIENTE DA BGT.   *ENDEREÇO DE ENTREGA DA REVENDA, CONFORME SOLICITAÇÃO DO RONALDO* (ANEXO)  PGTO FEITO ATRÁS DE LINK DE CARTÃO DE CRÉDITO 65K - LANÇADO NA BGT  ----------------------------------------------------------------- EXPEDIÇÃO:  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1084 E C1515 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 2X NA SEMANA SEM VALOR MÍNIMO, É PARA TODAS. E NÃO 2 CIFS PARA CADA.   ---------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0333',
    'TAIS REGINA HEBERLE ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1161',
    'Ferreira e Rufino Atelie Ltda - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA ASSIM QUE FICAR PRONTO TRANSPORTADORA: BAUER  *MODALIDADE DE FRETE ALTERADA DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0623',
    'TANIA ELDACI DA SILVA BOBADILHA-ME',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    'TERÇA/QUINTA ---------------------------------------------- TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    '---------------------- MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 --------------------------------------------------------- FREQUENCIA DE ENVIO: TERÇA/QUINTA ---------------------------------------------- TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.   COMERCIAL:   ATUALIZADO CADASTRO EM 18/04/2017 CONFORME ANEXOS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0777',
    'Tania Regina da Silva Saraiva - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1379',
    'Fino Toque Decor Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'Enviar sempre que estiver pronto CIF 1x na semana sem avlor minimo: Transportadora Expresso São Mguel',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0366',
    'Fischer Persianas Ltda ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0539',
    'Tatiane Aparecida  Schimitz',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0270',
    'Fladey Comércio e Representações Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1748',
    'TCP -  Terminal de Conteineres de Paranagua S/A',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF X NA SEMANA SEM VALOR MÍNIMO. TRANSPORTADORA : EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1393',
    'Flavia Bruchado',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1549',
    'Florinda Massami Abdallah - Moda Casa e Decoração',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0266',
    'Floripa Decor Comercio de Persianas Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1127',
    'Tec&Paper Decoração LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO PARA ANTECIPADO. 08/03/2018 - CONSULTA REALIZADA, CONSTAM RESTRIÇÕES. 28/11/2018 - CONSULTA REALIZADA, CONSTAM RESTRIÇÕES. 26/03/2019 - CONSULTA REALIZADA, CONSTAM RESTRIÇÕES. 28/05/2019 - CONSULTA REALIZADA, CONSTA 1 RESTRIÇÃO. (ANEXO) 28/05/2019 - ALTERADO CONDIÇÃO PAG. E ATRIBUIDO LIMITE DE R$ 10.000,00 - AUTORIZADO ADRIANO **ALTERAÇÃO ENDEREÇO DE ENTREGA CONFORME EMAIL ANEXO.(11/06/2019) 25/09/2019 - CONSULTA REALIZADA, CONSTAM RESTRIÇÕES. 25/09/2019 - ALTERAÇÃO LIMITE DE CRÉDITO R$20.000,00 AUTORIZADO ADRIANO 24/03/2020 - CONSULTA REALIZADA, CONSTAM RESTRIÇÕES. 09/06/2020 - CONSULTA REALIZADAS, CONSTAM RESTRIÇÕES (EDIÇÕES GLOBO) (ANEXO) 09/06/2020 - LIMITE ALTERADO DE 20K PARA 35K. IVAN E ADRIANO 22/03/2022 - CONSULTA REALIZADA, NADA CONSTA. SCORE 459/1000. (ANEXO) **ALTERADO ENDEREÇO DE ENTREGA CONFORME SOLICITADO PELA REVENDA, E ENDEREÇO DE COBRANÇA SEGUINDO SINTEGRA (06/07/2022) 25/08/2022 - CONSULTA REALIZADA, NADA CONSTA. SCORE 423/1000. (ANEXO) 11/07/2025 - CONSULTA REALIZADA, NADA CONSTA. SCORE 663/1000. (ANEXO) ___________________________________________________________________________ ANALISE DO REPRESENTANTE: CLIENTE LOCALIZADO NA REGIÃO DO JD. GUEDALA ( MORUMBI) TRABALHA COM FOCO EM PROFISSIONAIS. LOJA PEQUENA MAS BEM ALINHADA EM PRODUTOS DE VALOR AGREGADO.VAI INICIAR TRABALHO PARA CONHECER E MAIS ADIANTE DECIDIR EXCLUSIVIDADE. TABELA 20% + TABELA. ___________________________________________________________________________ REFERENCIA COMERCIAL: BUCALO: "O CLIENTE TEC & PAPER, COMPRA CONOSCO DESDE: 11/2014. FORMA DE PAGAMENTO: BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1033',
    'Floripa Persianas Com. Varegista Ltda -ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0147',
    'FLORIPRINT INDUSTRIA GRAFICA E ETIQUETAS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1254',
    'Flávia Maria Peluso - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0757',
    'Tecelagem Damatex Eireli',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1493',
    'FMA Felício Manunteção de Aeronaves Eireli - EPP',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0303',
    'Fontanetti Decorações Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1423',
    'Tecidos e Decorações Patense Eireli Me',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'Toda quarta',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: JAMEF MODALIDADE DE FRETE: CIF 1X POR SEMANA SEM VALOR MÍNIMO *QUESTIONAR O COMERCIAL ANTES DE MANDAR FOB FREQUÊNCIA DE ENVIO: TODA QUARTA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1107',
    'Fornasier e kruel ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 23/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1386',
    'Tecmil Persianas LTDA ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1727',
    'Fort Corporativo Comercial Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X POR SEMANA, VALOR MÍNIMO R$ 2.000,00 TRANSPORTADORA: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0787',
    'Fortes e Cafareli Iluminações Ltda. -ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '----------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0249',
    'Telmix Telefonia e Informática Ltda Me',
    'FOB',
    NULL,
    NULL,
    NULL,
    'TERÇAS E SEXTAS  TRANSPORTADORA: BAUER METRAGEM: ACIMA DE 3M DESPACHAR TUDO QUE TIVER NA PROGRAMAÇÃO PELA REUNIDAS',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:FOB FREQUENCIA DE ENVIO:TERÇAS E SEXTAS  TRANSPORTADORA: BAUER METRAGEM: ACIMA DE 3M DESPACHAR TUDO QUE TIVER NA PROGRAMAÇÃO PELA REUNIDAS.    OBS:ENVIO DE PEDIDOS TODAS SOMENTE TERÇAS E SEXTAS - NÃO ENVIAR EM OUTRO DIA, CLIENTE NÃO QUER DE JEITO NENHUM. PEDIDOS ACIMA DE 3M DESPACHAR TUDO QUE TIVER NA PROGRAMAÇÃO PELA REUNIDAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0896',
    'Franciele Azambuja da Luz',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '-----------------------------------------------',
    NULL,
    'ativo',
    'CONDIÇÃO : 28/56',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0989',
    'Franciele Azambuja da Luz ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1645',
    'Francis Dores Zaneti Decoração Eireli ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0969',
    'Freitas Castro Comercio de Persianas Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    'TERÇA E QUINTA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1555',
    'Frigo Araújo ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0222',
    'Telmo Fantin',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1257',
    'ANDERSON FIGUEIREDO DE ANDRADE',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1417',
    'FRP Comercio de Artigos de Decoração LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1X NA SEMANA TODA QUINTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, PEDIDOS ACIMA DE R$1.500,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TODA QUINTA-FEIRA. TRANSPORTADORA: BAUER PARA CIF E FOB  *VALOR DE FRETE CIF ALTERADO DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0413',
    'Fundo Municipal de Saúde',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1590',
    'G & G Comércio de Revestimentos LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'SEMPRE FOB TRANSPORTADORA AC EXPRESS     *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1261',
    'Transportes Ouro Negro Ltda. - CRICIUMA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0354',
    'Tereza Zenaide De Bairros Santos ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA --------------------------------------------- TRANSPORTADORA:BAUER, ALTERADO 09/07/15 SOLICITADO PELA ROSI',
    NULL,
    'ativo',
    NULL,
    '. ------------------------------------------------------------------ FATURAMENTO MODALIDADE DE FRETE: FOB --------------------------------------------- FREQUENCIA DE ENVIO: 1X NA SEMANA --------------------------------------------- TRANSPORTADORA:BAUER, ALTERADO 09/07/15 SOLICITADO PELA ROSI. GI ---------------------------------------------- METRAGEM: CIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0682',
    'G&S Comércio de Forros, Divisórias e Pisos Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0348',
    'Terezinha dos Santos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0762',
    'G. Bonacio & Cia LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA A QUALQUER DIA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB FREQUENCIA DE ENVIO: 1X NA SEMANA A QUALQUER DIA. TRANSPORTADORA: EXPRESSO SÃO MIGUEL *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1011',
    'Terra Brasil Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0458',
    'G.R CORTINAS E PERSIANAS',
    'FOB',
    NULL,
    NULL,
    NULL,
    'SOMENTE NA QUARTA-FEIRA METRAGEM: ACIMA DE 4M ENVIAR PELA REUNIDAS TODOS OS PEDIDOS',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:FOB  FREQUENCIA DE ENVIO: SOMENTE NA QUARTA-FEIRA METRAGEM: ACIMA DE 4M ENVIAR PELA REUNIDAS TODOS OS PEDIDOS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0141',
    'terra internet',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0920',
    'G.R. Confecções Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X POR SEMANA SEMPRE QUINTA 14/03/2019 - CONFORME AUTORIZADO POR E-MAIL PELA LUCIANA',
    NULL,
    'ativo',
    NULL,
    'REFERÊNCIA COMERCIAL: APESAR DE SER UM NOVO CADASTRO PARA GENTE, JÁ COMPRAVAM COM OUTROS FORNECEDORES COM ESTE CNPJ FATURADO NORMAL.   TRANSPORTADORA: EXPRESSO SÃO MIGUEL  FRETE CIF 1 X NA SEMANA SEM VALOR MINIMO FREQUENCIA DE ENVIO: 1X POR SEMANA SEMPRE QUINTA 14/03/2019 - CONFORME AUTORIZADO POR E-MAIL PELA LUCIANA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1077',
    'G3 Com. de Design de Cortinas Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1039',
    'Teste Portal',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0187',
    'Gabriel Justino da Silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0311',
    'Gabriel Luis Espindola',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0433',
    'Gabriella Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA SEXTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: 1X NA SEMANA TODA SEXTA-FEIRA. TRANSPORTADORA: REUNIDAS METRAGEM: EMBARQUE DE VOLUMES ATÉ 5M  METROS  *MODALIDADE DE FRETE ALTERADA DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1806',
    'GAC Comércio e Serviços Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO : GRUPO SOL (C1137 E C1806) 27/07/2026 - ATUALIZAÇÃO CADASTRAL EFETUADA 27/07/2026 - CONSULTA REALIZADA, NADA CONSTA',
    'ativo',
    NULL,
    'FRETE SEMPRE FOB 1X NA SEMANA TRANSPORTADORA - EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1108',
    'GALLO DECORAÇOES IMPORTAÇOES E EXPORTAÇOES LTDA EPP',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO PARA ANTECIPADO E LIMITE ZERADO. CONFORME EMAIL ADRIANO. 03/06/2019 - ADRIANO ALTEROU CONDIÇÃO DE PAGAMENTO ANTECIPADO PARA 20-40-60 BOLETO, LIMITE DE 10K. 06/09/2018 - CONSULTA REALIZADA, NADA CONSTA. (CNPJ) 16/09/2018 - CONDIÇÃO DE PAGAMENTO ALTERADA PARA ANTECIPADO E LIMITE ZERADO. REVENDA ESTÁ COM VÁRIOS BOLETOS EM ABERTO, E O MOTIVO SEGUNDO A MESMA, ESTÃO EM REFORMA, LOJA PARADO E POR ISSO SEM DINHEIRO PARA EFETUAR OS PAGAMENTOS DE PEDIDOS QUE JÁ FORAM ENTREGUES E RECEBIDOS. (DECISÃO ADRIANO, KATIA, PRICILA) 16/09/2019 - REGISTROS NO SPC 01/09/2020 - CONSULTA REALIZADA, NADA CONSTA. (ANEXO) 21/05/2021 - CONSULTA REALIZADA, NADA CONSTA. (ANEXO)  TRANSPORTADORA: JAMEF FRETE CIF 1X POR SEMANA ACIMA DE 1.000,00 FOB AUTORIZADO ENVIAR QUANDO NÃO ATINIGR FRETE   ANALISE DO REPRESENTANTE: LOJA TRADICIONAL EM RIO CLARO, MAIOR CONCORRENTE É A UNIFLEX. LOJA DE EXCELENTE PERFIL. ESTÁ COM EQUIPE REFORMULADA. ESTAVA COM CRIATIVA, VAI MUDAR 100%, FECHANDO EXCLUSIVIDADE CONOSCO NA CIDADE.  TEM COMO PARCEIRO O PRINCIPAL ARQUITETO DA CIDADE. A PROPOSTA FECHADA FOI A SEGUINTE: BOOK R$ 970,00 EM 3X SENDO 30/60',
    'SERÁ PARA 12 MESES COM META DE R$ 100.000,00 DE COMPRA PARA O PERIODO. NOS INFORMAR O VALOR ANTES DE EFETIVAR O PEDIDO."  FALADO COM ADRIANO, VAMOS MONITORAR AS VENDAS PRA VER A COBRANÇA OU NAO DO SHOWRROMM KATIA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0100',
    'Teto e Parede Comercio de Rev. Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0056',
    'Garbeloto Persianasxxx',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1330',
    'Gardine Comercio de Cortinas e Acessorios Ltda',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1542',
    'TGC DECORAÇÕES LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '- Sexta  Transportadora - Braspress para FOB  **GRUPO ECONÔMICO** Revenda faz parte do mesmo grupo econômico que C1721; C0508 por isso dividem o mesmo acordo de frete',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1721; C0508 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDE DE FRETE - SOMENTE FOB FREQUÊNCIA DE ENVIO - SEXTA  TRANSPORTADORA - BRASPRESS PARA FOB  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1721; C0508 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS  -----------------------------------------------------------------------  01/08/2023 - QUEDA DE CATEGORIA - DE FLAGSHIP PARA BASIC AGRUPAR SEMPRE COM OS PEDIDOS DA ADORNIE C0508 *** FRETE FOB - BRASPRESS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1458',
    'Gaviota Brasil S.A.',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1793',
    'GDL Comércio, Serviços e Decorações Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SAMENA ACIMA DE R$ 2.000,00 TRANSPORTADORA: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0195',
    'Thilin Imp. e Exp. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1570',
    'GE AMBIENTES E REVESTIMENTOS UNIPESSOAL LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1539',
    'GENOIR DECORAÇÕES LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0099',
    'Thimoteo e Cia Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1138',
    'TOMELIN INTERIORES LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1289',
    'Amarina Ferreira Santos Eireli - ME',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0280',
    'Genoir Decorações LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0469',
    'Top Empreendimentos Ltda ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA:BAUER METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA:BAUER METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0776',
    'Geodis Gerenciamento de Fretes do Brasil Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0808',
    'Toque de Arte Moveis Sob Medida LTDA',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0615',
    'George Iffarraguirre',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0411',
    'Geraldino & Geraldino LTDA- ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FOB 2X POR SEMANA - TERÇA/SEXTA TRANSPORTADORA BAUER *ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.  --------------------------------------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0108',
    'Geraldo Maffei ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1291',
    'TOQUE MACIO INDUSTRIA E COMERCIO LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 24/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0237',
    'Gessner Cortinas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0856',
    'Toscan Materiais de Construção Ltda-ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1828',
    'Toscana Partner Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    'GRUPO ECONÔMICO : PERGOSYSTEM (C1828,C1829 E C1830)   ------------------------------------------------- FATURAMENTO  FRETE CIF  TRASPORTADORA: RODONAVES QUANDO FRETE FOB: RODONAVES',
    'ativo',
    NULL,
    'FRETE CIF  TRASPORTADORA: RODONAVES QUANDO FRETE FOB: RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1583',
    'TR COMERCIO DE CORTINAS E PERSIANAS LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0571',
    'Tramados cortinas e decorações Ltda',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0140',
    'Transform Comercio de Cortinas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0358',
    'Transper - Transportes e Persianas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0613',
    'TRANSPORTE RODOVIARIO 1500 LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1619',
    'GIL DECOR DECORAÇÕES DE FRIBURGO LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0588',
    'Gilberto Alves da Costa',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA  TRANSPORTADORA: BAUER METRAGEM: "ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF   FREQUENCIA DE ENVIO: 1X NA SEMANA  TRANSPORTADORA: BAUER METRAGEM: "ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0758',
    'Gilda Maria Tavares',
    'CIF',
    NULL,
    NULL,
    NULL,
    'POR TRANSPORTADORA USAR A REUNIDAS *CAROL EXP',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1472',
    'Gilmar Antônio Morgan',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0999',
    'Gilmar Delvan ME',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0450',
    'Gilmar Zocche e Cia Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA:BAUER METRAGEM:CIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00.  FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA:BAUER METRAGEM:CIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0875',
    'GILSON DE MORAIS - 558.872.870-04',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0577',
    'Gilson Paulo Ferreira Junior- ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'FRETE FOB 2X POR SEMANA - TERÇA/QUINTA  23/11 - JOSI',
    NULL,
    'ativo',
    NULL,
    '--------------------------------------------------------------------------- FREQUÊNCIA DE ENVIO: ENVIO DE PEDIDOS CONFORME FICA PRONTO. ---------------------------------------------------------------------------  FRETE: FOB  TRANSPORTADORA OURO NEGRO ----------------------------------------------------------------------------------- FREQUENCIA DE ENVIO: FRETE FOB 2X POR SEMANA - TERÇA/QUINTA  23/11 - JOSI'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1345',
    'Gilvani Lopes Machado',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1085',
    'Transportes Ouro Negro Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1053',
    'Transportes Silvio Ltda',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1665',
    'Tres Tentos Agroindustrial S/A',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1669; C1632 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    'CONDIÇÃO DO PEDIDO ENTRADA R$ 39.000,00 EM 20/07 SALDO DE R$ 61.000,00 EM 18/08  (30 DIAS) - VIA BOLETO  ----------------------------------------------------------------------------------- FINANCEIRO:  17/07/2023 - CONSULTA REALIZADA, CONSTAM PENDENCIAS. SCORE 0/1000. SCORE RECUPERAÇÃO CRÉDITO 828',
    'DIRETO CONSUMIDOR FINAL REF. A REVENDA HÉVERLIN 19/07/2023 - CONDIÇÃO DO PEDIDO ENTRADA R$ 39.000,00 EM 20/07 SALDO DE R$ 61.000,00 EM 18/08  (30 DIAS) - VIA BOLETO  ----------------------------------------------------------------------------------- FINANCEIRO:  17/07/2023 - CONSULTA REALIZADA, CONSTAM PENDENCIAS. SCORE 0/1000. SCORE RECUPERAÇÃO CRÉDITO 828/1000. (ANEXO)    ------------------------------------------------------------------------------------ FATURAMENTO: FOB TRANSPORTADORA EXPRES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0966',
    'Trilho Sul Santa Catarina',
    'FOB',
    NULL,
    NULL,
    NULL,
    '- SEMPRE QUE TIVER PRONTA ENVIAR AS MERCADORIAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1842',
    'GHAV Móveis e Decorações Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA ACIMA R$ 1.500,00 TRANSPORTADOTA EXPRESSO SÃO MIGUEL  QUANDO FRETE FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1382',
    'Glaibi Home produtos e serviços em decoração eireli',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1886',
    'Edna Mariano Maia',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0477',
    'Glauber Rafael de Oliveira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0621',
    'Gleidson Silverio Luxury Products Ltda. Me.',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '---------------------------------------------------- Frete: FOB --------------------------------- Transportadora: Reunidas',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0231',
    'Global Divisorias Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0643',
    'TRIVIAL-INDUSTRIA E COMÉRCIO DE SALGADOS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0135',
    'GM Ind. e Comércio de Persianas ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1351',
    'CORTILEX IND E COM DE CORT E DEC LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0252',
    'Goya Revestimentos e Decorações LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0229',
    'Tropical Deck Artefatos de Madeira Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1747',
    'GR Atelie Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB , 1X NA SEMANA ASSIM QUE FICAR PRONTO. TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1781',
    'GR Atelie Ltda - Filial',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB , 1X NA SEMANA ASSIM QUE FICAR PRONTO. TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0449',
    'Grasiel Rodrigo Morgenstern ME',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1565',
    'Greko Comércio de Móveis e Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1358',
    'Grupo Sun',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0885',
    'Persihaus Persianas e Divisórias Ltda ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    NULL,
    '2 x por semana , 1 frete CIF + 1 FOB (atualizado dia 24/07/17 CC',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0578',
    'Tulio M D Bandeira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0625',
    'Guacira Fátima Querino do Canto',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1146',
    'GUAPORE GESSO LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    'AS SEGUNDAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1882',
    '3W Tapetes e Tecidos Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0101',
    'Guilherme Henrique M. C. Tomelim',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE MERCADORIA, TERÇA E QUINTA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1785',
    'Guilherme Rafael Cidral Neto 48.604.911',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1881',
    'Douglas Pitarelli',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1008',
    'Guinza Cortinas LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '2X POR SEMANA - TERÇA/QUINTA - 1 FRETE CIF (SEM VALOR MÍNIMO) E UM FOB FOB - ARLETE TRANSPORTES LTDA  MERCADORIAS ACIMA DE 3MTS ENVIAR POR OURO NEGRO  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1702 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1702 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0749',
    'Tutte Belli Comércio de Artigos de Cama e Mesa Ltda',
    'CIF',
    1000.0,
    NULL,
    NULL,
    ':',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0607',
    'GZ Cortinas e Persianas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1643 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1299',
    'H B Gortz 4floors - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1884',
    'Intech Boating Indústria e Comércio de Embarcações S/A',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 25/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0002',
    'Haniel decorações Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1864',
    'Jhonatan Aparecido Antunes 65.523.879',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA. TERÇA -FERA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL   QUANDO FRETE FOB : EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0887',
    'TW Transportes e Logistica Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1377',
    'ESD INSTALAÇÃO MANUTENÇÃO E MONTAGENS LTDA',
    'CIF_FOB',
    1000.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0562',
    'Harmonia Comercio e Serviços Eireli ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ALTERADO PARA REUNIDAS. ANEXO3. GI    TABELA PROMOCIONAL MARCO - ABRIL VOLTAR PARA 10%'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1089',
    'HAUAGGE EMPREENDIMENTOS IMOBILIARIOS LTDA',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1525',
    'HAUSZ AMBIENTES E REVESTIMENTOS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1711',
    'Havia Industria e Comércio de Acessórios Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0150 E C1451 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    '- ACORDO DE FRETE: ENVIAR FRTE FOB    ** ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.  TRANSPORTADORA EXPRESSO SÃO MIGUEL  ***SEMPRE QUE NÃO PUDER ENVIAR PELA EXPRESSO SÃO MIGUEL, ENVIAR PELA ACEVILLE.**NÃO MANDAR POR BAUER    **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0150 E C1451 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS  ----------------------------------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1849',
    'Openvision Investimentos Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB TRANSPORTADORA: AGUARDANDO REPRESENTANTE FERNANDO DAR RETORNO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'F0104',
    'desativado---Idox Comunicação Santos & Luckamann Publicidade Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0156',
    'Ultrapiso Ind, Com, Imp, e Exp. de Pisos e Revest. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0197',
    'Ultrapiso Ind, Com, Imp, e Exp. de Pisos e Revest. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0818',
    'Helena C da Camara Jung',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'TODAS AS QUINTAS  ----------------------------------- CONSULTA SERASA 15/12/2017 CLIENTE COM RESTRIÇÃO',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0119',
    'Hellen Priscila Casas ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0086',
    'Helnafa Comercio e Dec. LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0178',
    'Ultrapiso Ind. Com. Import e Exp. de Pisos e Rev. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0409',
    'Helton Flavio Moreira e Cia Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA:BAUER METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'FREQUENCIA DE ENVIO 1X NA SEMANA TRANSPORTADORA:BAUER METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1269',
    'Henrique Rupniewski',
    'CIF',
    NULL,
    NULL,
    NULL,
    'POR TRANSPORTADORA  SERÁ ENVIADO PELA TRANSPORTADORA  MOS TRANSPORTES (ANEXO EMAIL CAROL EXPEDIÇÃO)  DESTINATÁRIO HENRIQUE RUPNIEWSKI CPF 154',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'F0150',
    'xMultiart cadastro novo f0178',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0329',
    'Henrique Rupniewski Junior',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0188',
    'Ultrapiso Revestimentos e Decorações',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'F0158',
    'Paula Costaxxxx',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0952',
    'Henrique Rupniewski Junior ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0448',
    'Henrique Vandresen',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1447',
    'Heringer Decorações Ltda',
    'CIF_FOB',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0332',
    'Uniao Sul Brasileira Da IASD',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1880',
    'Erik Renan Fernandes 31.911.689',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUARTA-FEIRA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL   FRETE FOB: TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1387',
    'HOME AMBIENTES LTDA',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'F0196',
    '**inativo**Yendes Ind. e Comercio de Persianas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1605',
    'Home Carol Decor',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1352',
    'Home Design Comercio Varejista de Material de Construção EIRELI',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0779',
    'Unik S.A.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0957',
    'Home Fashion Comércio de Pisos e Persianas LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1523',
    'HOMELUX CORTINAS E PERSIANAS',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1879',
    'Giancarlo Favero Cortinas e Persianas',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUARTA-FEIRA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL   QUANDO FRETE FOB: TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1028',
    'Hotelaria Accor Brasil',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO R$ 23.597,39  VALOR DE CUSTO (TABELA) 18.747,28,  VALOR LIQUIDO DE CUSTO BEARE R$ 13.123,09 IMPOSTOS 17% - R$ 1.780,63 ------------------------------------------------ CREDITO BEARE R$ 8.693,67 ****'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0530',
    'Housing Interiores decorações Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: BAUER METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: BAUER METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'F0260',
    'Central do E.P.I. com de equip de seg ltda me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1154',
    'Hr Pisos Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1632',
    'Héverlin Grasiele Soares Guimarães',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1669; C1665 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'TRANPORTADORA: EXPRESSO SÃO MIGUEL - FOB  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1669; C1665 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS   ----------------------------------------------------------------------------------------------------- CONSIDERAÇÕES:  ADRIANO: CLIENTE VAI SE TORNAR MEMBER EM POUCO TEMPO PERÍODO INICIAL PARA EXPERIÊNCIA E VER SE OS VOLUMES SÃO COMPATIVEIS  -----------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1767',
    'Unimed Litoral Cooperativa de Trabalho Médico Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO TRANSPORTADORA : ACEVILLE (CIF E FOB)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1669',
    'Héverlin Grasiele Soares Guimarães',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    'GRUPO ECONÔMICO TAMBÉM',
    'ativo',
    NULL,
    'FRETE FOB - EXPRESSO SÃO MIGUEL  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1632; C1665 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS  ------------------------------------------------------------------------------------- 21/03/2024 - REVENDA MEMBER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1042',
    'Sabrina Enxovais LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1701',
    'UNISP CJ924 Comércio e Serviços para Decoração Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0036',
    'Iara E. P. Schichting ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0239',
    'Iara Maria Caetano Rodrigues ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    '(ANEXO1) _________________________________________________________________________  ACORDO DE FRETE: **CLIENTE BALCÃO** TRANSPORTADORA: BAUER METRAGEM: ACIMA DE 3M  ENVIAR TUDO PELA REUNIDAS  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0965',
    'Iarcheski comercio de Tecidos Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '( SEMPRE QUE TIVER PRONTOS  OS PEDIDOS ) ACEVILLE -  FRETE FOB',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0657',
    'UNIÃO OESTE PARANAENSE DE ESTUDOS E COMBATE AO CÂNCER',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0785',
    'Ibrauto Comércio de Veículos Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0813',
    'Iccr Indústria e Comércio de Cortinas Rocha Ltda',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 26/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1421',
    'MARISA DESIGNER COMÉRCIO DE MÓVEIS LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1878',
    'Renato Carlos dos Santos 61.179.729',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEGUNDA-FEIRA, ACIMMA DE R$ 1.500,00 TRANSPORTADORA JAMEF  FRETE QUANDO FOB: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1554',
    'Ideal Home Concept ltda me',
    'FOB',
    NULL,
    NULL,
    NULL,
    'Sempre que estiver pronto  *Tipo de envio e transportadora alterados dia 18/08/2022 conforme solicitação do Adriano ------------------------------------------------------------------------------------------------- COMERCIAL  *Atualizado para tabela A dia 16/05/2022 -  Autorizado Adriano  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: RODONAVES MODALIDADE DE FRETE: SEMPRE FOB FREQUÊNCIA DE ENVIO: SEMPRE QUE ESTIVER PRONTO  *TIPO DE ENVIO E TRANSPORTADORA ALTERADOS DIA 18/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO ------------------------------------------------------------------------------------------------- COMERCIAL  *ATUALIZADO PARA TABELA A DIA 16/05/2022 -  AUTORIZADO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1116',
    'Urbano Prestação de Serviços e Comercio de Carpete,Tapeçaria LTDA. ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO 20/40/60 SE ESTIVER OK O CADASTRO.  SHOW-ROOM: DUAS OPÇÕES AO CLIENTE - COM 50% FATURADO PARA 10 MESES COM META, ONDE ATINGINDO CANCELAMOS O BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1598',
    'Ideale Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    'SEXTA TRANSPORTADORA: EXPRESSO SÃO MIGUEL  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0435 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0435 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB FREQUENCIA DE ENVIO: SEXTA TRANSPORTADORA: EXPRESSO SÃO MIGUEL  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0435 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0709',
    'Ideali Persianas Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0962',
    'IGC Associados Consultoria em Finanças Ltda',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0755',
    'Illi Engenharia Construções Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0359',
    'Ilson Ribeiro',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0166',
    'Iluminatti Comercio de Materiais Elétricos Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0463',
    'Imobiliária Habivale Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO DA UNILUX'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1597',
    'USF Incorporadora SPE Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'POR TRANSPORADORA - FRETE SERÁ FOB',
    NULL,
    'ativo',
    NULL,
    'DE OBRAS  ------------------------------------------------------------ FINANCEIRO  03/08/2022 - CONSULTA REALIZADA - CONSTA RESTRIÇÕES 13/04/2026 -  CONSTA REALIZADA, CONSTAME PRENDENCIAS. SCORE 0/1000  -------------------------------------------------------------  - ACORDO DE FRETE:  EMBALAR PADRÃO TRANSPORTADORA - CLIENTE ENVIA CAMINHÃO DE COLETA.  QUANDO NECESSÁRIO ENVIO POR TRANSPORADORA - FRETE SERÁ FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0058',
    'Imperial Persianas ME c0137 inativo',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1375',
    'Imperium Pisos EIRELLI',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CIF 1X SEMANA ACIMA DE 1.500,00 - TRANSPORTES BAUER   FOB TRANSPORTES BAUER  *VALOR DO CIF ALTERADO DIA 15/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  ------------------------------------------------------------------------------------------  *DOCUMENTOS NO PORTAL   *INATIVO DIA 22/09/2023 CONFORME SOLICITADO PELO RICARDO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1623',
    'Stefani Farias Cortina e Cama LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'TIPO DE FRETE - 1X FRETE CIF SEM VALOR MÍNIMO TRANSPORTADORA CIF - EXPRESSO SÃO MIGUEL TRANSPORTADORA FOB - EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0277',
    'Industria e Comercio Decor Lar Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0702',
    'Indústria e Comércio de Confecções Rivo Ltda - EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    '---------------------------------------------------------- Frete: FOB Transportadora: Bauer (Lisandro)',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1440',
    'RODRIGO MARCON DE OLIVEIRA',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1063; C1362',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1870',
    'MDR Comercio de Enxovais LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF1X NA SEMANA, TERÇA - FEIRA ACIMA DE R$ 1500,00. TRANSPORTADORA: REUNIDAS (CIF)  QUANDO FRETE FOB TRASNPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0833',
    'Ineide Cortinas Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE RS NÃO AGRUPAR FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA:  P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL  _____________________________________________________________________________'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0697',
    'Ineide das Neves Vaquero Cobianchi',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1094',
    'Infinity Decorações LTDA',
    'CIF_FOB',
    1000.0,
    NULL,
    NULL,
    'U CARTA DE ANUENCIA) 09/11/2017 CONSULTA FEITA NO SERASA, CONSTA RESTIÇÃO 17/11/2017 CONSULTA FEITA NO SERASA, CONSTA RESTIÇÃO 30/11/2017 - LIMITE ZERADO POR ADRIANO E IVAN  CLIENTE COM DIVIDA ATIVA LIBERAÇÃO DE LIMITE PARA FATURAMENTO EM BOLETO ACORDADO E LIBERADO ENTRE IVAN E ADRIANO',
    NULL,
    'ativo',
    NULL,
    'EM BOLETO ACORDADO E LIBERADO ENTRE IVAN E ADRIANO.  TRANSPORTADORA: JAMEF FRETE CIF 1X POR SEMANA ACIMA DE R$ 1.000,00 QUANDO FOR FOB ENVIAR PELA JAMEF  REFERENCIA SANTA LUZIA:  CLIENTE DESDE 2010; MAIOR COMPRA EM OUT/2015 NO VALOR APROXIMADO DE R$ 9.402,00. ULTIMA COMPRA EM JUL/2017 NO VALOR APROXIMADO DE 3.000,00. CONDIÇÃO DE PGTO BOLETO 28/56, PAGAMENTOS EM DIA. LIMITE DE R$ 15.000,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0265',
    'V. Pires Damaceno E Cia Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0916',
    'Vagner João da Silva - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0754',
    'INFORMOV LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO PARA CLIENTE NEO DESIGN SP****  TRANSPORTADORA: JAMEF 08/12/2015 - CONSULTA REALIZADA CFE. DOCUMENTO NOS ANEXOS - NADA CONSTA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1267',
    'INGRID HESSEL ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0470',
    'Injetec de Friburgo Ind. e Com. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0845',
    'Valdemar Chies e cia Ltda.',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1873',
    'Caroline Neckel Fernandes 08254856907',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1484',
    'INOVAR CORTINAS E PERSIANAS LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0393',
    'Inove Decorações Comercio Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0519',
    'Inove Decorações EIRELI',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0743',
    'Inove House Automação Residencial Ltda - ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0890',
    'Instaladora de Divisórias Diviforro Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0055',
    'Persianas e Dec. Floriani Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2x na semana 1 FOB e 1 CIF 1 vez por semana, sem valor mínimo  *Cliente Prodesign TRANSPORTADORA: Expresso São Miguel  ------------------------------------------------------------------------------------------------------------------------------  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1822',
    'Instituto de Previdência de Itajaí',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF TRANSPORTADORA: SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1640',
    'Maristela Gouveia Terebeyczik e Cia LTDA',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    'TODA SEGUNDA FEIRA QUANDO FOB = EXPRESSO SÃO MIGUEL',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: EXPRESSO SÃO MIGUEL FRETE CIF 1X NA SEMANA, ACIMA DE R$ 2.000,00 FREQUENCIA DE ENVIO: TODA SEGUNDA FEIRA QUANDO FOB = EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0352',
    'Valdinar Lopes Pereira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1408',
    'Intelbras S/A Indústria de Telecomunicação Eletrônica Brasileira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1364',
    'Ione Goreti Comper Schmidt',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1022',
    'Valdir da S. Machado Me',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0467',
    'IOXS AUDIO VIDEO E AUTOMAÇÃO LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO UNILUX ALEX VAI TRAZER OS CHEQUES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0257',
    'IRENE DE BORBA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1401',
    'IRENE GOBBI MENEGAZZO E CIA LTDA',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1014',
    'Valdoir Nunes da Silva Me',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1647',
    'IRMAOS MUFFATO S.A',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA FRETE CIF: EXPRESSO SÃO MIGUEL  ****ENDEREÇO DE ENTREGA: AV. TIRADENTES, Nº 2667 COMPL: ESQUINA COM A RUA SERRA DOS PIRINEUS CEP 86.360-000 JD BANDEIRANTES - LONDRINA - PR**********'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0790',
    'Valentina Decor Cómercio de Cortinas e Persianas Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0165',
    'VALEREAL ARTIGOS PARA DECORAÇÃO E FLORICULTURA LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1141',
    'Valter Marcolino da Silva Me',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1365',
    'IRMÃOS SIDERICOUDES LTDA ME',
    'CIF_FOB',
    NULL,
    NULL,
    'CIF a cobrar _____________________________________',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 27/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1144',
    'Irmãos Thomasi',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1473',
    'Stylo Fino e Iluminação Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1459',
    'VANESKA RIBEIRO IZQUIERDO MARTIN 01853689998',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1061',
    'Vanessa Caetano de Oliveira',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1266',
    'ISABELLA PRADO BAQUETTE 10207083959',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'VIP Transportes',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1477',
    'Arte Palladios Eireli',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1285',
    'Vanessa Santin Lavandowski ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE: TRANSPORTADORA: RODONAVES FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1788',
    'Isis Perez Arquitetura Comércio e Serviços Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MINIMO R$ 2.000,00 TRANSPORTADORA: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0232',
    'Vania Pereira de Oliveira ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'QUINTA -------------------------------------- TRANSPORTADORA:BAUER METRAGEM: "ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    '------------------------------------ MODALIDADE DE FRETE: FOB -------------------------------------- FREQUENCIA DE ENVIO:QUINTA -------------------------------------- TRANSPORTADORA:BAUER METRAGEM: "ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1238',
    'ISOLDRY ISOLAMENTOS EIRELI',
    'CIF',
    1000.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0062',
    'Israel Com. de Pers. Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0521',
    'Vania Signori',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: TW  -------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1502',
    'IT HOME DESIGN E DECORACAO EIRELI',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0109',
    'Vanilda Vieira Anselmo Corrêa ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0385',
    'Ita Persianas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0063',
    'Itapema Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0406',
    'ITRA COMERCIO DE REVESTIMENTOS LTDA',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA (ACIMA DE R$700,00) TODA TERÇA OUTROS DIAS FOB, SOMENTE COM AUTORIZAÇÃO DO CLIENTE'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0672',
    'Iukesu Comércio de Cortinas e Persianas LTDA - ME',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF - 1X POR SEMANA ACIMA DE R$ 700,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0304',
    'Vanusa dos Santos Flores',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0328',
    'Ivan Rodrigues',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0884',
    'Ivanir de Fátima Vargas de Almeida - MEI',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    'TODAS AS TERÇAS  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0028',
    'Ivi & Jr. Ind. e Com. Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUARTA FEIRA, SEM VALOR MÍNIMO TRANSPORTADORA: EXPRESSO SÃO MIGUEL   QUANDO FRETE FOB: REUNIDAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0078',
    'Ivonete Savitski ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0746',
    'Veda Luz Cortinas e Persianas Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0284',
    'Vellut Tecidos Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    'ENVIAR CONFORME OS PEDIDOS FICAM PRONTOS ------------------------------------------------------------------------------ TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    '-------------------------------------------------------------------------------- MODALIDADE DE FRETE: UM ENVIO NA SEMANA CIF ACIMA DE R$ 700,00 ------------------------------------------------------------------------------ FREQUENCIA DE ENVIO: ENVIAR CONFORME OS PEDIDOS FICAM PRONTOS ------------------------------------------------------------------------------ TRANSPORTADORA: PARA NOTAS COM FRETE CIF E FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.  ----------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1086',
    'J A Ferreira',
    'CIF',
    NULL,
    NULL,
    NULL,
    'CLIENTE RETIRA NA UNILUX  OBS: CADASTRO FALTA DADOS DO SÓCIO, E CONTRATO SOCIAL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1134',
    'Veneto Decorações LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1504',
    'MARYANNE MITCHELL',
    'CIF_FOB',
    1000.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA RODONAVES P/ CIF E FOB:  1 FRETE CIF POR SEMANA (EM QUALQUER DIA) ACIMA DE R$ 1.000,00   ---------------------------------------------------------------------- ANÁLISE REPRESENTANTE  CLIENTE VAI COMEÇAR AGORA COM PERSIANAS, EU IREI ACOMPANHAR O PROCESSO COM TREINAMENTOS. É TAMBÉM MINHA CLIENTE NA HOME FINISH E NA MELISSA DECOR COM UMA ÓTIMA MARGEM DE COMPRAS COM PAGAMENTOS SEMPRE EM DIA. TEM BASTANTE INDICADORES PELA CIDADE E OS MESMOS PEDIRAM PARA AGREGAR PERSIANAS E TOLDOS EM SU'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1155',
    'J C  COMÉRCIO DE MÓVEIS E ARTIGOS DE DECORAÇÃO LTDA',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    'DE RMA  FINANCEIRO: CONSULTA SERASA EM 31/012018 - NÃO CONSTA RESTRIÇÃO DT',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0912',
    'J LUCIO KOVALISKI & CIA LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'U PAGAMENTO',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1572',
    'VENETO DECORAÇÕES LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0744',
    'J. Dos Santos - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1872',
    'Casa das Persianas Industria e Comércio Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEGUNDA FEIRA , ACOMA DE R$ 1.500,00 TRANSPORTADORA: TRANSPORTADORA SÃO MIGUEL  QAUNDO FRETE FOB: TRANSPORADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1836',
    'Ventana Esquadrias de PVC Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB 2X SEMANA TRANSPORTADORA : EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0918',
    'J.E.F. Matosinho Revestimentos - ME',
    'CIF',
    1500.0,
    'Expresso São Miguel',
    NULL,
    '1X NA SEMANA TODA TERÇA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, PEDIDOS ACIMA DE R$ 1.500,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TODA TERÇA-FEIRA. TRANSPORTADORA CIF - EXPRESSO SÃO MIGUEL  *VALOR DE FRETE CIF ALTERADO DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0713',
    'Venturi Modas Ltda EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1403',
    'J.MINUZZI ME',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0617',
    'Vera Lucia Theodorico Gomes',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0538',
    'VERAMAR DECORACOES LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0340',
    'J.S. Arquitetura e Decoração LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0506',
    'Jacks Nogueira Comércio de decorações LTDA.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c1520',
    'STUDIO DECORAÇÕES',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA QUINTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: 1X NA SEMANA TODA QUINTA-FEIRA. TRANSPORTADORA: RODONAVES  *MODALIDADE DE FRETE ALTERADA PARA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1522',
    'Gaviso Acabamentos',
    'FOB',
    NULL,
    NULL,
    NULL,
    'QUANDO ESTIVER PRONTO TRANSPORTADORA: BAUER   *MODALIDADE DE FRETE ALTERADA DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: QUANDO ESTIVER PRONTO TRANSPORTADORA: BAUER   *MODALIDADE DE FRETE ALTERADA DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0397',
    'Jackson Luciano Schneider 0076220124',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0827',
    'JAF Comércio de Artigos para o Lar Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1237',
    'JAIR JAIME DUARTE - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0764',
    'Jairo Rodrigues do Nascimento',
    'FOB',
    NULL,
    NULL,
    NULL,
    ':',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0490',
    'Verb Comércio e Serviços Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1548',
    'Jamef Transportes Eireli',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0817',
    'Verb Comércio e Serviços Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 28/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1218',
    'JAMEF TRANSPORTES EIRELI -FLN',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1695',
    'JAMEF TRANSPORTES LIMITADA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1771',
    'JAMEF TRANSPORTES LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0791',
    'Janaína H. W. Fernandes',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0581',
    'Jandira Jose Camilo da Silva - ME',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0888',
    'Janecir Angelo Tedesco',
    'FOB',
    NULL,
    NULL,
    NULL,
    'Sempre que estiver pronto',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1402 E C1616 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0104',
    'Vereda Persianas Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0065',
    'Janela Bonita Com. de Cortinas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1840',
    'Janete Bearari Prazeres Coelho 22.981.284',
    'CIF_FOB',
    2000.0,
    NULL,
    'Transportadora Rápido 90',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR ACIMA DE R$ 2.000,00 QUANDO FRETE FOB: TRANSPORTADORA RÁPIDO 90'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0541',
    'Janete Ramos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0804',
    'Veridiana Letícia Carrilho da Silveira',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1641',
    'Versateel Envidraçamento de Sacadas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'U EMAIL PARA ADRIANO, REPRESENTANTE E ELITON PARA INFORMAR DOS FREQUENTES ATRASOS',
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1478',
    'LAF Garzon Decoralle LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    '21/06/2023: CIF 1X POR SEMANA SEM VALOR MINIMO TRANSPORTADORA: JAMEF   *MODALIDADE DE FRETE ALTERADA DIA 18/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO -------------------------------------------------------------------------------------------- ANALISE DO REPRESENTANTE  SE TRATA DE UM EX VENDEDOR DA LOJA UNIFLEX BH, ESTÁ SE TORNANDO LOJISTA EM OUTRA CIDADE ONDE TEM GRANDES PARCERIAS COM ARQUITETOS E GRANDES INDICAÇÕES DE CLIENTES JÁ ATENDIDOS POR ELE NO PASSADO, A CIDADE FAZ PARTE DO POLO INDUSTRIAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0255',
    'Janilse Aparecida Soares dos Santos  Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1112',
    'VGB DESIGN EIRELI-ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0146',
    'Janio Nilton Pereira ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0026',
    'Jaqueline Gentil Duarte Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0151',
    'Jau Paulo Goulart ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0523',
    'Via 18 Imoveis ltda me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0549',
    'Jay Participações Imobiliarias Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1454',
    'JC  de Almeida Comercio de Confecçoes',
    'CIF_FOB',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1867',
    'Ana Larissa Bebe do Couto 24.930.540',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE RS AGRUPAR / NÃO AGRUPAR (AGUARDANDO INFORMAÇÕES DO COMERCIAL) FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO NIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO NIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0154',
    'JC Parada Com. de Cortinas, Pers. e Dec. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0345',
    'Via Decore Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1561',
    'Sauer e Lara confeccoes ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1866',
    'BBS Comercio de Pisos e Gesso em Gerais LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X SEMANA, SEGUNDA - FEIRA, ACIMA R$ 1500,00. TRANSPORTADORA: JAMEF   QAUNDO FRETE  FOB: TRANSPORTADORA RODONAVES.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1159',
    'JCL Comércio de Móveis Planejados e Sob Medida LTDA.',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0173',
    'Via Modenaxxxx',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0491',
    'Jean Fabio Mariotto',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0940',
    'Jeana Móveis e Bazar Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0857',
    'Jeferson da Silva',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    ':',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1175',
    'Jerusa Cristhiane MAttos Brito',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1308; C1412 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1109',
    'Barros e Barros Cortinas e Decorações Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    'TODAS AS TERÇAS - SEM EXCEÇÃO (NÃO AGRUPAR PARA OUTROS DIAS DA SEMANA 18/10/22!!!)  ___________________________________________________________________________  ANALISE REPRESENTANTE: CLIENTE DA CIDADE DE SOROCABA ONDE HÁ 1 REVENDA HD E OUTRA DE BANDEIRA ELUBEL, EX REVENDA CRIATIVA, ESTAVA FECHANDO COM A COLUMBIA MAS CONSEGUIMOS REVERTER',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1465',
    'Jet Desingn Interiores e Estofados LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    'ASSIM QUE FICAR PRONTO TRANSPORTADORA: BRASSPRESS PARA FOB  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: ASSIM QUE FICAR PRONTO TRANSPORTADORA: BRASSPRESS PARA FOB  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1292',
    'Via Tribus Confecçôes Eireli',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1865',
    'Klein Cortinas Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA TERÇA E QUINTA-FEIRA, ACIMA R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL  QUANDO FRETE FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1547',
    'JGG FERRREIRA - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1280',
    'Vida Animal',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1428',
    'Vidracaria 3 Maria Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0928',
    'Vidracaria Milani Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0595',
    'Jimesson Alves Pereira ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0919',
    'Vidracaria Reformarte Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0484',
    'JJ Papeis de Parede Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FICOU DEVENDO BAIXADO EM VENDA NAO RECEBIDA  1563,25  15;08;2014'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1868',
    'Chamel Interiores Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUARTA FEIRA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: EXPRESSO EJL  FRETE QUANDO FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1410',
    'JK PERSIANAS LTDA',
    'CIF_FOB',
    2000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0116',
    'Vidraçaria Dalla Valle Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1414',
    'VIEIRA E VIEIRA COMERCIO DE CARENAGEM LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1281',
    'JL Rações',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1587',
    'David Garcia Martins',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1399',
    'JLD Decora e Redes de Proteção Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB TRANSPORTADORA - BAUER   *DOCUMENTOS NO PORTAL'
);

-- Batch 29/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0111',
    'Vigor Com. de Vidros de Seg. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE MERCADORIA, TERÇA E QUINTA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0727',
    'Vila Bella Comércio e Decorações Eireli',
    'CIF_FOB',
    1000.0,
    NULL,
    'Expresso São Miguel',
    '----------------------------------------------------------------- ********************************** CONTATO COMERCIAL: comprasvittapaper@gmail',
    NULL,
    'ativo',
    NULL,
    'FRETE: CIF 1 X POR SEMANA, NAS COMPRAS ACIMA DE R$ 1.000,00 16/08/2018 - ACORDO DE FRETE FOB: CIF COM COBRANÇA:CIF(FOB) COBRAR FRETE ABAIXO VALOR MÍNIMO.  TRANSPORTADORA:  BAUER  24/02/2016 - PASSADO POR E-MAIL CFE. DOCUMENTO NOS ANEXOS, LOCAL PAARA ENTREGA DOS ITENS CFE. CONSTA NOS ENDEREÇOS -DEPÓSITO A PEDIDO DO CLIENTE. ----------------------------------------------------------------- FREQUÊNCIA DE ENVIO: ----------------------------------------------------------------- **********************'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1328',
    'Yes Decor Decoração de Ambientes Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, ACIMA R$1.500,00 TRANSPORTADORA : MOBILE QUANDO FRETE FOB: BRASSPRESS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0093',
    'JMC Com. Rep. de Prod. de Dec. Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    'Frete CIF 2 vezes por semana, sem valor mínimo - terça e Sexta-feira **TENTAR AGRUPAR QUANDO POSSÍVEL Transportadora: Reunidas  **GRUPO ECONÔMICO** Revenda faz parte do mesmo grupo econômico que C1483; C0783; C1682 por isso dividem o mesmo acordo de frete',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1483; C0783; C1682 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0436',
    'Joana Paiva Palodetto ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA:EMBARQUE DE VOLUMES ATÉ 6M  METROS',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:  CIF  ACIMA DE R$ 700,00,  FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA:EMBARQUE DE VOLUMES ATÉ 6M  METROS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1863',
    'Dieski Willian Petela & Cia ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUARTA-FEIRA , ACIMA DE R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL  FRETE QUANDO FOB: TRANPOSTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1264',
    'VILA FAN DECORACAO E PRESENTES LTDA.',
    'CIF',
    1000.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0953',
    'Joao Erlei da Silva Homem ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0205',
    'Jocelin Ferreira ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1717',
    'Villa Decor Serviços Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB  TRANSPORTADORA: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0495',
    'Joda e Fernandes LTDA EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0305',
    'Joel Celso Nascimento ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c0349',
    'Joelma dark da silva',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1862',
    'Davi de Paula Gabriel Filho',
    'CIF_FOB',
    1500.0,
    NULL,
    'VIP Transportes',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA, ACIMA DE R$ 1.500,00 SEGUNDA-FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL  QUANDO FRETE FOB : VIPEX'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1497',
    'Silk Home Cortinas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'CIF 1X POR SEMANA SEM VALOR MÍNIMO TRANSPORTADORA: EXPRESSO SÃO MIGUEL ______________________________________________________________ COMERCIAL  REALIZOU TREINAMENTO DE MOTORIZAÇÃO DIA 06/09/2022  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1006',
    'Joice Scalabrin Becker ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0968',
    'Villa Di Casa Comercio de Moveis Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'FRETE FOB 2X POR SEMANA - TERÇA/QUINTA  23/11 - JOSI',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1545',
    'Jomara Vieira dos Santos',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1857',
    'Vianna Diamond Comércio e Serviços Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB, 1X NA SEMANAMA, QUARTA FEIRA   TRANSPORTADORA: RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1455',
    'JOSEANE CRISTINA DO CARMO MACHADO',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0258',
    'Josiane de Jesus dos Santos Cortinas & Persianas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA- 23/08/2012- MANUELA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1851',
    'SC Home Comércio de Utilidades Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0453',
    'JOSÉ AUGUSTO SILVY ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1397',
    'Villaria Divisórias e Decorações LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'DE PEDIDOS CONFORME FICA PRONTO',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0807',
    'José Carlos Ballen',
    'CIF',
    700.0,
    NULL,
    NULL,
    '------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1856',
    'Estilo e Design Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1277',
    'Vinhedos Decorações Eireli-me',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1729',
    'José Claúdio Ribeiro',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'Terça e Quinta - AGRUPAR SEMPRE QUE POSSIVEL',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: JAMEF PARA CIF E FOB  MODALIDADE DE FRETE: CIF SEM VALOR MÍNIMO 2X POR SEMANA   FREQUÊNCIA DE ENVIO: TERÇA E QUINTA - AGRUPAR SEMPRE QUE POSSIVEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0461',
    'Vivant Indústria e Comércio de Malhas Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'PELA UNILUX'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1348',
    'José de Matos Vieira',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA CIF: JAMEF TRANSPORTADORA FOB: JAMEF FRETE CIF 1X POR SEMANA TODA QUARTA ACIMA DE R$1.500 *****MARCIO / RAYANNE SE ATENTAR AO FRETE CIF A MAIS QUE O CLIENTE TEM 24/03*****  ------------------------------------------------------------------------------------------------------- COMENTÁRIOS DO REPRESENTANTE:  CLIENTE ARTE DA CASA COM MAIS UMA UNIDADE **PODE SER ENVIADO COM A REVENDA ARTE DA CAS (EDUARDO FERRARI)  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0515',
    'José Renato Moreira ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TRANSPORTADORA: FRETE FOB VER TRANSPORTADORA DO CLIENTE  METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'ENDEREÇO DE ENTREGA: ALAMEDA DOUTOR CARLOS DE CARVALHO 1766, BATEL - CEP. 80730 - 200 - CURITIBA/PR MODALIDADE DE FRETE: SEMPRE FOB  FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: FRETE FOB VER TRANSPORTADORA DO CLIENTE  METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0736',
    'João da Silveira Bello ME',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '1X NA SEMANA   TRANSPORTADORA: RODONAVES *ALTERADO DIA 01/06/17 CC',
    NULL,
    'ativo',
    NULL,
    'FATURAMENTO MODALIDADE DE FRETE: CIF ACIMA DE R$ 1.000,00  FREQUENCIA DE ENVIO: 1X NA SEMANA   TRANSPORTADORA: RODONAVES *ALTERADO DIA 01/06/17 CC.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1057',
    'João Pedro Schult',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1853',
    'V & M2 Revestimentos Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE RS AGRUPAR / NÃO AGRUPAR (AGUARDANDO INFORMAÇÕES DO COMERCIAL) FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0106',
    'JR DECORAÇÕES EIRELI',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0729',
    'Juliana Aparecida Januário - ME',
    'CIF',
    1000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1672',
    'Vivi Franceschini Interiores Ltda',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'CIF 1X POR SEMANA ACIMA DE R$1',
    NULL,
    'ativo',
    NULL,
    'FREQUENCIA DE ENVIO: CIF 1X POR SEMANA ACIMA DE R$1.500,00 FOB: VIPEX CIF: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1635',
    'Luana da Silveira Nunes',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1129',
    'Juliana Machado de Oliveira',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0923',
    'Vivian Carvalho Decorações',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    'todos os dias da semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0313',
    'VIVIANA DOS SANTOS DECORAÇÕES - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1852',
    'Mendonça Moreschi Comercial Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FERE CIF 2X NA SEMANA, SEGUNDA-FEIRA E QUINTA-FEIRA, ACIMA DE R$ 1.500,00 TRANSPORTADORA JAMEF  QUANDO FRETE FOB: TRANSPORTADORA JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0390',
    'Juliana Pippi',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0551',
    'Julie B. Garbin',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0696',
    'Julio Cesar Vaquero Cobianchi',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1546',
    'VIVIANE NUNES CATELAN ME',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1650',
    'Loja da Ane Eireli EPP',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'TODA QUINTA FEIRA',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA CIF E FOB: EXPRESSO SÃO MIGUEL CIF 1X NA SEMANA SEM VALOR MÍNIMO FREQUENCIA DE ENVIO: TODA QUINTA FEIRA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0556',
    'Viviani Fusinato- 00402085914',
    'FOB',
    NULL,
    NULL,
    'ADILSON: 8421-6675',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB -    ADILSON: 8421-6675'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0634',
    'JULYCASA MATERIAIS DE CONSTRUÇÃO LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0482',
    'Junckes Construtora e Incorporadora Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 30/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0067',
    'Justen Cortinas e Cia Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1074',
    'Vizom Arquitetura e Dec. Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'RODONAVES 1X POR SEMANA CIF **ACORDO COMERCIAL FRETE  CIF 1X POR SEMANA ACIMA DE 1000,00 ALTERADO DIA 17/08/2018 (AUT. ADRIANO) FRETE FOB - RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0064',
    'Ivone Cortinas Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1252',
    'K & K HOME DECOR LTDA - ME',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1847',
    'R.L.R. Decoração de Quartos Infantis Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Apucarana',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, ACIMA DE R$ 1.500,00, TERÇAS-FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL  QUANDO FRETE FOB: TRASPORTADORA TRANSAPUCARANA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1833',
    'VM Decorações e Interiores Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO TRANSPOSTADORA: EXPRESSO SÃO MIGUEL QUANDO FRETE FOB: TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0422',
    'Kaciane Fagundes Decorações',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1745',
    'VN Gastronomia Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE:  FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0527',
    'Vogues e Vogues LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0250',
    'KAJUGA CORTINAS E DECORAÇÕES LTDA. - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0253',
    'VR COMÉRCIO DE PERSIANAS E CORTINAS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0110',
    'VR Cortinas Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1577',
    'VUD BAURU SOLUÇÕES E REVESTIMENTOS PARA CONSTRUÇÃO LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '– Sempre que estiver pronto Transportadora - Rodonaves',
    NULL,
    'ativo',
    NULL,
    'TIPO DE FRETE - SEMPRE FOB FREQUÊNCIA DE ENVIO – SEMPRE QUE ESTIVER PRONTO TRANSPORTADORA - RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0500',
    'VX Decohaus Revestimentos LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1177',
    'Karla R Jarros 7 Cia Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1562',
    'Kasa Arq Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1373',
    'Waldirene Machado Viana',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0632',
    'KASA LTDA - ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1058',
    'Walid Abdounni Tapeçaria EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB TRANSPORTADORA : RODONAVES  -------------------------------------------------------------------------------------  01/11/2022 - REVENDA INATIVADA CONFORME SOLICITAÇÃO DO ADRIANO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0981',
    'Kass Home Design LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1150',
    'Kaza Primory Comercio de Esquadrias e serviços Ltda ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO: CHEQUES PARA 28/56',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1625',
    'KAZARI DECORAÇOES LTDA',
    'CIF',
    1500.0,
    NULL,
    NULL,
    '– Segunda  Transportadora - Rodonaves',
    NULL,
    'ativo',
    NULL,
    'TIPO DE FRETE - CIF 1X NA SEMANA ACIMA DE R$1.500 FREQUÊNCIA DE ENVIO – SEGUNDA  TRANSPORTADORA - RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0068',
    'Kdec Com. e Decorações Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'CONFORME OS PEDIDOS FICAM PRONTOS; TRANSPORTADORA: REUNIDAS METRAGEM: ACIMA DE 5,20M SOLICITAR CAMINHÃO MAIOR COM A REUNIDAS',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB FREQUENCIA DE ENVIO: CONFORME OS PEDIDOS FICAM PRONTOS; TRANSPORTADORA: REUNIDAS METRAGEM: ACIMA DE 5,20M SOLICITAR CAMINHÃO MAIOR COM A REUNIDAS.   22/02/2016 - CONSULTA REALIZADA CFE. DOCUMENTO NOS ANEXOS - NADA CONSTA. FORMA DE PG 10/28/56 BOLETO LIMITE R$ 6000,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0559',
    'Kelen Paola Fand Persianas',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1 X SEMANA ACIMA 700,00.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0509',
    'Kelli Renata Gonzatti',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0799',
    'Finestre Decor Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2x na semana 1 FOB e 1 CIF 1 vez por semana, sem valor mínimo - Cliente Member  Transportadora: Expresso São Miguel  -----------------------------------------------------------  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'F1763',
    'Wesley Pereira Carneiro',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MINIMO R$ 1500,00 TRANSPORTADORA: RODONOVAES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0662',
    'Keterine Persianas e Decorações Comercio e Serviços  EIRELI ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0786',
    'Wall Decor Decorações Ltda. -ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    '-------------------------------------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1889',
    'E C Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA , QUARTA-FEIRA TRANSPORTADORA: REUNIDAS  FRETE QUANDO FOB: TRANSPORTADORA OURO NEGRO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1431',
    'Kilpp Planejados e Decoração Ltda',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0599',
    'KLAP COMERCIO DE MOVEIS LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: FRETE FOB - BAUER ( 1 X SEMANA  ) METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'FREQUENCIA DE ENVIO:   1X NA SEMANA TRANSPORTADORA: FRETE FOB - BAUER ( 1 X SEMANA  ) METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1845',
    'Progetto Design Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF X NA SEMANA, ACIMA R$ 1.500,00 TRANSPORTADORA JAMEF  QUANFOR FRETE FOB: TRANSPORTADORA BRASPRESS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0796',
    'Wall Decor Ind. e Com. Cortinas Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0230',
    'KOMLOG IMPORTAÇÃO LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1843',
    'Moss Home Comercio de Artigos de Tecido ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL  FRETE QUANDO FOB: BRASSPRESS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0382',
    'Wanderley de Faveri Marcelino',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1449',
    'KRUSIG SOLUCOES RESIDENCIAIS LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1179',
    'KSS DECORACOES LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0664',
    'WB MÓVEIS E DECORAÇÕES EIRELI ME',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    '---------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0184',
    'Kunrath & Cia Ltda-Me',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA - SEMPRE NA QUARTA --------------------------------------------- TRANSPORTADORA: PARA NOTAS COM FRETE CIF OU FOB - BAUER  ALTERAÇÕES EM 12/07/17 CC FINANCEIRO : FINANCEIRO@CASADASCORTINASUV',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 ---------------------------------------------- FREQUENCIA DE ENVIO: 1X NA SEMANA - SEMPRE NA QUARTA --------------------------------------------- TRANSPORTADORA: PARA NOTAS COM FRETE CIF OU FOB - BAUER  ALTERAÇÕES EM 12/07/17 CC FINANCEIRO : FINANCEIRO@CASADASCORTINASUV.COM.BR                     COMPRAS: COMPRAS@CASADASCORTINASUV.COM.BR CONTATO: CONTATO@CASADASCORTINASUV.COM.BR -------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0596',
    'Webber Webber e Cia Ltda.',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1762',
    'Wesley Pereira Carneiro',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MINIMO R$ 1500,00 TRANSPORTADORA: RODONOVAES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1148',
    'DDA- Comercio de persianas Ltda - ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0334',
    'Wiggers E Pertelle LTDA ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'FRETE FOB 1X POR SEMANA - QUINTA (18/10/22 - MAYARAI)  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1661 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1661 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0438',
    'Kunst Comércio de Cortinas Ltda',
    'CIF',
    NULL,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF- 1X NA SEMANA ACIMA DE 700,00 ACERTO C/ FERNANDO. 23/08/2012-MANUELA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1885',
    'Vitta Cortinas e Persianas LTDA',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1839',
    'Wild e Cia Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE NÃO AGRUPAR  CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1543',
    'Willians Costa Silva',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0658',
    'Winplus co ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 31/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1165',
    'L & M STUDIO COMÉRCIO DE DECORAÇÕES LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0555',
    'Wlademir Spindola Guimarães',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1585',
    'WPBG DESENVOLVIMENTO IMOBILIÁRIO S/A',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1585 E C1634 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0152',
    'XIfgalves  Cortinas MEXXXX',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0926',
    'L Felizari Cortinas Me',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '2x por semana (Terça e Quinta) 1 Frete CIF 1x por semana, acima de R$ 700,00',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0218',
    'XScolaro e Suzim Ltdaxxxx',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1776',
    'L G L Teixeira Pisos, Portas, Cortinas e Acabamentos Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'Segunda Fveira Transportadora: Rodonaves (CIF e FOB)',
    'GRUPO ECONÔMICO : GRUPO S R L (C1184)  -------------------------------------------------- FATURAMENTO  FRETE CIF, 1X NA SEMANA ACOMA R$ 1',
    'ativo',
    NULL,
    'FRETE CIF, 1X NA SEMANA ACOMA R$ 1.500,00 FREQUÊNCIA DE ENVIO: SEGUNDA FVEIRA TRANSPORTADORA: RODONAVES (CIF E FOB)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1118',
    'L P ENGENHARIA LTDA-ME',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    '1X NA SEMANA TODA SEXTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE FOB FREQUENCIA DE ENVIO: 1X NA SEMANA TODA SEXTA-FEIRA. TRANSPORTADORA: BAUER PARA FOB  ------------------------------------------------------------------------------ ANALISE REPRESENTANTE  REVENDA NOVA. VAI INAUGURAR. CIDADE PEQUENA, MAS VAI ATENDER MICRO REGIÃO. (SANTO ANTÔNIO DA PLATINA, NOVA FÁTIMA, RIBEIRÃO DO PINHAL, JUNDIAI DO SUL) CASAL ENGENHEIRO, ELA DECORADORA, FAZ TRABALHOS EM LONDRINA TAMBÉM. EMPRESÁRIOS BEM SUCEDIDOS, TEM POSTO GASOLINA, BOUTIQUE DE RO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0164',
    'xxGm Ind e Comércio de Persianas ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1279',
    'L&V Agropecuária',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1722',
    'L. T. Decor Comércio Varejista de Cortinas E Persianas  Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X SEMANA TRANSPORTADORA EXPRESSO SÃO MIGUEL  QUANFO FOB : TRANSPORTADORAS ALLIEX / AIANÇA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0688',
    'Yanaga Design Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    '02/06/2015, NADA CONSTA CONFORME DOCUMENTO NOS ANEXOS. 31/07/2017 - CONSULTA SERASA - NADA CONSTA. 23/07/2018 - CONSULTA REALIZADA, NADA CONSTA. (ANEXO)    FINANCEIRO:  LIMITE R$ 8.000,00 - ADRIANO 12/08/15  ALTERADO LIMITE DE CRÉDITO P/ R$ 20.000,00 - KATIA/ADRIANO (26/07/18)      TRANSPORTADORA: BAUER  FOB - 1 X SEMANA ------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0262',
    'Yendes Ind. e Comercio de Persianas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1877',
    'Matheus Zicka Gallucci 49.986.013',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUARTA-FEIRA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: REUNIDAS  QUANDO FRETE FOB : TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0531',
    'La Porte Home Decor Cortinas EIRELI- ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1541',
    'Yendes Industria e Comércio de Persianas  Eireli',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1783',
    'Lais Cortinas Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MÍNIMO R$ 2.000,00 QUANDO FRETE FOB: BRASSPRESS TRANSPORTADORA: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0331',
    'Lancer Yachts Comercio de Emb. LTDA - EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0175',
    'Ygor Pavan Modenese ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1613',
    'LAR COOPERATIVA AGROINDUSTRIAL',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO.  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1168',
    'Seiva Revestimentos LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0090',
    'SC Salete Carvalho Comércio de Cortinas Ltda Me.',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1002',
    'Yuni Stan Projeto Imoibiliario SA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO.   YUNI STAN PROJETO IMOBILIARIO S/A RUA OLIMPIADAS,66 ANDAR 11 CONJ 111/112 SALA 34 A CNPJ: 11.939.724/0001-11 INSC ESTADUAL : ISENTO VILA OLIMPIA – SP CEP : 04551-000  TRANSPORTADORA:'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0651',
    'Elegance Cortinas Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0199 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1391',
    'Laudelina Carboni ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0750',
    'Laura Santoro - ME',
    'CIF',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0824',
    'Laura Terezinha Silva de Oliveira ME',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0852',
    'Yuri Maciel Barrios ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1738',
    'Gru Consulting Consultoria Em Comercio Exterior Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0360',
    'Zahara Dec. de interiores Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1102',
    'ZAIONC FILHO ADMINIST. PARTICIPAÇÕES LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0373',
    'Leandro Blasius Decorações ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1341',
    'Contemporanea Cortinas e Persianas LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUANDO ESTIVER PRONTO, ACIMA DE R$ 1.500,00 TRANSPORTADORA: REUNIDAS  QUANDO FRETE FOB: TRANSPORTADORA ACEVILLE'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1824',
    'Lon Store Cortinas e Persianas Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEÇ FRETE QUANDO FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1604',
    'LEBENS E WERLANG LTDA ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1313',
    'ZANDONA MOVEIS E DECORACOES EIRELI',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1080',
    'Zanin Ambientes LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    'SEMPRE QUE FICAR PRONTO TRANSPORTADORA: EXPRESSO SÃO MIGUEL   *DCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: FOB FREQUENCIA DE ENVIO: SEMPRE QUE FICAR PRONTO TRANSPORTADORA: EXPRESSO SÃO MIGUEL   *DCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0240',
    'Leda Maria Dresch ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0978',
    'Trilhos & Telas Comercio e Serviços Ltda',
    'CIF',
    2000.0,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE RS  AGRUPAR FRETE FRETE SEMPRE CIF ACIMA DE R$2.000,00  TRANSPORTADORA CIF: EXPRESSO SÃO MIGUEL  TRANSPORTADORA: P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1448',
    'Leila Ventorin 08848652905',
    'FOB',
    NULL,
    NULL,
    NULL,
    'ASSIM QUE FICAR PRONTO TRANSPORTADORA: REUNIDAS  *MODALIDADE DE FRETE ALTERADA DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: ASSIM QUE FICAR PRONTO TRANSPORTADORA: REUNIDAS  *MODALIDADE DE FRETE ALTERADA DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0157',
    'Leister Moveis Dec. LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1823',
    'J. Sehnem',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0740',
    'Leomar Soares dos Santos - EPP',
    'CIF',
    800.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1492',
    'LEONARDO ADEMIR TONEZI DOS SANTOS 44553756862',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0558',
    'Leonardo Coelho',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1331',
    'LEONARDO JOSÉ DE MACEDO',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1065',
    'Leonardo Torres Correa',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0832',
    'Leonardo Valduga',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0130',
    'Leopoldo Francisco Meira Neto ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1651',
    'Leticia Home Decor Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: TRANSOLIVEIRA FRETE CIF 1X NA SEMANA ACIMA DE R$ 2.000,00'
);

-- Batch 32/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1059',
    'Leticia Souza Fraporti',
    'FOB',
    700.0,
    NULL,
    NULL,
    'TODAS AS QUINTAS',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1245',
    'LEVEL INCORPORADORA E LOTEADORA LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0494',
    'LH comércio de cortinas prontas LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0260',
    'Zavatti e Barbosa Ltda',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER   METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER   METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0929',
    'Zimmermann Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'DIARIAMENTE',
    NULL,
    'ativo',
    'CONDIÇÃO/LIMITE: BOLETO',
    'BRASSPRESS - ENVIO DIARIAMENTE. FRETE FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0171',
    'Lider Divisórias e Acabementos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1805',
    'Lidiane Castilho Soares Guidini',
    'CIF_FOB',
    2000.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA ACIMA DE R$ 2.000,00 TRANSPORTADORA: JAMEF  QUANDO FRETE FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1121',
    'Liedi Cortinas e Persianas',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE - 1X CIF ACIMA DE R$1.500,00 TRANSPORTADORA - BAUER PARA CIF E FOB OU EXPRESSO SÃO MIGUEL *VALOR DO CIF ALTERADO DIA 15/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  ----------------------------------------------------------- ANÁLISE REPRESENTANTE  REVENDA HUNTER SERA CLIENTE SOMENTE DE GLYDEA / CADASTAR TABELA BASE / NÃO DIVULGAR NO SITE /  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0336',
    'Liliam da Costa',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0540',
    'Lilian Bortolon',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0701',
    'Lilian Chiodi & Cia Ltda - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '- quarta-feira 1 frete cif por semana sem valor minimo Transportadora - Expresso São Miguel   *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'FREQUÊNCIA DE ENVIO - QUARTA-FEIRA 1 FRETE CIF POR SEMANA SEM VALOR MINIMO TRANSPORTADORA - EXPRESSO SÃO MIGUEL   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0659',
    'Lilian R Cardoso Me',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'S: SOMENTE NAS SEGUNDAS (BAUER ENTREGA EM 3DIAS, NAS TERÇAS/QUARTAS/QUINTAS) TRANSPORTADORA: BAUER CIF/FOB METRAGEM: ACIMA DE 4M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'FREQUENCIA DE ENVIOS: SOMENTE NAS SEGUNDAS (BAUER ENTREGA EM 3DIAS, NAS TERÇAS/QUARTAS/QUINTAS) TRANSPORTADORA: BAUER CIF/FOB METRAGEM: ACIMA DE 4M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0763',
    'Decor Cortinas e Persianas Eireli - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    'CIF 1 VEZ POR SEMANA, sem valor mínimo - Cliente Prodesign  Quinta   Transportadora: Expresso São Miguel (alterado dia 28/06/24 solicitado pelo cliente)   12/05/2022 - alterado frequancia de envio - de 2 fretes por semana para apenas 1',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0174',
    'Zini Ind e Com de Pers Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0236',
    'Litoral Cortinas Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1434',
    'ZM S/A',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '--------------------------------------------------------------------- Enviar sempre que ficar pronto',
    NULL,
    'ativo',
    NULL,
    'FRETE FOB - TRANSPORTADORA: BAUER --------------------------------------------------------------------- FREQUÊNCIA DE ENVIO: --------------------------------------------------------------------- ENVIAR SEMPRE QUE FICAR PRONTO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1637',
    'Êxitus Comercial LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c0318',
    'Litoral Soluções em Com. Exterior',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0323',
    'Livanos Wall Tomaz de Almeida',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0798',
    'Santos & Cabral London Pisos Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA SEM VALOR MINIMO  TRANSPORTADORA: EXPRESSO SÃO MIGUEL    SHOWROOM EMBARCAR DIA 26/02 SEM FALTA. CONDIÇÃO BONIFICADA SOB META DE R$ 450 K 12 MESES CONTANDO DE MARÇO.2024'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1287',
    'LMB PARTICIPAÇÕES LTDA - EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1832',
    'Casa Carla Comercio de Decoração Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CIENTE BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0980',
    'Loft House Comercio de Moveis e Decorações Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'FRETE FOB 2X POR SEMANA - TERÇA/QUINTA  23/11 - JOSI',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0124',
    'Persianas CJC Ltda ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'SEMPRE QUE ESTIVER PRONTO - CIF 1 vez por semana, sem valor mínimo - Cliente Member  TRANSPORTADORA: Expresso São Miguel  ----------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0245',
    'Loja das Cortinas Luzia LTDA EPP',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0440',
    'Cleberson Ribeiro',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1247',
    'Loja das Redes Eirele - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1212',
    'LOJA ELETRICA LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1049',
    'Loja Viva Cortinas e Persianas Ltda',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1359',
    'Lojão do Guma',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1812',
    'Aline Claudino da Silva 62.664.134',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO: RODRIGO RODRIGUES  -------------------------------- FATURAMENTO  CLIENTE BACÃO',
    'ativo',
    NULL,
    'CLIENTE BACÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1226',
    'Loraine Liberato Ind. Com. de Cortinas LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0040',
    'Loraine Liberato Ind. e Com.de Cort. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0609',
    'Lorival da Silva Velasques',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0600',
    'Losangeles Decorações Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '1X NA SEMANA  *** INATIVADA POR ADRIANO/RICARDO EM 15/01/21',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA  *** INATIVADA POR ADRIANO/RICARDO EM 15/01/21'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0553',
    'Louise Damiani',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1511',
    'LR Decorações - Cortinas e Persianas Eieli',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0878',
    'LP de Almeida e Cia LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1260',
    'LP PISOS',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO PAG. PARA: BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1871',
    'LPS Garcia Aion Decor LTDA',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA. TERÇA - FEIRA ACIMA DE R$ 1500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL  QUANDO FRETE FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0112',
    'Vitória Decorações e Cortinas LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE: FOB **QUANDO FOR TRANSPORTADORA, ENVIAR PELA ARLETE  *** CLIENTE RETIRA MATERIAL (EMABALADO) NO BALCÃO 1 VEZ POR SEMANA - QUINTA-FEIRA 23/01/2026 - JULIANA SOLICITOU ALTERAÇÃO DO DIA DE RETIRADA PARA TODA TERÇA-FEIRA. 09/03/2026 - JULIANA SOLICITOU ALTERAÇÃO DO DIA DE RETIRADA PARA TODA SEGUNDA-FEIRA.  29/08/2025: PEDIDO SERÃO RETIRADOS SOMENTE PELO COLABORADOR : JOCEMAR PEREIRA (SOLICITADO CLIENTE- E-MAIL)  ----------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0993',
    'Luana Machado de Oliveira ME',
    'CIF_FOB',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1406',
    'Lucali Interiores Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'SEMPRE QUE ESTIVER PRONTO',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0180',
    'Lucas e Monteiro Comércio e Representação de Móveis e Decorações LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    '12/06/2015 - CONSULTA REALIZADA CFE. DOCUMENTOS EM ANEXOS - NADA CONSTA. 25;11 ALTERADO LIMITE CREDITO - KATIA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1169',
    'Lucia Helena Bogas Fraga ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'COM A MAGNIFICAT [C1675]  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1675 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1675 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0543',
    'Lucia Muller Buligon',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0970',
    'Luciane Marinês Werle',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0125',
    'Lucietto & Oltramari Ltda - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0938',
    'Lucky Mart Indústria Comércio Serviços Persianas e Cortinas Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB SEMPRE QUE ESTIVER PRONTO TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1041',
    'E. O. Casimiro',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1599; C1654; C1692 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, SEM VALOR MÍNIMO  *SEMPRE AGRUPAR PEDIDOS PARA UTILIZAR FRETE CIF, CLIENTE NÃO QUER PAGAR FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL   *ACIMA DE 3M, USAR A RODONAVES *SE TIVER QUE ENVIAR FOB, SEMPRE PELA ALFA TRANSPORTES  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1599; C1654; C1692 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00, É PARA TODAS. E NÃO 1 CIF ACIMA DE 1.500,00 PARA CADA.   ------------------------'
);

-- Batch 33/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0622',
    'Luibi Construções Civis Ltda',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB - 1X NA SEMANA - EXPRESSO SÃO MIGUEL  ----------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0849',
    'Luis Paulo Zart',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1463',
    'LUISA PALACE HOTEL LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1427',
    'Luiz Cláudio Alonso de Oliveira',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0883',
    'Luiz Fernando Fanfa - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1220',
    'Luiz Gustavo Bezerra dos Santos 33924637873',
    'CIF_FOB',
    900.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0877',
    'Luiz Gustavo coelho dos santos me',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0071',
    'Lumanville Dec. e Com. de Pisos e Rev. Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1017',
    'Tatiana R I Martin Comercio de Cortinas e Decorações Me',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1001',
    'Lunni Mais Design Interiores Ltda',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE: TRANSPORTADORA: EXPRESSO SÃO MIGUEL (ALTERADO 05/02 CONFORME SOLICITAÇÃO CLIENTE, DEVIDO PROBLEMAS C/ TRANSPORTADORA ANTERIOR) 15/08/2022 - CIF - 1X  POR SEMANA - ACIMA DE R$ 1.500,00- CFE. EMAIL ADRIANO EM   QUANDO FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL  ---------------------------------------------------------------------------------------------------------------- 02/09/2022 - REVENDA PARTICIPOU DO TREINAMENTO DE INSTALADORES  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0394',
    'LURDES AGOSTINI RETALHOS - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1409',
    'Lush Comércio e Indústria de Persianas LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1742',
    'Luss Metais Finos - Acabamentos e Interiores LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'ATUAL CARGAS',
    NULL,
    NULL,
    'ativo',
    NULL,
    'CIF 1X A SEMANA SEM VALOR MÍNIMO TRANSPORTADORA JAMEF TRANSPORTADORA FOB ATUAL CARGAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1883',
    'Construtora Planespaço LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    'GRUPO ECONÔMICO)  ---------------------------------------------------- FINANCEIRO:  21/08/2026 - CONSULTA REALIZADA, NADA CONSTA',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1582',
    'Lux Artigos de Decoração LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'ACORDO DE FRETE: 29/08/2022 - FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO - RODONAVES FRETE FOB - BRASPRESS  ______________________________________________________  26/04/2022 - ALTERADO ENDEREÇO DE ENTREGA CONFORME SOLICITAÇÃO DO CLIENTE  *DOCUMENTOS O PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0843',
    'Dirceu Valmor Reuter',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'TODAS AS QUARTAS  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1517; C1536; C1538; C1540; C1612 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1517; C1536; C1538; C1540; C1612 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    'CONDIÇÃO DE PAGAMENTO EM 28/56. 18/01/2019 - CONSTA REGISTROS 14/09/2021 - CONSULTA RELIZADA, NADA CONSTA (ANEXO) 22/02/2022 - CONSULTA REALIZADA, CONSTAM PENDENCIAS. SOCRE 0/1000. (ANEXO) ____________________________________________________________________  REF COMERCIAIS: STM BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1486',
    'LUXASHADE INDUSTRIA E COMERCIO EIRELI - EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1627',
    'LV ARQUITETURA E SOLUÇÕES LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1490',
    'M C GIUSTI & CIA LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1790',
    'Atlântico Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    '1 FRETE CIF SEM VALOR MÍNIMO E 1 FRETE FOB POR SEMANA - TERÇA/QUINTA   TRANSPORTADORA: EXPRESSO SÃO MIGUUEL  METRAGEM ACIMA DE 5,20M SOLICITAR CAMINHÃO MAIOR COM A REUNIDAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1162',
    'M Decor Comércio de Cortinas Eireli ME',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: ACEVILLE PARA CIF E FOB FRETE CIF 1X POR SEMANA ACIMA DE R$ 1.500 *VALOR DO CIF ALTERADO DIA 15/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  --------------------------------------------------------------------------------------- ANÁLISE REPRESENTANTE  MAIOR REVENDA HUNTER DA CIDADE DE SÃO JOSE DOS PINHAIS. VAI COMPRAR SOMENTE GLYDEAS.  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1043',
    'M e F Materiais de Construção',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'c1795',
    'M Paiva Alves Santos',
    'CIF_FOB',
    1500.0,
    NULL,
    'Gridlog',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1 X NA SEMANA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: JAMEF  QUANDO FRETE FOB: GRIDLOG'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1707',
    'M U V Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE FOB 2X NA SEMANA SEM FAVLOR MÍNIMO TRANSPORTADORA SÃO MIGUEL   CIF TRANSPORTADORA VENETO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1563',
    'M. F. PEREIRA ARTEFATOS TEXTEIS',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0451',
    'M. I. FUJITA TOLDOS E DECORAÇÕES ME',
    'CIF',
    700.0,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1170',
    'Elena Leite Zarpate',
    'CIF_FOB',
    170000.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0380',
    'M.A.C. Favero Decorações e Acabamentos',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1859',
    'M.J.W. Engenharia Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1324',
    'Macomoweis Industria e Comercio de Moveis EIRELI',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1607',
    'Maga Decor LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1801',
    'Villaria Ambientes ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'PARA TODA QUARTA-FEIRA',
    'GRUPO ECONÔMICO: C1801 E C1397    ----------------------------------------- FATURAMENTO  FRETE SEMPRE FOB  TRANSPORTADORA : EXPRESSO SÃO MIGUEL  SOLICITADO LARISSA VIA WHATSAPP, ALTERAÇÃO DA FREQUENCIA DE ENVIO PARA TODA QUARTA-FEIRA',
    'ativo',
    NULL,
    'FRETE SEMPRE FOB  TRANSPORTADORA : EXPRESSO SÃO MIGUEL  SOLICITADO LARISSA VIA WHATSAPP, ALTERAÇÃO DA FREQUENCIA DE ENVIO PARA TODA QUARTA-FEIRA. 11/03/2026 - SOLICITADO LARISSA VIA WHATSAPP, ALTERAÇÃO DA TRANSPORTADORA: DE OURO NEGRO PARA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1684',
    'JC Peças e Acessórios LTDA ME',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'CIF 1X NA SEMANA ACIMA DE R$1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL QUANDO FOB TRANSPORTADORA: TRANSAPUCARANA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1433',
    'MAGALI BONELI TORRES BRASIL',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1217',
    'Magali Solda Eireli',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0073',
    'Magleid Comercio Confecções Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0673',
    'Maite Enxovais Ltda Me',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'DA SEMANA  ---------------------------------------------------------------------------------------- *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1682',
    'JMS Comércio de Produtos de Decoração LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1483; C0783; C0093 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FRETE CIF 2X POR SEMANA SEM VALOR MÍNIMO CIF E FOB - REUNIDAS TERÇA E SEXTA-FEIRA **TENTAR AGRUPAR QUANDO POSSÍVEL  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1483; C0783; C0093 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 2X NA SEMANA SEM VALOR MÍNIMO, É PARA TODAS. E NÃO 2 CIFS PARA CADA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1453',
    'Majestic Cortinas e Persianas',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0761',
    'MAJJ Restaurante e Petiscaria Eireli - EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1802',
    'Manufe Comércio de Produtos Arquitetônicos Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE SEMPRE FOB 2X NA SEMANA TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1769',
    'Manzoli Empreendimentos e Participações EIRELI',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1 X NA SEMANA, SEM VALOR MÍNIMO TRANSPORTADORA JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1353',
    'Mar e Luna Variedades',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0552',
    'Marcela Camera Carreirão',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0374',
    'Decoradora Decampos Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    '1 FRETE CIF POR SEMANA ACIMA DE R$1.500  EXPEDIÇÃO: FRETE FOB ENVIAR PELA TRANSPORTADORA TRANSAPUCARANA / SOLICITADO POR BETE -> (45) 9955 0035 EM 29/07/2026    *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1166',
    'Marcello Correa Petrelli',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1371',
    'MARCELO CATTO MATERIAIS DE CONSTRUÇÃO LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0904',
    'Marcelo Eduardo de Oliveira Arruee',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1838',
    'Gislaine Castoldi Cornelli Ltda',
    'CIF',
    2000.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL  FRETE QUANDO FOB: REVENDA EFETUANDO COTAÇÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1749',
    'Carine V. Eger ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓSXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);

-- Batch 34/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0950',
    'Marcelo Favieiro',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0851',
    'Marcelo Rosa de Brito',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    '---------------------------------------------------------------------- **************************************************** SEGUE ENDEREÇO ABAIXO PARA ENTREGAS DAS MERCADORIAS:  Rua: Júlia Rosa n 300 Bloco 1 Apto 304 Bairro: 5 de maio Cidade:Montenegro-Rs  Grato por sua atenção Ass: Marcelo **************************************************** EM 09/08/2016 - FOI ENVIADO UMA NF COM MAIS DE R$ 700,00 FRETE FOB - O CORRETO ERA CIF',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1234',
    'MARCENARIA SULAR KLTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1758',
    'Originale Comércio de Tapetes e Serviços de Decoração Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO TRANSPORTADORA : EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0589',
    'Arte e Estilo Confecções Ltda',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    NULL,
    'DIRETO**14/02/14- MANUELA',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1482',
    'MARCIA DA SILVA DORNELLES',
    'CIF_FOB',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0417',
    'Marcia e Silveira Ambientações ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'Sexta-feira Transportadora: Expresso São Miguel - para CIF e FOB    *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X CIF SEM VALOR MÍNIMO FREQUÊNCIA DE ENVIO: SEXTA-FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL - PARA CIF E FOB    *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0292',
    'MARCIA MARLENE DA SILVA DECORAÇÃO DE INTERIORES',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: BAUER OU EXPRESSO SÃO MIGUEL FRETE SEMPRE FOB   SEMPRE QUE FICAR PRONTO.  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1798',
    'Larissa de Oliveira Hantschel 62.262.261',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, TERÇA- FEIRA, ACIMA DE R$ 1.500,00 TRANSPORTADORA EXPRESSO SÃO MIGUEL   QUANDO FRETE FOB: TRANSPORTADORA: REUNIDAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0598',
    'Marcia Regina Righetto Mafra',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1088',
    'Marcio Cardoso da Rosa',
    'CIF',
    NULL,
    NULL,
    NULL,
    'LIGAR PARA O MARCIO PARA COMBINAR O ENVIO',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0013',
    'Giovana Cortinas Eireli - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1110',
    'Demiati Comércio de Persianas LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0860',
    'Marcio Carvalho Oleques  75757656034',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1211; C1363 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'ACORDO DE FRETE: TRANSPORTADORA CIF E FOB: EXPRESSO SÃO MIGUEL. FRETE CIF 1X NA SEMANA SEM VALOR MINIMO - MEMBER   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1211; C1363 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE.    ------------------------------------------------------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0011',
    'Marcio Cesar de Vasconcelos Silva ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1323',
    'Daniel Figueiredo Fernandes',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO: _30/60',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1644',
    'MARCOS ALEX BERNARDI',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1143',
    'Dart Comercio Decorações Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓSXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL  -----------------------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1659',
    'Arte Decor Interiores Eirelli ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE  FOB: RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0992',
    'Marcos L Manchur e Cia Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0102',
    'Marcos Vinicius Elias ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0473',
    'Marcos Vinícius Alves Rodrigues de Oliveira - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1444',
    'MARDEC COM FORROS E DIVISÓRIAS LTDA EPP',
    'CIF_FOB',
    1000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1363',
    'Leandro Sangoi da Silva 01078366020',
    'CIF',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0860; C1211 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'ACORDO DE FRETE: TRANSPORTADORA CIF E FOB: EXPRESSO SÃO MIGUEL. FRETE SEMPRE CIF 1X NA SEMANA, QUARTA-FEIRA, SEM VALOR MÍNIMO   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0860; C1211 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.000,00 É PARA AMBAS. E NÃO 1 CIF ACIMA DE 1.000,00 PARA CADA.   -----------------------------------------------------------------------------  18/08/2022 - REVENDA INATIVADA CONFORME SOLICITADO PELO ADRIANO  *DOCUMENTOS NO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0542',
    'Margareth Carreirão',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0650',
    'Margarida Antonello',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1367',
    'Mari Isabel Canazaro de Mello Me',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1860',
    'Vivere Casa e Decoração Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUARTA-FEIRA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: REUNIDAS  FRETE QUANDO FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1048',
    'Maria Alice Azeredo Almeida',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0430',
    'MARIA AUGUSTA DOS REIS CAMACHO',
    'CIF_FOB',
    700.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TRANSPORTADORA: PARA NOTAS COM FRETE CIF - JAMEF E PARA FRETE FOB - BAUER METRAGEM: ACIMA DE 3M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1529',
    'MARIA CRISTINA ALVES DA SILVA MUEHLBAUER',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1198',
    'Maria Lucia Silva Tomazi ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1719',
    'Maria Lucia Terres Dacas Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO TRANSPORTADORA: EXPRESSO SÃO MIGUEL  QAUNDO FOB: TRANSPORTADORA BAUER'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1106',
    'MARILEA AUGUSTO ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1315',
    'Marilei da Silva Souza ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0498',
    'Marilene Meira de Freitas 51155699904',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    ':'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0200',
    'Marilene Zanette Petersen - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1521',
    'La Marc Interiores By Marcia Cortinas',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA TERÇA FEIRA',
    NULL,
    'ativo',
    NULL,
    'FREQUENCIA DE ENVIO: 1X NA SEMANA TODA TERÇA FEIRA.  >> ALTERADO PARA TODOS OS DIAS ASSIM QUE PRONTO / EM 16/10 SOLICITADO VIA EMAIL: CONTATO@LAMARCINTERIORES.COM.BR   FRETE CIF 1X NA SEMANA NO DIA 02/08 CLIENTE SOLICITOU A TROCA DA TRANSPORTADOR TRANSPORTADORA BRISTOT   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1372',
    'Marilha Roldão Spidro da Silva',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1773',
    'ID Design Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'TERÇA E QUINTA TRANSPORTADORA: EXPRESSO SÃO MIGUEL',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA (SEM VALOR MINIMO)   REVENDA SELECT - **AGRUPAR SEMPRE QUE POSSIVEL** FREQUENCIA DE ENVIO: TERÇA E QUINTA TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1481',
    'MARILIS ANTUNES DE OLIVEIRA',
    'CIF_FOB',
    1000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0533',
    'Marina de Souza 06184577980',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'TECIDO SOFT FLOW SE TIVER AVARIA AGUARDAR POIS PODE SER QUE VOLTE E NAO FIQUE COM AVARIA REF AMASSADO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0572',
    'Marisa Borges',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO E LIMITE PARA: 10/28',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0488',
    'Marisa Jochem Demarchi',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1518',
    'Fernando Rudinei Marcon 90853911053',
    'CIF',
    2000.0,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1063; C1440',
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL  -------------------------------------------------------------------------------------------------  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1063; C1440. C1362 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00, É PARA TODAS. E NÃO 1 CIF '
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0564',
    'Markaz Decorações LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1003',
    'Via Pisos Comercio de Pisos e Decorações Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0259',
    'Maristela Heberle & Cia Ltda - ME',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, TERÇA-FEIRA, ACIMA R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL  QUANDO FRETE FOB: TRANSPORTADORA EXPRESSO SÃO MIGUEL  -------------------------------------------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0315',
    'Marlete dos Santos Santana',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1400',
    'Magaiver Eidt',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 35/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1193',
    'Marlon Koerich',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1082',
    'Marques Com. de Confecções Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0809',
    'Marta Cortinas Ltda ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0654',
    'John Lennon Monteiro Joaquim',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1164',
    'Marta Maria Curry Martins & Cia LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1626',
    'MARTE UPDATES & AVIONICS LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2X por semana',
    NULL,
    'ativo',
    NULL,
    '/EXPEDIÇÃO: FREQUÊNCIA DE ENVIO 2X POR SEMANA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1679',
    'Marcello Coimbra Cardoso Me',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X POR SEMANA SEM VALOR MÍNIMO. - NÃO ENVIAR FOB TRANSPORTADORA RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0911',
    'Angelica Denise Worm Me',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0412',
    'Martins Comercio de Cortinas e Persianas Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0201',
    'Unilux Industria e Com. de Persianas Ltda.',
    'CIF',
    NULL,
    NULL,
    NULL,
    'DE PEDIDOS CONFORME DATAS DE ENTREGA, SOMENTE PELA TRANSPORTADORA OURO NEGRO, SE TIVER PRODUTO DE 6M SOLICITAR COLETA DO CAMINHÃO COM A OURO NEGRO',
    NULL,
    'ativo',
    NULL,
    'OBSERVAR EM NOTA A PARTIR DE 05/05/14:  LOCAL DE ENTREGA: RUA SANTOS DUMONT 1781  06/09/13 - ENVIO DE PEDIDOS CONFORME DATAS DE ENTREGA, SOMENTE PELA TRANSPORTADORA OURO NEGRO, SE TIVER PRODUTO DE 6M SOLICITAR COLETA DO CAMINHÃO COM A OURO NEGRO. GISELE. ANEXO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0725',
    'Mata Rivoiro Comércio Colocação de Cortinas e Persianas Eireli - ME',
    'CIF',
    1000.0,
    NULL,
    NULL,
    '---------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0447',
    'Matecenter Materias de Const. Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA ESPERAR JUNTAR MINIMO 2 PEDIDOS***** TRANSPORTADORA: OURO NEGRO METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:, FRETE FOB SEMPRE. FREQUENCIA DE ENVIO:1X NA SEMANA ESPERAR JUNTAR MINIMO 2 PEDIDOS***** TRANSPORTADORA: OURO NEGRO METRAGEM:ACIMA DE 3M VERIFICAR COM A TRANSPORTADORA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1357',
    'Maternidade e Cirurgia Nossa Senhora do Rocio LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0955',
    'MATHEUS HENRIQUE DE SALES LESSA 06953885920',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1827',
    'M4 Comércio de Móveis Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: VIPEX'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1132',
    'Comercial Carim Decorações LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0872',
    'Vagner dos Santos e Cia Ltda - ME',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1652',
    'Maxi Toldos Bragança Ind Com de Toldos e Coberturas Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'CIF 1X NA SEMANA ACIMA DE R$1.500,00 TRANSPORTADORA: RODONAVES TRANSPORTADORA QUANDO FOB: RODONAVES  19/09/2024 - SOLICITADO PELO CLIENTE TROCA DE TRANSPORTADORA DE JAMEF PARA RODONAVES  --------------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0731',
    'Mauriglass Indústria e Comércio de Vidros Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1639',
    'Bailly Industrial Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    'SEMPRE QUE ESTIVER PRONTO',
    NULL,
    'ativo',
    NULL,
    '@BAILLY.COM.BR WHATSAPP (21) 96498-4122 ---------------------------------------------------------------------------------------- FINANCEIRO:  06/03/2023 - CONSULTA REALIZADA, NADA CONSTA. SCORE 606/1000 (ANEXO) 06/03/2023 - CONSULTA CPF DOS SÓCIOS, NADA CONSTA. SCORE 708/1000. (ANEXO)  ----------------------------------------------------------------------------------------- FATURAMENTO:   FRETE SEMPRE FOB  TRANSPORTADORA: COTALOG FREQUANCIA DE ENVIO: SEMPRE QUE ESTIVER PRONTO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1038',
    'MC INCORPORACAO IMOBILIARIA LTDA EPP',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0770',
    'MC Madeiras Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    'MUDOU PARA DIVENTARE',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1498',
    'Rodrigo Braga de Oliveira',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1818',
    'MDS Marcenaria Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF ACIMA 1.500,00 ,1 X NA SEMANA TRANSPORTADORA : CIF E FOB - RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1081',
    'Leandro Persianas Ltda ME',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0545',
    'Meire de Fatima Delani',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0829',
    'Melissa Tartarotti Lima',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0747',
    'Melita calçados ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO PARA CLEINTE MULINARI FRETE CIF   9.105,37 - VALOR VENDA -6.562,15 - CUSTO MULINARI ------------  2.543,22 -  457,78 - IMPOSTOS ------------  2.085,44 CRÉDITO PARA MULINARI'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0012',
    'Angela Maria Ribeiro Andrioni e CIA LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1715 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1671',
    'ME Decor Cortinas e Persianas LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA SEM VALOR MÍNIMO. TRANSPORTADORA: EXPRESSO SÃO MIGUE FOB - DISKTENHA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0811',
    'Merco Maju Pisos Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    'CONDIÇÃO PAGAMENTO (18/09/2018): PRAZO 10/28',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1032',
    'Legno Pisos e Decoração Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    '- ACORDO DE FRETE:  FRETE SEMPRE FOB 1X POR SEMANA - QUARTA TRANSPORTADORA - EXPRESSO SÃO MIGUEL  -------------------------------------------------------------------  -'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1800',
    'Mercosystem Comercial e Distribuidora Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE NÃO AGRUPAR  CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0566',
    'Metalkraft S/A - Injecao e Usinagem',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'DIRETO UNILUX  FRETE CIF NOS 2 PEDIDOS BNDES.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1844',
    'Casa Okre Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1 X NA SEMANA , TERÇA-FEIRA, SEM VALOR MÍNIMO TRANSPORTADORA: EXPRESSO SÃO MIGUEL  FRETE QUANDO FOB:  EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0159',
    'Metrica Comercio de Decorações Ltda ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0676',
    'MF Da Costa e Silva Ltda',
    'CIF_FOB',
    700.0,
    NULL,
    'Expresso São Miguel',
    'SEMPRE QUE PRONTO, SOLICITARÁ POR E-MAIL QUANDO DESEJAR AGRUPAR PEDIDO',
    NULL,
    'ativo',
    NULL,
    '---------------------------------------------------------------------------- MODALIDADE DE FRETE: CIF ACIMA DE R$ 700,00 ---------------------------------------------------------------------------- FREQUENCIA DE ENVIO: SEMPRE QUE PRONTO, SOLICITARÁ POR E-MAIL QUANDO DESEJAR AGRUPAR PEDIDO.(ACORDADO OSMAR E CAROL EXP) --------------------------------------------------------------------------------------------------------------------------------------------------- TRANSPORTADORA: PARA NOTAS COM FR'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0891',
    'MF Machado Soares',
    'CIF',
    700.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1343',
    'Innovar Decoração de Interiores LTDA ME',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'Sempre que estiver pronto  *Tipo de frete alterado dia 18/08/2022 conforme solicitação do Adriano  ------------------------------------------------------------------------------------------------------------------- Comentário do representante:  Cliente com loja bem montada em um pequeno shopping no centro de Vila Velha, tem um show room já montado pela Stalos que não esta correpondendo as espectativas',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA PEDIDOS ACIMA DE R$1.500,00 TRANSPORTADORA CIF: JAMEF TRANSPORTADORA FOB: JAMEF FREQUÊNCIA DE ENVIO: SEMPRE QUE ESTIVER PRONTO  *TIPO DE FRETE ALTERADO DIA 18/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  ------------------------------------------------------------------------------------------------------------------- COMENTÁRIO DO REPRESENTANTE:  CLIENTE COM LOJA BEM MONTADA EM UM PEQUENO SHOPPING NO CENTRO DE VILA VELHA, TEM UM SHOW ROOM JÁ MONTADO PELA STALOS QUE NÃO ESTA '
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1617',
    'MGS Comércio de Papéis e Tecidos LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA ACIMA DE 1.500 K TRANSPORTADORA JAMEF (12/12) FOB - JAMEF TRANSPORTADORA MOBILE PARA PEÇAS MAIORES DE 3M  -------------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0546',
    'Michel de Oliveira  Minichiello',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1591',
    'Celita Jakubiu Decorações Eireli ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'SEMPRE FOB FREQUÊNCIA: 1X POR SEMANA NA TERÇA-FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL  *MODALIDADE DE FRETE ALTERADA DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'TIPO DE ENVIO: SEMPRE FOB FREQUÊNCIA: 1X POR SEMANA NA TERÇA-FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL  *MODALIDADE DE FRETE ALTERADA DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0401',
    'Mikilita Sendeski e Cia Ltda',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1X NA SEMANA, CIF ACIMA DE R$ 700,00',
    NULL,
    'ativo',
    NULL,
    'ENVIO 1X NA SEMANA, CIF ACIMA DE R$ 700,00'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0905',
    'Milano Designer de Interiores',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '-----------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1814',
    'Minas Deccor Cortinas e Persianas Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA ACIMA DE R$ 1.500,00 TRANSPORTADORA : JAMEF FRETE QYANDO FOB: PAULINELES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1728',
    'Minas Decorações e Persianas Alphaville Ltda',
    'CIF',
    1500.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA. VALOR MÍNIMO R$ 1.500,00 TRANSPORTADORA: JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1062',
    'Mercopar Imp. e Exp. Produtos Diversos LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2X NA SEMANA (TERÇA/QUINTA) TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1151 E C1710 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1151 E C1710 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF 2X POR SEMANA INDEPENTENDE DO VALOR (AGRUPAR SE POSSÍVEL) FREQUENCIA DE ENVIO: 2X NA SEMANA (TERÇA/QUINTA) TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1151 E C1710 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 2X NA SEMANA SEM VALOR MÍNIMO, É PARA TODAS. E NÃO 2 CIFS PARA CADA.   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0046',
    'Divisão Forro e Carpetes Ltda ME',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1553',
    'Minas Decorações e Persianas Ltda',
    'CIF_FOB',
    3000.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    '1 FRETE CIF SEMANAL - ACIMA DE R$3.000 NA SEGUNDA OU QUARTA-FEIRA TRANSPORTADORA CIF: RODONAVES TRANSPORTADORA FOB: JAMEF OUTRAS OPÇÕES: JADLOG - TRANSMOREIRA  *TRANSPORTADORA E VALOR DE FRETE CIF ALTERADOS DIA 18/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1714',
    'Minuzzi e Liscoski Ltda',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÂO MIGUEL'
);

-- Batch 36/37 (50 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0958',
    'MK Móveis Ltda - EPP',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1760',
    'Estofaria Imperial Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO TRANSPORTADORA:EXPRESSO SÃO MIGUEL  QUANDO FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1596',
    'MK REVESTIMENTOS E ACABAMENTOS LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '– Quarta Transportadora - Rodonaves  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    'TIPO DE FRETE - FOB 1X NA SEMANA FREQUÊNCIA DE ENVIO – QUARTA TRANSPORTADORA - RODONAVES  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1426',
    'MM COMERCIO DE EQUIPAMENTOS LTDA EPP',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0583',
    'MM DECORAÇÕES E ACABAMENTOS LTDA - ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'TRANPORTADORA: RODONAVES  MODALIDADE DE FRETE: FRETE CIF A COBRAR - CLIENTE PAGA POR PIX METRAGEM: ACIMA DE 4M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. LIGAR PARA ANGELA (GERENTE DA JAMEF) FONE: 8806-6368  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1519',
    'Mobiliarte',
    'FOB',
    NULL,
    NULL,
    NULL,
    'ASSIM QUE FICAR PRONTO TRANSPORTADORA: BAUER PARA FOB',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: SEMPRE FOB FREQUENCIA DE ENVIO: ASSIM QUE FICAR PRONTO TRANSPORTADORA: BAUER PARA FOB'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1875',
    'Mobiliário Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA, QUALQUER DIA, ACIMA DE R$ 2.000,00 TRANSPORTADORA EXPRESSO SÃO MIGUEL  FRETE QUANDO FOB: TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1104',
    'Modernize Persianas e Cortinas Ltda Me',
    'CIF',
    700.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1500',
    'MODESKI IND E COM DE CORTINAS E CONFECCOES LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0568',
    'Monique Genuino Baesso ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1197',
    'L.R. Indústria e Comércio de Cortinas e Bordados',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0362',
    'Solaris Decor Eireli',
    'CIF',
    NULL,
    NULL,
    NULL,
    'Frete CIF 2 vezes por semana, sem valor mínimo ** TENTAR AGRUPAR QUANDO POSSÍVEL - Cliente Flagship  **GRUPO ECONÔMICO** Revenda faz parte do mesmo grupo econômico que C1430 por isso dividem o mesmo acordo de frete',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1430 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    '*** ENVIAR JUNTO COM DF & CO 27/07/2021 - FREQUÊNCIA DE ENVIO: FRETE CIF 2 VEZES POR SEMANA, SEM VALOR MÍNIMO ** TENTAR AGRUPAR QUANDO POSSÍVEL - CLIENTE FLAGSHIP  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1430 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 2X NA SEMANA SEM VALOR MÍNIMO, É PARA AMBAS. E NÃO 2 CIFS PARA CADA.    *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1834',
    'Show Home Decorações e Cortinas Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA, ACIMA R$ 1.500,00 TRANSPORTADORA : RODONAVES QUANDO FRETE FOB: BRASSPRESS ATÉ 2M E RODONAVES PARA TAMANHOS MAIORES (BRENO 25/05 EVO-VITOR)'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0906',
    'Adornare Design e Decoração LTDA',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓSXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL  ----------------------------------------------------------------  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1780',
    'Socrates da Silva Decorações ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEM VALOR MÍNIMO. TRANSPORTADORA: RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0516',
    'F Felizari Cortinas Me',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2x na semana 1 FOB e 1 CIF 1 vez por semana, sem valor mínimo - Cliente Member  Frete CIF e FOB Aceville  --------------------------------------------------------------------------------------  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0418',
    'Gardine Haus Decorações e Presentes LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0738',
    'Temponi & Ucles LTDA- ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TERÇA TRANSPORTADORA: EXPRESSO SÃO MIGUEL *SEMPRE AGRUPAR PEDIDOS PARA NÃO PAGAR FRETE',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, SEM VALOR MÍNIMO  FREQUENCIA DE ENVIO: 1X NA SEMANA TERÇA TRANSPORTADORA: EXPRESSO SÃO MIGUEL *SEMPRE AGRUPAR PEDIDOS PARA NÃO PAGAR FRETE.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1848',
    'E. Trevisani & Bastos Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Transportadora Rodoviário Afonso',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUARTA FEIRA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL   QUANDO FRETE FOB : TRANSPORTADORA RODOVIÁRIO AFONSO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1040',
    'Formato Designer e Decoração Eireli',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1100',
    'Angela Cristina Gomes de Souza  ME',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1223',
    'Marcia Marlene Marczewski',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0075',
    'Jonas Paulo de Souza CIA Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1709',
    'Capri Decor Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    'U EMAIL PARA ADRIANO, REPRESENTANTE E ELITON SOBRE OS ATRASOS FREQUENTES',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO - ENVIO NAS QUARTAS TRANSPORTADORA : EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1677',
    'Bettio Comércio de Móveis LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA (SEM VALOR MINIMO )   **AGRUPAR SEMPRE QUE POSSIVEL**  CIF E FOB -  SÃO MIGUEL.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0053',
    'Carlos Francisco do Nascimento Junior - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    'DE VENDA NOS CARTÕES, IREMOS FATURAR NORMAL EM BOLETO DENTRO DAS CONDIÇÕES DA REVENDA A DIFERENÇA, LÓGICO, SEMPRE RESPEITANDO O LIMITE DA MESMA, PASSANDO, TEMOS QUE COBRAR OUTRA FORMA DE PAGAMENTO, À VISTA, CHEQUE DE CLIENTES, ETC',
    NULL,
    'ativo',
    'CONDIÇÃO DE PAGAMENTO ALTERADA DE ANTECIPADO E LIMITE ZERO, PARA 20/40/60 LIMITE 30K. ELITON. 31/10/2025 - CONSULTA REALIZADA, CONSTAM PEDNÊNCIAS. SCORE 323/1000.  31/10/2025 - ALTERADO LIMITE DE R$ 30.000,00 PARA 50.000,00 (ELITON) 19/11/2025 - CONSULTA REALIZADA, CONSTAM PEDNÊNCIAS 4 PROTESTOS. SCORE 0/1000. (ANEXO) 19/11/2025 - LIMITEALTERADO DE 50K PARA 70K.  ------------------------------------------------------------------------------------------------------------------------  ACORDO FEITO EM 22/11/2017:  1). VAMOS SOLICITAR DUAS MAQUINAS DE CARTÃO PARA DEIXARMOS DISPONÍVEL NA REVENDA. 2). COMPRAS PARCELADAS EM ATÉ 3 X NÃO COBRAREMOS JUROS, PASSANDO DESTE, COBRAR TAXA DE 2,5% APÓS A 3 PARCELA. 3). NOS VALORES REPASSADOS SEMANALMENTE, IREMOS DESCONTAR A TAXA DO CARTÃO E MENSALMENTE O ALUGUEL DAS MÁQUINAS. 4). A REVENDA TAMBÉM PODERÁ MANDAR CHEQUES DE CLIENTES PARA PAGAMENTO DO PEDIDO SEM JUROS DENTRO DO SEU PRAZO MÉDIO DE PAGAMENTO, APÓS ESTE, JUROS DE 2,5%. 5). O RELATÓRIO DAS VENDAS DO CARTÃO, DEVERÃO SER ENVIADOS TODA SEXTA, FECHA O CICLO DE PEDIDOS RETIRADOS NA EMPRESA, SE POR UM A CASO O TOTAL FATURADO SEJA SUPERIOR AO ENVIO DE VENDA NOS CARTÕES, IREMOS FATURAR NORMAL EM BOLETO',
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1693',
    'RV Decor Comércio de Cortinas Eireli',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'U EMAIL PARA ADRIANO, REPRESENTANTE E ELITON, DEVIDO AOS ATRASOS CONSTANTES',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO. TRANSPORTADORA CIF E FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1060',
    'Graziela Gorges Candido',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE BALCÃO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1779',
    'Bilhart Decorações Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Apucarana',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF ACIMA DE R$ 1.500,00, 1X NA SEMANA TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF  FOB - TRANS APUCARANA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1308',
    'Decor Cortinas e Acessórios LTDA',
    'FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1175; C1412 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0367',
    'Beto Persianas e Cortinas Ltda ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1392',
    'Diviart & Decor LTDA',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE AGRUPAR - VERIFICAR PRÓXIMOS 5 DIAS ÚTEIS PARA CIF FRETE SEMPRE CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL   *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1876',
    'SF Rbeirão Artigos para Decorações Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEGUNDA-FEIRA , ACIMA DE R$ 1.500,00 TRANSPORTADORA JAMEF  QUANDO FRETE FOB: TRANSPORTADORA JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1661',
    'KR Sob Medida LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    'TODA QUINTA FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL  ------------------------------------------------------------------- **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0334 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0334 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FRETE FOB 1X POR SEMANA FREQUENCIA DE ENVIO: TODA QUINTA FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL  ------------------------------------------------------------------- **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0334 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1558',
    'Das Haus Cortinas e Persianas LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0223 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0199',
    'José Carlos Livramento ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0651 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    'CONDIÇÃO DE PAGAMENTO 20-30-40-50-60-70 BOL (BLOQUEIO APOS 5 DIAS - TUDO) LIMITE R$ 70.000,00 DURANTE O PERIODO EM QUE TIVERMOS CHEQUES DO CLIENTE, MANTEREMOS O LIMITE MAIOR CLIENTE VAI RETIRAR MERCADORIAS TODA TERÇA E QUINTA DE MANHÃ CEDO - DEIXAR TUDO PRONTO COM NF E MATERIAL SEPARADO ----------------------------------------------------------------- ESTOU EFETIVANDO O PEDIDO ABAIXO, REFERENTE A UMA VENDA DO CARLÃO, COM FATURAMENTO DIRETO - VALOR FINAL R$ 60.000,00 BOLETO EM 4X  CONFORME INSTRUÇÕES DO PEDIDO – 10/10 – 10/11 – 10/12 – 10/01 CUSTO DO PEDIDO PARA CARLÃO: R$ 23.900,00 IMPORTANTE:       TIRAR NF DE ENTREGA FUTURA (HOJE 10/09/18)                                IMPRIMIR OS 4 BOLETO',
    'DIRETO - VALOR FINAL R$ 60.000,00 BOLETO EM 4X  CONFORME INSTRUÇÕES DO PEDIDO – 10/10 – 10/11 – 10/12 – 10/01 CUSTO DO PEDIDO PARA CARLÃO: R$ 23.900,00 IMPORTANTE:       TIRAR NF DE ENTREGA FUTURA (HOJE 10/09/18)                                IMPRIMIR OS 4 BOLETOS DE R$ 15.000,00 (NAS DATAS ACORDADAS) ------------------------------------------------------------------ 19/09/2022 - EMPRESTIMO DE 100K P/ LOJA NOVA. CANCELAMOS 100K EM BOLETO E VAMOS REPARCELAR EM 12X (3 BOLETOS POR MÊS), FICANDO UM'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0069',
    'Com. de Conf. Guerreiro Ltda ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1158',
    'Cortinato Artigos de Decoção LTDA - ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO: C1332, C1751   --------------------------------- FINANCEIRO:  06/02/2018 CONSULTA FEITA NO SERASA, NÃO CONSTA RESTRIÇÃO DT',
    'ativo',
    NULL,
    'FATURAMENTO:  TRANSPORTADORA: RODONAVES  CIF 1X NA SEMANA  TRANSPORTADORA: RODONAVES FOB   __________________________________________________________________  ANÁLISE DO REPRESENTANTE: CLIENTE COM POTENCIAL DE CRESCIMENTO MUITO BOM, TRADICIONAL NA CIDADE. ATUALMENTE TRABALHA COM OUTRO FORNECEDOR MAS QUER SE DESTACAR AINDA MAIS COM NESTE SEGMENTO COM UM PORDUTO DIFERENCIADO. PROPOSTA SERÁ DE TABELA 15% + TABELA PROMOCIONAL. CONDIÇÃO DE PAGAMENTO 28/56 SE NÃO TIVER RESTRIÇÃO. BOOK R$ 970,00 EM 3X '
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1205',
    'Irmãos Niehues LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    'TERÇAS   TRANSPORTADORA: OURO NEGRO  ---------------------------------------------------  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1369',
    'Albach Utilidades e Móveis LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    'Frete CIF 1 vez por semana, sem valor mínimo - Cliente Member 18/01/2021 - alterado transportadora para Reunidas (solicitado Ricardo via email)  **SEMPRE AGRUPAR!!  *Documentos no portal ------------------------------------------------------------------------------------------------',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1119',
    'Compor Detalhes Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO - NAS QUARTAS-FEIRAS TRANSPORTADORA: OURO NEGRO  PEÇAS ENTRE 4 METROS A 5 MESNTRO : TRANSPORTADORA EXPRESSO SÃO MIGUEL   ---------------------------------------------------------------  - REFERENCIA COMERCIAL:  CORTTEX IND TEXTIL: NÃO PASSA REFERENCIA. TEXTIL MENEGHEL:  NÃO PASSA REFERENCIA.    IMPERIO PAPEL DE PAREDE: CLIENTE DESDE MARÇO DE 2016 COMPRA A VISTA OU DEPOSITO ANTECIPADO ULTIMA COMPRA EM AGOSTO DE 2017 NO VALOR DE 776,80 MAIOR COMPRA EM MAIO D'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1336',
    'Free Style Decorações LTDA',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1096',
    'Natan Decorações SF Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'DOS BOOKS, UMA KIT PARA CADA LOJA, O IDEAL É QUE SEJA SEM ÔNUS IMEDIATO',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1095 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1007',
    'Instalamais Decora Instalação e Decoração de Ambientes Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1687',
    'Decorações Marisa LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'agrupar para toda SEGUNDA, inclusive ASSISTÊNCIAS',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0425 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X CIF SEM VALOR MÍNIMO TRANSPORTADORA CIF OU FOB: EXPRESSO SÃO MIGUEL FREQUÊNCIA DE ENVIO: AGRUPAR PARA TODA SEGUNDA, INCLUSIVE ASSISTÊNCIAS.   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0425 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00, É PARA AMBAS. E NÃO 1 CIF ACIMA DE 1.500,00 PARA CADA.  METRAGEM: ACIMA DE 4M SOLICITAR LIBERAÇÃO COM A TRANSPORTADORA. BAUER CONSEGUE LEVAR ATÉ 4M PARA O CENTRO DE CASCAVEL.  -------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1841',
    'MSJL Comércio de Móveis Ltda',
    'CIF_FOB',
    15000.0,
    NULL,
    'VIP Transportes',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA , ACIMA DE R$ 1.5000,00 TRANSPORTADORA: JAMEF -    NÃO ENVIAR PELA RODONAVES QUANDO FRETE FOB: VIPEX'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1855',
    'Halex Costa Silva Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'VIP Transportes',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, ACIMA DE R$ 2.000,00, QUARTA-FEIRA TRANSPORTADORA: VIPEX  COM REDESPACHO EM SÃO PAULO PARA A TRANSPORTADORA COMAM (RUA SANTANA DE IPANEMA GUARULHOS/SP)  FOB - TAMBÉM VIPX  REDESPACHO:  STM  TRANSPORTES RODOVIARIOS LTDA - SPE  RUA SANTANA DE IPANEMA GUARULHOS/SP CNPJ: 04.271.846/0001-17 I.E 127.397.366.115  -----------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1151',
    'VLB da Silva Móveis Eireli - ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '2X NA SEMANA (TERÇA/QUINTA) TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB    **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1062 E C1710 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1062 E C1710 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 2X FRETE CIF SEM VALOR MÍNIMO (AGRUPAR SE POSSÍVEL) FREQUENCIA DE ENVIO: 2X NA SEMANA (TERÇA/QUINTA) TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB    **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1062 E C1710 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 2X NA SEMANA SEM VALOR MÍNIMO, É PARA TODAS. E NÃO 2 CIFS PARA CADA.   ------------------------------------------------------------------------------------- ANALISE REPRESENTANTE: "PARANÁ DECOR QUE'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1887',
    'RCM Administradora de Bens Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO : GRUPO DECORAÇÕES MARISA  ------------------------------ FATURAMENTO  FRETE CIF 1X NA SEMANA, SEGUNDA -FEIRA, SEM VALOR MÍNIMO TRANSPORTADORA CIF OU FOB: EXPRESSO SÃO MIGUEL  FREQUENCIA DE ÊNVIO : AGRUPAR PARA TODA SEGUNDA, INCLUSIVE ASSISTÊNCIAS',
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, SEGUNDA -FEIRA, SEM VALOR MÍNIMO TRANSPORTADORA CIF OU FOB: EXPRESSO SÃO MIGUEL  FREQUENCIA DE ÊNVIO : AGRUPAR PARA TODA SEGUNDA, INCLUSIVE ASSISTÊNCIAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0207',
    'Tela & Decor Comercial Ltda ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);

-- Batch 37/37 (44 registros)
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1796',
    'DP Comercial Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO (C1127)  ------------------------------------- FATURAMENTO  FRETE CIF 1X NA SEMANA, VALOR MÍNIMO R$ 2',
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, VALOR MÍNIMO R$ 2.000,00 TRANSPORTADORA: RODONAVES   FRETE FOB : RODONAVES'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1528',
    'GM Artigos de decoração LTDA',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0414 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0563',
    'Anny comercio de Cortinas LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA  TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB METRAGEM: ACIMA DE 4,5M ENVIAR OS PEDIDOS PELA TRANSPORTADORA RODONAVES T0059 - PRAZO DE ENTREGA 3 DIAS',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, SEM VALOR MÍNIMO. FREQUENCIA DE ENVIO: 1X NA SEMANA  TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB METRAGEM: ACIMA DE 4,5M ENVIAR OS PEDIDOS PELA TRANSPORTADORA RODONAVES T0059 - PRAZO DE ENTREGA 3 DIAS.  *VALOR DE FRETE CIF ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1675',
    'Magnificat Comércio e Manutenção  de Cortinas e Persianas LTDA',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    'Expresso São Miguel',
    'COM A LUCIA HELENA BOGAS FRAGA-ME [C1169]  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1169 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1169 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'FRETE CIF 1X POR SEMANA ACIMA DE R$1.500,00 TRANSPORTADORA CIF: RODONAVES TRANSPORTADORA FOB: RODONAVES **NÃO ENVIAR FOB SEM QUESTIONAR** AGRUPAR ENVIO COM A LUCIA HELENA BOGAS FRAGA-ME [C1169]  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1169 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00, É PARA TODAS. E NÃO 1 CIF ACIMA DE 1.500,00 PARA CADA.  ---------------------------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1084',
    'BGT Comercio de Artigos de Decorações EIRELI',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1690 E C1515 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1643',
    'HF Indorors And Outdoors Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0607 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'TRANSPORTADORA: ACEVILE FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO.  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0607 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE CIF 1X NA SEMANA SEM VALOR MÍNIMO. CIF É PARA AMBAS AS REVENDAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1413',
    'Christine Filgueiras Penido',
    'CIF_FOB',
    1500.0,
    'Expresso São Miguel',
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'CIF 2X POR SEMANA ACIMA DE R$1.500,00 (SEGUNDA E SEXTA) TRANSPORTADORA: CIF E FOB JAMEF -   ANÁLISE REPRESENTANTE: SE TRATA DE UMA LOJA HONTER DOUGLAS QUE DE INÍCIO QUER TRABALHAR COM NOSSOS TRILHOS MOTORIZADOS. É UMA LOJA CONCEITO NA CIDADE DE ITAÚNA QUE FICA A 90 KM DE BH, ÓTIMA ESTRUTURA E MUITO PROCURADA POR CLIENTES E INDICADORES, INCLUSIVE DAS CIDADES VIZINHAS.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1888',
    'Jacqueline Motto dos Santos 02203312947',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF, 1X NA SEMANA, TERÇA-FEIRA TRANSPORTADORA: REUNIDAS  FRETE QUNADO FOB: TRANSPORTADORA EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0264',
    'Decorações Leve Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'CIF 2X NA SEMANA (TERÇA E QUINTA) INDEPENDENTE DO VALOR AGRUPAR SEMPRE QUE POSSÍVEL - CLIENTE FLAGSHIP - 27/07/2021   *QUANDO HOUVER VALOR DE FRETE A COBRAR DO CLIENTE, NÃO ACRESCENTAR ESTE NA NF, ACUMULAR E COBRAR MENSALMENTE EM UM BOLETO SEPARADO APENAS DOS FRETES A COBRAR.*  TRANSPORTADORA EXPRESSO SÃO MIGUEL  --------------------------------------------------------------------------------------------------------------------------------------------------- CLIENTE FOI INFORMADO DE CONFERIR A M'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0789',
    'Ademar Luca',
    'FOB',
    NULL,
    NULL,
    '--------------------------------------------------',
    NULL,
    NULL,
    'ativo',
    NULL,
    'FRETE: CLIENTE LOCAL, RETIRA BALCÃO. SE NECESSÁRIO TRANSPORTADORA: FOB  -------------------------------------------------------------------- *DOCUMENTO NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0478',
    'Casa Matos Eireli - EPP',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1X NA SEMANA TODA SEXTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, PEDIDOS ACIMA DE R$1.500,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TODA SEXTA-FEIRA. TRANSPORTADORA: EXPRESSO SÂO MIGUEL PARA CIF E FOB ~~ AGRUPAR PARA NÃO MANDAR FOB METRAGEM: EMBARQUE DE VOLUMES ATÉ 5M  *VALOR DE FRETE CIF ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1660',
    'B. M. M. Verzutti E M. Kinzkowski Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Bristot',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    '************ EXPEDIÇÃO: CLIENTE COM EMBALAGEM ESPECIAL, DEVIDO A AVARIAS ***************  FRETE CIF 1X NA SEMANA SEM VALOR MÍNIMO. TRANSPORTADORA CIF E FOB: BRISTOT'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1817',
    'Atelier Mari Cortinas Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE NÃO AGRUPAR  CIF ACIMA DE R$2.000,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0893',
    'Daiana Senger ME',
    'CIF_FOB',
    1500.0,
    NULL,
    '--------------------------------------------------',
    'Agrupar os pedidos e enviar 2x semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1858',
    'FJG Decorações Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 1X NA SEMANA, QUARTA-FEIRA, ACIMA DE R$ 1.500,00 TRANSPORTADORA: EXPRESSO SÃO MIGUEL  QUANDO FTERE FOB: TRANSPORTADORA EXPESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0049',
    'Grupo Wog LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    'TERÇA E QUINTA  TRANSPORTADORA: EXPRESSO SÃO MIGUEL  *** ENTREGAS EM CHAPECÓ - ENVIAR QUANDO CLIENTE SOLICITAR - LOCAL DE ENTREGA: AV',
    NULL,
    'ativo',
    NULL,
    '**NÃO MANDAR PEDIDOS DE CONSERTO SOZINHOS - SOMENTE COM PEDIDOS DE VENDA**  26/07/2021 - ALTERADO MODALIDADE DE FRETE PARA CIF 2X NA SEMANA (SEM VALOR MINIMO) - REVENDA SELECT - **AGRUPAR SEMPRE QUE POSSIVEL**  FREQUENCIA DE ENVIO: TERÇA E QUINTA  TRANSPORTADORA: EXPRESSO SÃO MIGUEL  *** ENTREGAS EM CHAPECÓ - ENVIAR QUANDO CLIENTE SOLICITAR - LOCAL DE ENTREGA: AV. PORTO ALEGRE, 765 D CEP 89802-131 – CENTRO - CHAPECÓ/SC ***ANEXO2 ---------------------------------------------------  *DOCUMENTOS NO'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1430',
    'DF & CO Home Decor LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'Frete CIF 2 vezes por semana, sem valor mínimo ** TENTAR AGRUPAR QUANDO POSSÍVEL - Cliente Flagship Transportadora: Expresso São Miguel (CIF e FOB)  Peças maiores de 4m, enviar pela Reunidas',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0362 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    '27/07/2021 - FREQUÊNCIA DE ENVIO: FRETE CIF 2 VEZES POR SEMANA, SEM VALOR MÍNIMO ** TENTAR AGRUPAR QUANDO POSSÍVEL - CLIENTE FLAGSHIP TRANSPORTADORA: EXPRESSO SÃO MIGUEL (CIF E FOB)  PEÇAS MAIORES DE 4M, ENVIAR PELA REUNIDAS.   **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0362 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 2X NA SEMANA SEM VALOR MÍNIMO, É PARA AMBAS. E NÃO 2 CIFS PARA CADA.    ----------------------------------------------------------------  *DOCUMENTOS NO '
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1794',
    'Iamar Pisos e Revestimentos Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X NA SEMANA, SEGUNDA E QUINTA-FEIRA VALOR MÍNIMO R$ 1.500,00 EM 19/05/2026: REVENDA SOLICITOU ALTERAR PARA UM FRETE NA SEMANA (QUINTAS-FEIRAS), MAS SE NECESSÁRIO OUTRAS VEZES NA SEMANA, PERMANECE COM O BENEFÍCIO DOS DOIS FRETES CIF.    TRANSPORTADORA: EXPRESSO SÃO MIGUEL  QUANDO FRETE FOB: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1461',
    'Sonhar Comércio de Artigos para Decoração de Interiores Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0814',
    'Ambiental Cortinas e Decorações Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'ATÉ 15MIL. ACRDADO ENTRE ELITON E KÁTIA 06/03/2018 - CONDIÇÃO ALTERADA NOVAMENTE PARA 10/28/56. 18/11/2024 - CONSULTA REALIZADA, NADA CONSTA. SCORE 833/1000. (ANEXO) 18/11/2024 - LIMITE ALTERADO DE 90K PARA 160K. ________________________________________________________________  ACORDO DE FRETE: TRANSPORTADORA: EXPRESSO SÃO MIGUEL 2 FRETE CIF POR SEMANA SEM VALOR MÍNIMO - AGRUPAR SEMPRE QUE POSSÍVEL*   ________________________________________________________________  02/08/2022 - REVENDA PARTICIP'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0480',
    'Móveis Penha LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA TODA QUINTA-FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL METRAGEM: ACIMA DE 4M VERIFICAR COM A TRANSPORTADORA  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: CIF 1X NA SEMANA SEM VALOR MÍNIMO FREQUENCIA DE ENVIO: 1X NA SEMANA TODA QUINTA-FEIRA TRANSPORTADORA: EXPRESSO SÃO MIGUEL METRAGEM: ACIMA DE 4M VERIFICAR COM A TRANSPORTADORA  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1629',
    'Arte Decorações By Kelly Amaral  LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: JAMEF PARA CIF E FOB - NÃO ENVIAR FOB SEM QUESTIONAR FREQUENCIA: QUINTA-FEIRA. FRETE CIF 1X POR SEMANA SEM VALOR MÍNIMO.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0619',
    'CG Simoni Coda Cortinas EPP',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '1X NA SEMANA TODA SEXTA-FEIRA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, PEDIDOS ACIMA DE R$1.500,00 FREQUENCIA DE ENVIO: 1X NA SEMANA TODA SEXTA-FEIRA. TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB  *VALOR DE FRETE ALTERADO DIA 26/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1420',
    'Alameda Decor Artigos De Decoração LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    'Frete CIF 1 vez por semana, sem valor mínimo - Cliente Pro Design *** -- Expresso   FRETE FOB  -  DISK TENHA Frete FOB acima de 3 metros: Transportadora Brusville  Alterada transportadora solicitado pela revenda 17/03/25  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0660',
    'G.R CONFECCOES LTDA ME',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'FATURAMENTO:  FRETE CIF 1X NA SEMANA SEM VALOR MINIMO (QUINTA-FEIRA) TRASNPORTADORA SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1768',
    'Casa Del Fiore Decorações Ltda - Filial',
    'CIF_FOB',
    NULL,
    NULL,
    'Expresso São Miguel',
    '1x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0794 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'TRANSPORTADORA: JAMEF 26/08/2022 - 1 FRETE CIF NA SEMANA ACIMA DE 1.500 QUANDO FOB - BRASPRESS (ACIMA DE 2M RODONAVES) **AGRUPAR SEMPRE QUE POSSÍVEL  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0794 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. CIF 1X NA SEMANA ACIMA DE 1.500,00 É PARA AMBAS. E NÃO 1 CIF ACIMA DE 1.500,00 PARA CADA.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0282',
    'Delicatesse Tecidos & Decorações Ltda',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA CIF E FOB: EXPRESSO SÃO MIGUEL CIF 1X POR SEMANA SEM VALOR MÍNIMO.'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0291',
    'Pattelon Palacio dos Tecidos',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'Sexta-feira   *Valor de CIF alterado dia 29/08/2022 conforme solicitação do Adriano  29/09/2025: Alterado Transportadra Conforme solcitado por e-mail',
    NULL,
    'ativo',
    NULL,
    'TRANSPORTADORA: ESPRESSO SÃO MIGUEL  PARA CIF E FOB MODALIDADE DE FRETE: CIF 1X NA SEMANA, SEM VALOR MÍNIMO FREQUÊNCIA DE ENVIO: SEXTA-FEIRA   *VALOR DE CIF ALTERADO DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  29/09/2025: ALTERADO TRANSPORTADRA CONFORME SOLCITADO POR E-MAIL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0868',
    'Gisa Casa e Cortina Decorações EIRELI',
    'CIF_FOB',
    2000.0,
    NULL,
    NULL,
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0061',
    'Josiane Stoeberl - ME',
    'CIF_FOB',
    1500.0,
    NULL,
    NULL,
    '- Sempre que estiver pronto Transportadora - Disck & tenha CIF e FOB  *Envio todos os dias solicitado em 03/10/2025*  -----------------------------------------------------------  *Documentos no portal',
    NULL,
    'ativo',
    NULL,
    '. (PRICILA FÉRIAS) 21/07/2020 - CONSULTA REALIZADA. CONSTA PROTESTO. (ANEXO) 14/02/2022 - CONSULTA REALIZADA, CONSTAM PENDENCIAS. SCORE 0/1000. (ANEXO) 22/06/2022 - CONSULTA REALIZADA, CONSTAM PENDENCIAS. SCORE 0/1000. (ANEXO) 20/09/2022 - CONSULTA REALIZADA, CONSTAM PENDENCIAS. SCORE 0/1000. (ANEXO)   ---------------------------------------------------------- ACORDO DE FRETE  MODALIDADE DE FRETE - 1X CIF ACIMA DE R$ 1.500,00 FREQUÊNCIA DE ENVIO - SEMPRE QUE ESTIVER PRONTO TRANSPORTADORA - DISCK'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0435',
    'Ideale Decor Ltda',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1598 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    'MODALIDADE DE FRETE:FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL METRAGEM: EMBARQUE DE VOLUMES ATÉ 5M  METROS  **GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1598 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE. SEMPRE FOB FOB É PARA TODAS AS REVENDAS   ------------------------------------------------------------------------------------------------------------------------------------------------------  COMERCIAL  CLIENTE REALIZOU TREINAMENTO DE SKYWINDOWS MOTORIZADAS DIA 24/05/2022  NEG'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1332',
    'Cortinato Cortinas e Persianas LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '1x por semana',
    'GRUPO ECONÔMICO: C1158 E C1751 -------------------------------------------- FINACEIRO   22/03/2024 -  CONSULTA REALIZADA, NADA COSNTA',
    'ativo',
    NULL,
    'TRANSPORTADORA: RODONAVES  CIF 1X NA SEMANA'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1483',
    'JPS Comércio de Produtos de Decoração LTDA',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C0093; C0783; C1682 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1890',
    'La Casa Bella Ltda',
    'CIF_FOB',
    2000.0,
    NULL,
    'Expresso São Miguel',
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF, 2X NA SEMANA, QUALQUER DIA DA SEMANA, ACIMA DE R$ 2.000,00 TRANSPORTADORA : PESQUISAR  QUANDO FRETE FOB: TRANSPORTADORA REUNIDAS'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0930',
    'Ind. e Com. de Confecções Newness',
    'CIF',
    2000.0,
    NULL,
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1869',
    'Costume Artigos Texteis LTDA',
    'CIF',
    2000.0,
    'Expresso São Miguel',
    NULL,
    NULL,
    NULL,
    'ativo',
    NULL,
    'CLIENTE NA NOVA MODALIDADE DE FRETE RS  AGRUPAR FRETE FRETE SEMPRE CIF ACIMA DE R$2.000,00  TRANSPORTADORA CIF: EXPRESSO SÃO MIGUEL TRANSPORTADORA: P/ FRETE FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0737',
    'Guess Decoracoes LTDA-ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    '1X NA SEMANA',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF SEM VALOR MÍNIMO.  FREQUENCIA DE ENVIO: 1X NA SEMANA. TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E FOB  *VALOR DE CIF ALTERADO DIA 29/08/2022 CONFORME SOLICITAÇÃO DO ADRIANO  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1095',
    'Natan Oceanica Icarai Decorações LTDA ME',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'DOS BOOKS, UMA KIT PARA CADA LOJA, O IDEAL É QUE SEJA SEM ÔNUS IMEDIATO',
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1095 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0685',
    'Lutaiff Fernandes Comércio de Cortinas Eireli - ME',
    'FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO** REVENDA FAZ PARTE DO MESMO GRUPO ECONÔMICO QUE C1585 E C1634 POR ISSO DIVIDEM O MESMO ACORDO DE FRETE',
    'ativo',
    NULL,
    NULL
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1551',
    'Ribeiro e Oliveira Cortinas LTDA',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    'ASSIM QUE POSSÍVEL TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E SÃO MIGUEL PARA FOB *SÓ ENVIAR RODONAVES SE FOR A ÚNICA OPÇÃO  ----------------------------------------------------------------------------------- COMERCIAL:  CATEGORIA ALTERADA PARA MEMBER EM 02/09/2022 - TERMO ANEXO NO PORTAL REALIZOU TREINAMENTO DE MOTORIZAÇÃO DIA 06/09/2022  *DOCUMENTOS NO PORTAL',
    NULL,
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF SEM VALOR MÍNIMO FREQUENCIA DE ENVIO: ASSIM QUE POSSÍVEL TRANSPORTADORA: EXPRESSO SÃO MIGUEL PARA CIF E SÃO MIGUEL PARA FOB *SÓ ENVIAR RODONAVES SE FOR A ÚNICA OPÇÃO  ----------------------------------------------------------------------------------- COMERCIAL:  CATEGORIA ALTERADA PARA MEMBER EM 02/09/2022 - TERMO ANEXO NO PORTAL REALIZOU TREINAMENTO DE MOTORIZAÇÃO DIA 06/09/2022  *DOCUMENTOS NO PORTAL'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1731',
    'CFAT Arq Comércio e Serviços Ltda',
    'CIF',
    NULL,
    NULL,
    NULL,
    '2x por semana',
    NULL,
    'ativo',
    NULL,
    'FRETE CIF 2X POR SEMANA, SEM VALOR MÍNIMO - REVENDA SELECT TRANSPORTADORA: JAMEF.  MOBILE PARA PEÇAS MAIORES DE 3M'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C0788',
    'Cortiart Cortinas LTDA',
    'CIF_FOB',
    NULL,
    'Expresso São Miguel',
    'Expresso São Miguel',
    '1x por semana',
    NULL,
    'ativo',
    NULL,
    'CIF 1X NA SEMANA S/ VALOR MÍNIMO TRANSPORTADORA CIF: REUNIDAS FRETE FOB: EXPRESSO OU ACEVILLE  ------------------------------------------------------------------------  ACORDO DE FRETE:  *** CLIENTE RETIRA MATERIAL (EMABALADO) NO BALCÃO *  -----------------------------------------------------------------'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1813',
    'Confecções Siqueira Ltda',
    'CIF_FOB',
    1500.0,
    NULL,
    'Expresso São Miguel',
    'DOS CHEQUES, ELES VAO COMEÇAR A ENVIAR OS CHEQUES E ISSO FICARÁ COMO UMA ESPÉCIE DE CRÉDITO, AI OS PEDIDOS QUE ENTRAREM VAMOS CONCILIANDO, A E SE NAO TIVER MAIS CREDITO , TEM PEDIDO E A CONDIÇÃO DE PGTO É CHEQUE, ELE TEM UM PRAZO DE 15 DIAS PARA ENVIO',
    'GRUPO ECONÔMICO: GRUPO ALEXANDRE DINIZ (C1813 E C1163) 11/02/2026 APÓS REUNIÃO COM ELIRON FICOU DEFINIDO: LIMITE DELES ALTERAR DE 100K PARA 200KENVIO DOS CHEQUES, ELES VAO COMEÇAR A ENVIAR OS CHEQUES E ISSO FICARÁ COMO UMA ESPÉCIE DE CRÉDITO, AI OS PEDIDOS QUE ENTRAREM VAMOS CONCILIANDO, A E SE NAO TIVER MAIS CREDITO , TEM PEDIDO E A CONDIÇÃO DE PGTO É CHEQUE, ELE TEM UM PRAZO DE 15 DIAS PARA ENVIO',
    'ativo',
    NULL,
    'FRETE CIF 2 X NA SEMANA ACIMA DE R$ 1.500,00 (TERÇA-FERIRA E QUINTA-FEIRA) TRANSPORTADORA: JAMEF  FRETE FOB: TRANSPORTADORA JAMEF'
);
INSERT INTO public.faturamento_regras (
    codigo_cliente, 
    nome_cliente, 
    modalidade_frete, 
    valor_minimo_frete, 
    transportadora_cif, 
    transportadora_fob, 
    frequencia_envio, 
    grupo_economico, 
    status, 
    condicao_pagamento,
    observacoes
) VALUES (
    'C1765',
    'C F Casimiro Ltda',
    'CIF_FOB',
    NULL,
    NULL,
    NULL,
    NULL,
    'GRUPO ECONÔMICO C1041 - E',
    'ativo',
    NULL,
    'MODALIDADE DE FRETE: 1X FRETE CIF, SEM VALOR MÍNIMO  *SEMPRE AGRUPAR PEDIDOS PARA UTILIZAR FRETE CIF, CLIENTE NÃO QUER PAGAR FOB TRANSPORTADORA: EXPRESSO SÃO MIGUEL   *ACIMA DE 3M, USAR A RODONAVES *SE TIVER QUE ENVIAR FOB, TAMBÉM ENVIAR EXPRESSO SÃO MIGUEL (INFORMAÇÃO PASSADA PELO REPRESENTANTE CLEBERSON DIA 28/07/2026 WHATSAPP, POIS A ALFA TRANSPORTES COBROU FRETE MUITO CARO).'
);

COMMIT;

-- Verificação
SELECT COUNT(*) as total_registros FROM public.faturamento_regras;