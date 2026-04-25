<template>
  <div class="hub-view">
    <!-- Header: título + filtro + busca em linha -->
    <div class="hub-topbar">
      <div class="hub-title-block">
        <h1 class="view-title">Dashboards Gestão</h1>
        <p class="view-sub">Selecione um painel para visualizar.</p>
      </div>

      <div class="hub-controls">
        <!-- Filtro de setor (dropdown) -->
        <div class="filter-select-wrap">
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none" class="filter-icon"><path d="M1 3h13M3 7h9M6 11h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <select v-model="selectedSector" class="filter-select">
            <option :value="null">Todos os setores ({{ filteredBySearch.length }})</option>
            <option v-for="s in sectors" :key="s.id" :value="s.id">
              {{ s.name }} ({{ dashboardsBySector(s.id).length }})
            </option>
          </select>
          <svg width="11" height="11" viewBox="0 0 15 15" fill="none" class="select-chevron"><path d="M3 5l4.5 5L12 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        <!-- Busca -->
        <div class="hub-search-wrap">
          <svg width="13" height="13" viewBox="0 0 15 15" fill="none" class="search-icon"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input v-model="search" type="text" placeholder="Buscar..." class="hub-search" />
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="dash-grid">
      <div v-for="i in 6" :key="i" class="dash-card skeleton">
        <div class="skel-thumb"></div>
        <div class="skel-body">
          <div class="skel-line w70"></div>
          <div class="skel-line w40"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredDashboards.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 15 15" fill="none" opacity=".25"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>
      <p>Nenhum dashboard disponível</p>
      <span v-if="search">para a busca <em>"{{ search }}"</em></span>
    </div>

    <!-- Dashboard grid -->
    <div v-else class="dash-grid">
      <button
        v-for="d in filteredDashboards"
        :key="d.id"
        class="dash-card"
        @click="openDashboard(d)"
      >
        <!-- Thumbnail -->
        <div class="dash-thumb" :style="d.thumbnail_url ? `background-image: url(${d.thumbnail_url})` : ''">
          <div v-if="!d.thumbnail_url" class="dash-thumb-placeholder">
            <svg width="32" height="32" viewBox="0 0 15 15" fill="none" opacity=".3"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>
          </div>
          <!-- Status overlay -->
          <div v-if="d.status !== 'active'" :class="['dash-status-overlay', d.status]">
            {{ d.status === 'maintenance' ? 'Manutenção' : 'Erro' }}
          </div>
        </div>

        <!-- Card body -->
        <div class="dash-body">
          <div class="dash-meta">
            <span class="dash-type-tag" :class="d.type">
              {{ d.type === 'powerbi' ? 'Power BI' : d.type === 'internal' ? 'Interno' : 'Link' }}
            </span>
            <span
              v-if="d.sector"
              class="dash-sector-tag"
              :style="`color: ${d.sector.color}; background: ${d.sector.color}18; border-color: ${d.sector.color}44`"
            >
              {{ d.sector.name }}
            </span>
          </div>
          <h3 class="dash-title">{{ d.title }}</h3>
          <p v-if="d.description" class="dash-description">{{ d.description }}</p>
          <div class="dash-footer">
            <span :class="['dash-status-pill', d.status]">{{ statusLabel(d.status) }}</span>
            <span class="dash-embed-hint">
              {{ d.embed_mode === 'iframe' ? '⊞ Incorporado' : '↗ Nova aba' }}
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { getSectors, getDashboards, logDashboardView } from '../../services/hubApi';
import type { HubSector, HubDashboard } from '../../services/hubApi';

const props = defineProps<{ refresh: number }>();
const emit  = defineEmits<{ (e: 'open-viewer', d: HubDashboard): void }>();

const sectors        = ref<HubSector[]>([]);
const dashboards     = ref<HubDashboard[]>([]);
const selectedSector = ref<string | null>(null);
const search         = ref('');
const loading        = ref(true);

async function load() {
  loading.value = true;
  try {
    [sectors.value, dashboards.value] = await Promise.all([getSectors(), getDashboards()]);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.refresh, load);

function dashboardsBySector(sectorId: string) {
  return dashboards.value.filter(d =>
    d.sector_id === sectorId ||
    d.sharedSectors?.some(s => s.sector_id === sectorId),
  );
}

const filteredBySearch = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return dashboards.value;
  return dashboards.value.filter(d => d.title.toLowerCase().includes(q));
});

const filteredDashboards = computed(() => {
  if (!selectedSector.value) return filteredBySearch.value;
  return filteredBySearch.value.filter(d =>
    d.sector_id === selectedSector.value ||
    d.sharedSectors?.some(s => s.sector_id === selectedSector.value),
  );
});

function statusLabel(s: string) {
  return s === 'active' ? 'Ativo' : s === 'maintenance' ? 'Manutenção' : 'Erro';
}

async function openDashboard(d: HubDashboard) {
  logDashboardView(d.id);
  if (d.embed_mode === 'newtab' || d.type === 'link') {
    window.open(d.url, '_blank');
  } else {
    emit('open-viewer', d);
  }
}
</script>

<style scoped>
.hub-view { display: flex; flex-direction: column; gap: 1.25rem; }

/* Topbar: título + controles em linha */
.hub-topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.hub-title-block { flex-shrink: 0; }
.hub-controls {
  display: flex;
  align-items: center;
  gap: .6rem;
  flex-wrap: wrap;
}

/* Filtro dropdown */
.filter-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.filter-icon {
  position: absolute;
  left: .7rem;
  color: var(--text-3);
  pointer-events: none;
  z-index: 1;
}
.select-chevron {
  position: absolute;
  right: .7rem;
  color: var(--text-3);
  pointer-events: none;
}
.filter-select {
  appearance: none;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-2);
  border-radius: var(--radius);
  padding: .45rem 2rem .45rem 2rem;
  font-size: .82rem;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all var(--transition);
  min-width: 200px;
}
.filter-select:hover, .filter-select:focus {
  border-color: var(--border-2);
  color: var(--text);
  outline: none;
}

/* Busca */
.hub-search-wrap {
  position: relative;
}
.search-icon {
  position: absolute;
  left: .75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}
.hub-search {
  padding-left: 2.2rem !important;
  font-size: .82rem !important;
  width: 180px;
}

.tab-count {
  font-family: var(--font-mono);
  font-size: .68rem;
  color: var(--text-3);
  background: var(--surface-3);
  border-radius: 10px;
  padding: .05rem .35rem;
}

/* Grid */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

/* Card */
.dash-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition: border-color var(--transition), transform var(--transition), box-shadow var(--transition);
  display: flex;
  flex-direction: column;
  padding: 0;
  font-family: var(--font-body);
}
.dash-card:hover {
  border-color: var(--border-2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
}

/* Thumbnail */
.dash-thumb {
  height: 140px;
  background: var(--surface-2);
  background-size: cover;
  background-position: center;
  position: relative;
  flex-shrink: 0;
}
.dash-thumb-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-3);
}
.dash-status-overlay {
  position: absolute;
  bottom: .5rem; left: .5rem;
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: .2rem .5rem;
  border-radius: 3px;
}
.dash-status-overlay.maintenance {
  background: rgba(234,179,8,.15);
  color: #eab308;
  border: 1px solid rgba(234,179,8,.3);
}
.dash-status-overlay.error {
  background: var(--error-bg);
  color: var(--error);
  border: 1px solid rgba(255,42,95,.3);
}

/* Card body */
.dash-body { padding: .85rem 1rem; display: flex; flex-direction: column; gap: .5rem; flex: 1; }

.dash-meta { display: flex; gap: .4rem; flex-wrap: wrap; align-items: center; }
.dash-type-tag {
  font-size: .65rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  padding: .18rem .5rem; border-radius: 3px;
}
.dash-type-tag.powerbi { background: rgba(243,186,47,.12); color: #f3ba2f; border: 1px solid rgba(243,186,47,.25); }
.dash-type-tag.internal { background: var(--accent-dim); color: var(--accent); border: 1px solid rgba(0,240,255,.2); }
.dash-type-tag.link { background: rgba(168,85,247,.12); color: #a855f7; border: 1px solid rgba(168,85,247,.25); }

.dash-sector-tag {
  font-size: .65rem; font-weight: 600; letter-spacing: .04em;
  padding: .18rem .5rem; border-radius: 3px; border-width: 1px; border-style: solid;
}

.dash-title {
  font-size: .9rem; font-weight: 600; color: var(--text); line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.dash-description {
  font-size: .78rem; color: var(--text-2); line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.dash-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: auto; padding-top: .5rem; border-top: 1px solid var(--border);
}
.dash-status-pill {
  font-size: .65rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  padding: .15rem .5rem; border-radius: 10px;
}
.dash-status-pill.active { background: var(--success-bg); color: var(--success); }
.dash-status-pill.maintenance { background: rgba(234,179,8,.1); color: #eab308; }
.dash-status-pill.error { background: var(--error-bg); color: var(--error); }
.dash-embed-hint { font-size: .68rem; color: var(--text-3); font-family: var(--font-mono); }

/* Skeleton */
.skeleton { cursor: default; pointer-events: none; animation: shimmer 1.4s infinite linear; }
.skel-thumb { height: 140px; background: var(--surface-3); }
.skel-body { padding: .85rem 1rem; display: flex; flex-direction: column; gap: .5rem; }
.skel-line { height: 10px; border-radius: 4px; background: var(--surface-3); }
.skel-line.w70 { width: 70%; }
.skel-line.w40 { width: 40%; }
@keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: .75rem; padding: 4rem 1rem; color: var(--text-2); text-align: center;
}
.empty-state p { font-size: .95rem; }
.empty-state span { font-size: .82rem; }
.empty-state em { color: var(--accent); font-style: normal; }
</style>
