let currentPositions = {};
let targetPositions = {};
let gameObstacles = [];
let currentPowerups = [];
let canvasExplosionParticles = [];
let keysPressed = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, s: false, a: false, d: false };
let preMatchPopup, popupCountdownNumber, popupCarrierNotice, glowIndicator;

let joystickActive = false;
let activeTouchId = null;

let bombCanvas, ctx;
let deviceSelectScreen, menuScreen, lobbyScreen, gameScreen, leaderboardScreen, podiumRowsContainer, btnReturnLobby, btnLeaveLobby, btnQuitGame;
let btnHost, btnJoin, btnStart, btnEmoteToggle, emoteDrawerPanel;
let inputUsername, inputRoom, displayRoomId, playerList, waitMessage, gameTimer, gameTickerMessage;
let joystickZone, joystickStick;
let selectTerrain, selectDifficulty, selectFace, selectHat, colorShirt;
let hostSettingsPanel = null;

let myUsername = "";
let isHostUser = false;
let explosionActive = false;

let pulseTime = 0; 
let flashOverlayActive = false;
let flashOverlayAlpha = 0.0;
let playerTrails = {};
let mapW = 1400, mapH = 1000;
let heartbeatTimer = null;

let spectatorTargetName = ""; 
let manualSpectatorOverride = false;

document.addEventListener("DOMContentLoaded", () => {
    deviceSelectScreen = document.getElementById('device-select-screen');

    preMatchPopup = document.getElementById('pre-match-popup');
    popupCountdownNumber = document.getElementById('popup-countdown-number');
    popupCarrierNotice = document.getElementById('popup-carrier-notice');
    bombCanvas = document.getElementById('bomb-canvas');
    ctx = bombCanvas ? bombCanvas.getContext('2d') : null;
    glowIndicator = document.getElementById('glow-indicator');

    menuScreen = document.getElementById('menu-screen');
    lobbyScreen = document.getElementById('lobby-screen');
    gameScreen = document.getElementById('game-screen');
    leaderboardScreen = document.getElementById('leaderboard-screen');
    podiumRowsContainer = document.getElementById('podium-rows-container');
    btnReturnLobby = document.getElementById('btn-return-lobby');
    btnLeaveLobby = document.getElementById('btn-leave-lobby');
    btnQuitGame = document.getElementById('btn-quit-game');
    
    btnEmoteToggle = document.getElementById('btn-emote-toggle');
    emoteDrawerPanel = document.getElementById('emote-drawer-panel');

    btnHost = document.getElementById('btn-host');
    btnJoin = document.getElementById('btn-join');
    btnStart = document.getElementById('btn-start');

    inputUsername = document.getElementById('input-username');
    inputRoom = document.getElementById('input-room');
    displayRoomId = document.getElementById('display-room-id');
    playerList = document.getElementById('player-list');
    waitMessage = document.getElementById('wait-message');
    gameTimer = document.getElementById('game-timer');
    gameTickerMessage = document.getElementById('game-ticker-message');

    joystickZone = document.getElementById('joystick-zone');
    joystickStick = document.getElementById('joystick-stick');

    hostSettingsPanel = document.getElementById('host-settings-panel');
    selectTerrain = document.getElementById('select-terrain');
    selectDifficulty = document.getElementById('select-difficulty');
    selectFace = document.getElementById('select-face');
    selectHat = document.getElementById('select-hat');
    colorShirt = document.getElementById('color-shirt');

    initDeviceSelectorListeners();
    initUIInteractionListeners();
    initSpectatorPOVListeners();
    resizeGameView();
    window.addEventListener('resize', resizeGameView);
});

function initDeviceSelectorListeners() {
    document.querySelectorAll('.device-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chosenLayout = btn.getAttribute('data-layout');
            document.body.setAttribute('data-device-layout', chosenLayout);
            if (deviceSelectScreen) deviceSelectScreen.classList.add('hidden');
            if (menuScreen) menuScreen.classList.remove('hidden');
            resizeGameView();
        });
    });
}

function resizeGameView() {
    if (!bombCanvas) return;
    bombCanvas.width = 1400;
    bombCanvas.height = 1000;
}

function triggerMobileVibration(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern || 150);
    }
}

function sendCosmeticsUpdate() {
    if (myUsername && !currentPositions[myUsername]) {
        currentPositions[myUsername] = {};
    }
    if (myUsername && currentPositions[myUsername]) {
        currentPositions[myUsername].face = selectFace.value;
        currentPositions[myUsername].hat = selectHat.value;
        currentPositions[myUsername].shirt = colorShirt.value;
    }

    if (window.Network && typeof window.Network.updateCosmetics === 'function' && selectFace && selectHat && colorShirt) {
        window.Network.updateCosmetics({
            face: selectFace.value,
            hat: selectHat.value,
            shirt: colorShirt.value
        });
    }

    if (lobbyScreen && !lobbyScreen.classList.contains('hidden')) {
        updatePlayerLobbyUI(Object.keys(currentPositions));
    }
}

function initSpectatorPOVListeners() {
    const processPOVChange = (e) => {
        let localPlayer = currentPositions[myUsername];
        if (!localPlayer || !localPlayer.isDead) return;

        if (e.target.tagName === 'BUTTON' || e.target.closest('#game-ui-overlay')) return;

        let aliveSurvivors = Object.keys(currentPositions).filter(name => currentPositions[name] && !currentPositions[name].isDead);
        if (aliveSurvivors.length === 0) return;

        manualSpectatorOverride = true;

        let currentTargetIdx = aliveSurvivors.indexOf(spectatorTargetName);
        let nextTargetIdx = (currentTargetIdx + 1) % aliveSurvivors.length;
        
        spectatorTargetName = aliveSurvivors[nextTargetIdx];
        triggerMobileVibration(40);
    };

    if (bombCanvas) {
        bombCanvas.addEventListener('click', processPOVChange);
        bombCanvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                processPOVChange(e);
            }
        });
    }
}

function initUIInteractionListeners() {
    if (btnHost) {
        btnHost.addEventListener('click', () => { 
            const name = inputUsername ? inputUsername.value.trim() : ""; 
            if (name !== '') { 
                myUsername = name; 
                isHostUser = true; 
                if (menuScreen) menuScreen.classList.add('hidden');
                if (lobbyScreen) lobbyScreen.classList.remove('hidden');
                if (displayRoomId) displayRoomId.innerText = `Arena Room Code: LINKING...`;
                
                if (window.Network && typeof window.Network.hostRoom === 'function') {
                    window.Network.hostRoom(name); 
                    startLobbyHeartbeat();
                } else {
                    const networkCheckInterval = setInterval(() => {
                        if (window.Network && typeof window.Network.hostRoom === 'function') {
                            window.Network.hostRoom(name);
                            startLobbyHeartbeat();
                            clearInterval(networkCheckInterval);
                        }
                    }, 50);
                }
            } else {
                alert("Please enter a username first!");
            }
        });
    }
    
    if (btnJoin) {
        btnJoin.addEventListener('click', () => { 
            const name = inputUsername ? inputUsername.value.trim() : "";
            const code = inputRoom ? inputRoom.value.trim() : ""; 
            if (code.length === 4 && name !== '') { 
                myUsername = name; 
                isHostUser = false; 
                if (window.Network && typeof window.Network.joinRoom === 'function') {
                    window.Network.joinRoom(code, name); 
                } else {
                    const networkCheckInterval = setInterval(() => {
                        if (window.Network && typeof window.Network.joinRoom === 'function') {
                            window.Network.joinRoom(code, name);
                            clearInterval(networkCheckInterval);
                        }
                    }, 50);
                }
            } else {
                alert("Please enter a username and a valid 4-digit room code!");
            }
        });
    }

    if (selectFace) selectFace.addEventListener('change', sendCosmeticsUpdate);
    if (selectHat) selectHat.addEventListener('change', sendCosmeticsUpdate);
    if (colorShirt) colorShirt.addEventListener('input', sendCosmeticsUpdate);

    if (btnEmoteToggle && emoteDrawerPanel) {
        btnEmoteToggle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            emoteDrawerPanel.classList.toggle('hidden');
        });
        btnEmoteToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            emoteDrawerPanel.classList.toggle('hidden');
        });
    }

    document.addEventListener('touchstart', (e) => {
        if (emoteDrawerPanel && !emoteDrawerPanel.classList.contains('hidden') && e.target !== btnEmoteToggle) {
            emoteDrawerPanel.classList.add('hidden');
        }
    });
    document.addEventListener('click', (e) => {
        if (emoteDrawerPanel && !emoteDrawerPanel.classList.contains('hidden') && e.target !== btnEmoteToggle) {
            emoteDrawerPanel.classList.add('hidden');
        }
    });

    document.body.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('btn-emote-trigger')) {
            e.stopPropagation();
            e.preventDefault();
            if (window.Network && typeof window.Network.sendEmote === 'function') {
                window.Network.sendEmote(e.target.innerText);
            }
if (emoteDrawerPanel) emoteDrawerPanel.classList.add('hidden');
}
});
document.querySelectorAll('.btn-emote-trigger').forEach(btn => {
btn.addEventListener('click', (e) => {
e.stopPropagation();
if (window.Network && typeof window.Network.sendEmote === 'function') {
window.Network.sendEmote(btn.innerText);
}
if (emoteDrawerPanel) emoteDrawerPanel.classList.add('hidden');
});
});
if (btnStart) {
btnStart.addEventListener('click', () => {
if (window.Network && typeof window.Network.startGame === 'function' && selectTerrain && selectDifficulty) {
window.Network.startGame({
terrain: selectTerrain.value,
difficulty: selectDifficulty.value
});
}
});
}
if (btnReturnLobby) {
btnReturnLobby.addEventListener('click', () => {
if (leaderboardScreen) leaderboardScreen.classList.add('hidden');
if (lobbyScreen) lobbyScreen.classList.remove('hidden');
startLobbyHeartbeat();
});
}
if (btnLeaveLobby) {
btnLeaveLobby.addEventListener('click', () => {
location.reload();
});
}
if (btnQuitGame) {
btnQuitGame.addEventListener('touchstart', (e) => {
e.stopPropagation();
location.reload();
});
btnQuitGame.addEventListener('click', () => {
location.reload();
});
}
window.addEventListener('keydown', (e) => {
let k = e.key;
if (k === 'ArrowUp' || k === 'w') keysPressed.ArrowUp = true;
if (k === 'ArrowDown' || k === 's') keysPressed.ArrowDown = true;
if (k === 'ArrowLeft' || k === 'a') keysPressed.ArrowLeft = true;
if (k === 'ArrowRight' || k === 'd') keysPressed.ArrowRight = true;
updateKeyboardInput();
});
window.addEventListener('keyup', (e) => {
let k = e.key;
if (k === 'ArrowUp' || k === 'w') keysPressed.ArrowUp = false;
if (k === 'ArrowDown' || k === 's') keysPressed.ArrowDown = false;
if (k === 'ArrowLeft' || k === 'a') keysPressed.ArrowLeft = false;
if (k === 'ArrowRight' || k === 'd') keysPressed.ArrowRight = false;
updateKeyboardInput();
});
if (joystickZone) {
joystickZone.addEventListener('touchstart', (e) => {
e.preventDefault();
if (joystickActive || !e.changedTouches.length) return;
const touch = e.changedTouches[0];
joystickActive = true;
activeTouchId = touch.identifier;
handleJoystickMove(touch);
}, { passive: false });
joystickZone.addEventListener('touchmove', (e) => {
e.preventDefault();
if (!joystickActive) return;
for (let i = 0; i < e.touches.length; i++) {
if (e.touches[i].identifier === activeTouchId) {
handleJoystickMove(e.touches[i]);
break;
}
}
}, { passive: false });
joystickZone.addEventListener('touchend', handleJoystickEnd);
joystickZone.addEventListener('touchcancel', handleJoystickEnd);
}
}
function startLobbyHeartbeat() {
if (heartbeatTimer) clearInterval(heartbeatTimer);
heartbeatTimer = setInterval(() => {
if (window.Network && typeof window.Network.sendHeartbeat === 'function') {
window.Network.sendHeartbeat();
}
}, 3000);
}
function stopLobbyHeartbeat() {
if (heartbeatTimer) {
clearInterval(heartbeatTimer);
heartbeatTimer = null;
}
}
function updateKeyboardInput() {
let vx = 0, vy = 0;
if (keysPressed.ArrowUp) vy -= 1;
if (keysPressed.ArrowDown) vy += 1;
if (keysPressed.ArrowLeft) vx -= 1;
if (keysPressed.ArrowRight) vx += 1;
const mag = Math.sqrt(vx * vx + vy * vy);
if (mag > 0) { vx /= mag; vy /= mag; }
if (window.Network && typeof window.Network.sendInputVector === 'function') window.Network.sendInputVector(vx, vy);
}
function handleJoystickMove(touch) {
if (!joystickZone || !joystickStick) return;
const rect = joystickZone.getBoundingClientRect();
const centerX = rect.left + rect.width / 2;
const centerY = rect.top + rect.height / 2;
let dx = touch.clientX - centerX;
let dy = touch.clientY - centerY;
const maxRadius = rect.width / 2;
const dist = Math.sqrt(dx * dx + dy * dy);
if (dist > maxRadius) {
dx = (dx / dist) * maxRadius;
dy = (dy / dist) * maxRadius;
}
joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
const normX = dist > 0 ? dx / maxRadius : 0;
const normY = dist > 0 ? dy / maxRadius : 0;
if (window.Network && typeof window.Network.sendInputVector === 'function') window.Network.sendInputVector(normX, normY);
}
function handleJoystickEnd(e) {
if (!joystickActive) return;
let ended = false;
for (let i = 0; i < e.changedTouches.length; i++) {
if (e.changedTouches[i].identifier === activeTouchId) {
ended = true;
break;
}
}
if (e.touches.length === 0) {
ended = true;
}
if (ended) {
joystickActive = false;
activeTouchId = null;
if (joystickStick) joystickStick.style.transform = 'translate(-50%, -50%)';
if (window.Network && typeof window.Network.sendInputVector === 'function') window.Network.sendInputVector(0, 0);
}
}
function spawnExplosionShockwave(origins) {
flashOverlayActive = true;
flashOverlayAlpha = 0.85;
origins.forEach(src => {
for (let i = 0; i < 75; i++) {
let angle = Math.random() * Math.PI * 2;
let force = 6 + Math.random() * 18;
canvasExplosionParticles.push({
x: src.x, y: src.y,
vx: Math.cos(angle) * force, vy: Math.sin(angle) * force,
size: 8 + Math.random() * 14,
hue: Math.random() < 0.5 ? '#ff3b30' : (Math.random() < 0.5 ? '#ff9500' : '#ffcc00'),
opacity: 1.0, decay: 0.015 + Math.random() * 0.02
});
}
});
}
const checkNetworkHooks = setInterval(() => {
if (window.Network) {
clearInterval(checkNetworkHooks);
setupNetworkListeners();
}
}, 50);
function setupNetworkListeners() {
window.Network.onRoomCreated((data) => {
if (menuScreen) menuScreen.classList.add('hidden');
if (lobbyScreen) lobbyScreen.classList.remove('hidden');
if (displayRoomId) displayRoomId.innerText = `Arena Room Code: ${data.roomId}`;
if (isHostUser) {
if (btnStart) btnStart.classList.remove('hidden');
if (waitMessage) waitMessage.classList.add('hidden');
if (hostSettingsPanel) hostSettingsPanel.classList.remove('hidden');
}
if (data.players && Array.isArray(data.players)) {
data.players.forEach(p => {
if (!currentPositions[p]) currentPositions[p] = {};
});
}
sendCosmeticsUpdate();
updatePlayerLobbyUI(data.players);
});
window.Network.onRoomUpdated((data) => {
if (menuScreen) menuScreen.classList.add('hidden');
if (lobbyScreen) lobbyScreen.classList.remove('hidden');
if (displayRoomId) displayRoomId.innerText = `Arena Room Code: ${data.roomId}`;
if (isHostUser) {
if (btnStart) btnStart.classList.remove('hidden');
if (waitMessage) waitMessage.classList.add('hidden');
if (hostSettingsPanel) hostSettingsPanel.classList.remove('hidden');
} else {
if (btnStart) btnStart.classList.add('hidden');
if (waitMessage) waitMessage.classList.remove('hidden');
if (hostSettingsPanel) hostSettingsPanel.classList.add('hidden');
}
if (data.players && Array.isArray(data.players)) {
data.players.forEach(p => {
if (!currentPositions[p]) currentPositions[p] = {};
});
}
sendCosmeticsUpdate();
updatePlayerLobbyUI(data.players);
});
window.Network.onJoinDenied((data) => {
alert(data.message);
location.reload();
});
window.Network.onGameStarted((data) => {
if (heartbeatTimer) {
clearInterval(heartbeatTimer);
heartbeatTimer = null;
}
let realData = (data && data.obstacles) ? data : (data && data.data ? data.data : data);
gameObstacles = realData.obstacles || [];
mapW = realData.mapWidth || 1400;
mapH = realData.mapHeight || 1000;
if (window.Renderer) {
window.Renderer.activeTerrain = realData.terrain || 'cyber';
window.Renderer.mapW = mapW;
window.Renderer.mapH = mapH;
}
explosionActive = false;
playerTrails = {};
canvasExplosionParticles = [];
flashOverlayActive = false;
flashOverlayAlpha = 0.0;
manualSpectatorOverride = false;
spectatorTargetName = "";
if (lobbyScreen) lobbyScreen.classList.add('hidden');
if (gameScreen) gameScreen.classList.remove('hidden');
resizeGameView();
requestAnimationFrame(renderLoop);
});
window.Network.onTimerTick((data) => {
let realTick = (data && data.seconds !== undefined) ? data.seconds : (data && data.data && data.data.seconds !== undefined ? data.data.seconds : data);
if (gameTimer) gameTimer.innerText = `FUSE: ${realTick}s`;
});
window.Network.onPositionsUpdated((data) => {
let incomingPositions = (data && data.positions) ? data.positions : (data && data.data && data.data.positions ? data.data.positions : data);
if (!incomingPositions || typeof incomingPositions !== 'object') return;
targetPositions = incomingPositions;
for (let name in targetPositions) {
if (!currentPositions[name]) {
currentPositions[name] = { ...targetPositions[name] };
} else {
currentPositions[name].isIt = targetPositions[name].isIt;
currentPositions[name].isDead = targetPositions[name].isDead;
currentPositions[name].shirt = targetPositions[name].shirt;
currentPositions[name].face = targetPositions[name].face;
currentPositions[name].hat = targetPositions[name].hat;
currentPositions[name].hasShield = targetPositions[name].hasShield;
currentPositions[name].x = targetPositions[name].x;
currentPositions[name].y = targetPositions[name].y;
}
}
if (lobbyScreen && !lobbyScreen.classList.contains('hidden')) {
let activeNames = Object.keys(targetPositions);
updatePlayerLobbyUI(activeNames);
}
if (explosionActive) return;
const holdingBomb = !!currentPositions[myUsername]?.isIt;
if (glowIndicator) {
if (holdingBomb) glowIndicator.className = "it-glow";
else glowIndicator.className = "safe-glow";
}
if (typeof manageBombSound === 'function') {
manageBombSound(holdingBomb);
}
});
window.Network.onBombPassed((data) => {
let realPassed = (data && data.from) ? data : (data && data.data ? data.data : data);
if (gameTickerMessage && realPassed) gameTickerMessage.innerText = `💥 ${realPassed.from} tagged ${realPassed.to}!`;
triggerMobileVibration(120);
if (realPassed && realPassed.to === myUsername) {
triggerMobileVibration();
if (typeof playCountdownTickSound === 'function') {
playCountdownTickSound(true);
}
}
});
window.Network.onGameOver((data) => {
let realOver = (data && data.stats) ? data : (data && data.data ? data.data : data);
explosionActive = true;
if (glowIndicator) glowIndicator.className = "";
triggerMobileVibration();
if (typeof manageBombSound === 'function') {
manageBombSound(false);
}
setTimeout(() => {
if (gameScreen) gameScreen.classList.add('hidden');
if (leaderboardScreen) leaderboardScreen.classList.remove('hidden');
if (podiumRowsContainer && realOver && realOver.stats) {
podiumRowsContainer.innerHTML = '';
realOver.stats.forEach((row, idx) => {
const item = document.createElement('div');
item.className = 'podium-row';
const sym = idx === 0 ? '👑' : (row.isLoser ? '💥' : '🎮');
item.innerHTML = `<span>${sym} ${row.name}</span> <small>Held: ${Math.floor(row.score)}s</small>`;
podiumRowsContainer.appendChild(item);
});
}
}, 1200);
});
window.Network.onItemsUpdated((data) => {
let realItems = (data && data.powerups) ? data.powerups : (data && data.data && data.data.powerups ? data.data.powerups : data);
currentPowerups = Array.isArray(realItems) ? realItems : [];
});
window.Network.onEmoteTriggered((data) => {
let realEmote = (data && data.username) ? data : (data && data.data ? data.data : data);
if (realEmote && currentPositions[realEmote.username]) {
currentPositions[realEmote.username].activeEmote = realEmote.emote;
currentPositions[realEmote.username].emoteExpiry = Date.now() + 2000;
}
if (realEmote && typeof playEmoteSoundEffect === 'function') {
playEmoteSoundEffect(realEmote.emote);
}
});
window.Network.onPowerupCollectedGlobal((data) => {
let realPu = (data && data.username) ? data : (data && data.data ? data.data : data);
if (gameTickerMessage && realPu) {
let icon = realPu.type === 'speed' ? '⚡' : (realPu.type === 'freeze_trap' ? '❄️' : '🛡️');
gameTickerMessage.innerText = `${icon} ${realPu.username} picked up ${realPu.type.toUpperCase()}!`;
}
if (realPu && realPu.username === myUsername) {
triggerMobileVibration(80);
}
});
window.Network.onBombDetonatedPulse((data) => {
let realDet = (data && data.origins) ? data : (data && data.data ? data.data : data);
if (realDet && realDet.origins && realDet.origins.length > 0) {
spawnExplosionShockwave(realDet.origins);
}
if (typeof playExplosionSoundEffect === 'function') {
playExplosionSoundEffect();
}
triggerMobileVibration();
});
window.Network.onPreMatchCountdown((data) => {
let realCount = (data && data.count !== undefined) ? data : (data && data.data ? data.data : data);
if (preMatchPopup && realCount) {
preMatchPopup.classList.remove('hidden');
if (popupCountdownNumber) popupCountdownNumber.innerText = realCount.count;
if (popupCarrierNotice && realCount.holders && realCount.holders.length > 0) {
popupCarrierNotice.innerText = `BOMB CARRIERS: ${realCount.holders.join(', ')}`;
}
}
if (typeof playCountdownTickSound === 'function') {
playCountdownTickSound(false);
}
});
window.Network.onMatchBeginPulse(() => {
if (preMatchPopup) {
preMatchPopup.classList.add('hidden');
}
if (typeof playCountdownTickSound === 'function') {
playCountdownTickSound(true);
}
});
}
function renderLoop() {
if (!gameScreen || gameScreen.classList.contains('hidden')) return;
pulseTime += 0.08;
if (window.Renderer) window.Renderer.pulseTime = pulseTime;
for (let name in currentPositions) {
if (targetPositions[name]) {
currentPositions[name].x += (targetPositions[name].x - currentPositions[name].x) * 0.22;
currentPositions[name].y += (targetPositions[name].y - currentPositions[name].y) * 0.22;
}
}
if (ctx && window.Renderer) {
window.Renderer.paintRichThematicFloor(ctx);
let localPlayer = currentPositions[myUsername];
let camX = mapW / 2;
let camY = mapH / 2;
let customZoom = 1.0;
if (localPlayer) {
if (!localPlayer.isDead) {
camX = localPlayer.x;
camY = localPlayer.y;
customZoom = localPlayer.isIt ? 1.3 : 0.75;
} else {
if (spectatorTargetName && currentPositions[spectatorTargetName] && currentPositions[spectatorTargetName].isDead) {
manualSpectatorOverride = false;
spectatorTargetName = "";
}
if (!manualSpectatorOverride) {
for (let name in currentPositions) {
if (currentPositions[name] && currentPositions[name].isIt && !currentPositions[name].isDead) {
spectatorTargetName = name;
break;
}
}
}
if (!spectatorTargetName) {
for (let name in currentPositions) {
if (currentPositions[name] && !currentPositions[name].isDead) {
spectatorTargetName = name;
break;
}
}
}
let trackedPlayer = currentPositions[spectatorTargetName];
if (trackedPlayer) {
camX = trackedPlayer.x;
camY = trackedPlayer.y;
customZoom = 0.85;
} else {
camX = localPlayer.x;
camY = localPlayer.y;
customZoom = 0.6;
}
}
}
ctx.save();
ctx.translate(bombCanvas.width / 2, bombCanvas.height / 2);
ctx.scale(customZoom, customZoom);
ctx.translate(-camX, -camY);
for (let name in currentPositions) {
let p = currentPositions[name];
if (!p || p.isDead) continue;
if (!playerTrails[name]) playerTrails[name] = [];
playerTrails[name].push({ x: p.x, y: p.y, color: (p.isIt ? '#ef4444' : (p.shirt || '#e0a96d')), alpha: 0.6 });
if (playerTrails[name].length > 6) playerTrails[name].shift();
}
for (let name in playerTrails) {
for (let i = playerTrails[name].length - 1; i >= 0; i--) {
let t = playerTrails[name][i];
t.alpha -= 0.05;
if (t.alpha > 0) {
ctx.save();
ctx.globalAlpha = t.alpha;
ctx.beginPath();
ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
ctx.fillStyle = t.color;
ctx.fill();
ctx.restore();
}
}
playerTrails[name] = playerTrails[name].filter(t => t.alpha > 0);
}
for (let i = 0; i < gameObstacles.length; i++) {
window.Renderer.renderThematicObstacleBlock(ctx, gameObstacles[i]);
}
for (let pu of currentPowerups) {
ctx.save(); ctx.beginPath(); ctx.arc(pu.x, pu.y, 12, 0, Math.PI * 2);
if (pu.type === 'speed') ctx.fillStyle = '#eab308';
else if (pu.type === 'freeze_trap') ctx.fillStyle = '#06b6d4';
else if (pu.type === 'shield') ctx.fillStyle = '#10b981';
ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
ctx.fillStyle = '#ffffff'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
let icon = pu.type === 'speed' ? '⚡' : (pu.type === 'freeze_trap' ? '❄️' : '🛡️');
ctx.fillText(icon, pu.x, pu.y); ctx.restore();
}
ctx.strokeStyle = '#4f46e5'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, mapW, mapH);
for (let name in currentPositions) {
let player = currentPositions[name];
if (!player || player.isDead || player.x === undefined || player.y === undefined) continue;
let playerShirt = player.shirt || '#e0a96d';
let playerFace = player.face || '🙂';
if (player.isIt && !explosionActive) {
ctx.save();
let rad = 46 + Math.sin(pulseTime * 5.0) * 9;
ctx.beginPath();
ctx.arc(player.x, player.y, rad + 15, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
ctx.fill();
ctx.restore();
}
ctx.beginPath();
ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
ctx.fillStyle = playerShirt;
ctx.fill();
ctx.strokeStyle = player.hasShield ? '#10b981' : '#ffffff';
ctx.lineWidth = player.hasShield ? 4 : 2.5;
ctx.stroke();
ctx.fillStyle = '#ffffff';
ctx.font = '18px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(playerFace, player.x, player.y);
if (player.hat && player.hat !== 'none') {
ctx.save(); ctx.font = '20px Arial'; ctx.textAlign = 'center';
ctx.fillText(player.hat, player.x, player.y - 18); ctx.restore();
}
if (player.activeEmote && Date.now() < player.emoteExpiry) {
ctx.save(); ctx.font = '24px Arial'; ctx.textAlign = 'center';
ctx.fillText(player.activeEmote, player.x, player.y - 56); ctx.restore();
}
ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px Arial'; ctx.textBaseline = 'alphabetic';
ctx.fillText(player.isIt ? `💣 ${name}` : name, player.x, player.y - 36);
}
for (let i = canvasExplosionParticles.length - 1; i >= 0; i--) {
let p = canvasExplosionParticles[i];
p.x += p.vx; p.y += p.vy;
p.vx *= 0.94; p.vy *= 0.94;
p.opacity -= p.decay;
if (p.opacity <= 0) {
canvasExplosionParticles.splice(i, 1); continue;
}
ctx.save(); ctx.globalAlpha = p.opacity; ctx.beginPath();
ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.hue; ctx.fill();
ctx.restore();
}
ctx.restore();
if (localPlayer && window.Renderer && typeof window.Renderer.drawRadarCompass === 'function') {
window.Renderer.drawRadarCompass(ctx, localPlayer, currentPositions, bombCanvas.width, bombCanvas.height, myUsername);
}
if (flashOverlayActive) {
ctx.save();
ctx.fillStyle = `rgba(255, 255, 255, ${flashOverlayAlpha})`;
ctx.fillRect(0, 0, bombCanvas.width, bombCanvas.height);
ctx.restore();
flashOverlayAlpha -= 0.04;
if (flashOverlayAlpha <= 0) flashOverlayActive = false;
}
if (localPlayer && localPlayer.isDead) {
ctx.save();
ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
ctx.fillRect(0, 0, bombCanvas.width, 50);
ctx.fillStyle = "#f43f5e";
ctx.font = "bold 16px system-ui";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
let isTargetIt = currentPositions[spectatorTargetName] && currentPositions[spectatorTargetName].isIt;
let targetLabel = isTargetIt ? `${spectatorTargetName} 💣` : spectatorTargetName;
let bannerString = spectatorTargetName
? `SPECTATING POV: ${targetLabel} — [TAP ARENA TO SWITCH PLAYER]`
: 'SPECTATING MODE — WAITING FOR RE-SPAWN';
ctx.fillText(bannerString, bombCanvas.width / 2, 25);
ctx.restore();
}
}
requestAnimationFrame(renderLoop);
}
function updatePlayerLobbyUI(players) {
if (!playerList) return;
playerList.innerHTML = '';
let uniquelyTrackedNames = [...new Set(players)];
uniquelyTrackedNames.forEach((p) => {
const item = document.createElement('div');
item.className = "lobby-player-row";
let skinColor = "#e0a96d";
let faceExpr = "🙂";
let hatEmoji = "";
if (currentPositions[p]) {
skinColor = currentPositions[p].shirt || skinColor;
faceExpr = currentPositions[p].face || faceExpr;
hatEmoji = currentPositions[p].hat && currentPositions[p].hat !== 'none' ? currentPositions[p].hat : "";
}
item.innerHTML = `<span class="lobby-avatar-preview" style="background-color: ${skinColor}"> <span class="lobby-hat-layer">${hatEmoji}</span> <span class="lobby-face-layer">${faceExpr}</span> </span> <span class="lobby-name-layer">${p === myUsername ? `👤 ${p} (You)` : `🎮 ${p}`}</span>`;
playerList.appendChild(item);
});
}