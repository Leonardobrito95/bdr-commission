<template>
  <div class="period-filter">
    <div class="filter-group">
      <label class="filter-label">Período</label>
      <select :value="modelPeriod" @change="onPeriodChange">
        <option v-for="opt in PERIOD_OPTIONS" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <Transition name="expand">
      <div v-if="modelPeriod === 'custom_month'" class="custom-month-row">
        <div class="filter-group">
          <label class="filter-label">Mês</label>
          <select :value="modelMonth" @change="onMonthChange">
            <option v-for="(name, idx) in MONTH_NAMES" :key="idx" :value="idx">{{ name }}</option>
          </select>
        </div>
        <div class="filter-group year-group">
          <label class="filter-label">Ano</label>
          <select :value="modelYear" @change="onYearChange">
            <option v-for="y in availableYears()" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { type Period, PERIOD_OPTIONS, MONTH_NAMES, availableYears } from '../composables/useDateRange';

defineProps<{
  modelPeriod: Period;
  modelMonth:  number;
  modelYear:   number;
}>();

const emit = defineEmits<{
  (e: 'update:modelPeriod', v: Period):  void;
  (e: 'update:modelMonth',  v: number):  void;
  (e: 'update:modelYear',   v: number):  void;
  (e: 'change'): void;
}>();

function onPeriodChange(ev: Event) {
  emit('update:modelPeriod', (ev.target as HTMLSelectElement).value as Period);
  emit('change');
}
function onMonthChange(ev: Event) {
  emit('update:modelMonth', Number((ev.target as HTMLSelectElement).value));
  emit('change');
}
function onYearChange(ev: Event) {
  emit('update:modelYear', Number((ev.target as HTMLSelectElement).value));
  emit('change');
}
</script>

<style scoped>
.period-filter {
  display: contents; /* transparente no layout — os filhos entram direto no filter-bar pai */
}
.custom-month-row {
  display: contents;
}
.year-group { max-width: 90px; }

.expand-enter-active,
.expand-leave-active { transition: opacity .2s ease; }
.expand-enter-from,
.expand-leave-to     { opacity: 0; }
</style>
