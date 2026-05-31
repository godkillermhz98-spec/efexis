<template>
    <div class="diagnostics-page">
        <header class="diagnostics-hero">
            <div>
                <p class="diagnostics-eyebrow">
                    <span></span>
                    [02] Diagnostics
                </p>
                <h1>Runtime signal desk</h1>
            </div>
            <button
                class="discord-test-btn"
                :class="{ connected: isConnected }"
                @click="discordTest"
            >
                <span class="btn-led"></span>
                {{ isConnected ? 'Disconnect RPC' : 'Discord Test' }}
            </button>
        </header>

        <section class="logs-panel">
            <div class="logs-panel-header">
                <div>
                    <p class="panel-kicker">Event stream</p>
                    <h2>Logs</h2>
                </div>
                <button class="clear-logs-btn" @click="clearLogs">Clear</button>
            </div>

            <div class="logs-list">
                <div v-if="logs.length === 0" class="empty-log">No logs available.</div>
                <ul v-else>
                    <li v-for="(log, index) in logs" :key="index" class="log-row">
                        <span class="log-time">[{{ new Date(log.timestamp).toLocaleString() }}]</span>
                        <span
                            class="log-type"
                            :class="{
                                info: log.type === 'info',
                                error: log.type === 'error',
                                warning: log.type === 'warning',
                                debug: log.type === 'debug'
                            }"
                        >
                            [{{ log.type.toUpperCase() }}]
                        </span>
                        <span class="log-message">{{ log.message }}</span>
                    </li>
                </ul>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { useGlobalState } from '@/composables/app-state';

const ActivityKind = {
    Playing: 0,
    Listening: 2,
    Watching: 3,
    Competing: 5
} as const;

const isConnected = ref(false);

const { logs, clearLogs } = useGlobalState();

function discordTest() {
    const appIdCode = '1361728268088381706';

    if (isConnected.value) {
        console.log('Disconnecting from Discord');
        emit('event_disconnect');
        isConnected.value = false;
        return;
    }

    invoke('connect_to_discord_rpc_3', {
        activity_json: JSON.stringify({
            app_id: appIdCode,
            details: 'Jhabol',
            state: "/jhabol",
            activity_kind: ActivityKind.Watching,
            timestamp: createAgoTimestamp('1h 30m')
        }),
        action: 'connect',
    });
    isConnected.value = true;
}

function createAgoTimestamp(input: string) {
    const time = input.split(' ');
    let hours = 0;
    let minutes = 0;

    for (let i = 0; i < time.length; i++) {
        if (time[i].includes('h')) {
            hours = parseInt(time[i]);
        } else if (time[i].includes('m')) {
            minutes = parseInt(time[i]);
        }
    }

    const date = new Date();
    date.setHours(date.getHours() - hours);
    date.setMinutes(date.getMinutes() - minutes);

    return Math.floor(date.getTime() / 1000);
}
</script>

<style scoped>
.diagnostics-page {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding: 2rem clamp(1rem, 2.2vw, 2rem);
    color: #fafafa;
}

.diagnostics-hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding: clamp(1.35rem, 2.5vw, 2rem);
    border: 1px solid rgba(255, 255, 255, 0.075);
    border-radius: 8px;
    background:
        radial-gradient(circle at 84% 16%, rgba(153, 255, 0, 0.14), transparent 18rem),
        linear-gradient(145deg, rgba(255, 255, 255, 0.065), rgba(255, 255, 255, 0.018));
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(18px);
}

.diagnostics-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0 0 0.85rem;
    color: rgba(250, 250, 250, 0.62);
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
}

.diagnostics-eyebrow span {
    width: 2.6rem;
    height: 1px;
    background: #99ff00;
    box-shadow: 0 0 16px rgba(153, 255, 0, 0.55);
}

.diagnostics-hero h1 {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(2.1rem, 4vw, 4.2rem);
    font-weight: 400;
    line-height: 1;
}

.discord-test-btn,
.clear-logs-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 40px;
    padding: 0 1rem;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    color: #0a0a0b;
    background: #99ff00;
    box-shadow: 0 0 20px rgba(153, 255, 0, 0.24);
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
}

.discord-test-btn.connected {
    color: #ffffff;
    background: linear-gradient(135deg, #ff6b6b, #d94848);
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.24);
}

.btn-led {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.65;
}

.logs-panel {
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.075);
    border-radius: 8px;
    background:
        linear-gradient(145deg, rgba(255, 255, 255, 0.058), rgba(255, 255, 255, 0.018)),
        rgba(10, 10, 11, 0.62);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(18px);
}

.logs-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.065);
}

.panel-kicker {
    margin: 0 0 0.25rem;
    color: #99ff00;
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.64rem;
    font-weight: 800;
    text-transform: uppercase;
}

.logs-panel h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
}

.clear-logs-btn {
    min-height: 34px;
    color: rgba(250, 250, 250, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.035);
    box-shadow: none;
}

.logs-list {
    max-height: 420px;
    overflow-y: auto;
    padding: 1rem;
}

.logs-list ul {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

.log-row,
.empty-log {
    padding: 0.65rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.76rem;
}

.log-time {
    color: rgba(250, 250, 250, 0.42);
}

.log-type {
    margin-left: 0.5rem;
    font-weight: 800;
}

.log-type.info {
    color: #8bdcff;
}

.log-type.error {
    color: #ff8a8a;
}

.log-type.warning {
    color: #ffd166;
}

.log-type.debug {
    color: #99ff00;
}

.log-message {
    margin-left: 0.5rem;
    color: rgba(250, 250, 250, 0.76);
}

.empty-log {
    color: rgba(250, 250, 250, 0.48);
    text-align: center;
}

@media (max-width: 720px) {
    .diagnostics-hero {
        align-items: stretch;
        flex-direction: column;
    }

    .discord-test-btn {
        width: 100%;
    }
}
</style>
