/**
 * useHealthChangeSound - plays heal or damage audio when health changes.
 */
import { useEffect, useRef } from 'react';
import damageSoundUrl from '../assets/sounds/damage.mp3';
import healSoundUrl from '../assets/sounds/heal.mp3';
import { useUIStore } from '../state/stores/uiStore';

export function useHealthChangeSound(health: number): void {
  const soundVolume = useUIStore((state) => state.soundVolume);
  const previousHealthRef = useRef(health);
  const healAudioRef = useRef<HTMLAudioElement | null>(null);
  const damageAudioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(soundVolume);

  useEffect(() => {
    volumeRef.current = soundVolume;
  }, [soundVolume]);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!healAudioRef.current) {
      healAudioRef.current = new Audio(healSoundUrl);
    }

    if (!damageAudioRef.current) {
      damageAudioRef.current = new Audio(damageSoundUrl);
    }

    if (healAudioRef.current) {
      healAudioRef.current.volume = soundVolume;
    }

    if (damageAudioRef.current) {
      damageAudioRef.current.volume = soundVolume;
    }
  }, [soundVolume]);

  useEffect(() => {
    const previousHealth = previousHealthRef.current;
    if (health === previousHealth) {
      return;
    }

    const delta = health - previousHealth;
    previousHealthRef.current = health;

    if (typeof Audio === 'undefined') {
      return;
    }

    const audioElement = delta > 0 ? healAudioRef.current : damageAudioRef.current;
    if (!audioElement) {
      return;
    }

    audioElement.volume = volumeRef.current;
    audioElement.currentTime = 0;
    const playPromise = audioElement.play();
    if (playPromise) {
      void playPromise.catch(() => {});
    }
  }, [health]);
}
