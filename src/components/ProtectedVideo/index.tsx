'use client';

import React, { useEffect } from 'react';

import Link from 'next/link';

interface ProtectedVideoProps {
  src: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  link?: string | null;
  controls?: boolean;
  showPlayIcon?: boolean;
}

export default function ProtectedVideo({
  src,
  autoPlay = true,
  muted = true,
  loop = true,
  className = '',
  link = null,
  controls = false,
  showPlayIcon = false,
}: ProtectedVideoProps) {
  useEffect(() => {
    // Prevent keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const preventRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const VideoElement = (
    <video
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      disablePictureInPicture
      playsInline
      // preload="auto"
      controls={controls}
      controlsList="nodownload noplaybackrate nofullscreen"
      className={`w-full h-full object-cover pointer-events-none ${className}`}
      onContextMenu={preventRightClick}
      style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );

  const PlayOverlay = (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50">
        <svg className="h-[18px] w-[18px] text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {/* Triangle is bounding-box centred on the 24x24 viewBox (x 7.5-16.5, y 5.5-18.5)
              so it sits dead centre of the circle without a nudge. */}
          <path d="M8.5 5.5v13a1 1 0 001.54.84l8.5-6.5a1 1 0 000-1.68l-8.5-6.5A1 1 0 008.5 5.5z" />
        </svg>
      </div>
    </div>
  );

  if (link) {
    return (
      <div className="relative w-full h-full overflow-hidden" onContextMenu={preventRightClick}>
        {VideoElement}
        {showPlayIcon && PlayOverlay}
        <Link href={link} className="absolute inset-0 w-full h-full" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden" onContextMenu={preventRightClick}>
      {VideoElement}
      {showPlayIcon && PlayOverlay}
    </div>
  );
}
