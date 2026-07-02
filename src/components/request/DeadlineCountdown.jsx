import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

function getRemaining(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  const overdue = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  return { days, hours, minutes, overdue };
}

export default function DeadlineCountdown({ deadline }) {
  const [remaining, setRemaining] = useState(() => getRemaining(deadline));

  useEffect(() => {
    setRemaining(getRemaining(deadline));
    const interval = setInterval(() => setRemaining(getRemaining(deadline)), 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!remaining) return null;

  const { days, hours, minutes, overdue } = remaining;
  const urgent = !overdue && days <= 7;

  return (
    <Card className={urgent && !overdue ? 'border-amber-400 bg-amber-50' : 'border-red-700 bg-red-600'}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-semibold flex items-center gap-1.5 ${urgent && !overdue ? 'text-amber-700' : 'text-white'}`}>
          <Clock className="w-3.5 h-3.5" />
          45-Day Deadline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <TimeUnit value={days} label="Days" overdue={overdue} urgent={urgent} />
          <TimeUnit value={hours} label="Hours" overdue={overdue} urgent={urgent} />
          <TimeUnit value={minutes} label="Minutes" overdue={overdue} urgent={urgent} />
        </div>
        <p className={`text-xs mt-3 text-center font-medium ${urgent && !overdue ? 'text-amber-700' : 'text-red-50'}`}>
          {overdue ? 'Statutory deadline passed' : 'remaining to fulfill this request'}
        </p>
      </CardContent>
    </Card>
  );
}

function TimeUnit({ value, label, overdue, urgent }) {
  return (
    <div className={`rounded-lg py-3 text-center ${urgent && !overdue ? 'bg-amber-100' : 'bg-white/15'}`}>
      <div className={`text-2xl font-bold tabular-nums ${urgent && !overdue ? 'text-amber-700' : 'text-white'}`}>
        {String(value).padStart(2, '0')}
      </div>
      <div className={`text-[10px] uppercase tracking-wider mt-0.5 ${urgent && !overdue ? 'text-amber-600' : 'text-red-100'}`}>{label}</div>
    </div>
  );
}