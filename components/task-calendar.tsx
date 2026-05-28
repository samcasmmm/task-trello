'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const PRIORITY_BORDER_COLORS: Record<string, string> = {
  low: 'border-l-zinc-500 bg-zinc-950/20 text-zinc-400 hover:bg-zinc-900/20',
  medium: 'border-l-yellow-600 bg-yellow-950/20 text-yellow-400 hover:bg-yellow-900/20',
  high: 'border-l-orange-500 bg-orange-950/20 text-orange-400 hover:bg-orange-900/20',
  urgent: 'border-l-red-500 bg-red-950/20 text-red-400 hover:bg-red-900/20',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TaskCalendar({
  tasks = [],
}: {
  projectId: string;
  tasks: any[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Create grid cells
  const cells = [];
  // Prefix padding empty cells
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ day: null, date: null });
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, month, d) });
  }

  // Filter tasks for a specific date cell
  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    return tasks.filter((t) => {
      const targetDate = t.due_date || t.dueDate;
      if (!targetDate) return false;
      const tDate = new Date(targetDate);
      return (
        tDate.getFullYear() === date.getFullYear() &&
        tDate.getMonth() === date.getMonth() &&
        tDate.getDate() === date.getDate()
      );
    });
  };

  return (
    <Card
      className='p-6 rounded-lg'
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <CardHeader className='flex flex-row items-center justify-between pb-6 border-b border-slate-800 mb-6'>
        <CardTitle className='text-lg font-bold flex items-center gap-2 text-slate-100'>
          <CalendarDays className='w-5 h-5 text-slate-400' />
          {currentDate.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </CardTitle>
        <div className='flex items-center gap-1.5'>
          <Button
            variant='outline'
            size='icon'
            onClick={prevMonth}
            className='btn-ghost h-8 w-8 text-xs rounded-md'
          >
            <ChevronLeft className='w-4 h-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCurrentDate(new Date())}
            className='btn-ghost h-8 px-3 text-xs rounded-md font-semibold'
          >
            Today
          </Button>
          <Button
            variant='outline'
            size='icon'
            onClick={nextMonth}
            className='btn-ghost h-8 w-8 text-xs rounded-md'
          >
            <ChevronRight className='w-4 h-4' />
          </Button>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        {/* Calendar Grid */}
        <div
          className='grid grid-cols-7 gap-px rounded-lg overflow-hidden border'
          style={{
            background: 'var(--border-subtle)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Weekday headers */}
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className='py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400'
              style={{ background: 'var(--surface-1)' }}
            >
              {day}
            </div>
          ))}

          {/* Date cells */}
          {cells.map((cell, idx) => {
            const dateTasks = getTasksForDate(cell.date);
            const isToday =
              cell.date &&
              cell.date.toDateString() === new Date().toDateString();

            return (
              <div
                key={idx}
                className='min-h-[110px] p-2 flex flex-col gap-1 border-r border-b transition-colors'
                style={{
                  background: cell.day === null ? 'var(--background)' : 'var(--surface-2)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {cell.day && (
                  <div className='flex justify-between items-center mb-1'>
                    <span
                      className={`text-xs font-bold font-mono rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? 'bg-slate-100 text-slate-950'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dateTasks.length > 0 && (
                      <span
                        className='text-[9px] font-bold px-1.5 py-0.5 rounded'
                        style={{
                          background: 'var(--surface-3)',
                          color: 'var(--foreground-muted)',
                        }}
                      >
                        {dateTasks.length} task{dateTasks.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Task list tags inside calendar date box */}
                <div className='flex-1 overflow-y-auto space-y-1 max-h-[70px] scrollbar-none'>
                  {dateTasks.map((t) => (
                    <Link key={t.id} href={`/dashboard/task/${t.id}`}>
                      <div
                        className={`text-[10px] p-1 border-l-2 rounded truncate transition-colors font-semibold cursor-pointer ${
                          PRIORITY_BORDER_COLORS[t.priority] ||
                          'border-l-zinc-500 bg-zinc-950/20 text-zinc-300'
                        }`}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
