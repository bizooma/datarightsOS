import { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { urgencyCards } from './urgencyCards';

export default function UrgencyCarousel() {
  const scrollRef = useRef(null);
  const pausedRef = useRef(false);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  // Continuous auto-scroll. Loops back to start seamlessly using the duplicated track.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf;
    const step = () => {
      if (!pausedRef.current) {
        el.scrollLeft += 0.6;
        // The track is duplicated, so reset to the first half once we pass it.
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) {
          el.scrollLeft -= half;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative">
      {/* Arrow controls */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="w-9 h-9 rounded-full border border-red-900/50 bg-red-950/30 text-red-300 flex items-center justify-center hover:bg-red-900/40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="w-9 h-9 rounded-full border border-red-900/50 bg-red-950/30 text-red-300 flex items-center justify-center hover:bg-red-900/40 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin] [scrollbar-color:#7f1d1d_transparent]"
      >
        {[...urgencyCards, ...urgencyCards].map((card, i) => (
          <article
            key={i}
            className="shrink-0 w-[300px] rounded-xl border border-red-900/40 bg-gradient-to-b from-red-950/40 to-[#1a1010] p-6 flex flex-col hover:border-red-700/70 hover:from-red-950/60 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-700/40 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-300/80 bg-red-900/30 border border-red-800/40 px-2 py-0.5 rounded-full">
                {card.tag}
              </span>
            </div>
            <h3 className="font-semibold text-white text-[15px] leading-snug mb-3">
              {card.title}
            </h3>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              {card.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}