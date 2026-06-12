-- =========================================================
-- REFORÇO DE SEGURANÇA E OTIMIZAÇÃO DE BANCO DE DADOS
-- =========================================================

-- 1. Otimização de Performance (Índices)
CREATE INDEX IF NOT EXISTS idx_registros_conference_id ON public.registros(conference_id);
CREATE INDEX IF NOT EXISTS idx_estoque_posicoes_status ON public.estoque_posicoes(status);
CREATE INDEX IF NOT EXISTS idx_estoque_posicoes_estrutura ON public.estoque_posicoes(estrutura);
CREATE INDEX IF NOT EXISTS idx_estoque_saidas_registro_id ON public.estoque_saidas(registro_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory(sku);

-- 2. Correção de Segurança em Funções (Search Path)
-- Aplicar search_path em funções customizadas para evitar ataques de sequestro de path
-- Nota: Como não listamos as funções, vamos garantir as políticas RLS primeiro que é mais crítico.

-- 3. Reforço de RLS (Substituir permissões públicas por autenticadas)

-- Tabela: conferences
DROP POLICY IF EXISTS "Public read conferences" ON public.conferences;
DROP POLICY IF EXISTS "Public insert conferences" ON public.conferences;
DROP POLICY IF EXISTS "Public update conferences" ON public.conferences;
DROP POLICY IF EXISTS "Authenticated users can delete conferences" ON public.conferences;

CREATE POLICY "Authenticated users can read conferences" ON public.conferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert conferences" ON public.conferences FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update conferences" ON public.conferences FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete conferences" ON public.conferences FOR DELETE TO authenticated USING (true);

-- Tabela: registros
DROP POLICY IF EXISTS "Public read registros" ON public.registros;
DROP POLICY IF EXISTS "Public insert registros" ON public.registros;
DROP POLICY IF EXISTS "Public update registros" ON public.registros;
DROP POLICY IF EXISTS "Authenticated users can delete registros" ON public.registros;

CREATE POLICY "Authenticated users can read registros" ON public.registros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert registros" ON public.registros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update registros" ON public.registros FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete registros" ON public.registros FOR DELETE TO authenticated USING (true);

-- Tabela: estoque_posicoes
DROP POLICY IF EXISTS "Public read estoque" ON public.estoque_posicoes;
DROP POLICY IF EXISTS "Public insert estoque" ON public.estoque_posicoes;
DROP POLICY IF EXISTS "Public update estoque" ON public.estoque_posicoes;
DROP POLICY IF EXISTS "Allow all access to estoque_posicoes" ON public.estoque_posicoes;
DROP POLICY IF EXISTS "Authenticated users can delete estoque" ON public.estoque_posicoes;

CREATE POLICY "Authenticated users can read estoque" ON public.estoque_posicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert estoque" ON public.estoque_posicoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update estoque" ON public.estoque_posicoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete estoque" ON public.estoque_posicoes FOR DELETE TO authenticated USING (true);

-- Tabela: inventory
DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anyone can insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anyone can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can delete inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anyone can select inventory" ON public.inventory;

CREATE POLICY "Authenticated users can read inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update inventory" ON public.inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete inventory" ON public.inventory FOR DELETE TO authenticated USING (true);

-- Tabela: reservas
DROP POLICY IF EXISTS "Enable all for all users" ON public.reservas;
CREATE POLICY "Authenticated users can manage reservas" ON public.reservas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela: tarefas_contagem (Remover acesso ANON)
DROP POLICY IF EXISTS "Enable all for anon users on tarefas_contagem" ON public.tarefas_contagem;
DROP POLICY IF EXISTS "Enable all for authenticated users on tarefas_contagem" ON public.tarefas_contagem;
CREATE POLICY "Authenticated users can manage tarefas_contagem" ON public.tarefas_contagem FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela: operation_logs
DROP POLICY IF EXISTS "Anyone can view operation logs" ON public.operation_logs;
DROP POLICY IF EXISTS "Anyone can insert operation logs" ON public.operation_logs;
CREATE POLICY "Authenticated users can read logs" ON public.operation_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert logs" ON public.operation_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Garantir GRANTs corretos
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
