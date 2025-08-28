import { useRef, useCallback, useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';

// Cambiar imports por requires para mejor bundling
const sources = {
  background: require('./bingo/background_music.mp3'),
  start: require('./bingo/start.mp3'),
  win: require('./bingo/win.mp3'),
  select: require('./bingo/select.mp3'),
  logro: require('./bingo/logro.mp3'),
}

export function useBingoSound() {
  const [assetsReady, setAssetsReady] = useState(true);

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
    if (!assetsReady || !bg) return;
    try {
      if ('volume' in bg) bg.volume = bgTargetVolume;
      // Intentos de loop según API disponible
      if ('looping' in bg) bg.looping = true;
      bg.loop = true;
      if (typeof bg.setLooping === 'function') bg.setLooping(true);
      if (typeof bg.setIsLooping === 'function') bg.setIsLooping(true);
      console.log(bg.loop);

      // Refuerzo: listener para reiniciar manualmente si termina
      if (typeof bg.addEventListener === 'function') {
        const onEnd = () => {
          if (!musicMuted && assetsReady) {
            try {
              if (typeof bg.seekTo === 'function') bg.seekTo(0);
              if (typeof bg.play === 'function') bg.play();
            } catch (e) {
              console.warn('[useBingoSound] Loop manual failed', e);
            }
          }
        };
        bg.addEventListener('ended', onEnd);
        return () => {
          bg.removeEventListener('ended', onEnd);
        };
      }
    } catch (error) {
      console.warn('Error configurando background:', error);
    }
  }, [bg, assetsReady, musicMuted]);

  const startBackground = useCallback(() => {
    if (!assetsReady || !bg || musicMuted) return;
    
    try {
      // Fade-in para evitar picos
      if (bgFadeTimerRef.current) { 
        clearInterval(bgFadeTimerRef.current); 
        bgFadeTimerRef.current = null; 
      }
      
      if ('volume' in bg) bg.volume = 0;
      if (typeof bg.seekTo === 'function') bg.seekTo(0);
      if (typeof bg.play === 'function') bg.play();
      
      // Incremento en 8 pasos hasta bgTargetVolume
      let steps = 8, i = 0;
      const step = bgTargetVolume / steps;
      bgFadeTimerRef.current = setInterval(() => {
        try {
          if (!('volume' in bg)) { 
            clearInterval(bgFadeTimerRef.current); 
            bgFadeTimerRef.current = null; 
            return; 
          }
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
  }, [bg, musicMuted, assetsReady]);

  const stopBackground = useCallback(() => {
    if (!bg) return;
    
    try {
      if (bgFadeTimerRef.current) { 
        clearInterval(bgFadeTimerRef.current); 
        bgFadeTimerRef.current = null; 
      }
      
      // Verificar que el reproductor no haya sido liberado
      if (bg && typeof bg.pause === 'function') {
        try {
          if ('volume' in bg) bg.volume = 0;
          bg.pause();
        } catch (releaseError) {
          console.warn('Background player was already released:', releaseError);
        }
      }
    } catch (error) {
      console.warn('Error stopping background:', error);
    }
  }, [bg]);

  const playEffect = (type) => {
    console.log(type, assetsReady, effectsMutedRef.current)
    if (effectsMutedRef.current) return;
    
    const now = Date.now();
    const { type: lastType, at } = lastEffectRef.current || {};
    if (type === 'logro' && lastType === 'win' && now - at < 1500) return;
    if (lastType === type && now - at < 200) return;
    console.log(sSelect)
    try {
      if (type === 'start' && sStart) { 
        if ('volume' in sStart) sStart.volume = defaultEffectVolumes.current.start; 
        sStart.seekTo?.(0); 
        sStart.play?.(); 
      }
      else if (type === 'win' && sWin) { 
        if ('volume' in sWin) sWin.volume = defaultEffectVolumes.current.win; 
    try {
          sWin.seekTo?.(0);
          const p = sWin.play?.();
          if (p && typeof p.then === "function") {
            p.catch(() => {
              setTimeout(() => sWin.play?.(), 50); // reintento rápido
            });
          }
        } catch (e) {
          console.warn("playEffect failed", e);
        }
      }
      else if (type === 'select' && sSelect) { 
        if ('volume' in sSelect) sSelect.volume = defaultEffectVolumes.current.select; 
        try {
          sSelect.seekTo?.(0);
          const p = sSelect.play?.();
          if (p && typeof p.then === "function") {
            p.catch(() => {
              setTimeout(() => sSelect.play?.(), 50); // reintento rápido
            });
          }
        } catch (e) {
          console.warn("playEffect failed", e);
        }
      }
      else if (type === 'logro' && sLogro) { 
        if ('volume' in sLogro) sLogro.volume = defaultEffectVolumes.current.logro; 
        try {
          sLogro.seekTo?.(0);
          const p = sLogro.play?.();
          if (p && typeof p.then === "function") {
            p.catch(() => {
              setTimeout(() => sLogro.play?.(), 50); // reintento rápido
            });
          }
        } catch (e) {
          console.warn("playEffect failed", e);
        }
      }
      
      lastEffectRef.current = { type, at: now };
    } catch (e) {
      console.warn('[useBingoSound] playEffect failed', type, e);
    }
  };

  // Aplicar mute de efectos forzando volumen 0 y pausando si está activo
  useEffect(() => {
    if (!assetsReady) return;
    
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
  }, [effectsMuted, sStart, sWin, sSelect, sLogro, assetsReady]);

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      try {
        if (bgFadeTimerRef.current) {
          clearInterval(bgFadeTimerRef.current);
          bgFadeTimerRef.current = null;
        }
        
        // Limpiar todos los reproductores de audio
        const players = [bg, sStart, sWin, sSelect, sLogro];
        players.forEach(player => {
          if (player && typeof player.pause === 'function') {
            try {
              player.pause();
            } catch (e) {
              // Player ya fue liberado, ignorar
            }
          }
        });
      } catch (error) {
        console.warn('Error during audio cleanup:', error);
      }
    };
  }, [bg, sStart, sWin, sSelect, sLogro]);

  return {
    startBackground,
    stopBackground,
    musicMuted,
    setMusicMuted,
    effectsMuted,
    setEffectsMuted,
    playEffect,
    assetsReady, // Nuevo: para saber si los assets están listos
  };
}