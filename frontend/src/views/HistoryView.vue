<template>
  <div class="view-history">
    <!-- Header -->
    <div class="history-header">
      <div class="history-title-group">
        <h1 class="history-title">Histórico de Comissões</h1>
        <p class="history-sub">{{ filtered.length }} registro{{ filtered.length !== 1 ? 's' : '' }} encontrado{{ filtered.length !== 1 ? 's' : '' }}</p>
      </div>
      <button class="btn-refresh" @click="load">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11.5 6.5A5 5 0 1 1 6.5 1.5M6.5 1.5L9 4M6.5 1.5L4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Atualizar
      </button>
    </div>

    <!-- Summary cards -->
    <div class="summary-row">
      <div class="summary-card">
        <span class="sc-label">Total de Registros</span>
        <span class="sc-value">{{ filtered.length }}</span>
      </div>
      <div class="summary-card">
        <span class="sc-label">Total em Comissões</span>
        <span class="sc-value amber">{{ formatCurrency(totalComissao) }}</span>
      </div>
      <div class="summary-card">
        <span class="sc-label">Upgrades no Período</span>
        <span class="sc-value">{{ upgradeCount }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Data Inicial</label>
        <input type="date" v-model="filters.dateFrom" />
      </div>
      <div class="filter-group">
        <label class="filter-label">Data Final</label>
        <input type="date" v-model="filters.dateTo" />
      </div>
      <div v-if="isGestor" class="filter-group">
        <label class="filter-label">Consultor</label>
        <select v-model="filters.vendedor">
          <option value="">Todos</option>
          <option v-for="v in vendedores" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Tipo</label>
        <select v-model="filters.tipo">
          <option value="">Todos</option>
          <option value="Upgrade">Upgrade</option>
          <option value="Downgrade">Downgrade</option>
          <option value="Refidelizacao">Refidelização</option>
        </select>
      </div>
      <button class="btn-filter-clear" @click="clearFilters">Limpar filtros</button>
    </div>

    <!-- Table -->
    <div v-if="loading" class="state-msg">Carregando registros...</div>
    <div v-else-if="filtered.length === 0" class="state-msg">Nenhum registro encontrado para os filtros selecionados.</div>

    <template v-else>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Contrato</th>
            <th>Cliente</th>
            <th>Consultor</th>
            <th>Tipo</th>
            <th>Valor Atual</th>
            <th>Valor Novo</th>
            <th>Comissão</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in paginated" :key="c.id">
            <td class="td-date">{{ formatDate(c.data_registro) }}</td>
            <td class="td-mono">{{ c.id_contrato }}</td>
            <td>{{ c.nome_cliente }}</td>
            <td>{{ c.vendedor }}</td>
            <td>
              <span :class="['type-tag', c.tipo_negociacao.toLowerCase()]">{{ c.tipo_negociacao }}</span>
            </td>
            <td class="td-amount">{{ formatCurrency(c.valor_atual) }}</td>
            <td class="td-amount">{{ c.valor_novo ? formatCurrency(c.valor_novo) : '—' }}</td>
            <td class="td-commission">{{ formatCurrency(c.valor_comissao) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button class="pg-btn" @click="page = 1"          :disabled="page === 1">«</button>
      <button class="pg-btn" @click="page--"             :disabled="page === 1">‹</button>
      <span class="pg-info">
        Página <strong>{{ page }}</strong> de <strong>{{ totalPages }}</strong>
        <span class="pg-count"> — {{ filtered.length }} registros</span>
      </span>
      <button class="pg-btn" @click="page++"             :disabled="page >= totalPages">›</button>
      <button class="pg-btn" @click="page = totalPages"  :disabled="page >= totalPages">»</button>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { bdrApi, type Commission } from '../services/api';
import { useAuth } from '../composables/useAuth';
import { currentMonthRange } from '../composables/useDateRange';

const { isGestor } = useAuth();

const props = defineProps<{ refresh: number }>();
watch(() => props.refresh, load);

const commissions = ref<Commission[]>([]);
const loading = ref(false);

const filters = ref({ ...currentMonthRange(), vendedor: '', tipo: '' });

// ── Pagination ────────────────────────────────────────────────────────────────
const page      = ref(1);
const PAGE_SIZE = 50;

const vendedores = computed(() => [...new Set(commissions.value.map(c => c.vendedor))].sort());

const filtered = computed(() => {
  return commissions.value.filter(c => {
    const date = new Date(c.data_registro);
    if (filters.value.dateFrom && date < new Date(filters.value.dateFrom + 'T00:00:00')) return false;
    if (filters.value.dateTo   && date > new Date(filters.value.dateTo   + 'T23:59:59')) return false;
    if (filters.value.vendedor && c.vendedor !== filters.value.vendedor) return false;
    if (filters.value.tipo     && c.tipo_negociacao !== filters.value.tipo) return false;
    return true;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));
const paginated  = computed(() => {
  const s = (page.value - 1) * PAGE_SIZE;
  return filtered.value.slice(s, s + PAGE_SIZE);
});

watch(filtered, () => { page.value = 1; });

const totalComissao = computed(() =>
  filtered.value.reduce((sum, c) => sum + Number(c.valor_comissao), 0)
);

const upgradeCount = computed(() =>
  filtered.value.filter(c => c.tipo_negociacao === 'Upgrade').length
);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    commissions.value = await bdrApi.listCommissions();
  } finally {
    loading.value = false;
  }
}

function clearFilters() {
  filters.value = { ...currentMonthRange(), vendedor: '', tipo: '' };
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.pagination { display:flex; align-items:center; justify-content:center; gap:.5rem; padding:.9rem 0 .25rem; }
.pg-btn { background:var(--surface-2); border:1px solid var(--border); color:var(--text-2); border-radius:var(--radius-sm); width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:.9rem; transition:all var(--transition); }
.pg-btn:hover:not(:disabled){ color:var(--accent); border-color:var(--accent); }
.pg-btn:disabled { opacity:.3; cursor:not-allowed; }
.pg-info { font-size:.8rem; color:var(--text-2); padding:0 .5rem; }
.pg-info strong { color:var(--text); }
.pg-count { color:var(--text-3); }
</style>
