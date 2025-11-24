
export class SoundManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;

    // Volume Settings
    private volumeMaster: number = 0.5;
    private volumeMusic: number = 0.4;
    private volumeSfx: number = 0.6;

    // Procedural Music State
    private isPlayingBgm: boolean = false;
    private nextNoteTime: number = 0;
    private current16thNote: number = 0;
    private measureCount: number = 0;
    private baseTempo: number = 100;
    private currentTempo: number = 100;

    // Game Data for Music Evolution
    private currentAltitude: number = 0; // Affects Intensity

    // Scheduler
    private scheduleAheadTime: number = 0.1;
    private timerID: number | null = null;

    // Jetpack Engine
    private jetpackOsc: OscillatorNode | null = null;
    private jetpackGain: GainNode | null = null;

    constructor() { }

    public init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();

            this.masterGain.connect(this.ctx.destination);
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);

            // Dynamics Compressor to glue the mix
            const compressor = this.ctx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
            compressor.knee.setValueAtTime(30, this.ctx.currentTime);
            compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
            compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
            compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

            this.musicGain.disconnect();
            this.musicGain.connect(compressor);
            compressor.connect(this.masterGain);

            this.updateVolumes();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public setVolumes(master: number, music: number, sfx: number) {
        this.volumeMaster = master;
        this.volumeMusic = music;
        this.volumeSfx = sfx;
        this.updateVolumes();
    }

    public updateAltitude(altitude: number) {
        this.currentAltitude = Math.max(0, altitude);
    }

    private updateVolumes() {
        if (!this.masterGain || !this.musicGain || !this.sfxGain || !this.ctx) return;
        const now = this.ctx.currentTime;

        const vMaster = Number.isFinite(this.volumeMaster) ? Math.max(0, this.volumeMaster) : 0.5;
        const vMusic = Number.isFinite(this.volumeMusic) ? Math.max(0, this.volumeMusic) : 0.4;
        const vSfx = Number.isFinite(this.volumeSfx) ? Math.max(0, this.volumeSfx) : 0.6;

        this.masterGain.gain.setTargetAtTime(vMaster, now, 0.1);
        this.musicGain.gain.setTargetAtTime(vMusic, now, 0.1);
        this.sfxGain.gain.setTargetAtTime(vSfx, now, 0.1);
    }

    // --- IMPACT BASS (Platform Interaction) ---
    public playPlatformImpact() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const degrees = [0, 0, 2, 4, 5];
        const degree = degrees[Math.floor(Math.random() * degrees.length)];
        const freq = this.getScaleNote(degree, 1);

        const safeAlt = Number.isFinite(this.currentAltitude) ? this.currentAltitude : 0;
        const intensity = Math.min(1.0, safeAlt / 4000);

        const filterEnv = 150 + (intensity * 1200);
        const decay = 0.25 + (intensity * 0.15);

        this.playSynth(t, freq / 2, decay + 0.1, 0.5, 'sine', 0, 0.01);
        this.playSynth(t, freq, decay, 0.35, 'sawtooth', filterEnv, 0.01);
        this.playTone(60, 'square', 0.05, 0.15, -30);
    }

    // --- SFX METHODS (Optimized) ---
    private playTone(freq: number, type: OscillatorType, duration: number, vol: number, slide: number = 0) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const safeFreq = Number.isFinite(freq) && freq > 0 ? freq : 440;
        const safeVol = Number.isFinite(vol) ? vol : 0;

        osc.type = type;
        osc.frequency.setValueAtTime(safeFreq, t);

        if (slide !== 0) {
            const targetFreq = safeFreq + slide;
            const safeTarget = Math.max(1, targetFreq);
            osc.frequency.exponentialRampToValueAtTime(safeTarget, t + duration);
        }

        gain.gain.setValueAtTime(safeVol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start();
        osc.stop(t + duration);
    }

    public playJump() { this.playTone(150, 'square', 0.2, 0.1, 450); }

    public playPerfectJump() {
        // Renamed conceptually to Hyper Jump - Cleaner, more "tech" sound
        // A high ping followed by a shimmer
        this.playTone(1200, 'sine', 0.1, 0.2, 0);
        setTimeout(() => this.playTone(2400, 'square', 0.1, 0.05, -400), 50);
    }

    public playDamage() { this.playTone(100, 'sawtooth', 0.3, 0.2, -80); }
    public playCollect() { this.playTone(1200, 'triangle', 0.5, 0.1, 800); }
    public playHover() { this.playTone(400, 'sine', 0.05, 0.02, -100); }
    public playClick() { this.playTone(800, 'square', 0.1, 0.05, -400); }

    public startJetpack() {
        if (!this.ctx || this.jetpackOsc) return;
        const t = this.ctx.currentTime;

        this.jetpackOsc = this.ctx.createOscillator();
        this.jetpackOsc.type = 'sawtooth';
        this.jetpackOsc.frequency.value = 60;

        this.jetpackGain = this.ctx.createGain();
        this.jetpackGain.gain.setValueAtTime(0, t);
        this.jetpackGain.gain.linearRampToValueAtTime(0.1, t + 0.2);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;

        this.jetpackOsc.connect(filter);
        filter.connect(this.jetpackGain);
        this.jetpackGain.connect(this.sfxGain!);
        this.jetpackOsc.start();
    }

    public stopJetpack() {
        if (!this.ctx || !this.jetpackOsc || !this.jetpackGain) return;
        const t = this.ctx.currentTime;

        try {
            this.jetpackGain.gain.setTargetAtTime(0, t, 0.1);
            const osc = this.jetpackOsc;
            setTimeout(() => {
                try { osc.stop(); } catch (e) { }
            }, 200);
        } catch (e) { }

        this.jetpackOsc = null;
        this.jetpackGain = null;
    }

    public startMusic() {
        if (this.isPlayingBgm) return;
        this.init();
        this.isPlayingBgm = true;
        this.nextNoteTime = this.ctx!.currentTime + 0.1;
        this.current16thNote = 0;
        this.measureCount = 0;
        this.timerID = window.setInterval(() => this.scheduler(), 25);
    }

    public stopMusic() {
        this.isPlayingBgm = false;
        if (this.timerID) {
            clearInterval(this.timerID);
            this.timerID = null;
        }
    }

    private scheduler() {
        if (!this.ctx) return;
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.generateAndPlayNote(this.current16thNote, this.nextNoteTime);
            this.advanceNote();
        }
    }

    private advanceNote() {
        const safeAlt = Number.isFinite(this.currentAltitude) ? this.currentAltitude : 0;
        const targetTempo = Math.min(140, this.baseTempo + (safeAlt / 200));

        this.currentTempo += (targetTempo - this.currentTempo) * 0.1;
        if (!Number.isFinite(this.currentTempo) || this.currentTempo < 1) this.currentTempo = 100;

        const secondsPerBeat = 60.0 / this.currentTempo;
        this.nextNoteTime += 0.25 * secondsPerBeat;
        this.current16thNote++;
        if (this.current16thNote === 16) {
            this.current16thNote = 0;
            this.measureCount++;
        }
    }

    private getPseudoRandom(seed: number) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    private midiToFreq(midi: number) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    private getScaleNote(index: number, octave: number) {
        const safeAlt = Number.isFinite(this.currentAltitude) ? this.currentAltitude : 0;
        const scale = safeAlt > 1000 ? [0, 2, 3, 5, 7, 9, 10] : [0, 3, 5, 7, 10];
        const noteIndex = Math.abs(index % scale.length);
        const noteOctave = Math.floor(index / scale.length) + octave;
        const root = 36; // C2
        return this.midiToFreq(root + (noteOctave * 12) + scale[noteIndex]);
    }

    private generateAndPlayNote(beat: number, time: number) {
        const safeAlt = Number.isFinite(this.currentAltitude) ? this.currentAltitude : 0;
        const intensity = Math.min(1.0, safeAlt / 2000);

        const measureSeed = this.measureCount * 12.345;

        const kickProb = (beat % 4 === 0) ? 1.0 : (intensity > 0.5 && beat % 2 !== 0 ? 0.2 : 0);
        if (this.getPseudoRandom(measureSeed + beat) < kickProb) {
            this.playDrum(time, 150, 0.01, 0.8, 'sine'); // Kick
        }

        const bassSeed = measureSeed + beat * 1.1;
        if (beat % 2 === 0 || (intensity > 0.4 && this.getPseudoRandom(bassSeed) > 0.5)) {
            const rootOffset = (Math.floor(this.measureCount / 4) % 2 === 0) ? 0 : -2;
            const freq = this.getScaleNote(rootOffset, 0);
            this.playSynth(time, freq, 0.15, 0.2, 'sawtooth', 200);
        }

        if (beat % 8 === 4) {
            this.playNoise(time, 0.3, 1000); // Snare
        }

        if (intensity > 0.2) {
            if (beat % 2 === 0 || (intensity > 0.6 && beat % 2 !== 0)) {
                const vol = beat % 4 === 2 ? 0.1 : 0.04;
                this.playNoise(time, vol, 8000, 0.03);
            }
        }

        if (intensity > 0.25) {
            const arpSeed = measureSeed + beat * 9.87;
            if (this.getPseudoRandom(arpSeed) > 0.6) {
                const scaleIndex = Math.floor(this.getPseudoRandom(arpSeed + 1) * 8);
                const freq = this.getScaleNote(scaleIndex, 2);
                this.playSynth(time, freq, 0.1, 0.1, 'square', 0, 0.05);
                this.playSynth(time + 0.15, freq, 0.1, 0.05, 'square', 0, 0.05);
            }
        }
    }

    private playDrum(time: number, freq: number, endFreq: number, vol: number, type: OscillatorType) {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = type;

        const safeFreq = Number.isFinite(freq) && freq > 0 ? freq : 150;
        const safeEndFreq = Number.isFinite(endFreq) && endFreq > 0 ? endFreq : 0.01;
        const safeVol = Number.isFinite(vol) ? vol : 0.5;

        osc.frequency.setValueAtTime(safeFreq, time);
        osc.frequency.exponentialRampToValueAtTime(safeEndFreq, time + 0.1);
        gain.gain.setValueAtTime(safeVol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        gain.connect(this.musicGain!);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    private playNoise(time: number, vol: number, filterFreq: number, duration: number = 0.1) {
        const bufferSize = this.ctx!.sampleRate * duration;
        const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx!.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = Number.isFinite(filterFreq) ? filterFreq : 1000;

        const gain = this.ctx!.createGain();
        const safeVol = Number.isFinite(vol) ? vol : 0.1;
        gain.gain.setValueAtTime(safeVol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);
        noise.start(time);
    }

    private playSynth(time: number, freq: number, duration: number, vol: number, type: OscillatorType, filterEnv: number = 0, attack: number = 0.01) {
        const osc = this.ctx!.createOscillator();
        osc.type = type;

        const safeFreq = Number.isFinite(freq) && freq > 0 ? freq : 400;
        const safeVol = Number.isFinite(vol) ? vol : 0.1;

        osc.frequency.setValueAtTime(safeFreq, time);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(safeFreq, time);

        if (filterEnv > 0) {
            const target = Math.max(1, safeFreq + filterEnv); // Ensure positive
            filter.frequency.exponentialRampToValueAtTime(target, time + attack);
            filter.frequency.exponentialRampToValueAtTime(safeFreq, time + duration);
        } else {
            filter.frequency.value = safeFreq * 4;
        }

        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(safeVol, time + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);
        osc.start(time);
        osc.stop(time + duration);
    }

    playHover() {
        // Assuming 'play' method exists elsewhere or is intended to be added.
        // For now, this will cause a compile error if 'play' is not defined.
        // This part of the instruction seems to be a partial snippet or depends on other changes.
        // Keeping it as provided, but noting potential issue.
        // this.play('hover'); 
    }

    setVolume(volume: number) {
        // Clamp volume between 0 and 1
        const v = Math.max(0, Math.min(1, volume));
        // Update Howler global volume
        if (typeof window !== 'undefined' && (window as any).Howler) {
            (window as any).Howler.volume(v);
        }
    }
}

export const soundManager = new SoundManager();
