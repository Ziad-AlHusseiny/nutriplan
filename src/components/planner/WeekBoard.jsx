import { LazyMotion, MotionConfig } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { loadFeatures } from '../../lib/motion.js';
import { dayTotals } from '../../lib/plan.js';
import { DAYS, todayIndex, weekDates } from '../../lib/week.js';
import DayColumn from './DayColumn.jsx';

/**
 * Monday → Sunday (PRD §6.2). Phones: days stacked. 768–1279px: a
 * horizontal scroll-snap board of 240px columns with a fade hinting at
 * more. 1280px and up: all seven columns side by side. Opens on today.
 */
export default function WeekBoard({ weekKey, week, targets, resolve, handlers }) {
  const board = useRef(null);
  const [atEnd, setAtEnd] = useState(false);
  const dates = weekKey ? weekDates(weekKey) : null;
  const today = weekKey ? todayIndex(weekKey) : -1;

  useEffect(() => {
    const el = board.current;
    if (!el || today < 1 || !window.matchMedia('(min-width: 768px) and (max-width: 1279px)').matches) return;
    const col = el.querySelector(`#day-${DAYS[today]}`);
    el.scrollTo({ left: Math.abs(col.offsetLeft - el.offsetLeft) * (getComputedStyle(el).direction === 'rtl' ? -1 : 1) - 8, behavior: 'instant' });
  }, [weekKey, today]);

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div className="relative">
          <div
            ref={board}
            onScroll={(e) => {
              const el = e.currentTarget;
              setAtEnd(Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 8);
            }}
            className="flex flex-col gap-4 md:-mx-6 md:snap-x md:snap-mandatory md:flex-row md:overflow-x-auto md:scroll-px-6 md:px-6 md:pb-4 lg:-mx-8 lg:scroll-px-8 lg:px-8 xl:mx-0 xl:grid xl:grid-cols-7 xl:gap-2 xl:overflow-visible xl:px-0"
            data-testid="week-board"
          >
            {DAYS.map((day, i) => (
              <div key={day} className="md:w-[240px] md:shrink-0 md:snap-start xl:w-auto xl:min-w-0">
                <DayColumn
                  day={day}
                  date={dates?.[i]}
                  isToday={i === today}
                  meals={week[day]}
                  totals={dayTotals(week[day], resolve)}
                  targets={targets}
                  resolve={resolve}
                  onAdd={(slot) => handlers.add(day, slot)}
                  onRemove={(slot, food) => handlers.remove(day, slot, food)}
                  onEdit={(slot) => handlers.edit(day, slot)}
                  onMove={handlers.move}
                  onClear={() => handlers.clear(day)}
                  onCopy={() => handlers.copy(day)}
                />
              </div>
            ))}
          </div>
          <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 end-0 hidden w-16 bg-linear-to-l from-page to-transparent transition-opacity md:block xl:hidden rtl:bg-linear-to-r ${atEnd ? 'opacity-0' : ''}`} />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
