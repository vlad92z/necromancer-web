/**
 * useBackgroundMusic - plays looping background music with overlapped restarts for seamless playback (Web Audio first, HTMLAudio fallback).
 */
import { useEffect, useRef, useState } from 'react';
import backgroundMusicUrl from '../assets/sounds/background.mp3';

const AUDIO_OVERLAP_SECONDS = 0.2;
const FALLBACK_DURATION_SECONDS = 31;

export function useBackgroundMusic(isEnabled: boolean, volume: number = 0.35): void {
  const normalizedVolume = Math.min(Math.max(volume, 0), 1);
  const [isBufferReady, setIsBufferReady] = useState(false);
  const useWebAudioRef = useRef(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const loopTimeoutRef = useRef<number | null>(null);

  const fallbackAudiosRef = useRef<HTMLAudioElement[]>([]);
  const fallbackLoopTimeoutRef = useRef<number | null>(null);
  const fallbackIndexRef = useRef(0);

  const stopWebAudioPlayback = () => {
    if (loopTimeoutRef.current !== null) {
      window.clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    activeSourcesRef.current.forEach((source) => {
      source.stop();
      source.disconnect();
    });
    activeSourcesRef.current = [];
  };

  const stopFallbackPlayback = () => {
    if (fallbackLoopTimeoutRef.current !== null) {
      window.clearTimeout(fallbackLoopTimeoutRef.current);
      fallbackLoopTimeoutRef.current = null;
    }
    fallbackAudiosRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;
    const AudioContextClass =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      useWebAudioRef.current = false;
      setIsBufferReady(true);
      return () => {
        stopFallbackPlayback();
      };
    }

    const context = new AudioContextClass();
    const gainNode = context.createGain();
    gainNode.gain.value = normalizedVolume;
    gainNode.connect(context.destination);

    audioContextRef.current = context;
    gainNodeRef.current = gainNode;

    const loadBuffer = async () => {
      try {
        const response = await fetch(backgroundMusicUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await context.decodeAudioData(arrayBuffer);
        if (!cancelled) {
          bufferRef.current = buffer;
          setIsBufferReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          useWebAudioRef.current = false;
          setIsBufferReady(true);
        }
      }
    };

    void loadBuffer();

    return () => {
      cancelled = true;
      stopWebAudioPlayback();
      const gain = gainNodeRef.current;
      if (gain) {
        gain.disconnect();
      }
      context.close().catch(() => {});
      audioContextRef.current = null;
      gainNodeRef.current = null;
      bufferRef.current = null;
      stopFallbackPlayback();
    };
  }, []);

  useEffect(() => {
    if (!isBufferReady) {
      return;
    }

    if (!useWebAudioRef.current) {
      fallbackAudiosRef.current.forEach((audio) => {
        audio.volume = normalizedVolume;
      });
      return;
    }

    const gainNode = gainNodeRef.current;
    if (gainNode) {
      gainNode.gain.value = normalizedVolume;
    }
  }, [isBufferReady, normalizedVolume]);

  useEffect(() => {
    if (!isBufferReady) {
      return;
    }

    if (!useWebAudioRef.current) {
      stopFallbackPlayback();

      const ensureFallbackAudios = () => {
        if (fallbackAudiosRef.current.length === 0) {
          const first = new Audio(backgroundMusicUrl);
          const second = new Audio(backgroundMusicUrl);
          [first, second].forEach((audio) => {
            audio.loop = false;
            audio.volume = normalizedVolume;
          });
          fallbackAudiosRef.current = [first, second];
        } else {
          fallbackAudiosRef.current.forEach((audio) => {
            audio.volume = normalizedVolume;
            audio.pause();
            audio.currentTime = 0;
          });
        }
      };

      const startFallbackLoop = () => {
        const audios = fallbackAudiosRef.current;
        if (audios.length === 0) {
          return;
        }

        fallbackIndexRef.current = 0;

        const playAtIndex = (index: number) => {
          const audio = audios[index];
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise) {
            void playPromise.catch(() => {});
          }
        };

        const scheduleNext = () => {
          const currentAudio = audios[fallbackIndexRef.current];
          const durationSeconds = Number.isFinite(currentAudio.duration) && currentAudio.duration > 0
            ? currentAudio.duration
            : FALLBACK_DURATION_SECONDS;
          const waitMs = Math.max((durationSeconds - AUDIO_OVERLAP_SECONDS) * 1000, 0);
          fallbackLoopTimeoutRef.current = window.setTimeout(() => {
            fallbackIndexRef.current = (fallbackIndexRef.current + 1) % audios.length;
            playAtIndex(fallbackIndexRef.current);
            scheduleNext();
          }, waitMs);
        };

        playAtIndex(0);
        scheduleNext();
      };

      if (isEnabled) {
        ensureFallbackAudios();
        startFallbackLoop();
      } else {
        stopFallbackPlayback();
      }

      return () => {
        stopFallbackPlayback();
      };
    }

    const context = audioContextRef.current;
    const buffer = bufferRef.current;
    const gainNode = gainNodeRef.current;

    if (!context || !buffer || !gainNode) {
      return;
    }

    stopWebAudioPlayback();

    const startBufferSource = () => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gainNode);
      source.start(0);
      source.onended = () => {
        const remaining = activeSourcesRef.current.filter((item) => item !== source);
        activeSourcesRef.current = remaining;
      };
      activeSourcesRef.current.push(source);

      const waitMs = Math.max((buffer.duration - AUDIO_OVERLAP_SECONDS) * 1000, 0);
      loopTimeoutRef.current = window.setTimeout(() => {
        startBufferSource();
      }, waitMs);
    };

    if (isEnabled) {
      void context.resume().then(() => {
        startBufferSource();
      }).catch(() => {});
    } else {
      stopWebAudioPlayback();
    }

    return () => {
      stopWebAudioPlayback();
    };
  }, [isBufferReady, isEnabled, normalizedVolume]);
}
