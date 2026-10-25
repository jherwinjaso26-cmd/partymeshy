let audioCtx = null;
let soundInterval = null;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playCountdownTickSound(isFinal) {
    initAudio(); 
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, t);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isFinal ? 0.35 : 0.15));
    osc.connect(gain); 
    gain.connect(audioCtx.destination);
    osc.start(t); 
    osc.stop(t + (isFinal ? 0.35 : 0.15));
}

function playExplosionSoundEffect() {
    initAudio(); 
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    let bufferSize = audioCtx.sampleRate * 1.2;
    let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    let data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i]; 
        data[i] *= 3.0; 
    }
    let noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    let filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass'; 
    filter.frequency.setValueAtTime(300, t);
    let gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(1.0, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    noiseNode.connect(filter); 
    filter.connect(gainNode); 
    gainNode.connect(audioCtx.destination);
    noiseNode.start(t); 
    noiseNode.stop(t + 1.2);
}

function playEmoteSoundEffect(emoteType) {
    initAudio(); 
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'triangle';
    if (emoteType === '😂') osc.frequency.setValueAtTime(520, t);
    else if (emoteType === '👍') osc.frequency.setValueAtTime(440, t);
    else if (emoteType === '👊') osc.frequency.setValueAtTime(330, t);
    else osc.frequency.setValueAtTime(220, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain); 
    gain.connect(audioCtx.destination);
    osc.start(t); 
    osc.stop(t + 0.25);
}

function playPressureTick() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    
    let osc = audioCtx.createOscillator();
    let pitchMod = audioCtx.createOscillator();
    let modGain = audioCtx.createGain();
    let gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(380, t + 0.18);
    
    pitchMod.type = 'sine';
    pitchMod.frequency.setValueAtTime(45, t);
    modGain.gain.setValueAtTime(35, t);
    
    gainNode.gain.setValueAtTime(0.15, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    
    pitchMod.connect(modGain);
    modGain.connect(osc.frequency);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    pitchMod.start(t);
    osc.start(t);
    pitchMod.stop(t + 0.18);
    osc.stop(t + 0.18);
}

function manageBombSound(isHoldingBomb) {
    initAudio();
    if (isHoldingBomb) {
        if (!soundInterval) soundInterval = setInterval(playPressureTick, 240);
    } else {
        if (soundInterval) { 
            clearInterval(soundInterval); 
            soundInterval = null; 
        }
    }
}
