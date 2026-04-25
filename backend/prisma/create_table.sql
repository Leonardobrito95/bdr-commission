CREATE TABLE IF NOT EXISTS public.commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contrato     VARCHAR(50)    NOT NULL,
  nome_cliente    VARCHAR(200)   NOT NULL,
  vendedor        VARCHAR(100)   NOT NULL,
  tipo_negociacao VARCHAR(20)    NOT NULL CHECK (tipo_negociacao IN ('Upgrade', 'Downgrade', 'Refidelizacao')),
  valor_atual     DECIMAL(10,2)  NOT NULL,
  valor_novo      DECIMAL(10,2),
  valor_comissao  DECIMAL(10,2)  NOT NULL,
  data_registro   TIMESTAMP      NOT NULL DEFAULT NOW()
);
