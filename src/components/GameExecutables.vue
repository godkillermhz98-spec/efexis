<template>
    <div class="panel-container">
        <h3 class="panel-title">
            The game has multiple platform executables. Please select one to launch:
        </h3>

        <div class="executables-list">
            <div v-for="(executable) in filteredExecutables" :key="executable.name"
                class="executable-row">
                
                <!-- OS Badge -->
                <div class="os-badge-wrapper">
                    <div class="os-badge">
                        {{ executable.os }}
                    </div>
                </div>

                <!-- Path Breadcrumbs -->
                <div class="breadcrumbs-container">
                    <div class="breadcrumbs-scroll scrollbar-none fade-right">
                        <div v-for="(section, i) in splitExecutableName(executable)" :key="i"
                            class="breadcrumb-segment">
                            <span>{{ section }}</span>
                        </div>
                    </div>
                </div>

                <!-- Action Button -->
                <div class="action-button-wrapper">
                    <button 
                        class="action-btn"
                        :class="{
                            'btn-play': !gameActions?.isExecutableRunning(executable),
                            'btn-stop': gameActions?.isExecutableRunning(executable),
                        }"
                        @click="handleLaunch(executable)"
                    >
                        {{ gameActions?.isExecutableRunning(executable) ? 'Stop' : 'Play' }}
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
        // currently no support for linux and darwin
        return executable.os !== EXECUTABLE_OS.LINUX && executable.os !== EXECUTABLE_OS.DARWIN
            && !isValidPath(executable.name);
    });
});

function splitExecutableName(executable: GameExecutable) {
    const allSections = executable.name.split(/\\|\//);
    
    const last = executable.name.split(/\\|\//).pop();
    // remove file extension if there was none, just return the last section
    const name = last?.split('.').slice(0, -1).join('.') || last;
    return [
        ...allSections.slice(0, -1),
        name,
    ];
}

function getExecutablePath(executable: GameExecutable) {
    const allSections = executable.name.split(/\\|\//);
    const last = executable.name.split(/\\|\//).pop();
    // remove file extension if there was none, just return the last section
    const name = last?.split('.').slice(0, -1).join('.') || last;
    return [
        ...allSections.slice(0, -1)
    ].join(path.sep())
}

function getFilename(executable: GameExecutable) {
    const last = executable.name.split(/\\|\//).pop();
    // remove file extension if there was none, just return the last section
    return last;
}

function isValidPath(path: string) {
    const illegalChars = ['>', '<', ':', '"', '|', '?', '*'];
    return illegalChars.some(char => path.includes(char));
}

function handleLaunch(executable: GameExecutable) {
    // Handle the launch logic here
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
    background-color: #1a1a24;
    border: 1px solid #2e2e3d;
    border-radius: 8px;
    padding: 16px;
    color: #f2f3f5;
}

.panel-title {
    font-size: 0.85rem;
    font-weight: 500;
    color: #8e9297;
    margin-top: 0;
    margin-bottom: 12px;
}

.executables-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.executable-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    width: 100%;
}

.os-badge-wrapper {
    width: 56px;
    max-width: 80px;
    display: flex;
}

.os-badge {
    background-color: #15151e;
    border: 1px solid #2e2e3d;
    color: #f2f3f5;
    border-radius: 9999px;
    padding: 2px 8px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    text-align: center;
    width: 100%;
}

.breadcrumbs-container {
    position: relative;
    overflow: hidden;
}

.breadcrumbs-scroll {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    max-width: 100%;
    padding-right: 16px;
}

.breadcrumb-segment {
    text-align: center;
    background-color: #15151e;
    border: 1px solid #2e2e3d;
    border-radius: 9999px;
    padding: 2px 10px;
    margin-right: 4px;
    white-space: nowrap;
    font-size: 0.7rem;
    color: #f2f3f5;
}

.breadcrumb-segment span {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.action-button-wrapper {
    justify-self: end;
}

.action-btn {
    color: #ffffff;
    border: none;
    border-radius: 4px;
    padding: 6px 16px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.1s ease;
}

.action-btn:active {
    transform: scale(0.96);
}

.btn-play {
    background-color: #5865f2;
}

.btn-play:hover {
    background-color: #4752c4;
}

.btn-stop {
    background-color: #ed4245;
}

.btn-stop:hover {
    background-color: #c93b3e;
}

.fade-right {
    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    mask-image: linear-gradient(to right, black 85%, transparent 100%);
}

.scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.scrollbar-none::-webkit-scrollbar {
    display: none;
}
</style>