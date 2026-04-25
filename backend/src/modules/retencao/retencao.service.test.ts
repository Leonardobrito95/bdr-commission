import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock do repositório ───────────────────────────────────────────────────────
vi.mock('./retencao.repository', () => ({
  fetchRetencao:         vi.fn(),
  fetchRetencaoDetalhe:  vi.fn(() => Promise.resolve([])),
  getComissaoRetencao:   vi.fn((qtd: number) => {
    if (qtd >= 110) return 750;
    if (qtd >= 90)  return 550;
    if (qtd >= 70)  return 400;
    return 0;
  }),
}));

import * as repo from './retencao.repository';
import { getRetencao } from './retencao.service';

// Helpers
type Operador = {
  nome_operador:   string;
  qtd_tratadas:    number;
  qtd_retidas:     number;
  qtd_nao_retidas: number;
  pct_reversao:    number;
  comissao:        number;
  faixa:           string;
};

function makeOp(nome: string, retidas: number, tratadas: number): Operador {
  return {
    nome_operador:   nome,
    qtd_tratadas:    tratadas,
    qtd_retidas:     retidas,
    qtd_nao_retidas: tratadas - retidas,
    pct_reversao:    tratadas > 0 ? Math.round((retidas / tratadas) * 1000) / 10 : 0,
    comissao:        retidas >= 110 ? 750 : retidas >= 90 ? 550 : retidas >= 70 ? 400 : 0,
    faixa:           retidas >= 110 ? 'Ouro' : retidas >= 90 ? 'Prata' : retidas >= 70 ? 'Bronze' : 'Sem meta',
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('getRetencao — KPIs agregados', () => {
  beforeEach(() => {
    vi.mocked(repo.fetchRetencao).mockResolvedValue([
      makeOp('Alice', 120, 150),  // Ouro
      makeOp('Bob',   90,  120),  // Prata
      makeOp('Carol', 65,  100),  // Sem meta
    ]);
  });

  it('soma corretamente totalTratadas', async () => {
    const { kpis } = await getRetencao('gestor', 'Gestor', {});
    expect(kpis.totalTratadas).toBe(370);   // 150 + 120 + 100
  });

  it('soma corretamente totalRetidas', async () => {
    const { kpis } = await getRetencao('gestor', 'Gestor', {});
    expect(kpis.totalRetidas).toBe(275);    // 120 + 90 + 65
  });

  it('calcula pctReversaoGeral corretamente', async () => {
    const { kpis } = await getRetencao('gestor', 'Gestor', {});
    // (275 / 370) × 100 ≈ 74.3%
    expect(kpis.pctReversaoGeral).toBeCloseTo(74.3, 1);
  });

  it('conta apenas operadores com comissão > 0 em operadoresNaMeta', async () => {
    const { kpis } = await getRetencao('gestor', 'Gestor', {});
    expect(kpis.operadoresNaMeta).toBe(2);  // Alice (Ouro) + Bob (Prata); Carol sem meta
  });

  it('soma corretamente totalComissoes', async () => {
    const { kpis } = await getRetencao('gestor', 'Gestor', {});
    expect(kpis.totalComissoes).toBe(1300);  // 750 + 550 + 0
  });
});

describe('getRetencao — pctReversaoGeral com zero tratadas', () => {
  it('retorna 0 quando não há registros', async () => {
    vi.mocked(repo.fetchRetencao).mockResolvedValue([]);
    const { kpis } = await getRetencao('gestor', 'Gestor', {});
    expect(kpis.pctReversaoGeral).toBe(0);
  });
});

describe('getRetencao — controle de acesso por perfil', () => {
  beforeEach(() => {
    vi.mocked(repo.fetchRetencao).mockResolvedValue([makeOp('Alice', 80, 100)]);
  });

  it('consultor recebe filtro pelo próprio nome', async () => {
    await getRetencao('consultor', 'Alice', {});
    expect(repo.fetchRetencao).toHaveBeenCalledWith(
      expect.objectContaining({ operadorNome: 'Alice' })
    );
  });

  it('gestor sem filtro de operador recebe undefined', async () => {
    await getRetencao('gestor', 'Gestor', {});
    expect(repo.fetchRetencao).toHaveBeenCalledWith(
      expect.objectContaining({ operadorNome: undefined })
    );
  });

  it('gestor com filtro de operador recebe o nome especificado', async () => {
    await getRetencao('gestor', 'Gestor', { operador: 'Bob' });
    expect(repo.fetchRetencao).toHaveBeenCalledWith(
      expect.objectContaining({ operadorNome: 'Bob' })
    );
  });

  it('cs sem filtro recebe undefined (acesso total ao setor)', async () => {
    await getRetencao('cs', 'CS User', {});
    expect(repo.fetchRetencao).toHaveBeenCalledWith(
      expect.objectContaining({ operadorNome: undefined })
    );
  });
});

describe('getRetencao — faixas de bônus', () => {
  it('operador com 110+ retenções tem comissão Ouro (R$ 750)', async () => {
    vi.mocked(repo.fetchRetencao).mockResolvedValue([makeOp('Alice', 110, 130)]);
    const { operadores } = await getRetencao('gestor', 'Gestor', {});
    expect(operadores[0].comissao).toBe(750);
    expect(operadores[0].faixa).toBe('Ouro');
  });

  it('operador com 90-109 retenções tem comissão Prata (R$ 550)', async () => {
    vi.mocked(repo.fetchRetencao).mockResolvedValue([makeOp('Bob', 95, 120)]);
    const { operadores } = await getRetencao('gestor', 'Gestor', {});
    expect(operadores[0].comissao).toBe(550);
    expect(operadores[0].faixa).toBe('Prata');
  });

  it('operador com 70-89 retenções tem comissão Bronze (R$ 400)', async () => {
    vi.mocked(repo.fetchRetencao).mockResolvedValue([makeOp('Carol', 75, 100)]);
    const { operadores } = await getRetencao('gestor', 'Gestor', {});
    expect(operadores[0].comissao).toBe(400);
    expect(operadores[0].faixa).toBe('Bronze');
  });

  it('operador com menos de 70 retenções não recebe comissão', async () => {
    vi.mocked(repo.fetchRetencao).mockResolvedValue([makeOp('Dave', 60, 100)]);
    const { operadores } = await getRetencao('gestor', 'Gestor', {});
    expect(operadores[0].comissao).toBe(0);
  });
});
