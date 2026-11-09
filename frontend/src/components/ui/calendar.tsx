import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CalendarEvent {
  date: string;
  title: string;
  type?: 'MAINTENANCE' | 'RESERVATION' | 'DISRUPTION';
}

export interface CalendarProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  events?: CalendarEvent[];
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate = new Date(),
  onSelectDate,
  events = [],
  className,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfWeek = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const getEventsForDay = (day: number) => {
    const dateKey = formatDateKey(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return events.filter((e) => e.date === dateKey);
  };

  return (
    <div
      className={cn(
        'w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-slate-100 shadow-xl backdrop-blur-xl',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide text-slate-100">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase pb-2">
        {weekDays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="h-9" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = getEventsForDay(day);
          const activeToday = isToday(day);
          const activeSelected = isSelected(day);

          return (
            <button
              key={`day-${day}`}
              onClick={() => {
                const clickedDate = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day
                );
                if (onSelectDate) onSelectDate(clickedDate);
              }}
              className={cn(
                'relative flex h-9 flex-col items-center justify-start rounded-xl p-1 text-xs font-semibold transition-all duration-200',
                activeSelected
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                  : activeToday
                  ? 'border border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
              )}
            >
              <span>{day}</span>

              {dayEvents.length > 0 && (
                <div className="mt-auto flex items-center gap-0.5">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1 w-1 rounded-full',
                        event.type === 'MAINTENANCE'
                          ? 'bg-amber-400'
                          : event.type === 'DISRUPTION'
                          ? 'bg-rose-400'
                          : 'bg-emerald-400'
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};