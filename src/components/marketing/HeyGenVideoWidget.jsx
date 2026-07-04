import { useState } from 'react';
import { Play, X } from 'lucide-react';

export default function HeyGenVideoWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {open ? (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-black">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close video"
            className="absolute top-2 right-2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <iframe
            width="315"
            height="560"
            src="https://app.heygen.com/embeds/bc499743fdfe4c15a57c544a27c24f32"
            title="Data Rights"
            frameBorder="0"
            allow="encrypted-media; fullscreen;"
            allowFullScreen
            className="block"
          />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Play Data Rights video"
          className="group relative flex flex-col items-center justify-center gap-3 w-[130px] h-[200px] rounded-2xl overflow-hidden shadow-2xl border border-border bg-gradient-to-br from-primary to-primary/70"
        >
          <span className="h-12 w-12 flex items-center justify-center rounded-full bg-white/20 group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current text-white ml-0.5" />
          </span>
          <span className="text-[11px] font-medium text-white px-2 text-center">
            Watch video
          </span>
        </button>
      )}
    </div>
  );
}