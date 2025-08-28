import { useRef, useCallback, useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

const sources = {
  background: require('../../assets/sound/bingo/background_music.mp3'),
  start: require('../../assets/sound/bingo/start.mp3'),
  win: require('../../assets/sound/bingo/win.mp3'),
  select: require('../../assets/sound/bingo/select.mp3'),
  logro: require('../../assets/sound/bingo/logro.mp3'),
};

export function useBingoSound() {
  const bg = useAudioPlayer(sources.background);
  const sStart = useAudioPlayer(sources.start);
  const sWin = useAudioPlayer(sources.win);
  const sSelect = useAudioPlayer(sources.select);
  const sLogro = useAudioPlayer(sources.logro);

  const [musicMuted, setMusicMuted] = useState(false);
  const [effectsMuted, setEffectsMuted] = useState(false);
  const effectsMutedRef = useRef(effectsMuted);
  useEffect(() => { effectsMutedRef.current = effectsMuted; }, [effectsMuted]);
  // Volúmenes por efecto (ajustables)
  const defaultEffectVolumes = useRef({ start: 0.15, win: 0.8, select: 0.2, logro: 0.7 });
  const bgTargetVolume = 0.03;
  const bgFadeTimerRef = useRef(null);

  const lastEffectRef = useRef({ type: null, at: 0 });

  // Configurar volumen bajo del background y forzar loop cuando sea posible
  useEffect(() => {
    try {
      if ('volume' in bg) bg.volume = bgTargetVolume;
      // Intentos de loop según API disponible
      if ('looping' in bg) bg.looping = true;
      if (typeof bg.setLooping === 'function') bg.setLooping(true);
      if (typeof bg.setIsLooping === 'function') bg.setIsLooping(true);
    } catch {}
  }, [bg]);


  const startBackground = useCallback(() => {
    if (musicMuted) return;
    try {
      // Fade-in para evitar picos
      if (bgFadeTimerRef.current) { clearInterval(bgFadeTimerRef.current); bgFadeTimerRef.current = null; }
      if ('volume' in bg) bg.volume = 0;
      if (typeof bg.seekTo === 'function') bg.seekTo(0);
      if (typeof bg.play === 'function') bg.play();
      // Incremento en 8 pasos hasta bgTargetVolume
      let steps = 8, i = 0;
      const step = bgTargetVolume / steps;
      bgFadeTimerRef.current = setInterval(() => {
        try {
          if (!('volume' in bg)) { clearInterval(bgFadeTimerRef.current); bgFadeTimerRef.current = null; return; }
          const next = Math.min(bgTargetVolume, (bg.volume || 0) + step);
          bg.volume = next;
          i++;
          if (i >= steps || next >= bgTargetVolume) {
            clearInterval(bgFadeTimerRef.current);
            bgFadeTimerRef.current = null;
            bg.volume = bgTargetVolume;
          }
        } catch {
          clearInterval(bgFadeTimerRef.current);
          bgFadeTimerRef.current = null;
        }
      }, 60);
    } catch (e) {
      console.warn('[useBingoSound] startBackground failed', e);
    }
  }, [bg, musicMuted]);

  const stopBackground = useCallback(() => {
    try {
      if (bgFadeTimerRef.current) { clearInterval(bgFadeTimerRef.current); bgFadeTimerRef.current = null; }
      if ('volume' in bg) bg.volume = 0;
      if (typeof bg.pause === 'function') bg.pause();
    } catch {}
  }, [bg]);

  const playEffect = useCallback((type) => {
    if (effectsMutedRef.current) return;
    const now = Date.now();
    const { type: lastType, at } = lastEffectRef.current || {};
    if (type === 'logro' && lastType === 'win' && now - at < 1500) return;
    if (lastType === type && now - at < 200) return;
    try {
  if (type === 'start') { if ('volume' in sStart) sStart.volume = defaultEffectVolumes.current.start; sStart.seekTo?.(0); sStart.play?.(); }
  else if (type === 'win') { if ('volume' in sWin) sWin.volume = defaultEffectVolumes.current.win; sWin.seekTo?.(0); sWin.play?.(); }
  else if (type === 'select') { if ('volume' in sSelect) sSelect.volume = defaultEffectVolumes.current.select; sSelect.seekTo?.(0); sSelect.play?.(); }
  else if (type === 'logro') { if ('volume' in sLogro) sLogro.volume = defaultEffectVolumes.current.logro; sLogro.seekTo?.(0); sLogro.play?.(); }
      lastEffectRef.current = { type, at: now };
    } catch (e) {
      console.warn('[useBingoSound] playEffect failed', type, e);
    }
  }, [effectsMuted, sStart, sWin, sSelect, sLogro]);

  // Aplicar mute de efectos forzando volumen 0 y pausando si está activo
  useEffect(() => {
    const players = [sStart, sWin, sSelect, sLogro];
    try {
      players.forEach((p) => {
        if (!p) return;
        if (effectsMuted) {
          try { p.pause?.(); } catch {}
          try { if ('volume' in p) p.volume = 0; } catch {}
        } else {
          try {
            if (p === sStart && 'volume' in p) p.volume = defaultEffectVolumes.current.start;
            if (p === sWin && 'volume' in p) p.volume = defaultEffectVolumes.current.win;
            if (p === sSelect && 'volume' in p) p.volume = defaultEffectVolumes.current.select;
            if (p === sLogro && 'volume' in p) p.volume = defaultEffectVolumes.current.logro;
          } catch {}
        }
      });
    } catch {}
  }, [effectsMuted, sStart, sWin, sSelect, sLogro]);

  return {
    startBackground,
    stopBackground,
    musicMuted,
    setMusicMuted,
    effectsMuted,
    setEffectsMuted,
    playEffect,
  };
}
