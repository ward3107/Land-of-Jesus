'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Full-screen welcome video above the hero. It fills the viewport edge to edge
 * (object-cover) and tries to autoplay with narration while on screen. When a
 * browser blocks audible autoplay, the visitor can start it with one tap. The
 * video remains unmuted. A pinned stage gives the introduction room to breathe
 * while scrolling into the rest of the journey. RTL-safe.
 */
export function IntroVideo() {
  const t = useTranslations('Intro');
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [ended, setEnded] = useState(false);

  // Keep playback tied to the visible, pinned stage rather than the taller
  // scroll section. A rejected audible play request exposes the start button.
  useEffect(() => {
    const video = videoRef.current;
    const stage = stageRef.current;
    if (!video || !stage) return;
    let mounted = true;
    const playWithSound = () => {
      video.muted = false;
      void video.play().catch(() => {
        if (mounted) setNeedsGesture(true);
      });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !video.ended) playWithSound();
        else video.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(stage);
    playWithSound();
    return () => {
      mounted = false;
      io.disconnect();
    };
  }, []);

  const startWithSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.currentTime = 0;
    setEnded(false);
    void video.play().then(
      () => setNeedsGesture(false),
      () => setNeedsGesture(true),
    );
  };

  return (
    <section
      aria-label={t('videoLabel')}
      className="relative h-[200svh] w-full bg-night motion-reduce:h-[100svh]"
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/intro.mp4"
          aria-label={t('videoLabel')}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          playsInline
          preload="auto"
          onPlay={() => { setEnded(false); setNeedsGesture(false); }}
          onEnded={() => setEnded(true)}
          onError={() => setNeedsGesture(true)}
        />

        {needsGesture || ended ? (
          <button
            type="button"
            onClick={startWithSound}
            className="absolute inset-0 z-10 grid place-items-center bg-black/35 transition-colors hover:bg-black/45"
          >
            <span className="flex items-center gap-3 rounded-full bg-white/90 px-6 py-4 font-medium text-night">
              <Play className="h-6 w-6" aria-hidden="true" />
              {ended ? t('replay') : t('soundOn')}
            </span>
          </button>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 hidden justify-center md:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur">
            {t('scrollCue')}
            <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  );
}
