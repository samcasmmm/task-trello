'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Layers } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TaskSwimlanesProps {
  tasks: any[];
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];

const PRIORITY_COLOR: Record<string, string> = {
  low: 'border-l-zinc-500 bg-zinc-950/20 text-zinc-400',
  medium: 'border-l-yellow-600 bg-yellow-950/20 text-yellow-400',
  high: 'border-l-orange-500 bg-orange-950/20 text-orange-400',
  urgent: 'border-l-red-500 bg-red-950/20 text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
};

export default function TaskSwimlanes({ tasks = [] }: TaskSwimlanesProps) {
  const [swimlaneBy, setSwimlaneBy] = useState<'priority' | 'assignee'>('priority');

  // Generate swimlane headers/rows based on chosen criteria
  const rows =
    swimlaneBy === 'priority'
      ? PRIORITIES
      : Array.from(new Set(tasks.map((t) => t.assigned_to_user?.id || 'unassigned')));

  const getLabel = (row: string) => {
    if (swimlaneBy === 'priority') return row.toUpperCase();
    if (row === 'unassigned') return 'UNASSIGNED';
    const match = tasks.find((t) => t.assigned_to_user?.id === row);
    return match?.assigned_to_user?.fullName?.toUpperCase() || 'UNKNOWN ASSIGNEE';
  };

  const getTasks = (row: string, status: string) => {
    return tasks.filter((t) => {
      const matchStatus = t.status === status;
      if (!matchStatus) return false;
      if (swimlaneBy === 'priority') return t.priority === row;
      return (t.assigned_to_user?.id || 'unassigned') === row;
    });
  };

  return (
    <div className="space-y-4">
      {/* Selector switches */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Group Swimlanes By
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gray-950/60 p-0.5 rounded-lg border border-gray-800">
          <button
            onClick={() => setSwimlaneBy('priority')}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
              swimlaneBy === 'priority'
                ? 'bg-gray-800 text-white border border-gray-700'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Priority
          </button>
          <button
            onClick={() => setSwimlaneBy('assignee')}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
              swimlaneBy === 'assignee'
                ? 'bg-gray-800 text-white border border-gray-700'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Assignee
          </button>
        </div>
      </div>

      {/* Grid Swimlanes View */}
      <div className="space-y-4 overflow-x-auto min-w-[800px]">
        {rows.map((row) => (
          <div
            key={row}
            className="border rounded-lg overflow-hidden bg-surface-2 border-border-subtle"
          >
            {/* Header label for each swimlane row */}
            <div className="px-4 py-2 border-b flex items-center justify-between bg-surface-1 border-border-subtle">
              <h3 className="text-xs font-bold text-gray-300 tracking-wider font-mono">
                {getLabel(row)}
              </h3>
              <span className="text-[10px] border font-bold px-2 py-0.5 rounded bg-surface-3 border-border-strong text-foreground-muted">
                {
                  tasks.filter((t) =>
                    swimlaneBy === 'priority'
                      ? t.priority === row
                      : (t.assigned_to_user?.id || 'unassigned') === row,
                  ).length
                }{' '}
                tasks
              </span>
            </div>

            {/* Matrix Columns */}
            <div className="grid grid-cols-5 divide-x divide-border-subtle bg-background border-border-subtle">
              {STATUSES.map((status) => {
                const laneTasks = getTasks(row, status);
                return (
                  <div
                    key={status}
                    className="p-3 min-h-[140px] space-y-2 border-r border-border-subtle"
                  >
                    {/* Status header indicator */}
                    <div className="flex items-center gap-1.5 mb-2.5 pb-1 border-b border-border-subtle">
                      <span className="text-[9px] font-extrabold uppercase text-gray-500">
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="text-[8px] ml-auto font-black rounded px-1 bg-surface-3 text-foreground-muted">
                        {laneTasks.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {laneTasks.map((t) => (
                        <Link key={t.id} href={`/dashboard/task/${t.id}`} className="block">
                          <div
                            className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col justify-between hover:border-gray-500 transition-all border-border-subtle ${
                              PRIORITY_COLOR[t.priority] ||
                              'border-l-zinc-500 bg-gray-950/40 text-gray-300'
                            }`}
                          >
                            <span className="truncate text-[11px]">{t.title}</span>
                            {t.assigned_to_user && (
                              <div className="flex items-center gap-1.5 mt-2 ml-auto">
                                <Avatar className="h-4 w-4 rounded-sm border border-border-strong">
                                  <AvatarImage src={t.assigned_to_user.avatarUrl || ''} />
                                  <AvatarFallback className="text-[7px] font-black bg-gray-800 text-gray-300 rounded-sm">
                                    {t.assigned_to_user.fullName?.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
