<script setup lang="ts">
import { ref, computed, useTemplateRef, shallowRef, provide, nextTick, triggerRef, watch } from 'vue';
// import gameListData from '../assets/gamelist.json';
import { onClickOutside, refDebounced, tryOnMounted } from '@vueuse/core';
import { useFuse } from '@vueuse/integrations/useFuse'
import { invoke } from '@tauri-apps/api/core';
import { randomString } from '@/utils/random-string';
import { GameActionsProvider, GameExecutable, type Game } from '@/types/types';
import IconVerified from '@/components/IconVerified.vue';
import { isEmpty } from 'lodash-es';
import GameExecutables from '@/components/GameExecutables.vue';
import { GameActionsKey } from '@/constants/constants';
import { path } from '@tauri-apps/api';
import { emit } from '@tauri-apps/api/event';
import { useFetchGameList } from '@/composables/fetch-gamelist';
import { UseFuseOptions } from '@vueuse/integrations';
import Fuse from 'fuse.js';
import { useGlobalState } from '@/composables/app-state';
import TimedNotification from '@/components/TimedNotification.vue';


type DialogKey = 
    'none' | 
    'rpc_message_1'|
    'no_game_selected';;

// Game list from JSON file
// const gameDB = ref<Game[]>([]);

const {
    gameDB,
    isLoadingBundled,
    isLoadingDiscord,
    isLoadingGH,
    fetchGameList,
    isReadyGH,
    isReadyBundled,
    isReadyDiscord,
    allFetchDone,
} = useFetchGameList()
const { addLog } = useGlobalState();
const shouldShowNotificationContainer = computed(() => {
    return isLoadingGH.value || isLoadingDiscord.value || isLoadingBundled.value ||
           (isReadyGH.value || isReadyDiscord.value || isReadyBundled.value);
});

const dialogRef = useTemplateRef<HTMLDialogElement>('dialogRef');
const searchResultContainerRef = useTemplateRef<HTMLElement>('searchResultContainerRef')
const dialogMessage = ref('');
const isDialogOpen = ref(false);
const dialogKey = ref<DialogKey>('none')
const isConnectedToRPC = ref(false);
const isConnecting = ref(false);

// Search functionality
const searchQuery = shallowRef('');
const debouncedSearchQuery = refDebounced(searchQuery, 300)

const searchResultsIsOpen = ref(false);
const isOnSearchResults = ref(false);

// Game status
const currentlyPlaying = ref<string | null>(null);


onClickOutside(searchResultContainerRef, () => {
    searchResultsIsOpen.value = false;
})

// const searchResults = computed(() => {
//     if (!debouncedSearchQuery.value) return [];
//     const query = debouncedSearchQuery.value.toLowerCase();
//     return gameDB.value.filter(game =>
//         game.name.toLowerCase().includes(query) ||
//         game.aliases?.some(alias => alias.toLowerCase().includes(query))
//     );
// });

const COPYRIGHT_SYMBOL = '\u00A9';
const TRADEMARK_SYMBOL = '\u2122';
const REGISTERED_SYMBOL = '\u00AE';
const ignoredSymbols = [COPYRIGHT_SYMBOL, TRADEMARK_SYMBOL, REGISTERED_SYMBOL];
const ignoredSymbolsRegex = new RegExp(`[${ignoredSymbols.join('')}]`, 'g');
const fuseOptions = computed<UseFuseOptions<Game>>(() => ({
    fuseOptions: {
        // Prioritize name and aliases for searching, then lastly executables
        keys: [
            { name: 'name', weight: 0.7 },
            { name: 'aliases', weight: 0.2 },
            { name: 'executables.name', weight: 0.1 },
        ],
        getFn: (obj: any, path: string[] | string) => {
            const value = Fuse.config.getFn(obj, path);
            return typeof value === "string"
            ? value.replace(ignoredSymbolsRegex, "")
            : value;
        },
        isCaseSensitive: false,
        threshold: 0.5,        
        // A score of 0indicates a perfect match, while a score of 1 indicates a complete mismatch
        includeScore: true,
        includeMatches: false
    },
    resultLimit: 12,
    matchAllWhenSearchEmpty: false,
}));

const { results: searchResults } = useFuse(debouncedSearchQuery, gameDB, fuseOptions)

// Selected games list
const loadSavedGames = (): Game[] => {
    const saved = localStorage.getItem("dqc_game_list");
    if (!saved) return [];
    try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
            return parsed.map((game: Game) => {
                game.is_running = false;
                if (game.executables && Array.isArray(game.executables)) {
                    game.executables = game.executables.map((exe: GameExecutable) => ({
                        ...exe,
                        is_running: false
                    }));
                }
                return game;
            });
        }
    } catch (e) {
        console.error("Failed to parse stored game list", e);
    }
    return [];
};

const gameList = ref<Game[]>(loadSavedGames());
watch(gameList, (newVal) => {
    localStorage.setItem("dqc_game_list", JSON.stringify(newVal));
}, { deep: true });
// const selectedGame = ref<Game | null>(null);
const selectedGameId = ref<string | null | undefined>(null);

const selectedGame = computed(() => {
    if (!selectedGameId.value) return null;
    const found = gameList.value.find(g => g.uid === selectedGameId.value);
    console.log('selectedGame computed - selectedGameId:', selectedGameId.value, 'found:', found);
    return found || null;
});

function closeSearchResults() {
    searchResultsIsOpen.value = false;
}
function openSearchResults() {
    searchResultsIsOpen.value = true;
}

// Function to add a game to the selected list
function addGameToList(game: Game) {
    if (!gameList.value.some(g => g.id === game.id)) {
        gameList.value.push({
            uid: randomString(),
            ...game
        });
    }

    closeSearchResults();
}

const forceRerenderKey = ref(0); 
// Function to remove a game from the selected list
function removeGameFromList(game: Game) {
    const gameId = game.uid;
    gameList.value = gameList.value.filter(game => game.uid !== gameId);
    if (selectedGame.value?.uid === gameId) { 
        // selectedGame.value = null;
        selectedGameId.value = null;
        forceRerenderKey.value++; 
    }
}

function selectGame(game: Game) {
    // selectedGame.value = game;
    selectedGameId.value = game?.uid;
    searchResultsIsOpen.value = false;
}

function canCreateDummyGame(game: Game | null) {
    if (!game) {
        return false;
    }
    // we can only create a dummy game if the game is not installed or game is not running
    return !game.is_installed
}

function canPlayGame(game: Game | null) {
    if (!game) {
        return false;
    }
    // we can only play a game if the game is installed and not running
    return (game.is_installed && !game.is_running) ?? false;
}

function isExecutableRunning(executable: GameExecutable) {
    // Check if the executable is running
    return executable.is_running ?? false;
}
function isGameExecutableInstalled(executable: GameExecutable) {
    // Check if the executable is installed
    return executable.is_installed ?? false;
}

function isGameInstalled(game: Game | null) {
    if (!game) {
        return false;
    }
    // we can only play a game if the game is installed and not running
    return game.is_installed ?? false;
}


// Create a dummy game
async function createDummyGame(game: Game | null, executable: GameExecutable) {
    if (!game) {
        return;
    }
    const gameUid = game.uid;
    const gameToInstall = gameList.value.find(g => g.uid === gameUid);
    const executableItem = gameToInstall?.executables.find(exe => exe.name === executable.name);
    if (gameToInstall && executableItem) {
        const payload =  { 
            path: executable.path,
            executable_name: executable.filename,
            path_len: executable.segments,
            app_id: Number(gameToInstall.id),
        }
        console.log(payload);
        const result = await invoke('create_fake_game', payload)
        console.log('Game created:', result);
        gameToInstall.is_installed = true;
        executableItem.is_installed = true;
        return true;
    }
}


async function installAndPlay({game, executable}: {game: Game, executable: GameExecutable}) {
    if (!game) {
        return;
    }
    const gameCreated = await createDummyGame(game, executable);
    if (gameCreated) {
        playGame({game, executable});
    } else {
        console.error('Failed to create game');
        addLog('error', 'Failed to create game');
    }
}
// Play game function
async function playGame({game, executable}: {game: Game, executable: GameExecutable}) {
    if (!game) {
        return;
    }
    const gameUid = game.uid;
    try {
        console.log(`Playing game: ${gameUid}`);
        addLog('info', `Playing game: ${game.name}`);
        addLog('info', `Executable: ${executable.name}`);
        currentlyPlaying.value = game.id;
        // find the game in the list
        const gameToPlay = gameList.value.find(g => g.uid === gameUid);
        const executableItem = gameToPlay?.executables.find(exe => exe.name === executable.name);
        if (gameToPlay && executableItem) {
            const payload =  { 
                name: game.name,
                path: executable.path,
                executable_name: executable.filename,
                path_len: executable.segments,
                app_id: Number(gameToPlay.id),
                exec_path: path.join(executable.path!, executable.filename!),
            } 
            await invoke('run_background_process', payload);
            gameToPlay.is_running = true;
            executableItem.is_running = true; 
        }
        // In a real app, this would invoke a Tauri command to launch the game
       
    } catch (error) {
        console.error('Failed to launch game:', error);
    }
}

// Stop playing
async function stopPlaying({game, executable}: {game: Game, executable: GameExecutable}) {
    if (!game) {
        return;
    }
    console.log('Stopped playing game');
    const gameUid = game.uid;
    
    currentlyPlaying.value = null;
 
    const gameToPlay = gameList.value.find(g => g.uid === gameUid);
    const executableItem = gameToPlay?.executables.find(exe => exe.name === executable.name);
    if (gameToPlay && executableItem) {
        try {
            await invoke('stop_process', {
                exec_name: executable.filename!
            })
            addLog('info', `Stopped game process: ${game.name}`);
            addLog('info', `Stopped Executable: ${executable.name}`);
        } catch (error) {
            console.error('Failed to stop game process:', error);
            const errorMessage = (error instanceof Error) ? error.message : String(error);
            addLog('error', 'Failed to stop game process' + errorMessage);
            // Even if stopping fails, we still update the state
            gameToPlay.is_running = false;
            executableItem.is_running = false;
        } finally {
            gameToPlay.is_running = false;
            executableItem.is_running = false;
        }
    }
}

function getExecutables(game: Game) {
    return game.executables.map(exe => exe.name)
}

async function handleTestRPC(game: Game | null) {
    let state = isConnectedToRPC.value ? 'disconnect' : 'connect';

    console.log('Testing RPC for game:', game);
    if (!game && state === 'connect') {
        showDialog('no_game_selected');
        return;
    }
    if (state === 'disconnect' || isConnecting.value) {
        // await invoke('connect_to_discord_rpc_2', { app_id: "0", discord_state: "disconnect" })
        // invoke('connect_to_discord_rpc_3', {
        //     activity_json: JSON.stringify({
        //         app_id: selectedGame.value?.id
        //     }),
        //     action: 'disconnect',
        // })
        emit('event_disconnect');
        
        isConnectedToRPC.value = false;
        game!.is_running = false;
        currentlyPlaying.value = null;
        isConnecting.value = false;
        return;
    }
    showDialog('rpc_message_1');
}

async function continueRPCRisk(game: Game | null) {
    if (!game) {
        return;
    }
    const gameUid = game.uid;
    const gameToTest = gameList.value.find(g => g.uid === gameUid);
    if (gameToTest) {
        console.log('Testing RPC for game:', gameToTest);
        isConnecting.value = true;
        // invoke('connect_to_discord_rpc_2', { app_id: gameToTest.id, discord_state: "connect" })
        invoke('connect_to_discord_rpc_3', {
            activity_json: JSON.stringify({
                app_id: gameToTest.id,
            }),
            action: 'connect',
        })
        .then(() => {
            isConnectedToRPC.value = true;
            gameToTest.is_running = true;
            currentlyPlaying.value = gameToTest.id;
            isConnecting.value = false;
        })

        hideDialog();
    }
}

function handleSearchBlur() {
    setTimeout(() => {
        if (!isOnSearchResults.value) {
            searchResultsIsOpen.value = false;
        }
    }, 200);
}

function showDialog(message: DialogKey) {
    isDialogOpen.value = true;
    dialogMessage.value = message;
    dialogKey.value = message;
    if(!isEmpty(message)) {
        dialogRef.value?.showModal();
    }
}

function hideDialog() {
    dialogRef.value?.close(); 
    dialogMessage.value = '';
    isDialogOpen.value = false;
}


provide<GameActionsProvider>(GameActionsKey, {
    canPlayGame,
    isGameInstalled,
    isExecutableRunning,
    isGameExecutableInstalled,
});
</script>

<template>
    <div class="home-container">
        <!-- Dialog Modal -->
        <dialog id="dialog" class="dialog-modal" ref="dialogRef">
            <div class="dialog-inner">
                <div class="dialog-body">
                    <div v-if="dialogKey === 'rpc_message_1'">
                        <div class="dialog-warning-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>
                        <h3 class="dialog-title">Experimental Feature</h3>
                        <p class="dialog-text">This is only a feature in development.</p>
                        <p class="dialog-text" style="margin-top: 0.5rem;">
                            It works but due to the nature that it tricks Discord into thinking you are playing a game
                            by sending an RPC using actual game ID rather than letting Discord detect you have a game/application running.
                        </p>
                        <p class="dialog-text dialog-text--danger" style="margin-top: 0.75rem;">
                            This may flag your account as suspicious for self-botting.
                        </p>
                    </div>
                    <div v-if="dialogKey === 'no_game_selected'">
                        <div class="dialog-info-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                        </div>
                        <p class="dialog-text">No game selected. Please select a game from the list on the left.</p>
                    </div>
                </div>
                <div class="dialog-actions">
                    <button class="btn btn--ghost" @click="hideDialog()">
                        <span v-if="dialogKey == 'rpc_message_1'">Cancel</span>
                        <span v-else>OK</span>
                    </button>
                    <button
                        v-if="dialogKey === 'rpc_message_1'"
                        class="btn btn--danger"
                        @click="continueRPCRisk(selectedGame)">
                        Accept risk and continue
                    </button>
                </div>
            </div>
        </dialog>

        <!-- Page Header -->
        <h1 class="page-title">Handler</h1>

        <!-- Fetch Status Notifications -->
        <Transition
            enter-active-class="notif-enter-active"
            leave-active-class="notif-leave-active"
            enter-from-class="notif-enter-from"
            enter-to-class="notif-enter-to"
        >
            <div class="fetch-status-container" v-if="shouldShowNotificationContainer && !allFetchDone">
                <Transition
                    enter-active-class="notif-enter-active"
                    leave-active-class="notif-leave-active"
                    enter-from-class="notif-enter-from"
                    enter-to-class="notif-enter-to"
                >
                    <div v-if="isLoadingGH" class="fetch-status-item">
                        Fetching game list from GitHub mirror...
                        <span class="pulse-dot"></span>
                    </div>
                </Transition>
                <TimedNotification :is-ready="isReadyGH" :duration="1500" container-class="fetch-status-item">
                    Game list from mirror fetched <span class="check-mark">✓</span>
                </TimedNotification>

                <Transition
                    enter-active-class="notif-enter-active"
                    leave-active-class="notif-leave-active"
                    enter-from-class="notif-enter-from"
                    enter-to-class="notif-enter-to"
                >
                    <div v-if="isLoadingDiscord" class="fetch-status-item">
                        Fetching game list directly from Discord...
                        <span class="pulse-dot"></span>
                    </div>
                </Transition>
                <TimedNotification :is-ready="isReadyDiscord" :duration="1500" container-class="fetch-status-item">
                    Game list from Discord fetched <span class="check-mark">✓</span>
                </TimedNotification>

                <Transition
                    enter-active-class="notif-enter-active"
                    leave-active-class="notif-leave-active"
                    enter-from-class="notif-enter-from"
                    enter-to-class="notif-enter-to"
                >
                    <div v-if="isLoadingBundled" class="fetch-status-item">
                        Fetching game list from bundled game list...
                        <span class="pulse-dot"></span>
                    </div>
                </Transition>
                <TimedNotification :is-ready="isReadyBundled" :duration="1500" container-class="fetch-status-item">
                    Game list from bundle pre-loaded <span class="check-mark">✓</span>
                </TimedNotification>
            </div>
        </Transition>

        <!-- Search Bar -->
        <div class="search-section">
            <div class="search-wrapper" ref="searchResultContainerRef">
                <div class="search-input-row">
                    <input v-model="searchQuery" type="text" placeholder="Search Discord Verified games..."
                        class="search-input"
                        @focus="openSearchResults" @blur="handleSearchBlur" />
                    <button @click="fetchGameList()" class="refetch-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                        <span>Refetch</span>
                    </button>
                </div>
                <!-- Search Results Dropdown -->
                <div v-if="searchResultsIsOpen" @click="isOnSearchResults = true" class="search-dropdown">
                    <div v-if="searchResults.length > 0">
                        <div v-for="game in searchResults" :key="game.item.id" class="search-result-item">
                            <div class="search-result-info">
                                <div class="search-result-name">{{ game.item.name }}</div>
                                <div class="search-result-id">ID: {{ game.item.id }}</div>
                                <div class="search-result-exes">
                                    <ul>
                                        <li v-for="exe in game.item.executables" :key="exe.name">
                                            <span class="exe-label">{{ exe.name }}</span>
                                            <span class="exe-os">{{ exe.os }}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <button @click="addGameToList(game.item)" class="btn btn--accent btn--sm">
                                + Add
                            </button>
                        </div>
                    </div>
                    <div v-if="searchResults.length === 0" class="search-empty">
                        Search for games by name.<br>
                        Click "+ Add" to add them to your queue.
                    </div>
                </div>
            </div>
        </div>

        <!-- Two-Column Layout -->
        <div class="columns-grid">
            <!-- Left Column: Game Queue -->
            <div class="panel">
                <div class="panel-header">
                    <h2 class="panel-title">
                        <svg class="panel-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"/>
                            <line x1="8" y1="12" x2="21" y2="12"/>
                            <line x1="8" y1="18" x2="21" y2="18"/>
                            <line x1="3" y1="6" x2="3.01" y2="6"/>
                            <line x1="3" y1="12" x2="3.01" y2="12"/>
                            <line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                        Game Queue
                    </h2>
                    <span class="panel-badge" v-if="gameList.length > 0">{{ gameList.length }}</span>
                </div>

                <div v-if="gameList.length === 0" class="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 0.75rem;">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p>No games selected.</p>
                    <p class="empty-state-hint">Search and add games from the search bar above.</p>
                </div>

                <div v-else class="game-list">
                    <div v-for="game in gameList" :key="game.id"
                        class="game-item"
                        :class="{ 'game-item--selected': selectedGame?.uid === game.uid }"
                        @click="selectGame(game)"
                    >
                        <div class="game-item-main">
                            <div class="game-item-name-row">
                                <span class="game-item-name">{{ game.name }}</span>
                                <div class="verified-badge">
                                    <div class="verified-dot"></div>
                                    <IconVerified class="verified-icon"></IconVerified>
                                </div>
                            </div>
                            <button @click.stop="removeGameFromList(game)" class="remove-btn" v-if="!game.is_running">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div class="game-item-status" v-if="game.is_running">
                            <span class="running-indicator"></span>
                            <span class="running-text">Running</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Game Actions -->
            <div class="panel panel--actions" :key="forceRerenderKey">
                <div class="panel-header">
                    <h2 class="panel-title">
                        <svg class="panel-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Game Actions
                    </h2>
                </div>

                <div class="panel-body">
                    <!-- No game selected state -->
                    <div class="empty-state empty-state--compact" v-if="!selectedGame || selectedGame === null">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 0.5rem;">
                            <path d="M5 12h14"/>
                            <path d="M12 5v14"/>
                        </svg>
                        <p>Select a game from the queue to perform actions.</p>
                    </div>

                    <!-- Game info -->
                    <div v-if="selectedGame" class="game-info-card">
                        <div class="game-info-row">
                            <span class="game-info-label">Name</span>
                            <span class="game-info-value">{{ selectedGame.name }}</span>
                        </div>
                        <div class="game-info-row">
                            <span class="game-info-label">ID</span>
                            <span class="game-info-value game-info-value--mono">{{ selectedGame.id }}</span>
                        </div>
                        <div v-if="selectedGame.aliases && selectedGame.aliases.length > 0" class="game-info-row game-info-row--block">
                            <span class="game-info-label">Aliases</span>
                            <div class="alias-tags">
                                <span v-for="alias in selectedGame.aliases" :key="alias" class="alias-tag">{{ alias }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- RPC Button -->
                    <button @click="handleTestRPC(selectedGame)" class="btn btn--accent btn--full">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                            <line x1="16" y1="8" x2="2" y2="22"/>
                            <line x1="17.5" y1="15" x2="9" y2="15"/>
                        </svg>
                        {{ isConnecting || isConnectedToRPC ? 'Disconnect from Discord Gateway' : 'Test RPC Connection' }}
                    </button>

                    <div class="divider"></div>

                    <!-- Game Executables -->
                    <GameExecutables v-if="selectedGame" :game="selectedGame" 
                        @play="playGame"
                        @stop="stopPlaying"
                        @install_and_play="installAndPlay"
                    />
                </div>

                <!-- Divider -->
                <div class="border-t border-gray-200 dark:border-gray-700 my-5"></div>

                <div class="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 class="font-medium text-gray-800 dark:text-white mb-2">Status</h3>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Check Discord to see if it displays that you are playing a game.
                    </div>
                    <div v-if="currentlyPlaying" class="text-gray-500 dark:text-gray-400">
                        Currently playing: <span class="text-green-600"> {{gameList.find(g => g.id ===
                            currentlyPlaying)?.name }}</span>
                    </div>
                    <div v-else class="text-gray-500 dark:text-gray-400">
                        Not playing any game
                    </div>
                </div>

                <div v-if="selectedGame" class="my-4">
                    <h3 class="font-medium text-gray-800 dark:text-white mb-2">Game Info</h3>
                    <!-- Game info -->
                    <!-- <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    
                        <strong>Aliases:</strong>
                        <ul class="list-disc list-inside">
                            <li v-for="alias in selectedGame.aliases" :key="alias"
                                class="text-gray-500 dark:text-gray-400">
                                <span class="font-mono">{{ alias }}</span>
                            </li>
                        </ul>
                        <strong>Executables:</strong>
                        <ul class="list-disc list-inside">
                            <li v-for="exe in getExecutables(selectedGame)" :key="exe"
                                class="text-gray-500 dark:text-gray-400">
                                <span class="font-mono">{{ exe }}</span>
                            </li>
                        </ul>
                    </div> -->
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../theme/style.css";

/* ═══════════════════════════════════════
   COLOR TOKENS (matching MainLayout.vue)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   PAGE CONTAINER
   ═══════════════════════════════════════ */
.home-container {
    padding: 2rem 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
}

/* ═══════════════════════════════════════
   PAGE TITLE
   ═══════════════════════════════════════ */
.page-title {
    font-size: 1.75rem;
    font-weight: 800;
    text-align: center;
    margin-bottom: 1.75rem;
    letter-spacing: 0.03em;
    background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #5865f2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* ═══════════════════════════════════════
   FETCH STATUS NOTIFICATIONS
   ═══════════════════════════════════════ */
.fetch-status-container {
    position: absolute;
    top: 0.75rem;
    left: 1rem;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.fetch-status-item {
    font-size: 0.8rem;
    color: #8e9297;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: #15151e;
    border: 1px solid #2e2e3d;
    border-radius: 999px;
    white-space: nowrap;
}

.pulse-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #57f287;
    animation: pulse-glow 1.5s ease-in-out infinite;
}

.check-mark {
    color: #57f287;
    font-weight: 600;
}

/* Notification transitions */
.notif-enter-active {
    transition: all 0.3s ease-out 0.1s;
}
.notif-leave-active {
    transition: all 0.4s ease-in 0.1s;
}
.notif-enter-from {
    opacity: 0;
    transform: translateY(6px);
}
.notif-enter-to {
    opacity: 1;
    transform: translateY(0);
}

@keyframes pulse-glow {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(87, 242, 135, 0.4); }
    50% { opacity: 0.6; box-shadow: 0 0 6px 2px rgba(87, 242, 135, 0.2); }
}

/* ═══════════════════════════════════════
   SEARCH BAR
   ═══════════════════════════════════════ */
.search-section {
    margin-bottom: 1.75rem;
}

.search-wrapper {
    position: relative;
}

.search-input-row {
    position: relative;
    display: flex;
    align-items: center;
}

.search-input {
    width: 100%;
    padding: 0.7rem 1rem;
    padding-right: 7rem;
    background: #1a1a24;
    border: 1px solid #2e2e3d;
    border-radius: 0.5rem;
    color: #f2f3f5;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.25s ease;
}

.search-input::placeholder {
    color: #6a6d72;
}

.search-input:focus {
    border-color: #5865f2;
    box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.35), 0 0 20px rgba(88, 101, 242, 0.15);
}

.refetch-btn {
    position: absolute;
    right: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.65rem;
    background: transparent;
    border: 1px solid #2e2e3d;
    border-radius: 0.375rem;
    color: #8e9297;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.refetch-btn:hover {
    background: #22222e;
    color: #f2f3f5;
    border-color: #3a3a4d;
}

/* ═══════════════════════════════════════
   SEARCH DROPDOWN
   ═══════════════════════════════════════ */
.search-dropdown {
    position: absolute;
    z-index: 50;
    margin-top: 0.375rem;
    width: 100%;
    background: #1a1a24;
    border: 1px solid #2e2e3d;
    border-radius: 0.5rem;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    max-height: 320px;
    overflow-y: auto;
}

.search-dropdown::-webkit-scrollbar {
    width: 6px;
}
.search-dropdown::-webkit-scrollbar-track {
    background: transparent;
}
.search-dropdown::-webkit-scrollbar-thumb {
    background: #2e2e3d;
    border-radius: 3px;
}
.search-dropdown::-webkit-scrollbar-thumb:hover {
    background: #5865f2;
}

.search-result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #2e2e3d;
    transition: background 0.15s ease;
    cursor: default;
}

.search-result-item:last-child {
    border-bottom: none;
}

.search-result-item:hover {
    background: #22222e;
}

.search-result-info {
    flex: 1;
    min-width: 0;
}

.search-result-name {
    font-weight: 600;
    color: #f2f3f5;
    font-size: 0.9rem;
}

.search-result-id {
    font-size: 0.75rem;
    color: #6a6d72;
    margin-top: 0.125rem;
}

.search-result-exes {
    margin-top: 0.375rem;
}

.search-result-exes ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
}

.search-result-exes li {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    background: #15151e;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    border: 1px solid #2e2e3d;
}

.exe-label {
    color: #8e9297;
    font-family: 'Consolas', 'Monaco', monospace;
}

.exe-os {
    color: #6a6d72;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.search-empty {
    padding: 1.5rem;
    text-align: center;
    color: #6a6d72;
    font-size: 0.85rem;
    line-height: 1.5;
}

/* ═══════════════════════════════════════
   COLUMNS LAYOUT
   ═══════════════════════════════════════ */
.columns-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    position: relative;
}

@media (min-width: 768px) {
    .columns-grid {
        grid-template-columns: 1fr 1fr;
    }
}

/* ═══════════════════════════════════════
   PANEL (shared card style)
   ═══════════════════════════════════════ */
.panel {
    background: #1a1a24;
    border: 1px solid #2e2e3d;
    border-radius: 0.625rem;
    overflow: hidden;
}

.panel--actions {
    align-self: start;
    position: sticky;
    top: 1rem;
}

@media (max-width: 767px) {
    .panel--actions {
        position: static;
    }
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #2e2e3d;
}

.panel-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #f2f3f5;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
}

.panel-title-icon {
    color: #5865f2;
    flex-shrink: 0;
}

.panel-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.4rem;
    border-radius: 999px;
    background: #5865f2;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
}

.panel-body {
    padding: 1rem 1.25rem;
}

/* ═══════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════ */
.empty-state {
    text-align: center;
    padding: 2.5rem 1rem;
    color: #8e9297;
    font-size: 0.875rem;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.empty-state--compact {
    padding: 1.5rem 1rem;
}

.empty-state-hint {
    color: #6a6d72;
    font-size: 0.8rem;
    margin-top: 0.25rem;
}

/* ═══════════════════════════════════════
   GAME LIST (left panel)
   ═══════════════════════════════════════ */
.game-list {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.game-item {
    padding: 0.75rem 1rem;
    border: 1px solid #2e2e3d;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: transparent;
}

.game-item:hover {
    background: #22222e;
    border-color: #3a3a4d;
}

.game-item--selected {
    border-color: #5865f2;
    background: rgba(88, 101, 242, 0.08);
    box-shadow: 0 0 12px rgba(88, 101, 242, 0.35), inset 0 0 0 1px rgba(88, 101, 242, 0.15);
}

.game-item--selected:hover {
    background: rgba(88, 101, 242, 0.12);
}

.game-item-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.game-item-name-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
}

.game-item-name {
    font-weight: 600;
    color: #f2f3f5;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.verified-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
}

.verified-dot {
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

.verified-icon {
    width: 1.125rem;
    height: 1.125rem;
    color: #5865f2;
    position: relative;
}

.remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.375rem;
    border: none;
    background: transparent;
    color: #a83234;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.remove-btn:hover {
    background: rgba(237, 66, 69, 0.12);
    color: #ed4245;
}

.game-item-status {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.375rem;
}

.running-indicator {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #57f287;
    box-shadow: 0 0 6px rgba(87, 242, 135, 0.5);
    animation: pulse-glow-green 2s ease-in-out infinite;
}

.running-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: #57f287;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

@keyframes pulse-glow-green {
    0%, 100% { box-shadow: 0 0 4px rgba(87, 242, 135, 0.4); }
    50% { box-shadow: 0 0 10px rgba(87, 242, 135, 0.7); }
}

/* ═══════════════════════════════════════
   GAME INFO CARD (right panel)
   ═══════════════════════════════════════ */
.game-info-card {
    background: #15151e;
    border: 1px solid #2e2e3d;
    border-radius: 0.5rem;
    padding: 0.875rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.game-info-row {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
}

.game-info-row--block {
    flex-direction: column;
    gap: 0.375rem;
}

.game-info-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #6a6d72;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    flex-shrink: 0;
    min-width: 3rem;
}

.game-info-value {
    font-size: 0.85rem;
    color: #f2f3f5;
    font-weight: 500;
}

.game-info-value--mono {
    font-family: 'Consolas', 'Monaco', monospace;
    color: #8e9297;
    font-size: 0.8rem;
}

.alias-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.alias-tag {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: #22222e;
    border: 1px solid #2e2e3d;
    color: #8e9297;
    font-size: 0.75rem;
    font-family: 'Consolas', 'Monaco', monospace;
}

/* ═══════════════════════════════════════
   BUTTONS
   ═══════════════════════════════════════ */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.btn--accent {
    background: #5865f2;
    color: #fff;
}

.btn--accent:hover {
    background: #4752c4;
    box-shadow: 0 4px 12px rgba(88, 101, 242, 0.35);
}

.btn--ghost {
    background: transparent;
    border: 1px solid #2e2e3d;
    color: #8e9297;
}

.btn--ghost:hover {
    background: #22222e;
    color: #f2f3f5;
    border-color: #3a3a4d;
}

.btn--danger {
    background: rgba(237, 66, 69, 0.15);
    border: 1px solid rgba(237, 66, 69, 0.3);
    color: #ed4245;
}

.btn--danger:hover {
    background: rgba(237, 66, 69, 0.25);
    box-shadow: 0 4px 12px rgba(237, 66, 69, 0.2);
}

.btn--full {
    width: 100%;
}

.btn--sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
    border-radius: 0.375rem;
    flex-shrink: 0;
}

/* ═══════════════════════════════════════
   DIVIDER
   ═══════════════════════════════════════ */
.divider {
    height: 1px;
    background: #2e2e3d;
    margin: 1rem 0;
}

/* ═══════════════════════════════════════
   STATUS CARD
   ═══════════════════════════════════════ */
.status-card {
    margin: 1rem 1.25rem;
    padding: 1rem;
    background: #15151e;
    border: 1px solid #2e2e3d;
    border-radius: 0.5rem;
}

.status-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: #f2f3f5;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.status-hint {
    font-size: 0.78rem;
    color: #6a6d72;
    margin-bottom: 0.75rem;
    line-height: 1.4;
}

.status-playing {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #8e9297;
}

.status-game-name {
    color: #57f287;
    font-weight: 600;
}

.status-idle {
    font-size: 0.85rem;
    color: #6a6d72;
    font-style: italic;
}

/* ═══════════════════════════════════════
   GAME INFO FOOTER
   ═══════════════════════════════════════ */
.game-info-footer {
    padding: 0.75rem 1.25rem 1rem;
}

.game-info-footer-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f2f3f5;
}

/* ═══════════════════════════════════════
   DIALOG MODAL
   ═══════════════════════════════════════ */
.dialog-modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: #1a1a24;
    border: 1px solid #2e2e3d;
    border-radius: 0.75rem;
    padding: 0;
    max-width: 440px;
    width: calc(100% - 2rem);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
    color: #f2f3f5;
    z-index: 100;
}

.dialog-modal::backdrop {
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}

.dialog-inner {
    padding: 1.75rem;
}

.dialog-body {
    margin-bottom: 1.5rem;
}

.dialog-warning-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    background: rgba(237, 66, 69, 0.12);
    color: #ed4245;
    margin-bottom: 1rem;
}

.dialog-info-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    background: rgba(88, 101, 242, 0.12);
    color: #5865f2;
    margin-bottom: 1rem;
}

.dialog-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #f2f3f5;
    margin-bottom: 0.75rem;
}

.dialog-text {
    font-size: 0.875rem;
    color: #8e9297;
    line-height: 1.6;
}

.dialog-text--danger {
    color: #ed4245;
    font-weight: 500;
}

.dialog-actions {
    display: flex;
    gap: 0.625rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid #2e2e3d;
}
</style>