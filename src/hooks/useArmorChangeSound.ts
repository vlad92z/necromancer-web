/**
 * useArmorChangeSound - plays armor loss audio cues when armor changes.
 */
import { useEffect, useRef } from 'react';
import armorDamageSoundUrl from '../assets/sounds/armor_damage.mp3';
import { useSoundVolume } from './useGameState';

export function useArmorChangeSound(armor: number): void {
  const soundVolume = useSoundVolume();
  const previousArmorRef = useRef(armor);
  const armorDamageAudioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(soundVolume);

  useEffect(() => {
    volumeRef.current = soundVolume;
  }, [soundVolume]);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!armorDamageAudioRef.current) {
      armorDamageAudioRef.current = new Audio(armorDamageSoundUrl);
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

    const isLoss = armor < previousArmor;
    if (!isLoss) {
      previousArmorRef.current = armor;
      return;
    }

    const audioElement = armorDamageAudioRef.current;
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
