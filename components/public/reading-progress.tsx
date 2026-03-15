"use client";

import {useEffect, useState} from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const fullHeight = document.body.scrollHeight - window.innerHeight;
      const next = fullHeight > 0 ? (window.scrollY / fullHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, next)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, {passive: true});
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-transparent">
      <div className="h-full bg-site-accent transition-[width] duration-150" style={{width: `${progress}%`}} />
    </div>
  );
}
