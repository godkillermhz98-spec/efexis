<script setup lang="ts">
import MainLayout from './components/MainLayout.vue';
import { Pages, useGlobalState } from './composables/app-state';
import HomeView from './pages/HomeView.vue';
import Playground from './pages/Playground.vue';

const appState = useGlobalState();
const { page } = appState;
</script>

<template>
  <MainLayout>
    <HomeView v-show="page === Pages.HOME"/>
    <Playground v-show="page === Pages.PLAYGROUND"/>
  </MainLayout>
</template>

<style>
button,
.sdb-btn,
.refetch-btn,
.sdb-rpc-btn,
.action-btn,
.nav-link,
.btn-play,
.btn-stop,
.sdb-link-btn {
  transition:
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.28s ease,
    border-color 0.28s ease,
    background-color 0.28s ease !important;
}

button:hover,
.sdb-btn:hover,
.refetch-btn:hover,
.sdb-rpc-btn:hover,
.action-btn:hover,
.nav-link:hover,
.btn-play:hover,
.btn-stop:hover,
.sdb-link-btn:hover {
  transform: translateY(-1px) !important;
}

button:active,
.sdb-btn:active,
.refetch-btn:active,
.sdb-rpc-btn:active,
.action-btn:active,
.nav-link:active,
.btn-play:active,
.btn-stop:active,
.sdb-link-btn:active {
  transform: translateY(0) scale(0.98) !important;
}

.btn-launch:hover,
.btn-play:hover,
.steamdb-primary-btn:hover,
.btn--accent:hover {
  box-shadow: 0 0 22px rgba(153, 255, 0, 0.36), 0 12px 34px rgba(153, 255, 0, 0.12) !important;
}

.sdb-rpc-btn:hover,
.btn-launch-running:hover,
.btn-stop:hover,
.bg-red-600:hover {
  box-shadow: 0 0 18px rgba(255, 82, 82, 0.38), 0 12px 30px rgba(255, 82, 82, 0.16) !important;
}

.btn-watch:hover,
.nav-link.active:hover,
.bg-blue-500:hover,
.bg-blue-600:hover {
  box-shadow: 0 0 18px rgba(139, 220, 255, 0.34), 0 12px 30px rgba(139, 220, 255, 0.13) !important;
}

.sdb-btn:hover,
.refetch-btn:hover,
.sdb-link-btn:hover,
.nav-link:not(.active):hover {
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.08), 0 10px 22px rgba(0, 0, 0, 0.28) !important;
}
</style>
