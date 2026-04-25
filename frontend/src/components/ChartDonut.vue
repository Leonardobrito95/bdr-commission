<template>
  <div class="chart-donut-wrap">
    <div class="chart-title">{{ title }}</div>
    <div class="donut-body">
      <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="donut-svg">
        <!-- Trilha de fundo -->
        <circle
          :cx="CX" :cy="CY" :r="RADIUS"
          fill="none"
          stroke="var(--surface-3)"
          :stroke-width="STROKE"
        />
        <!-- Segmentos -->
        <circle
          v-for="(seg, i) in arcs"
          :key="i"
          :cx="CX" :cy="CY" :r="RADIUS"
          fill="none"
          :stroke="seg.color"
          :stroke-width="STROKE"
          :stroke-dasharray="`${seg.dash} ${CIRCUMFERENCE}`"
          :stroke-dashoffset="seg.offset"
          stroke-linecap="butt"
          class="donut-segment"
          :style="{ animationDelay: `${i * 0.12}s` }"
        />
        <!-- Centro -->
        <text :x="CX" :y="CY - 6" text-anchor="middle" class="donut-center-val">
          {{ centerOverride !== undefined ? centerOverride : total }}
        </text>
        <text :x="CX" :y="CY + 14" text-anchor="middle" class="donut-center-lbl">
          {{ centerLabel }}
        </text>
      </svg>

      <!-- Legenda -->
      <div class="donut-legend">
        <div v-for="(seg, i) in segments" :key="i" class="legend-item">
          <span class="legend-dot" :style="{ background: seg.color }" />
          <span class="legend-label">{{ seg.label }}</span>
          <span class="legend-value">{{ seg.value }}</span>
          <span class="legend-pct">{{ pct(seg.value) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Segment { label: string; value: number; color: string; }

const props = defineProps<{
  title: string;
  centerLabel?: string;
  centerOverride?: number;   // substitui o total no centro do donut
  segments: Segment[];
}>();

const SIZE        = 160;
const CX          = 80;
const CY          = 80;
const RADIUS      = 58;
const STROKE      = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP         = 3; // px de gap entre segmentos

const total = computed(() => props.segments.reduce((s, x) => s + x.value, 0));

function pct(v: number) {
  if (!total.value) return '0';
  return Math.round((v / total.value) * 100).toString();
}

const arcs = computed(() => {
  const t = total.value || 1;
  let cumulativeAngle = -Math.PI / 2; // começa no topo
  return props.segments.map((seg) => {
    const fraction = seg.value / t;
    const arcLen   = fraction * CIRCUMFERENCE - GAP;
    const dash     = Math.max(arcLen, 0);
    // dashoffset: quantos px "pular" antes de começar a desenhar
    const offset   = -(cumulativeAngle / (2 * Math.PI)) * CIRCUMFERENCE + CIRCUMFERENCE / 4;
    cumulativeAngle += fraction * 2 * Math.PI;
    return { color: seg.color, dash, offset: CIRCUMFERENCE - offset + CIRCUMFERENCE };
  });
});

</script>

<style scoped>
.chart-donut-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}
.chart-title {
  font-size: .7rem;
  font-weight: 700;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: .08em;
}
.donut-body {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.donut-svg {
  width: 130px;
  height: 130px;
  flex-shrink: 0;
  overflow: visible;
}
.donut-segment {
  transform-origin: 80px 80px;
  animation: donutGrow .5s cubic-bezier(.4,0,.2,1) both;
}
@keyframes donutGrow {
  from { opacity: 0; transform: scale(.85); }
  to   { opacity: 1; transform: scale(1); }
}
.donut-center-val {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  fill: var(--text);
}
.donut-center-lbl {
  font-size: 9px;
  fill: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.donut-legend {
  display: flex;
  flex-direction: column;
  gap: .45rem;
  min-width: 100px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: .78rem;
}
.legend-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label { color: var(--text-2); flex: 1; }
.legend-value { font-family: var(--font-mono); font-weight: 600; color: var(--text); }
.legend-pct   { color: var(--text-3); font-size: .7rem; min-width: 30px; text-align: right; }
</style>
