class AudioManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {}; 
        this.musicSources = {}; 

        // --- Persistent Music Routing ---
        // 1. Create a Lowpass Filter for the muffle effect
        this.muffleFilter = this.context.createBiquadFilter();
        this.muffleFilter.type = 'lowpass';
        this.muffleFilter.frequency.value = 22000; // Start clear

        // 2. Create a Gain Node to lower the music volume globally
        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = 0.99; // Lowered volume (99% of original)

        // Connect the chain: Music Source -> Filter -> Gain -> Output
        this.muffleFilter.connect(this.musicGain);
        this.musicGain.connect(this.context.destination);
        
        this.soundSources = {
            // Player
            mlem: './assets/sfx/mlem.mp3',
            jump: './assets/sfx/jump.mp3',
            midAirJump: './assets/sfx/mid_air_jump.mp3',
            dash: './assets/sfx/dash.mp3',
            land: './assets/sfx/land.mp3',

            // Enemies
            fire: './assets/sfx/pop.mp3',
            miss: './assets/sfx/whiff.mp3',
            hit: './assets/sfx/towerHit.mp3',
            towerHit: './assets/sfx/thud.mp3',

            // UI
            purchase: './assets/sfx/chime.mp3',
            reset: './assets.sfx/reset.mp3',
            upgrade: './assets/sfx/ding.mp3',
            levelUp: './assets/sfx/levelUp.mp3',

            // Loot
            scoop: './assets/sfx/sparkle.mp3',
            money: './assets/sfx/twinkle.mp3',
            heart: './assets/sfx/soft_sound.mp3',
            xp: './assets/sfx/xp.mp3',
            pop: './assets/sfx/pop.mp3',

            // Music
            music: './assets/sfx/music.mp3',
            gameOverMusic: './assets/sfx/gameOverMusic.mp3'
        };

        this.loadingPromise = this.preloadSounds();
    }

    async preloadSounds() {
        const soundPromises = [];
        for (const key in this.soundSources) {
            const promise = fetch(this.soundSources[key])
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
                .then(decodedData => {
                    this.sounds[key] = decodedData;
                })
                .catch(err => console.error(`Error loading sound: ${key}`, err));
            soundPromises.push(promise);
        }
        await Promise.all(soundPromises);
    }

    playSound(key) {
        if (this.context.state === 'suspended') this.context.resume();

        if (this.sounds[key]) {
            const source = this.context.createBufferSource();
            source.buffer = this.sounds[key];
            // SFX connect directly to destination (unmuffled)
            source.connect(this.context.destination);
            source.start(0);
        }
    }

    playMusic(key, loop = true) {
        if (this.context.state === 'suspended') this.context.resume();

        if (this.sounds[key] && !this.musicSources[key]) {
            const source = this.context.createBufferSource();
            source.buffer = this.sounds[key];
            source.loop = loop;
            
            // Connect to our specialized music filter chain
            source.connect(this.muffleFilter);
            
            source.start(0);
            this.musicSources[key] = source;
        }
    }

    // Toggle this when pausing/opening shop/leveling up
    setMuffled(isMuffled) {
        if (this.context.state === 'suspended') this.context.resume();

        // Target 600Hz for muffle, 22000Hz for clear
        const targetFreq = isMuffled ? 600 : 22000;
        
        // Smooth transition over 0.2 seconds
        this.muffleFilter.frequency.setTargetAtTime(targetFreq, this.context.currentTime, 0.1);
    }

    stopMusic(key) {
        if (this.musicSources[key]) {
            this.musicSources[key].stop();
            delete this.musicSources[key];
        }
    }
}

export default AudioManager;