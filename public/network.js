const socket = io();

const Network = {
    hostRoom: (username) => socket.emit('create_room', username),
    joinRoom: (roomId, username) => socket.emit('join_room', { roomId, username }),
    updateCosmetics: (cosmetics) => socket.emit('update_player_cosmetics', cosmetics),
    sendEmote: (emote) => socket.emit('trigger_emote', emote),
    startGame: (config) => socket.emit('start_game_signal', config),
    sendInputVector: (vx, vy) => socket.emit('input_vector', { vx, vy }),
    sendHeartbeat: () => socket.emit('lobby_heartbeat'),
    
    // DIRECT HOOK LINKS: Passes data vectors straight into callbacks without secondary bundling wrappers
    onRoomCreated: (callback) => socket.on('room_created', callback),
    onRoomUpdated: (callback) => socket.on('room_updated', callback),
    onGameStarted: (callback) => socket.on('game_started', callback),
    onPositionsUpdated: (callback) => socket.on('positions_updated', callback),
    onItemsUpdated: (callback) => socket.on('items_updated', callback),
    onBombPassed: (callback) => socket.on('bomb_passed', callback),
    onTimerTick: (callback) => socket.on('timer_tick', callback),
    onGameOver: (callback) => socket.on('game_over', callback),
    onEmoteTriggered: (callback) => socket.on('emote_triggered_global', callback),
    onPowerupCollectedGlobal: (callback) => socket.on('powerup_collected_global', callback),
    onBombDetonatedPulse: (callback) => socket.on('bomb_detonated_pulse', callback),
    onPreMatchCountdown: (callback) => socket.on('pre_match_countdown', callback),
    onMatchBeginPulse: (callback) => socket.on('match_begin_pulse', callback),
    onJoinDenied: (callback) => socket.on('join_denied', callback)
};

window.Network = Network;
console.log("Network.js: Standardized direct transaction mappings deployed.");
