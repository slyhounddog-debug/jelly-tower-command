class AudioManager {
    constructor(game) {
        this.game = game;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.musicSources = {};

        // --- Persistent Music Routing ---
        this.muffleFilter = this.context.createBiquadFilter();
        this.muffleFilter.type = 'lowpass';
        this.muffleFilter.frequency.value = 22000;

        this.biquadFilter = this.context.createBiquadFilter();
        this.biquadFilter.type = 'highpass';
        this.biquadFilter.frequency.value = 0;

        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = 0.8;

        this.muffleFilter.connect(this.biquadFilter);
        this.biquadFilter.connect(this.musicGain);
        this.musicGain.connect(this.context.destination);

        // --- Sound Effects Routing ---
        this.soundGain = this.context.createGain();
        this.soundGain.gain.value = 1.0;
        this.soundGain.connect(this.context.destination);

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
            hit: './assets/sfx/towerHit.mp3', // Kill
            towerHit: './assets/sfx/thud.mp3',
            bossHit: './assets/sfx/thud.mp3',
            bossKilled: './assets/sfx/levelUp.mp3',

            // UI
            purchase: './assets/sfx/chime.mp3',
            reset: './assets/sfx/reset.mp3',
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
            source.connect(this.soundGain);
            source.start(0);
        }
    }

    playMusic(key, loop = true) {
        if (this.context.state === 'suspended') this.context.resume();

        if (this.sounds[key] && !this.musicSources[key]) {
            const source = this.context.createBufferSource();
            source.buffer = this.sounds[key];
            source.loop = loop;

            source.connect(this.muffleFilter);

            source.start(0);
            this.musicSources[key] = source;
        }
    }

    setMuffled(isMuffled) {
        if (this.context.state === 'suspended') this.context.resume();
        const targetFreq = isMuffled ? 600 : 22000;
        this.muffleFilter.frequency.setTargetAtTime(targetFreq, this.context.currentTime, 0.1);
    }

    setBuildMode(isBuilding, isMuffled = false) {
        if (this.context.state === 'suspended') this.context.resume();

        let targetFreq = 22000;
        let targetRate = 1.0;

        if (isBuilding) {
            targetFreq = 800; // Build mode muffle
            targetRate = 0.3; // Build mode slowdown
        } else if (isMuffled) {
            targetFreq = 600; // Standard menu muffle
        }

        this.muffleFilter.frequency.setTargetAtTime(targetFreq, this.context.currentTime, 0.2);
        if (this.musicSources.music) {
            this.musicSources.music.playbackRate.setTargetAtTime(targetRate, this.context.currentTime, 0.2);
        }
    }

    setBossMusic(active) {
        if (this.context.state === 'suspended') this.context.resume();

        if (active) {
            this.biquadFilter.frequency.setTargetAtTime(1000, this.context.currentTime, 0.5);
            if (this.musicSources.music) {
                this.musicSources.music.playbackRate.setTargetAtTime(1.1, this.context.currentTime, 0.5);
            }
        } else {
            this.biquadFilter.frequency.setTargetAtTime(0, this.context.currentTime, 0.1);
            if (this.musicSources.music) {
                this.musicSources.music.playbackRate.setTargetAtTime(1, this.context.currentTime, 0.1);
            }
        }
    }

    stopMusic(key) {
        if (this.musicSources[key]) {
            this.musicSources[key].stop();
            delete this.musicSources[key];
        }
    }

    setSoundVolume(volume) {
        this.soundGain.gain.setValueAtTime(volume, this.context.currentTime);
    }

    setMusicVolume(volume) {
        this.musicGain.gain.setValueAtTime(volume, this.context.currentTime);
    }
}

export default AudioManager;