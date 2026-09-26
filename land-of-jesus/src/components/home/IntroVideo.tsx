'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Play, Volume2, VolumeX } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Full-screen welcome video above the hero. It muted-autoplays while it is on
 * screen (browsers only allow autoplay when muted) and pauses when scrolled
 * away. Tapping the video, or the sound button, turns on Cillian's narration —
 * and restarts from the top the first time, so the story is heard whole. A
 * scroll cue invites the visitor down into the journey. RTL-safe.
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
      className="relative flex min-h-[100svh] flex-col items-center justify-center bg-night px-4 py-16"
    >
      <div className="relative w-full max-w-5xl overflow-hidden rounded-card shadow-float">
        <video
          ref={videoRef}
          src="/videos/intro.mp4"
          className="aspect-video max-h-[78svh] w-full bg-black object-contain"
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
          className="absolute bottom-3 end-3 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/70"
        >
          {muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
          <span>{muted ? t('soundOn') : t('soundOff')}</span>
        </button>

        {ended ? (
          <button
            type="button"
            aria-label={t('replay')}
            onClick={replay}
            className="absolute inset-0 grid place-items-center bg-black/35 transition-colors hover:bg-black/45"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-night">
              <Play className="h-7 w-7 translate-x-0.5" aria-hidden="true" />
            </span>
          </button>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col items-center gap-1 text-white/70">
        <span className="text-sm tracking-wide">{t('scrollCue')}</span>
        <ChevronDown className="h-5 w-5 animate-bounce" aria-hidden="true" />
      </div>
    </section>
  );
}
