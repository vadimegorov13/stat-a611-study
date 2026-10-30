// Countdown to the scheduled final, shown at the top of the sidebar.
import { useEffect, useState } from 'react';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';

const DAY = 86400000;

export function ExamCountdown({ onNavigate }: { onNavigate?: () => void }) {
  const { course } = useData();
  const { navigate } = useNav();
  const final = course.exam.final;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Tick every second in the final hour, otherwise once a minute.
    const start = final ? new Date(final.start).getTime() : 0;
    const ms = start - now < 3600000 && start > now ? 1000 : 60000;
    const t = window.setTimeout(() => setNow(Date.now()), ms);
    return () => window.clearTimeout(t);
  }, [now, final]);
  if (!final) return null;

  const start = new Date(final.start);
  const end = new Date(final.end);
  const left = start.getTime() - now;
  const when = `${start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, ${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}–${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

  let big: string;
  let unit: string;
  if (now >= end.getTime()) {
    big = 'Done';
    unit = 'the scheduled exam time has passed';
  } else if (left <= 0) {
    big = 'Now';
    unit = 'the exam is in progress';
  } else if (left >= 2 * DAY) {
    const days = Math.floor(left / DAY);
    big = String(days);
    unit = `days · ${Math.floor((left % DAY) / 3600000)} h`;
  } else {
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    const sec = Math.floor((left % 60000) / 1000);
    big = left < 3600000 ? `${m}:${String(sec).padStart(2, '0')}` : `${h} h ${String(m).padStart(2, '0')} m`;
    unit = 'until the exam';
  }

  return (
    <a
      href="#/progress"
      className={`exam-countdown ${left > 0 && left < 7 * DAY ? 'soon' : ''}`}
      title={final.note}
      onClick={(e) => {
        e.preventDefault();
        navigate({ kind: 'progress' });
        onNavigate?.();
      }}
      aria-label={`${final.label}: ${big} ${unit}. ${when}. Open the exam checklist.`}
    >
      <span className="ec-label">{final.label}</span>
      <span className="ec-main">
        <strong>{big}</strong> <span>{unit}</span>
      </span>
      <span className="ec-when">{when}</span>
    </a>
  );
}
