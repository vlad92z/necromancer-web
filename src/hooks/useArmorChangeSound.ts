/**
 * useArmorChangeSound - plays armor gain or loss audio cues when armor changes.
 */
import { useEffect, useRef } from 'react';
import armorSoundUrl from '../assets/sounds/armor.mp3';
import armorDamageSoundUrl from '../assets/sounds/armor_damage.mp3';
import { useUIStore } from '../state/stores/uiStore';

export function useArmorChangeSound(armor: number): void {
  const soundVolume = useUIStore((state) => state.soundVolume);
  const previousArmorRef = useRef(armor);
  const armorAudioRef = useRef<HTMLAudioElement | null>(null);
  const armorDamageAudioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(soundVolume);

  useEffect(() => {
    volumeRef.current = soundVolume;
  }, [soundVolume]);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!armorAudioRef.current) {
      armorAudioRef.current = new Audio(armorSoundUrl);
    }

    if (!armorDamageAudioRef.current) {
      armorDamageAudioRef.current = new Audio(armorDamageSoundUrl);
    }

    if (armorAudioRef.current) {
      armorAudioRef.current.volume = soundVolume;
    }
    if (armorDamageAudioRef.current) {
      armorDamageAudioRef.current.volume = soundVolume;
    }
  }, [soundVolume]);

  useEffect(() => {
    const previousArmor = previousArmorRef.current;
    if (armor === previousArmor) {
      return;
    }

    const isGain = armor > previousArmor;
    const audioElement = isGain ? armorAudioRef.current : armorDamageAudioRef.current;
    if (!audioElement) {
      previousArmorRef.current = armor;
      return;
    }

    audioElement.volume = volumeRef.current;
    audioElement.currentTime = 0;
    const playPromise = audioElement.play();
    if (playPromise) {
      void playPromise.catch(() => {});
    }

    previousArmorRef.current = armor;
  }, [armor]);
}
