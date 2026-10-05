ALTER TABLE public.tecidos_sem_espaco
  ALTER COLUMN estrutura DROP NOT NULL,
  ALTER COLUMN coluna DROP NOT NULL,
  ALTER COLUMN nivel DROP NOT NULL,
  ALTER COLUMN endereco_desejado DROP NOT NULL;