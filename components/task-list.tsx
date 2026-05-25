'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { Search, ArrowUpDown } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
};

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-50 text-blue-700 border-blue-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

export default function TaskList({
  tasks = [],
}: {
  projectId: string;
  tasks: any[];
}) {
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'assigned_to') {
      aVal = a.assigned_to_user?.fullName || '';
      bVal = b.assigned_to_user?.fullName || '';
    }

    if (aVal === undefined || aVal === null) return sortAsc ? -1 : 1;
    if (bVal === undefined || bVal === null) return sortAsc ? 1 : -1;

    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className='space-y-4'>
      {/* Search Filter */}
      <div className='relative max-w-sm'>
        <Search className='w-4 h-4 absolute left-3 top-3 text-gray-400' />
        <Input
          placeholder='Filter list by task title...'
          className='pl-9'
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>

      <Card className='overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left border-collapse'>
            <thead>
              <tr className='border-b bg-gray-50/75 text-gray-600 font-semibold select-none'>
                <th
                  onClick={() => handleSort('title')}
                  className='p-4 cursor-pointer hover:bg-gray-100/50 hover:text-gray-900 transition-colors'
                >
                  <div className='flex items-center gap-1'>
                    Task Title
                    <ArrowUpDown className='w-3.5 h-3.5' />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className='p-4 cursor-pointer hover:bg-gray-100/50 hover:text-gray-900 transition-colors'
                >
                  <div className='flex items-center gap-1'>
                    Status
                    <ArrowUpDown className='w-3.5 h-3.5' />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className='p-4 cursor-pointer hover:bg-gray-100/50 hover:text-gray-900 transition-colors'
                >
                  <div className='flex items-center gap-1'>
                    Priority
                    <ArrowUpDown className='w-3.5 h-3.5' />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('assigned_to')}
                  className='p-4 cursor-pointer hover:bg-gray-100/50 hover:text-gray-900 transition-colors'
                >
                  <div className='flex items-center gap-1'>
                    Assignee
                    <ArrowUpDown className='w-3.5 h-3.5' />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dueDate')}
                  className='p-4 cursor-pointer hover:bg-gray-100/50 hover:text-gray-900 transition-colors'
                >
                  <div className='flex items-center gap-1'>
                    Due Date
                    <ArrowUpDown className='w-3.5 h-3.5' />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className='hover:bg-gray-50/50 transition-colors'
                  >
                    <td className='p-4 font-medium text-gray-900'>
                      <Link
                        href={`/dashboard/task/${task.id}`}
                        className='hover:text-blue-600 hover:underline block truncate max-w-sm'
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className='p-4'>
                      <Badge
                        className={`capitalize border-none shadow-none font-semibold ${STATUS_COLORS[task.status] || ''}`}
                      >
                        {STATUS_LABELS[task.status] || task.status}
                      </Badge>
                    </td>
                    <td className='p-4'>
                      <Badge
                        variant='outline'
                        className={`capitalize font-semibold ${PRIORITY_COLORS[task.priority] || ''}`}
                      >
                        {task.priority}
                      </Badge>
                    </td>
                    <td className='p-4'>
                      {task.assigned_to_user ? (
                        <div className='flex items-center gap-2'>
                          <Avatar className='h-6 w-6'>
                            <AvatarImage
                              src={task.assigned_to_user.avatarUrl || ''}
                            />
                            <AvatarFallback>
                              {task.assigned_to_user.fullName
                                ?.substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className='text-gray-700 text-xs font-medium'>
                            {task.assigned_to_user.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className='text-gray-400 text-xs font-medium'>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className='p-4 text-gray-500 font-mono text-xs'>
                      {task.due_date ? formatDate(task.due_date) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className='p-8 text-center text-gray-500'>
                    No tasks found matching this project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
