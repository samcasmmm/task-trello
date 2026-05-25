'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const PRIORITY_BORDER_COLORS: Record<string, string> = {
  low: 'border-l-blue-500 bg-blue-50/50 text-blue-700 hover:bg-blue-100/50',
  medium: 'border-l-yellow-500 bg-yellow-50/50 text-yellow-800 hover:bg-yellow-100/50',
  high: 'border-l-orange-500 bg-orange-50/50 text-orange-800 hover:bg-orange-100/50',
  urgent: 'border-l-red-500 bg-red-50/50 text-red-700 hover:bg-red-100/50',
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
      if (!t.due_date) return false;
      const tDate = new Date(t.due_date);
      return (
        tDate.getFullYear() === date.getFullYear() &&
        tDate.getMonth() === date.getMonth() &&
        tDate.getDate() === date.getDate()
      );
    });
  };

  return (
    <Card className='p-6'>
      <CardHeader className='flex flex-row items-center justify-between pb-6 border-b mb-6'>
        <CardTitle className='text-lg font-bold flex items-center gap-2'>
          <CalendarDays className='w-5 h-5 text-gray-500' />
          {currentDate.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </CardTitle>
        <div className='flex items-center gap-1.5'>
          <Button variant='outline' size='icon' onClick={prevMonth}>
            <ChevronLeft className='w-4 h-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button variant='outline' size='icon' onClick={nextMonth}>
            <ChevronRight className='w-4 h-4' />
          </Button>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        {/* Calendar Grid */}
        <div className='grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200'>
          {/* Weekday headers */}
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className='bg-gray-50 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'
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
                className={`bg-white min-h-[110px] p-2 flex flex-col gap-1 border-r border-b border-gray-100 last:border-r-0 ${
                  cell.day === null ? 'bg-gray-50/50' : ''
                }`}
              >
                {cell.day && (
                  <div className='flex justify-between items-center mb-1'>
                    <span
                      className={`text-xs font-bold font-mono rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dateTasks.length > 0 && (
                      <span className='text-[10px] bg-gray-100 text-gray-500 font-semibold px-1.5 py-0.5 rounded'>
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
                        className={`text-[10px] p-1 border-l-2 rounded truncate transition-colors font-medium cursor-pointer ${
                          PRIORITY_BORDER_COLORS[t.priority] ||
                          'border-l-gray-400 bg-gray-50 text-gray-700'
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
