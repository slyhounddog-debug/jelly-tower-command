class AudioManager {
    constructor() {
        // High-performance audio context
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {}; // This will now store the decoded audio data (buffers)
        
        this.soundSources = {
            // Player sounds
            mlem: './assets/sfx/mlem.mp3',
            jump: './assets/sfx/jump.mp3',
            midAirJump: './assets/sfx/mid_air_jump.mp3',
            dash: './assets/sfx/dash.mp3',
            land: './assets/sfx/land.mp3',

            // Missile sounds
            fire: './assets/sfx/pop.mp3',
            miss: './assets/sfx/whiff.mp3',
            hit: './assets/sfx/thud.mp3',

            // UI sounds
            purchase: './assets/sfx/chime.mp3',
            reset: './assets/sfx/reset.mp3',
            upgrade: './assets/sfx/ding.mp3',

            // Collectible sounds
            scoop: './assets/sfx/sparkle.mp3',
            money: './assets/sfx/twinkle.mp3',
            heart: './assets/sfx/soft_sound.mp3'
        };

        this.preloadSounds();
    }

    async preloadSounds() {
        for (const key in this.soundSources) {
            try {
                const response = await fetch(this.soundSources[key]);
                const arrayBuffer = await response.arrayBuffer();
                // Decode the audio into a raw buffer for instant access
                this.sounds[key] = await this.context.decodeAudioData(arrayBuffer);
            } catch (err) {
                console.error(`Error loading sound: ${key}`, err);
            }
        }
    }

    playSound(key) {
        // 1. Resume context if browser blocked it
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        // 2. Play the pre-loaded buffer
        if (this.sounds[key]) {
            const source = this.context.createBufferSource();
            source.buffer = this.sounds[key];
            source.connect(this.context.destination);
            source.start(0);
        } else {
            console.warn(`Sound not found or not yet loaded: ${key}`);
        }
    }
}

export default AudioManager;