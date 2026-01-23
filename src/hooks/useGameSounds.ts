import { useCallback, useRef } from 'react';

type SoundType = 'move' | 'capture' | 'check' | 'gameEnd' | 'gameStart' | 'illegal';

// Pre-generated sound frequencies for different game events
const soundConfigs: Record<SoundType, { frequencies: number[]; durations: number[]; types: OscillatorType[]; volumes: number[] }> = {
  move: {
    frequencies: [440, 523],
    durations: [0.08, 0.06],
    types: ['sine', 'sine'],
    volumes: [0.12, 0.08]
  },
  capture: {
    frequencies: [330, 262, 196],
    durations: [0.1, 0.08, 0.12],
    types: ['square', 'sawtooth', 'sine'],
    volumes: [0.15, 0.1, 0.08]
  },
  check: {
    frequencies: [660, 880, 660],
    durations: [0.1, 0.1, 0.15],
    types: ['sine', 'sine', 'sine'],
    volumes: [0.12, 0.15, 0.1]
  },
  gameEnd: {
    frequencies: [523, 659, 784, 1047],
    durations: [0.15, 0.15, 0.15, 0.25],
    types: ['sine', 'sine', 'sine', 'sine'],
    volumes: [0.1, 0.12, 0.14, 0.16]
  },
  gameStart: {
    frequencies: [392, 523, 659],
    durations: [0.12, 0.12, 0.2],
    types: ['sine', 'sine', 'sine'],
    volumes: [0.08, 0.1, 0.12]
  },
  illegal: {
    frequencies: [200, 150],
    durations: [0.1, 0.15],
    types: ['square', 'square'],
    volumes: [0.1, 0.08]
  }
};

export const useGameSounds = (enabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;

    try {
      const audioContext = getAudioContext();
      const config = soundConfigs[type];
      
      let startTime = audioContext.currentTime;

      config.frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = config.types[index];
        
        const volume = config.volumes[index];
        const duration = config.durations[index];
        
        // Envelope for smoother sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.05);
        
        startTime += duration * 0.7; // Overlap notes slightly
      });
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }, [enabled, getAudioContext]);

  const playMove = useCallback(() => playSound('move'), [playSound]);
  const playCapture = useCallback(() => playSound('capture'), [playSound]);
  const playCheck = useCallback(() => playSound('check'), [playSound]);
  const playGameEnd = useCallback(() => playSound('gameEnd'), [playSound]);
  const playGameStart = useCallback(() => playSound('gameStart'), [playSound]);
  const playIllegal = useCallback(() => playSound('illegal'), [playSound]);

  return {
    playSound,
    playMove,
    playCapture,
    playCheck,
    playGameEnd,
    playGameStart,
    playIllegal
  };
};
