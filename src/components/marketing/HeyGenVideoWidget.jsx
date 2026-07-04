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
          className="group relative block w-[130px] h-[200px] rounded-2xl overflow-hidden shadow-2xl border border-border bg-black"
        >
          <img
            src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/93ea73c5f_generated_image.png"
            alt="Data Rights video"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="h-12 w-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </span>
          </div>
          <span className="absolute bottom-0 inset-x-0 px-2 py-1.5 text-[11px] font-medium text-white bg-gradient-to-t from-black/70 to-transparent text-center">
            Watch video
          </span>
        </button>
      )}
    </div>
  );
}