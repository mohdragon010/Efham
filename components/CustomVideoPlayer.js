"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// WORLD-CLASS EDUCATIONAL VIDEO PLAYER
// Matched to: Arabic LMS design system
// Colors: White canvas · Orange #FF6B2B · Teal #00BCD4
// Typography: Tajawal / Cairo (Arabic), DM Mono (timecodes)
// Features: animated waveform · circular progress ring · chapter markers
//           hover timecode · volume reveal · big-play flash · RTL layout
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomVideoPlayer({ videoId, title, subtitle, chapters = [] }) {
  const isYouTube =
    videoId &&
    (videoId.length === 11 ||
      videoId.includes("youtube.com") ||
      videoId.includes("youtu.be"));

  const [isPlaying, setIsPlaying]         = useState(false);
  const [progress, setProgress]           = useState(0);
  const [buffered, setBuffered]           = useState(0);
  const [currentTime, setCurrentTime]     = useState(0);
  const [duration, setDuration]           = useState(0);
  const [volume, setVolume]               = useState(1);
  const [isMuted, setIsMuted]             = useState(false);
  const [isReady, setIsReady]             = useState(false);
  const [showControls, setShowControls]   = useState(true);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [isSeeking, setIsSeeking]         = useState(false);
  const [playbackRate, setPlaybackRate]   = useState(1);
  const [showRates, setShowRates]         = useState(false);
  const [error, setError]                 = useState(null);
  const [showVolume, setShowVolume]       = useState(false);
  const [hoverTime, setHoverTime]         = useState(0);
  const [hoverX, setHoverX]               = useState(0);
  const [isHoveringBar, setIsHoveringBar] = useState(false);
  const [justSeeked, setJustSeeked]       = useState(false);
  const [activeChapter, setActiveChapter] = useState(null);
  const [wavePhase, setWavePhase]         = useState(0);
  const [showBigPlay, setShowBigPlay]     = useState(false);

  const playerRef       = useRef(null);
  const videoRef        = useRef(null);
  const containerRef    = useRef(null);
  const controlsTimer   = useRef(null);
  const progressBarRef  = useRef(null);
  const bigPlayTimer    = useRef(null);

  // ── YouTube Setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isYouTube) { setIsReady(true); return; }
    const init = () => {
      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(`yt-edu-${videoId}`, {
        videoId,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, enablejsapi: 1, origin: window.location.origin },
        events: {
          onReady: (e) => { setIsReady(true); setDuration(e.target.getDuration()); e.target.setVolume(volume * 100); },
          onStateChange: (e) => setIsPlaying(e.data === window.YT.PlayerState.PLAYING),
          onError: () => setError("تعذّر تحميل الفيديو"),
        },
      });
    };
    if (window.YT?.Player) init();
    else {
      if (!document.getElementById("yt-edu-api")) {
        const s = document.createElement("script"); s.id = "yt-edu-api"; s.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(s);
      }
      window.onYouTubeIframeAPIReady = init;
    }
    return () => { playerRef.current?.destroy(); playerRef.current = null; };
  }, [videoId, isYouTube]);

  // ── Progress + wave polling ────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      if (isSeeking) return;
      let ct = 0, dur = 0;
      if (isYouTube) {
        if (!playerRef.current?.getCurrentTime) return;
        ct = playerRef.current.getCurrentTime(); dur = playerRef.current.getDuration() || duration;
      } else if (videoRef.current) {
        ct = videoRef.current.currentTime; dur = videoRef.current.duration || 0;
        if (videoRef.current.buffered.length > 0) {
          const b = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
          setBuffered(dur ? (b / dur) * 100 : 0);
        }
      }
      setCurrentTime(ct); setProgress(dur ? (ct / dur) * 100 : 0);
      if (chapters.length && dur) {
        const pct = ct / dur;
        const ch = [...chapters].reverse().find(c => c.at <= pct);
        setActiveChapter(ch?.label || null);
      }
      if (isPlaying) setWavePhase(p => p + 0.18);
    }, 100);
    return () => clearInterval(iv);
  }, [isPlaying, duration, isYouTube, isSeeking, chapters]);

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── Controls hide timer ────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3500);
  }, [isPlaying]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      switch (e.code) {
        case "Space": case "KeyK": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft":  e.preventDefault(); skip(-5);  break;
        case "ArrowRight": e.preventDefault(); skip(5);   break;
        case "KeyM": toggleMute(); break;
        case "KeyF": handleFullscreen(); break;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isPlaying, volume, isMuted]);

  const flashBigPlay = () => {
    setShowBigPlay(true);
    clearTimeout(bigPlayTimer.current);
    bigPlayTimer.current = setTimeout(() => setShowBigPlay(false), 650);
  };

  const togglePlay = useCallback(() => {
    flashBigPlay();
    if (isYouTube) { if (!playerRef.current) return; isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo(); }
    else { if (!videoRef.current) return; isPlaying ? videoRef.current.pause() : videoRef.current.play().catch(() => setError("فشل التشغيل")); setIsPlaying(!isPlaying); }
  }, [isYouTube, isPlaying]);

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setProgress(val); setJustSeeked(true); setTimeout(() => setJustSeeked(false), 700);
    if (isYouTube) playerRef.current?.seekTo((val / 100) * duration, true);
    else if (videoRef.current) videoRef.current.currentTime = (val / 100) * (videoRef.current.duration || 0);
  };

  const toggleMute = useCallback(() => {
    if (isYouTube) { if (!playerRef.current) return; isMuted ? (playerRef.current.unMute(), playerRef.current.setVolume(volume * 100)) : playerRef.current.mute(); }
    else if (videoRef.current) videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isYouTube, isMuted, volume]);

  const handleVolumeChange = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setVolume(val); setIsMuted(val === 0);
    if (isYouTube && playerRef.current) { playerRef.current.setVolume(val * 100); if (val > 0) playerRef.current.unMute(); }
    else if (videoRef.current) { videoRef.current.volume = val; videoRef.current.muted = val === 0; }
  }, [isYouTube]);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    !document.fullscreenElement ? containerRef.current.requestFullscreen?.() : document.exitFullscreen?.();
  }, []);

  const skip = useCallback((sec) => {
    if (isYouTube) playerRef.current?.seekTo(playerRef.current.getCurrentTime() + sec, true);
    else if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + sec, videoRef.current.duration || 0));
  }, [isYouTube]);

  const handleProgressHover = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x); setHoverTime(Math.max(0, Math.min(1, x / rect.width)) * duration);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const completedPct = duration ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;
  const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const circumference = 2 * Math.PI * 17;
  const WAVE_BARS = 30;
  const waveBars = Array.from({ length: WAVE_BARS }, (_, i) => {
    const h = isPlaying
      ? 36 + Math.sin(wavePhase + i * 0.65) * 18 + Math.sin(wavePhase * 1.9 + i * 0.28) * 10
      : 6;
    return Math.max(3, Math.min(36, h * 0.42));
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=DM+Mono:wght@400;500&display=swap');

        .ep { --or: #FF6B2B; --or-h: #FF8547; --or-g: rgba(255,107,43,0.3); --tl: #00BCD4; --bg: #ffffff; --sf: #F7F8FC; --bd: #E9EDF5; --t1: #1A1D2E; --t2: #6B7280; --tm: #9CA3AF; }
        .ep * { box-sizing: border-box; margin: 0; padding: 0; }
        .ep { font-family: 'Tajawal', sans-serif; direction: rtl; }

        /* Ranges */
        .ep-seek { -webkit-appearance: none; appearance: none; width: 100%; height: 100%; background: transparent; outline: none; cursor: pointer; position: absolute; inset: 0; opacity: 0; }
        .ep-seek::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--or); cursor: pointer; }

        .ep-vol { -webkit-appearance: none; appearance: none; height: 3px; border-radius: 99px; outline: none; cursor: pointer; width: 72px; }
        .ep-vol::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 2px solid var(--or); cursor: pointer; margin-top: -4.5px; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
        .ep-vol::-webkit-slider-runnable-track { height: 3px; border-radius: 99px; }
        .ep-vol::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 2px solid var(--or); }

        /* Progress thumb */
        .ep-progress-input { -webkit-appearance: none; appearance: none; width: 100%; background: transparent; outline: none; cursor: pointer; height: 20px; }
        .ep-progress-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; border: 3px solid var(--or);
          box-shadow: 0 0 0 4px var(--or-g), 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer; margin-top: -6.5px;
          transition: transform .15s, box-shadow .15s;
        }
        .ep-progress-input:hover::-webkit-slider-thumb { transform: scale(1.25); box-shadow: 0 0 0 7px var(--or-g), 0 2px 8px rgba(0,0,0,0.3); }
        .ep-progress-input::-webkit-slider-runnable-track { height: 3px; border-radius: 99px; }
        .ep-progress-input::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 3px solid var(--or); }

        /* Ctrl buttons */
        .ep-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 50%; width: 36px; height: 36px; color: rgba(255,255,255,.85); transition: background .15s, transform .15s; }
        .ep-btn:hover { background: rgba(255,255,255,.16); transform: scale(1.1); color: #fff; }
        .ep-btn:active { transform: scale(.92); }

        /* Skip buttons */
        .ep-skip { background: rgba(255,255,255,.12); border: none; cursor: pointer; border-radius: 12px; padding: 9px 16px; color: rgba(255,255,255,.9); display: flex; flex-direction: column; align-items: center; gap: 2px; transition: all .2s; backdrop-filter: blur(6px); }
        .ep-skip:hover { background: rgba(255,255,255,.22); color: #fff; transform: scale(1.05); }

        /* Big play */
        .ep-play { width: 70px; height: 70px; border-radius: 50%; border: none; background: var(--or); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 24px var(--or-g), 0 2px 8px rgba(0,0,0,.2); transition: transform .15s, box-shadow .15s, background .15s; position: relative; overflow: hidden; }
        .ep-play::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at 38% 32%, rgba(255,255,255,.28), transparent 65%); pointer-events: none; }
        .ep-play:hover { transform: scale(1.1); box-shadow: 0 10px 32px var(--or-g); background: var(--or-h); }
        .ep-play:active { transform: scale(.94); }

        /* Rate pill */
        .ep-rate { border: 1.5px solid rgba(255,255,255,.22); border-radius: 8px; padding: 4px 11px; background: rgba(255,255,255,.1); color: rgba(255,255,255,.9); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; backdrop-filter: blur(6px); font-family: 'Tajawal', sans-serif; white-space: nowrap; }
        .ep-rate:hover { background: rgba(255,255,255,.2); color: #fff; }
        .ep-rate.on { background: var(--or); border-color: var(--or); }

        /* Rate dropdown */
        .ep-rdrop { position: absolute; bottom: calc(100% + 8px); left: 0; background: rgba(20,22,38,.97); border-radius: 14px; min-width: 88px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.07); animation: dropIn .18s ease-out; z-index: 60; }
        .ep-ropt { display: block; width: 100%; text-align: center; padding: 9px 14px; background: none; border: none; cursor: pointer; color: rgba(255,255,255,.7); font-size: 13px; font-weight: 500; font-family: 'Tajawal', sans-serif; transition: background .12s, color .12s; }
        .ep-ropt:hover { background: rgba(255,255,255,.07); color: #fff; }
        .ep-ropt.sel { color: var(--or); font-weight: 700; }

        /* Time tooltip */
        .ep-tt { position: absolute; bottom: calc(100% + 10px); background: rgba(20,22,38,.95); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; white-space: nowrap; transform: translateX(-50%); pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,.25); backdrop-filter: blur(8px); font-family: 'DM Mono', monospace; }
        .ep-tt::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: rgba(20,22,38,.95); }

        /* Big flash */
        @keyframes bigFlash { 0% { opacity: .8; transform: translate(-50%,-50%) scale(.5); } 60% { opacity: .6; transform: translate(-50%,-50%) scale(1.05); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.2); } }
        .ep-flash { animation: bigFlash .65s ease-out forwards; }

        /* Animations */
        @keyframes dropIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes seekPulse { 0%,100% { box-shadow: 0 0 0 0 var(--or-g); } 50% { box-shadow: 0 0 12px 4px var(--or-g); } }
        .ep-seek-pulse { animation: seekPulse .7s ease-in-out; }

        /* Chapter dot */
        .ep-chap { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 2px; border-radius: 99px; background: rgba(255,255,255,.55); transition: height .15s, background .15s; pointer-events: none; }
        .ep-chap:hover { background: #fff; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════ OUTER CARD */}
      <div className="ep" style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 48px rgba(0,0,0,.14), 0 2px 8px rgba(0,0,0,.07)", background: "var(--bg)", width: "100%" }}>

        {/* ═══════════════════════════════════════════════════ VIDEO STAGE */}
        <div ref={containerRef} tabIndex={0} style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0b0d1a", overflow: "hidden", outline: "none" }}
          onMouseMove={resetTimer} onMouseLeave={() => isPlaying && setShowControls(false)} onContextMenu={(e) => e.preventDefault()}>

          {/* Player engine */}
          {isYouTube
            ? <div id={`yt-edu-${videoId}`} style={{ width: "100%", height: "100%", pointerEvents: "none" }} />
            : <video ref={videoRef} src={videoId} style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onEnded={() => setIsPlaying(false)} onLoadedMetadata={() => setDuration(videoRef.current.duration)} onError={() => setError("تعذّر تحميل الفيديو")} playsInline />
          }

          {/* Click overlay */}
          <div style={{ position: "absolute", inset: 0, zIndex: 10, cursor: "pointer" }} onClick={togglePlay} onDoubleClick={handleFullscreen} />

          {/* Loading */}
          {!isReady && !error && (
            <div style={{ position: "absolute", inset: 0, zIndex: 25, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#0b0d1a" }}>
              <div style={{ width: 46, height: 46, border: "3.5px solid rgba(255,107,43,.18)", borderTopColor: "var(--or)", borderRadius: "50%", animation: "spin .75s linear infinite" }} />
              <span style={{ color: "rgba(255,255,255,.4)", fontSize: 13, letterSpacing: ".08em" }}>جارٍ التحميل…</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ position: "absolute", inset: 0, zIndex: 25, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "#0b0d1a" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ color: "#ef4444", fontSize: 14, fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {/* Big play/pause flash */}
          {showBigPlay && (
            <div className="ep-flash" style={{ position: "absolute", zIndex: 22, left: "50%", top: "50%", width: 76, height: 76, borderRadius: "50%", background: "rgba(255,107,43,.8)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              {isPlaying
                ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>
                : <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style={{ marginRight: -3 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
              }
            </div>
          )}

          {/* ─────────────────────── CONTROLS OVERLAY */}
          <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: showControls || !isPlaying ? 1 : 0, transition: "opacity .4s ease", pointerEvents: "none" }}>

            {/* Top vignette */}
            <div style={{ position: "absolute", top: 0, insetInline: 0, height: "38%", background: "linear-gradient(to bottom, rgba(0,0,0,.65), transparent)", pointerEvents: "none" }} />
            {/* Bottom vignette */}
            <div style={{ position: "absolute", bottom: 0, insetInline: 0, height: "52%", background: "linear-gradient(to top, rgba(0,0,0,.75), transparent)", pointerEvents: "none" }} />

            {/* ── Top bar */}
            <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 20px 0", pointerEvents: "auto" }}>
              <div>
                {title && <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1.35, textShadow: "0 1px 6px rgba(0,0,0,.5)", maxWidth: 400 }}>{title}</div>}
                {(subtitle || activeChapter) && <div style={{ color: "rgba(255,255,255,.6)", fontSize: 12, marginTop: 3, fontWeight: 400 }}>{activeChapter || subtitle}</div>}
              </div>
              {completedPct > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: completedPct >= 90 ? "var(--tl)" : "var(--or)", borderRadius: 99, padding: "5px 12px", boxShadow: "0 2px 10px rgba(0,0,0,.25)", flexShrink: 0 }}>
                  {completedPct >= 90 && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{completedPct}%</span>
                </div>
              )}
            </div>

            {/* ── Center transport */}
            <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, pointerEvents: "auto" }}>
              <button className="ep-skip" onClick={(e) => { e.stopPropagation(); skip(-10); }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                <span style={{ fontSize: 11, fontWeight: 600 }}>١٠ث</span>
              </button>

              <button className="ep-play" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                {isPlaying
                  ? <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>
                  : <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{ marginRight: -3 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                }
              </button>

              <button className="ep-skip" onClick={(e) => { e.stopPropagation(); skip(10); }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg>
                <span style={{ fontSize: 11, fontWeight: 600 }}>١٠ث</span>
              </button>
            </div>

            {/* ── Bottom controls */}
            <div style={{ position: "relative", zIndex: 2, padding: "0 18px 16px", pointerEvents: "auto" }}>

              {/* Waveform bar visualization */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2.5, height: 24, marginBottom: 9, opacity: isPlaying ? 1 : 0.25, transition: "opacity .5s" }}>
                {waveBars.map((h, i) => {
                  const played = i < WAVE_BARS * (progress / 100);
                  return <div key={i} style={{ width: 3.5, height: h, background: played ? "var(--or)" : "rgba(255,255,255,.3)", borderRadius: 99, transition: "height .1s ease, background .25s" }} />;
                })}
              </div>

              {/* Progress bar */}
              <div ref={progressBarRef} style={{ position: "relative", height: 20, marginBottom: 10, cursor: "pointer" }}
                onMouseEnter={() => setIsHoveringBar(true)} onMouseLeave={() => setIsHoveringBar(false)} onMouseMove={handleProgressHover}>

                {/* Track */}
                <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 0, right: 0, height: isHoveringBar ? 5 : 3, borderRadius: 99, background: "rgba(255,255,255,.2)", transition: "height .15s", overflow: "visible" }}>
                  <div style={{ position: "absolute", inset: 0, width: `${buffered}%`, background: "rgba(255,255,255,.22)", borderRadius: 99 }} />
                  <div className={justSeeked ? "ep-seek-pulse" : ""} style={{ position: "absolute", inset: 0, width: `${progress}%`, background: "var(--or)", borderRadius: 99, boxShadow: "0 0 7px var(--or-g)" }} />
                  {chapters.map((ch, i) => (
                    <div key={i} className="ep-chap" style={{ left: `${ch.at * 100}%`, height: isHoveringBar ? 14 : 10 }} title={ch.label} />
                  ))}
                </div>

                {/* Hover tooltip */}
                {isHoveringBar && (
                  <div className="ep-tt" style={{ left: hoverX }}>{fmt(hoverTime)}</div>
                )}

                {/* Thumb overlay */}
                {isHoveringBar && (
                  <div style={{ position: "absolute", top: "50%", transform: "translate(-50%, -50%)", left: `${progress}%`, width: 16, height: 16, borderRadius: "50%", background: "#fff", border: "3px solid var(--or)", boxShadow: "0 0 0 4px var(--or-g)", pointerEvents: "none", transition: "left .1s" }} />
                )}

                <input type="range" min="0" max="100" step="0.05" value={progress}
                  onChange={handleSeek}
                  onMouseDown={() => setIsSeeking(true)} onMouseUp={() => setIsSeeking(false)}
                  onTouchStart={() => setIsSeeking(true)} onTouchEnd={() => setIsSeeking(false)}
                  onClick={(e) => e.stopPropagation()}
                  className="ep-seek"
                />
              </div>

              {/* Control row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                {/* Right cluster (RTL start) */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Volume */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}
                    onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
                    <button className="ep-btn" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
                      {isMuted || volume === 0
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                        : volume < 0.5
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                      }
                    </button>
                    <div style={{ width: showVolume ? 72 : 0, overflow: "hidden", transition: "width .25s ease" }}>
                      <input type="range" min="0" max="1" step="0.01"
                        value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                        onClick={(e) => e.stopPropagation()} className="ep-vol"
                        style={{ background: `linear-gradient(to right, var(--or) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,.25) ${(isMuted ? 0 : volume) * 100}%)` }}
                      />
                    </div>
                  </div>

                  {/* Timecode */}
                  <span style={{ color: "rgba(255,255,255,.92)", fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace", letterSpacing: ".03em", direction: "ltr", display: "inline-block" }}>
                    {fmt(currentTime)} <span style={{ color: "rgba(255,255,255,.35)" }}>/</span> {fmt(duration)}
                  </span>
                </div>

                {/* Left cluster */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Rate */}
                  <div style={{ position: "relative" }}>
                    <button className={`ep-rate ${playbackRate !== 1 ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); setShowRates(s => !s); }}>
                      {playbackRate === 1 ? "السرعة" : `${playbackRate}×`}
                    </button>
                    {showRates && (
                      <div className="ep-rdrop" onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: "7px 12px 5px", color: "rgba(255,255,255,.3)", fontSize: 10, letterSpacing: ".15em", borderBottom: "1px solid rgba(255,255,255,.06)", textAlign: "center" }}>السرعة</div>
                        {RATES.map(r => (
                          <button key={r} className={`ep-ropt ${r === playbackRate ? "sel" : ""}`}
                            onClick={() => { setPlaybackRate(r); if (isYouTube && playerRef.current) playerRef.current.setPlaybackRate(r); else if (videoRef.current) videoRef.current.playbackRate = r; setShowRates(false); }}>
                            {r === 1 ? "عادي" : `${r}×`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button className="ep-btn" onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}>
                    {isFullscreen
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════ BOTTOM INFO STRIP */}
        <div style={{ background: "var(--bg)", padding: "14px 20px 16px", borderTop: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 14 }}>

          {/* Progress ring */}
          <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="24" cy="24" r="18" fill="none" stroke="var(--bd)" strokeWidth="3.5" />
              <circle cx="24" cy="24" r="18" fill="none"
                stroke={completedPct >= 90 ? "var(--tl)" : "var(--or)"}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - completedPct / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset .5s ease" }}
              />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: completedPct >= 90 ? "var(--tl)" : "var(--or)", fontFamily: "'DM Mono', monospace" }}>
              {completedPct}%
            </span>
          </div>

          {/* Meta */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            {title && <div style={{ color: "var(--t1)", fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--tm)", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{fmt(currentTime)} / {fmt(duration)}</span>
              {completedPct >= 90 && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,188,212,.1)", color: "var(--tl)", borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  مكتمل
                </span>
              )}
            </div>
          </div>

          {/* Playback rate badge */}
          {playbackRate !== 1 && (
            <div style={{ background: "rgba(255,107,43,.08)", color: "var(--or)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {playbackRate}×
            </div>
          )}
        </div>
      </div>
    </>
  );
}