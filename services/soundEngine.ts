/**
 * Procedural Sound Engine using Web Audio API
 * Generates sound effects and ambience for a modern teen drama setting.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceNode: AudioBufferSourceNode | null = null;
  private ambienceGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialization
  }

  init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; 
    this.masterGain.connect(this.ctx.destination);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : 0.3, 
        this.ctx!.currentTime, 
        0.1
      );
    }
    return this.isMuted;
  }

  async resume() {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playCue(cue: string) {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    switch (cue) {
      case 'phone_ping':
        this.playPhonePing();
        break;
      case 'school_bell':
        this.playSchoolBell();
        break;
      case 'heartbeat':
        this.playHeartbeat();
        break;
      case 'drama_sting':
        this.playDramaSting();
        break;
      case 'gossip_whisper':
        this.playWhisper();
        break;
      case 'success_chime':
        this.playSuccess();
        break;
      case 'school_ambience':
        this.playAmbience('school');
        break;
      case 'party_ambience':
        this.playAmbience('party');
        break;
      case 'neutral':
      default:
        this.stopAmbience();
        break;
    }
  }

  // --- SFX Implementations ---

  private playPhonePing() {
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  private playSchoolBell() {
    const now = this.ctx!.currentTime;
    // A simple digital bell sound
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    const mod = this.ctx!.createOscillator();
    const modGain = this.ctx!.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 600;
    
    mod.type = 'square';
    mod.frequency.value = 15; // Rattle effect
    modGain.gain.value = 200;

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.15, now + 1.0);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    mod.start(now);
    osc.stop(now + 1.5);
    mod.stop(now + 1.5);
  }

  private playHeartbeat() {
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.frequency.value = 50;
    
    // Thump-thump
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    gain.gain.setValueAtTime(0, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.7);
  }

  private playDramaSting() {
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 1.0);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 1.5);
  }

  private playSuccess() {
    const now = this.ctx!.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now + i*0.1);
      gain.gain.linearRampToValueAtTime(0.1, now + i*0.1 + 0.1);
      gain.gain.linearRampToValueAtTime(0, now + i*0.1 + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 2.0);
    });
  }

  private playWhisper() {
    const now = this.ctx!.currentTime;
    const buffer = this.createNoiseBuffer();
    if(!buffer) return;
    
    const source = this.ctx!.createBufferSource();
    const gain = this.ctx!.createGain();
    const filter = this.ctx!.createBiquadFilter();
    
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.5);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    source.start(now);
    source.stop(now + 1.5);
  }

  private playAmbience(type: 'school' | 'party') {
    if (this.ambienceNode) return;
    
    const buffer = this.createNoiseBuffer();
    if (!buffer) return;

    this.ambienceNode = this.ctx!.createBufferSource();
    this.ambienceNode.buffer = buffer;
    this.ambienceNode.loop = true;

    const filter = this.ctx!.createBiquadFilter();
    this.ambienceGain = this.ctx!.createGain();
    
    if (type === 'school') {
      // Filtered noise to sound like distant chatter/hallway
      filter.type = 'bandpass';
      filter.frequency.value = 500;
      filter.Q.value = 1;
      this.ambienceGain.gain.value = 0.03;
    } else {
      // Thumpier noise (bass music from another room)
      filter.type = 'lowpass';
      filter.frequency.value = 150;
      this.ambienceGain.gain.value = 0.1;
    }

    this.ambienceNode.connect(filter);
    filter.connect(this.ambienceGain);
    this.ambienceGain.connect(this.masterGain!);

    this.ambienceNode.start();
    
    this.ambienceGain.gain.setValueAtTime(0, this.ctx!.currentTime);
    this.ambienceGain.gain.linearRampToValueAtTime(
      type === 'school' ? 0.03 : 0.1, 
      this.ctx!.currentTime + 2
    );
  }

  private stopAmbience() {
    if (this.ambienceNode && this.ambienceGain) {
      const now = this.ctx!.currentTime;
      this.ambienceGain.gain.linearRampToValueAtTime(0, now + 1.5);
      this.ambienceNode.stop(now + 1.5);
      this.ambienceNode = null;
      this.ambienceGain = null;
    }
  }
}

export const soundEngine = new SoundEngine();