'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Play, Volume2, VolumeX } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Full-screen welcome video above the hero. It fills the viewport edge to edge
 * (object-cover) and muted-autoplays while on screen — browsers only allow
 * autoplay when muted — then pauses when scrolled away. Tapping the video, or
 * the sound button, turns on Cillian's narration and restarts from the top the
 * first time so the story is heard whole. A scroll cue invites the visitor
 * down into the journey. RTL-safe.
 */
export function IntroVideo() {
  const t = useTranslations('Intro');
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [soundedOnce, setSoundedOnce] = useState(false);

  // Play only while the intro is in view; pause once it scrolls out.
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  const enableSound = () => {
    const video = videoRef.current;
    if (!video) return;
    setMuted(false);
    video.muted = false;
    if (!soundedOnce) {
      setSoundedOnce(true);
      video.currentTime = 0; // hear the narration from the beginning
    }
    setEnded(false);
    void video.play().catch(() => {});
  };

  const toggleSound = () => {
    if (muted) {
      enableSound();
    } else {
      const video = videoRef.current;
      if (!video) return;
      setMuted(true);
      video.muted = true;
    }
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setEnded(false);
    void video.play().catch(() => {});
  };

  return (
    <section
      ref={sectionRef}
      aria-label={t('videoLabel')}
      className="relative h-[100svh] w-full overflow-hidden bg-night"
    >
      <p className="sr-only">{t('description')}</p>
      <video
        ref={videoRef}
        src="/videos/intro.mp4"
        className="absolute inset-0 h-full w-full object-cover"
        muted={muted}
        autoPlay
        playsInline
        preload="metadata"
        onClick={toggleSound}
        onPlay={() => setEnded(false)}
        onEnded={() => setEnded(true)}
      />

      <button
        type="button"
        onClick={toggleSound}
        className="absolute end-4 top-20 z-10 inline-flex items-center gap-2 rounded-full bg-black/45 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/65"
      >
        {muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
        <span>{muted ? t('soundOn') : t('soundOff')}</span>
      </button>

      {ended ? (
        <button
          type="button"
          aria-label={t('replay')}
          onClick={replay}
          className="absolute inset-0 z-10 grid place-items-center bg-black/35 transition-colors hover:bg-black/45"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-night">
            <Play className="h-7 w-7 translate-x-0.5" aria-hidden="true" />
          </span>
        </button>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 hidden justify-center md:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur">
          {t('scrollCue')}
          <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}
