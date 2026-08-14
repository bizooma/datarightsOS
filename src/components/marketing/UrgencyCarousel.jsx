import { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { urgencyCards } from './urgencyCards';

export default function UrgencyCarousel() {
  const scrollRef = useRef(null);
  const pausedRef = useRef(false);

  const resumeTimer = useRef(null);

  // Pause the auto-scroll while the smooth scroll animates, otherwise the
  // per-frame scrollLeft writes cancel it out immediately.
  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    pausedRef.current = true;
    const half = el.scrollWidth / 2;
    let target = el.scrollLeft + dir * 325;
    if (target < 0) {
      el.scrollLeft += half;
      target += half;
    } else if (target >= half) {
      el.scrollLeft -= half;
      target -= half;
    }
    el.scrollTo({ left: target, behavior: 'smooth' });
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { pausedRef.current = false; }, 700);
  };

  // Continuous auto-scroll. Loops back to start seamlessly using the duplicated track.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf;
    const step = () => {
      if (!pausedRef.current) {
        el.scrollLeft += 0.6;
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
      <div
        ref={scrollRef}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin] [scrollbar-color:#b91c1c_transparent]"
      >
        {[...urgencyCards, ...urgencyCards].map((card, i) => (
          <article
            key={i}
            className="group relative shrink-0 w-[300px] rounded-xl overflow-hidden border border-red-700/40 bg-gradient-to-b from-[#1d1112] to-[#150d0e] flex flex-col shadow-lg shadow-black/40 hover:border-red-500/70 transition-colors"
          >
            {/* Alert header bar */}
            <div className="bg-gradient-to-r from-red-700 to-red-600 px-5 py-2 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white">
                {card.tag} Alert
              </span>
            </div>

            {/* Corner accents */}
            <span className="pointer-events-none absolute top-12 left-3 w-3 h-3 border-t border-l border-red-500/50" />
            <span className="pointer-events-none absolute top-12 right-3 w-3 h-3 border-t border-r border-red-500/50" />

            <div className="px-5 pt-6 pb-5 flex flex-col flex-1">
              {card.stat && (
                <p className="text-3xl font-extrabold text-white text-center tracking-tight mb-1">
                  {card.stat}
                </p>
              )}
              <h3 className="text-[15px] font-bold text-red-400 text-center uppercase tracking-wide leading-snug mb-3">
                {card.headline}
              </h3>
              <p className="text-[13px] text-slate-400 leading-relaxed text-center flex-1">
                {card.body}
              </p>
            </div>

            {/* Footer action row */}
            <div className="border-t border-red-700/30 bg-red-950/30 px-5 py-3 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">
                Stay Ahead
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Arrow controls */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="w-9 h-9 rounded-full border border-red-800/50 bg-red-950/30 text-red-300 flex items-center justify-center hover:bg-red-900/40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="w-9 h-9 rounded-full border border-red-800/50 bg-red-950/30 text-red-300 flex items-center justify-center hover:bg-red-900/40 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}