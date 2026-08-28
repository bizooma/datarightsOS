import { useState } from 'react';
import { Play } from 'lucide-react';

// Click-to-load video embed: nothing is requested from the video host until the
// visitor presses play. Until then only a static poster served from our own media
// is shown.
export default function LazyVideoEmbed({ src, title, poster }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-[#14202b]">
      {playing ? (
        <iframe
          src={src}
          title={title}
          frameBorder="0"
          allow="encrypted-media; fullscreen;"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 w-full h-full"
        >
          <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-xl transition-transform group-hover:scale-105">
              <Play className="w-6 h-6 text-[#14202b] ml-0.5" fill="currentColor" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}