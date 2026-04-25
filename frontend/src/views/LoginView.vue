<template>
  <div class="login-root">

    <!-- fundo animado global -->
    <div class="bg-layer" aria-hidden="true">
      <div class="bg-gradient"></div>
      <svg class="bg-grid" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse">
            <path d="M52 0H0v52" fill="none" stroke="rgba(0,210,255,.05)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <div class="bg-orb orb1"></div>
      <div class="bg-orb orb2"></div>
    </div>

    <!-- ── coluna esquerda — branding ── -->
    <aside class="brand-col">

      <!-- anéis de sinal -->
      <div class="rings" aria-hidden="true">
        <span class="ring"></span>
        <span class="ring"></span>
        <span class="ring"></span>
        <span class="ring-core"></span>
      </div>

      <!-- métricas flutuantes -->
      <div class="kpi k1"><b>98.7<small>%</small></b><span>Uptime</span></div>
      <div class="kpi k2"><b>12<small>ms</small></b><span>Latência</span></div>
      <div class="kpi k3"><b>612<small>Mb</small></b><span>Download</span></div>

      <!-- barras de performance -->
      <div class="bars" aria-hidden="true">
        <i v-for="n in 9" :key="n" :style="`--i:${n}`"></i>
      </div>

      <!-- conteúdo principal -->
      <div class="brand-body">
        <svg class="brand-icon" width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="25" stroke="url(#bi)" stroke-width="1.2"/>
          <path d="M26 10L40 18v16L26 42 12 34V18L26 10Z" stroke="url(#bi)" stroke-width="1.2" fill="none"/>
          <circle cx="26" cy="26" r="6" fill="url(#bi)" opacity=".9"/>
          <defs>
            <linearGradient id="bi" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stop-color="#00d4ff"/><stop offset="1" stop-color="#005fff"/>
            </linearGradient>
          </defs>
        </svg>

        <h1 class="brand-name">
          <em>Performance</em>
          <strong>Canaã</strong>
        </h1>
        <p class="brand-desc">Gestão comercial inteligente.<br>Resultados em tempo real.</p>

        <div class="brand-chips">
          <span>BDR · Comissões</span>
          <span>Vendas · Contratos</span>
          <span>CS · Retenção</span>
        </div>
      </div>

      <footer class="brand-foot">Canaã Telecom &nbsp;·&nbsp; Sistema Interno</footer>
    </aside>

    <!-- ── coluna direita — login ── -->
    <main class="form-col">

      <!-- cabeçalho mobile -->
      <div class="mobile-header">
        <svg width="28" height="28" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="25" stroke="url(#mbi)" stroke-width="1.5"/>
          <path d="M26 10L40 18v16L26 42 12 34V18L26 10Z" stroke="url(#mbi)" stroke-width="1.5" fill="none"/>
          <circle cx="26" cy="26" r="6" fill="url(#mbi)"/>
          <defs>
            <linearGradient id="mbi" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stop-color="#00d4ff"/><stop offset="1" stop-color="#005fff"/>
            </linearGradient>
          </defs>
        </svg>
        <span>Performance <strong>Canaã</strong></span>
      </div>

      <!-- painel de login -->
      <div class="login-panel">

        <div class="panel-top">
          <div class="panel-tag">ACESSO SEGURO</div>
          <h2>Entre em sua<br><span>conta</span></h2>
          <p>Use suas credenciais do IXC Provedor</p>
        </div>

        <form @submit.prevent="handleLogin" novalidate>

          <div class="input-block" :class="{ active: focusedField === 'email' || email }">
            <label for="email">E-mail</label>
            <div class="input-wrap">
              <svg class="input-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3.5" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M1 5l6 4 6-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="seu@email.com"
                autocomplete="email"
                required
                :disabled="loading"
                @focus="focusedField = 'email'"
                @blur="focusedField = ''"
              />
            </div>
            <div class="input-line"></div>
          </div>

          <div class="input-block" :class="{ active: focusedField === 'password' || password }">
            <label for="password">Senha</label>
            <div class="input-wrap">
              <svg class="input-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="3" y="6" width="8" height="6.5" rx="1" stroke="currentColor" stroke-width="1.2"/>
                <path d="M5 6V4.5a2 2 0 0 1 4 0V6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <input
                id="password"
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                placeholder="••••••••••"
                autocomplete="current-password"
                required
                :disabled="loading"
                @focus="focusedField = 'password'"
                @blur="focusedField = ''"
              />
              <button type="button" class="eye-btn" @click="showPass = !showPass" tabindex="-1">
                <svg v-if="!showPass" width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.2"/></svg>
                <svg v-else width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4 4.3C2.6 5.3 1.5 6.7 1 8c1 2.7 3.8 5 7 5a7 7 0 0 0 3.7-1M7 3.1A7.3 7.3 0 0 1 8 3c3.2 0 6 2.3 7 5-.4 1-1 2-1.8 2.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              </button>
            </div>
            <div class="input-line"></div>
          </div>

          <div v-if="error" class="error-bar">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 4v3M6.5 9h.01" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            {{ error }}
          </div>

          <button type="submit" class="submit" :disabled="loading">
            <span v-if="!loading" class="submit-text">
              Continuar
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <span v-else class="submit-dots">
              <i></i><i></i><i></i>
            </span>
          </button>

        </form>

        <div class="panel-foot">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x=".5" y="4" width="10" height="6.5" rx="1" stroke="currentColor" stroke-width="1"/><path d="M3 4V3a2.5 2.5 0 0 1 5 0v1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
          Acesso restrito a colaboradores
        </div>

      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const emit = defineEmits<{ (e: 'login-success'): void }>();

const { login }    = useAuth();
const email        = ref('');
const password     = ref('');
const showPass     = ref(false);
const loading      = ref(false);
const error        = ref('');
const focusedField = ref('');

async function handleLogin() {
  error.value   = '';
  loading.value = true;
  try {
    await login(email.value, password.value);
    emit('login-success');
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    error.value = e.response?.data?.message ?? 'Credenciais inválidas. Tente novamente.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

/* ── base ─────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.login-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-family: 'DM Sans', sans-serif;
  position: relative;
  background: #040c18;
  color: #fff;
}

/* ── fundo global ─────────────────────────────────────────── */
.bg-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 50%, rgba(0,100,200,.18) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 80% 30%, rgba(0,40,120,.15) 0%, transparent 70%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: orbDrift 12s ease-in-out infinite alternate;
}
.orb1 {
  width: 500px; height: 500px;
  background: rgba(0,160,255,.08);
  top: -10%; left: -10%;
}
.orb2 {
  width: 400px; height: 400px;
  background: rgba(0,60,200,.07);
  bottom: -10%; right: 40%;
  animation-delay: -6s;
}
@keyframes orbDrift {
  from { transform: translate(0,0); }
  to   { transform: translate(40px, 30px); }
}

/* ── coluna esquerda ─────────────────────────────────────── */
.brand-col {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 3rem 3.5rem;
  overflow: hidden;
}

/* anéis */
.rings {
  position: absolute;
  top: 8%;
  right: -15%;
  width: 420px;
  height: 420px;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(0,210,255,.12);
  animation: ripple 4s ease-out infinite;
}
.ring:nth-child(2) { animation-delay: 1.3s; }
.ring:nth-child(3) { animation-delay: 2.6s; }

@keyframes ripple {
  0%   { transform: scale(.2); opacity: .8; }
  100% { transform: scale(1.1); opacity: 0; }
}

.ring-core {
  position: absolute;
  top: 50%; left: 50%;
  width: 12px; height: 12px;
  background: #00d4ff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 20px 6px rgba(0,212,255,.4);
}

/* kpis */
.kpi {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(0,210,255,.1);
  border-radius: 12px;
  padding: .55rem 1rem;
  backdrop-filter: blur(12px);
  animation: fadeUp .6s both;
}
.kpi b {
  font-family: 'Syne', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #00d4ff;
  line-height: 1;
}
.kpi b small { font-size: .58em; opacity: .7; margin-left: 1px; }
.kpi span { font-size: .6rem; color: rgba(255,255,255,.35); letter-spacing: .08em; text-transform: uppercase; margin-top: 3px; }

.k1 { top: 20%; left: 6%;   animation-delay: .1s; }
.k2 { top: 36%; left: 30%;  animation-delay: .25s; }
.k3 { top: 14%; right: 28%; animation-delay: .4s; }

/* barras */
.bars {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 32%;
  display: flex;
  align-items: flex-end;
  gap: 5px;
  padding: 0 3.5rem;
  opacity: .13;
  pointer-events: none;
}
.bars i {
  flex: 1;
  background: linear-gradient(to top, #00d4ff, #0050ff);
  border-radius: 3px 3px 0 0;
  animation: barPulse 2.6s ease-in-out infinite;
  animation-delay: calc(var(--i) * .18s);
}
@keyframes barPulse {
  0%,100% { height: 15%; }
  50%     { height: 90%; }
}

/* conteúdo */
.brand-body {
  position: relative;
  z-index: 2;
  animation: fadeUp .5s both;
}

.brand-icon { margin-bottom: 1.5rem; }

.brand-name {
  display: flex;
  flex-direction: column;
  line-height: .92;
  margin-bottom: 1.1rem;
}
.brand-name em {
  font-style: normal;
  font-family: 'Syne', sans-serif;
  font-size: clamp(2rem, 3.5vw, 2.8rem);
  font-weight: 600;
  color: rgba(255,255,255,.85);
  letter-spacing: -.02em;
}
.brand-name strong {
  font-family: 'Syne', sans-serif;
  font-size: clamp(2.8rem, 5vw, 4.2rem);
  font-weight: 800;
  background: linear-gradient(120deg, #00d4ff 0%, #5599ff 60%, #00aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -.03em;
}

.brand-desc {
  font-size: .9rem;
  color: rgba(255,255,255,.38);
  line-height: 1.7;
  margin-bottom: 2rem;
}

.brand-chips {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
}
.brand-chips span {
  font-size: .7rem;
  color: rgba(0,210,255,.7);
  border: 1px solid rgba(0,210,255,.18);
  border-radius: 20px;
  padding: .3rem .85rem;
  letter-spacing: .04em;
  background: rgba(0,210,255,.04);
}

.brand-foot {
  position: relative;
  z-index: 2;
  margin-top: 3.5rem;
  font-size: .68rem;
  color: rgba(255,255,255,.18);
  letter-spacing: .1em;
  text-transform: uppercase;
}

/* ── coluna direita ──────────────────────────────────────── */
.form-col {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.mobile-header { display: none; }

/* painel de login */
.login-panel {
  width: 100%;
  max-width: 400px;
  animation: fadeUp .5s .1s both;
}

.panel-top { margin-bottom: 2.75rem; }

.panel-tag {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  font-size: .65rem;
  font-weight: 600;
  letter-spacing: .14em;
  color: #00d4ff;
  margin-bottom: 1.25rem;
}
.panel-tag::before {
  content: '';
  display: block;
  width: 18px; height: 1.5px;
  background: #00d4ff;
  border-radius: 2px;
}

.panel-top h2 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(2rem, 3vw, 2.6rem);
  font-weight: 800;
  line-height: 1.05;
  color: rgba(255,255,255,.92);
  margin-bottom: .75rem;
}
.panel-top h2 span {
  background: linear-gradient(120deg, #00d4ff, #5599ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.panel-top p {
  font-size: .85rem;
  color: rgba(255,255,255,.3);
}

/* inputs estilo editorial */
form { display: flex; flex-direction: column; gap: 0; }

.input-block {
  position: relative;
  margin-bottom: 1.75rem;
}

.input-block label {
  display: block;
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(255,255,255,.3);
  margin-bottom: .65rem;
  transition: color .2s;
}
.input-block.active label { color: #00d4ff; }

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0;
  color: rgba(255,255,255,.2);
  transition: color .2s;
  pointer-events: none;
}
.input-block.active .input-icon { color: #00d4ff; }

.input-wrap input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  padding: .5rem 2rem .5rem 1.5rem;
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  color: rgba(255,255,255,.88);
  caret-color: #00d4ff;
}
.input-wrap input::placeholder { color: rgba(255,255,255,.18); }
.input-wrap input:disabled { opacity: .4; cursor: not-allowed; }

.input-line {
  position: absolute;
  bottom: -4px; left: 0;
  width: 100%; height: 1px;
  background: rgba(255,255,255,.1);
}
.input-line::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  height: 100%;
  width: 0;
  background: linear-gradient(to right, #00d4ff, #5599ff);
  transition: width .3s cubic-bezier(.4,0,.2,1);
  border-radius: 2px;
}
.input-block.active .input-line::after { width: 100%; }

.eye-btn {
  position: absolute;
  right: 0;
  background: none;
  border: none;
  color: rgba(255,255,255,.2);
  cursor: pointer;
  padding: 4px;
  display: flex;
  border-radius: 4px;
  transition: color .15s;
}
.eye-btn:hover { color: rgba(255,255,255,.6); }

/* erro */
.error-bar {
  display: flex;
  align-items: center;
  gap: .5rem;
  background: rgba(239,68,68,.08);
  border: 1px solid rgba(239,68,68,.25);
  color: #f87171;
  font-size: .82rem;
  padding: .7rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  animation: shake .35s cubic-bezier(.36,.07,.19,.97);
}
@keyframes shake {
  0%,100%  { transform: none; }
  20%,60%  { transform: translateX(-5px); }
  40%,80%  { transform: translateX(5px); }
}

/* botão */
.submit {
  width: 100%;
  padding: 1rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(0,210,255,.3);
  border-radius: 10px;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: .95rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color .25s, transform .2s;
  letter-spacing: .02em;
}

.submit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(0,212,255,.12), rgba(0,100,255,.18));
  opacity: 0;
  transition: opacity .25s;
}
.submit::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, #00d4ff, #0055ff);
  opacity: 0;
  transition: opacity .3s;
}
.submit:hover:not(:disabled)::before { opacity: 1; }
.submit:hover:not(:disabled) { border-color: rgba(0,210,255,.7); transform: translateY(-1px); }
.submit:disabled { opacity: .4; cursor: not-allowed; }

.submit-text, .submit-dots {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .6rem;
}

.submit-dots i {
  display: block;
  width: 7px; height: 7px;
  background: rgba(255,255,255,.7);
  border-radius: 50%;
  animation: dot .7s ease-in-out infinite;
}
.submit-dots i:nth-child(2) { animation-delay: .15s; }
.submit-dots i:nth-child(3) { animation-delay: .3s; }
@keyframes dot {
  0%,80%,100% { transform: scale(.5); opacity: .3; }
  40%         { transform: scale(1);  opacity: 1; }
}

/* rodapé */
.panel-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  margin-top: 2rem;
  font-size: .72rem;
  color: rgba(255,255,255,.2);
  letter-spacing: .04em;
}

/* ── animação ─────────────────────────────────────────────── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: none; }
}

/* ── responsivo ───────────────────────────────────────────── */
@media (max-width: 900px) {
  .login-root {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .brand-col {
    display: none;
  }

  .form-col {
    flex-direction: column;
    justify-content: center;
    padding: 2rem 1.5rem;
    min-height: 100vh;
  }

  .mobile-header {
    display: flex;
    align-items: center;
    gap: .75rem;
    margin-bottom: 3rem;
    font-size: 1.1rem;
    color: rgba(255,255,255,.7);
    font-family: 'Syne', sans-serif;
    font-weight: 600;
  }
  .mobile-header strong {
    background: linear-gradient(120deg, #00d4ff, #5599ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .login-panel { max-width: 100%; }

  .panel-top h2 { font-size: 2rem; }
}

@media (max-width: 400px) {
  .form-col { padding: 1.5rem 1.25rem; }
  .panel-top h2 { font-size: 1.75rem; }
}
</style>
