<script setup lang="ts">
import { Pages, useGlobalState } from '@/composables/app-state';
import IconRustLang from './IconRustLang.vue';
import IconVueJs from './IconVueJs.vue';
// Layout component for consistent page structure
const appState = useGlobalState();
const { page, setPage } = appState;
</script>

<template>
  <div class="layout-container">
    <!-- Left Sidebar navigation -->
    <aside class="sidebar">
      <!-- App branding header -->
      <div class="sidebar-header">
        <img src="/logo.svg" alt="Logo" class="app-logo" />
        <h2 class="app-title">Quest Companion</h2>
      </div>

      <!-- Navigation links (pill-shaped vertical list) -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li>
            <a href="#" 
              class="nav-link"
              :class="{ 'active': page === Pages.HOME }"
              @click.prevent="setPage(Pages.HOME)"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </a>
          </li> 
          <li>
            <a href="#" 
              class="nav-link"
              :class="{ 'active': page === Pages.PLAYGROUND }"
              @click.prevent="setPage(Pages.PLAYGROUND)"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              <span>Playground</span>
            </a>
          </li>
          <li>
            <a href="#" class="nav-link">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Settings</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Sidebar footer with branding info -->
      <footer class="sidebar-footer">
        <div class="footer-text">
          &copy; 2025 Built with <IconRustLang class="inline-block h-3.5 w-3.5 text-red-400 mx-0.5 align-middle"/> Rust and <IconVueJs class="h-3.5 w-3.5 inline-block text-[#4FC08D] mx-0.5 align-middle"/> Vue.js
        </div>
      </footer>
    </aside>
    
    <!-- Main content view (scrolls independently) -->
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
  background-color: #0f0f13;
  color: #f2f3f5;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.sidebar {
  width: 220px;
  min-width: 220px;
  background-color: #1a1a24;
  border-right: 1px solid #2e2e3d;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 1.5rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid #2e2e3d;
}

.app-logo {
  height: 2rem;
  width: 2rem;
  filter: drop-shadow(0 0 8px rgba(88, 101, 242, 0.5));
}

.app-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f2f3f5;
  letter-spacing: 0.025em;
  background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-nav {
  padding: 1.25rem 0.75rem;
  flex-grow: 1;
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
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #8e9297;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover {
  background-color: #2e2e3d;
  color: #f2f3f5;
}

.nav-link.active {
  background-color: #5865f2;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(88, 101, 242, 0.35);
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.main-content {
  flex-grow: 1;
  height: 100%;
  overflow-y: auto;
  background-color: #0f0f13;
  display: flex;
  flex-direction: column;
}

/* Custom premium scrollbar styling */
.main-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: #0f0f13;
}

.main-content::-webkit-scrollbar-thumb {
  background: #2e2e3d;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #5865f2;
}

.sidebar-footer {
  padding: 1.25rem 1rem;
  border-top: 1px solid #2e2e3d;
  background-color: #15151e;
  margin-top: auto;
}

.footer-text {
  font-size: 0.7rem;
  color: #8e9297;
  text-align: center;
  line-height: 1.5;
}
</style>