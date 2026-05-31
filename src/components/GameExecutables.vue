<template>
    <div class="panel-container">
        <div class="panel-header-small">
            <h3 class="panel-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 3v2m6 0V5M5 8h14M5 12h14M5 16h14M5 20h14"/>
                </svg>
                Executables
            </h3>
        </div>

        <div class="executables-list">
            <div
                v-for="(executable, index) in filteredExecutables"
                :key="executable.name"
                class="executable-row"
                :style="{ '--delay': `${index * 0.08}s` }"
            >
                <div class="os-badge-wrapper">
                    <div class="os-badge">{{ executable.os }}</div>
                </div>

                <div class="breadcrumbs-container">
                    <div class="breadcrumbs-scroll scrollbar-none fade-right">
                        <div
                            v-for="(section, i) in splitExecutableName(executable)"
                            :key="i"
                            class="breadcrumb-segment"
                        >
                            <span>{{ section }}</span>
                        </div>
                    </div>
                </div>

                <div class="action-button-wrapper">
                    <button
                        class="action-btn"
                        :class="{
                            'btn-play': !gameActions?.isExecutableRunning(executable),
                            'btn-stop': gameActions?.isExecutableRunning(executable),
                        }"
                        @click="handleLaunch(executable)"
                    >
                        <svg v-if="!gameActions?.isExecutableRunning(executable)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="4" y="4" width="16" height="16" rx="2"/>
                        </svg>
                        <span>{{ gameActions?.isExecutableRunning(executable) ? 'Stop' : 'Play' }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { EXECUTABLE_OS, GameActionsKey } from '@/constants/constants';
import { GameActionsProvider, type Game, type GameExecutable } from '@/types/types';
import { path, app } from '@tauri-apps/api';
import { computed, inject } from 'vue';

const props = defineProps<{
    game: Game
}>();

const emit = defineEmits<{
    play: [{game: Game, executable: GameExecutable}]
    stop: [{game: Game, executable: GameExecutable}]
    install_and_play: [{game: Game, executable: GameExecutable}]
}>();

const gameActions = inject<GameActionsProvider>(GameActionsKey);

const filteredExecutables = computed(() => {
    return props.game.executables.filter(executable => {
        return executable.os !== EXECUTABLE_OS.LINUX && executable.os !== EXECUTABLE_OS.DARWIN
            && !isValidPath(executable.name);
    });
});

function splitExecutableName(executable: GameExecutable) {
    const allSections = executable.name.split(/\\|\//);
    const last = executable.name.split(/\\|\//).pop();
    const name = last?.split('.').slice(0, -1).join('.') || last;
    return [
        ...allSections.slice(0, -1),
        name,
    ];
}

function getExecutablePath(executable: GameExecutable) {
    const allSections = executable.name.split(/\\|\//);
    return [
        ...allSections.slice(0, -1)
    ].join(path.sep())
}

function getFilename(executable: GameExecutable) {
    const last = executable.name.split(/\\|\//).pop();
    return last;
}

function isValidPath(path: string) {
    const illegalChars = ['>', '<', ':', '"', '|', '?', '*'];
    return illegalChars.some(char => path.includes(char));
}

function handleLaunch(executable: GameExecutable) {
    console.log('Launching game:', props.game);
    if(executable.is_running) {
        emit('stop', {
            game: props.game,
            executable: {
                path: getExecutablePath(executable),
                segments: splitExecutableName(executable).length,
                filename: getFilename(executable),
                ...executable
            },
        });
    } else {
        if (!gameActions?.isGameExecutableInstalled(executable)) {
            emit('install_and_play', {
                game: props.game,
                executable: {
                    path: getExecutablePath(executable),
                    segments: splitExecutableName(executable).length,
                    filename: getFilename(executable),
                    ...executable
                },
            });
        } else {
            emit('play', {
                game: props.game,
                executable: {
                    path: getExecutablePath(executable),
                    segments: splitExecutableName(executable).length,
                    filename: getFilename(executable),
                    ...executable
                },
            });
        }
    }
}
</script>

<style scoped>
.panel-container {
    position: relative;
    overflow: hidden;
    padding: 1rem;
    color: #fafafa;
    border: 1px solid rgba(255, 255, 255, 0.075);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.035);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
}

.panel-container::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(153, 255, 0, 0.7), rgba(139, 220, 255, 0.42), transparent);
}

.panel-container::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
        radial-gradient(circle at 14% 0%, rgba(153, 255, 0, 0.12), transparent 32%),
        linear-gradient(110deg, transparent 15%, rgba(255, 255, 255, 0.035) 42%, transparent 68%);
    opacity: 0.78;
    transform: translateX(-18%);
    animation: executablePanelGlow 8s ease-in-out infinite;
}

.panel-header-small {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.9rem;
}

.panel-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    color: #fafafa;
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
}

.panel-title svg {
    width: 1rem;
    height: 1rem;
    color: #99ff00;
}

.executables-list {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.executable-row {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.8rem;
    align-items: center;
    width: 100%;
    padding: 0.55rem;
    border: 1px solid rgba(255, 255, 255, 0.065);
    border-radius: 8px;
    background: rgba(10, 10, 11, 0.28);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
    transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
    animation: slideInRow 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: var(--delay, 0s);
}

.executable-row::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    background: linear-gradient(#99ff00, #8bdcff);
    opacity: 0;
    transform: scaleY(0.28);
    transition: opacity 180ms ease, transform 180ms ease;
}

.executable-row::after {
    content: '';
    position: absolute;
    inset: -55% -28%;
    pointer-events: none;
    background: linear-gradient(110deg, transparent 38%, rgba(255, 255, 255, 0.16) 50%, transparent 62%);
    opacity: 0;
    transform: translateX(-40%) rotate(7deg);
    transition: opacity 180ms ease, transform 520ms ease;
}

.executable-row:hover {
    border-color: rgba(153, 255, 0, 0.22);
    background: rgba(153, 255, 0, 0.045);
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22), 0 0 24px rgba(153, 255, 0, 0.08);
    transform: translateY(-2px);
}

.executable-row:hover::before {
    opacity: 1;
    transform: scaleY(1);
}

.executable-row:hover::after {
    opacity: 1;
    transform: translateX(42%) rotate(7deg);
}

.os-badge-wrapper {
    width: 64px;
    max-width: 72px;
    display: flex;
}

.os-badge {
    width: 100%;
    padding: 0.28rem 0.55rem;
    border: 1px solid rgba(139, 220, 255, 0.2);
    border-radius: 999px;
    color: #8bdcff;
    background: rgba(139, 220, 255, 0.07);
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.62rem;
    font-weight: 800;
    text-align: center;
    text-transform: uppercase;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.breadcrumbs-container {
    position: relative;
    overflow: hidden;
}

.breadcrumbs-scroll {
    display: flex;
    flex-wrap: nowrap;
    max-width: 100%;
    overflow-x: auto;
    padding-right: 16px;
}

.breadcrumb-segment {
    margin-right: 6px;
    padding: 0.3rem 0.65rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 999px;
    color: rgba(250, 250, 250, 0.68);
    background: rgba(255, 255, 255, 0.035);
    font-size: 0.68rem;
    white-space: nowrap;
    transition: color 180ms ease, border-color 180ms ease, background 180ms ease, transform 180ms ease;
}

.breadcrumb-segment:hover {
    color: #99ff00;
    border-color: rgba(153, 255, 0, 0.28);
    background: rgba(153, 255, 0, 0.08);
    transform: translateY(-1px);
}

.breadcrumb-segment span {
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}

.action-button-wrapper {
    justify-self: end;
}

.action-btn {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 76px;
    justify-content: center;
    padding: 0.55rem 0.95rem;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
}

.action-btn::after {
    content: '';
    position: absolute;
    inset: -45% -30%;
    z-index: -1;
    background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.54) 50%, transparent 65%);
    opacity: 0;
    transform: translateX(-62%) rotate(8deg);
    transition: opacity 180ms ease, transform 460ms ease;
}

.action-btn:hover {
    transform: translateY(-1px);
    filter: saturate(1.08);
}

.action-btn:hover::after {
    opacity: 0.54;
    transform: translateX(62%) rotate(8deg);
}

.btn-play {
    color: #0a0a0b;
    background: #99ff00;
    box-shadow: 0 0 18px rgba(153, 255, 0, 0.24);
}

.btn-play:hover {
    background: linear-gradient(135deg, #99ff00, #caff5c 48%, #8bdcff);
}

.btn-stop {
    color: #ffffff;
    background: linear-gradient(135deg, #ff6b6b, #d94848);
    box-shadow: 0 0 18px rgba(255, 107, 107, 0.24);
}

.btn-stop:hover {
    background: linear-gradient(135deg, #ff8a8a, #e05757);
}

.action-btn svg {
    flex-shrink: 0;
}

.fade-right {
    -webkit-mask-image: linear-gradient(to right, black 86%, transparent 100%);
    mask-image: linear-gradient(to right, black 86%, transparent 100%);
}

.scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.scrollbar-none::-webkit-scrollbar {
    display: none;
}

@keyframes slideInRow {
    from {
        opacity: 0;
        transform: translateX(-14px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes executablePanelGlow {
    0%, 100% {
        opacity: 0.58;
        transform: translateX(-18%);
    }
    50% {
        opacity: 0.92;
        transform: translateX(4%);
    }
}

@media (max-width: 720px) {
    .executable-row {
        grid-template-columns: 1fr;
        gap: 0.65rem;
    }

    .os-badge-wrapper,
    .action-button-wrapper {
        width: 100%;
        justify-self: stretch;
    }

    .action-btn {
        width: 100%;
    }
}

@media (prefers-reduced-motion: reduce) {
    .panel-container::after,
    .executable-row,
    .action-btn {
        animation: none;
    }

    .executable-row,
    .breadcrumb-segment,
    .action-btn {
        transition: none;
    }
}
</style>
