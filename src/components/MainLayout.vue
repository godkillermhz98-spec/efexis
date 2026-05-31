<script setup lang="ts">
import { Pages, useGlobalState } from '@/composables/app-state';
import IconRustLang from './IconRustLang.vue';
import IconVueJs from './IconVueJs.vue';

const appState = useGlobalState();
const { page, setPage } = appState;
</script>

<template>
  <div class="layout-container">
    <div class="layout-ambient" aria-hidden="true">
      <span class="ambient-ring ambient-ring--one"></span>
      <span class="ambient-ring ambient-ring--two"></span>
      <span class="ambient-beam ambient-beam--one"></span>
      <span class="ambient-beam ambient-beam--two"></span>
    </div>

    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="app-logo-shell">
          <img src="/efexis-mark.svg" alt="Efexis" class="app-logo" />
        </span>
        <div class="brand-copy">
          <h2 class="app-title">Efexis</h2>
          <span class="app-subtitle">Quest automation</span>
        </div>
      </div>

      <div class="sidebar-status" aria-label="Automation status">
        <span class="status-dot"></span>
        <span>Automation online</span>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li>
            <a
              href="#"
              class="nav-link"
              :class="{ active: page === Pages.HOME }"
              @click.prevent="setPage(Pages.HOME)"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Handler</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              class="nav-link"
              :class="{ active: page === Pages.PLAYGROUND }"
              @click.prevent="setPage(Pages.PLAYGROUND)"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              <span>Diagnostics</span>
            </a>
          </li>
          <li>
            <a href="#" class="nav-link" @click.prevent>
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Settings</span>
            </a>
          </li>
        </ul>
      </nav>

      <footer class="sidebar-footer">
        <div class="footer-kicker">Desktop build</div>
        <div class="footer-text">
          Powered by <IconRustLang class="inline-block h-3.5 w-3.5 text-orange-300 mx-0.5 align-middle"/> Rust and <IconVueJs class="h-3.5 w-3.5 inline-block text-[#99ff00] mx-0.5 align-middle"/> Vue.js
        </div>
      </footer>
    </aside>

    <main class="main-content">
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 82% 4%, rgba(139, 220, 255, 0.11), transparent 34rem),
    radial-gradient(ellipse at 8% 58%, rgba(183, 153, 255, 0.08), transparent 38rem),
    linear-gradient(180deg, rgba(153, 255, 0, 0.05), transparent 18rem),
    #0a0a0b;
  color: #fafafa;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  position: relative;
}

.layout-container::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(115deg, transparent 0 23%, rgba(255, 255, 255, 0.018) 23.2%, transparent 23.6% 62%, rgba(153, 255, 0, 0.03) 62.2%, transparent 62.6%),
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px);
  background-size: 100% 100%, 112px 112px, 112px 112px;
  mask-image: linear-gradient(to bottom, #000 0%, transparent 86%);
}

.layout-container::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 0%, rgba(153, 255, 0, 0.055), transparent 34rem),
    linear-gradient(90deg, rgba(10, 10, 11, 0.38), transparent 38%, rgba(10, 10, 11, 0.45));
}

.layout-ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.72;
}

.ambient-ring {
  position: absolute;
  width: 38rem;
  height: 38rem;
  border-radius: 999px;
  border: 1px solid rgba(153, 255, 0, 0.08);
  box-shadow: inset 0 0 70px rgba(153, 255, 0, 0.025);
  animation: ambientOrbit 28s linear infinite;
}

.ambient-ring::before,
.ambient-ring::after {
  content: '';
  position: absolute;
  display: none;
}

.ambient-ring::before {
  top: 18%;
  left: 9%;
}

.ambient-ring::after {
  right: 15%;
  bottom: 22%;
  background: #8bdcff;
  box-shadow: 0 0 22px rgba(139, 220, 255, 0.42);
}

.ambient-ring--one {
  top: 8vh;
  left: -19rem;
}

.ambient-ring--two {
  right: -22rem;
  bottom: 2vh;
  width: 48rem;
  height: 48rem;
  border-color: rgba(139, 220, 255, 0.06);
  animation-duration: 34s;
  animation-direction: reverse;
}

.ambient-beam {
  position: absolute;
  width: 44vw;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(153, 255, 0, 0.2), rgba(139, 220, 255, 0.16), transparent);
  opacity: 0.55;
  animation: ambientBeam 10s ease-in-out infinite;
}

.ambient-beam--one {
  top: 30vh;
  left: -10vw;
  transform: rotate(-18deg);
}

.ambient-beam--two {
  right: -10vw;
  bottom: 25vh;
  transform: rotate(-28deg);
  animation-delay: -4s;
}

.sidebar {
  width: 248px;
  min-width: 248px;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(12, 13, 13, 0.88) 0%, rgba(8, 8, 9, 0.78) 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.075);
  box-shadow: 22px 0 70px rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  animation: fadeInLeft 0.85s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(153, 255, 0, 0.055), transparent 30%),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 80px);
  pointer-events: none;
  mask-image: linear-gradient(to bottom, #000, transparent 84%);
}

.sidebar-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.45rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.app-logo-shell {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background:
    linear-gradient(#0a0a0b, #0a0a0b) padding-box,
    conic-gradient(from 145deg, #99ff00, #8bdcff, #b799ff, #99ff00) border-box;
  border: 1px solid transparent;
  box-shadow:
    0 0 26px rgba(153, 255, 0, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.app-logo {
  width: 34px;
  height: 34px;
  filter: drop-shadow(0 0 10px rgba(153, 255, 0, 0.2));
}

.brand-copy {
  min-width: 0;
}

.app-title {
  margin: 0;
  color: #fafafa;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.35rem;
  font-weight: 400;
  line-height: 1;
}

.app-subtitle {
  display: block;
  margin-top: 0.22rem;
  color: rgba(250, 250, 250, 0.46);
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 0.62rem;
  text-transform: uppercase;
}

.sidebar-status {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 1rem 1rem 0;
  padding: 0.55rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 999px;
  color: rgba(250, 250, 250, 0.64);
  background: rgba(255, 255, 255, 0.035);
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 0.66rem;
  text-transform: uppercase;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #99ff00;
  box-shadow: 0 0 0 5px rgba(153, 255, 0, 0.11), 0 0 16px rgba(153, 255, 0, 0.42);
  animation: statusPulse 2.4s ease-in-out infinite;
}

.sidebar-nav {
  position: relative;
  z-index: 1;
  flex-grow: 1;
  padding: 1.25rem 0.75rem;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.78rem 0.9rem;
  border: 1px solid transparent;
  border-radius: 8px;
  color: rgba(250, 250, 250, 0.54);
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 0.72rem;
  font-weight: 600;
  text-decoration: none;
  text-transform: uppercase;
  transition: color 0.28s ease, background 0.28s ease, border-color 0.28s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-link:hover {
  color: #fafafa;
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(139, 220, 255, 0.16);
  transform: translateX(3px);
}

.nav-link.active {
  color: #fafafa;
  background: linear-gradient(135deg, rgba(153, 255, 0, 0.16), rgba(139, 220, 255, 0.07));
  border-color: rgba(153, 255, 0, 0.32);
  box-shadow:
    0 0 28px rgba(153, 255, 0, 0.11),
    inset 3px 0 0 #99ff00;
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.main-content {
  position: relative;
  z-index: 1;
  flex-grow: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.main-content::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(10, 10, 11, 0.45);
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(153, 255, 0, 0.52);
  border-radius: 999px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #99ff00;
}

.sidebar-footer {
  position: relative;
  z-index: 1;
  margin-top: auto;
  padding: 1.1rem 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background-color: transparent;
}

.footer-kicker {
  margin-bottom: 0.35rem;
  color: #99ff00;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 0.62rem;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
}

.footer-text {
  color: rgba(250, 250, 250, 0.48);
  font-size: 0.7rem;
  line-height: 1.5;
  text-align: center;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-32px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes ambientOrbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ambientBeam {
  0%, 100% { opacity: 0.18; filter: blur(0.5px); }
  42%, 55% { opacity: 0.7; filter: blur(0); }
}

@keyframes statusPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.78); opacity: 0.68; }
}

@media (max-width: 820px) {
  .layout-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    min-width: 0;
    height: auto;
    flex-direction: row;
    align-items: center;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.075);
  }

  .sidebar-header {
    border-bottom: 0;
    padding: 0.85rem 1rem;
  }

  .sidebar-status,
  .sidebar-footer {
    display: none;
  }

  .sidebar-nav {
    flex: 1;
    overflow-x: auto;
    padding: 0.75rem 1rem 0.75rem 0;
  }

  .nav-list {
    flex-direction: row;
    justify-content: flex-end;
  }

  .nav-link {
    white-space: nowrap;
  }

  .main-content {
    min-height: 0;
  }
}
</style>
