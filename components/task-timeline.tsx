'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface TaskTimelineProps {
  tasks: any[];
}

export default function TaskTimeline({ tasks = [] }: TaskTimelineProps) {
  // Sort tasks by start date, then due date
  const datedTasks = tasks
    .filter((t) => t.startDate || t.due_date || t.dueDate)
    .sort((a, b) => {
      const aStart = new Date(a.startDate || a.due_date || a.dueDate).getTime();
      const bStart = new Date(b.startDate || b.due_date || b.dueDate).getTime();
      return aStart - bStart;
    });

  if (datedTasks.length === 0) {
    return (
      <Card className="rounded-lg py-16 text-center bg-surface-2 border border-border-subtle">
        <CardContent className="p-6">
          <CalendarDays className="w-8 h-8 mx-auto mb-3 text-gray-500" />
          <h3 className="text-sm font-bold mb-1 text-gray-300">No Tasks with Dates</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Give tasks a start and due date to view them inside a project Gantt timeline chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find min/max boundaries
  const timeValues = datedTasks.flatMap((t) => {
    const dates = [];
    if (t.startDate) dates.push(new Date(t.startDate).getTime());
    if (t.due_date || t.dueDate) dates.push(new Date(t.due_date || t.dueDate).getTime());
    return dates;
  });

  const minTime = Math.min(...timeValues);
  const maxTime = Math.max(...timeValues);
  const totalDays = Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)) + 7; // padding

  return (
    <Card className="rounded-lg overflow-hidden bg-surface-2 border border-border-subtle">
      <CardContent className="p-4 overflow-x-auto">
        <div className="min-w-[800px] space-y-4">
          {/* Header timeline indicators */}
          <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-500 pb-2 border-b border-border-subtle">
            <div className="w-1/4">Task Description</div>
            <div className="w-3/4 flex justify-between px-2 font-mono">
              <span>{formatDate(new Date(minTime))}</span>
              <span>Timeline Plan</span>
              <span>{formatDate(new Date(maxTime))}</span>
            </div>
          </div>

          {/* List timelines */}
          <div className="space-y-3 pt-2">
            {datedTasks.map((t) => {
              const start = new Date(t.startDate || t.due_date || t.dueDate).getTime();
              const end = new Date(t.due_date || t.dueDate || t.startDate).getTime();
              const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
              const startOffset = Math.ceil((start - minTime) / (1000 * 60 * 60 * 24));

              // Percentages
              const leftPercent = (startOffset / totalDays) * 100;
              const widthPercent = (duration / totalDays) * 100;

              return (
                <div key={t.id} className="flex items-center text-xs">
                  <div className="w-1/4 pr-4 font-semibold text-gray-200 truncate">
                    <Link
                      href={`/dashboard/task/${t.id}`}
                      className="hover:underline hover:text-white"
                    >
                      {t.title}
                    </Link>
                  </div>
                  <div className="w-3/4 relative h-7 border rounded-md overflow-hidden bg-surface-1 border-border-subtle">
                    <div
                      className="absolute top-1 bottom-1 rounded border transition-all flex items-center px-2 overflow-hidden bg-surface-3 border-border-strong"
                      style={{
                        left: `${Math.min(95, leftPercent)}%`,
                        width: `${Math.max(4, Math.min(100 - leftPercent, widthPercent))}%`,
                      }}
                      title={`${t.title}: ${formatDate(String(start))} to ${formatDate(String(end))}`}
                    >
                      <span className="text-[9px] font-bold text-gray-300 truncate">{t.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
