'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import api from '@/lib/axios';
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  X,
  Calendar,
  Hourglass,
  Gauge,
  TrendingUp,
  Activity,
  GitCommit,
  UserCheck,
} from 'lucide-react';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];
const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
};

const STATUS_COLORS: Record<string, string> = {
  todo: 'badge-status-todo',
  in_progress: 'badge-status-in_progress',
  in_review: 'badge-status-in_review',
  done: 'badge-status-done',
  blocked: 'badge-status-blocked',
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS: Record<string, string> = {
  low: 'badge-priority-low',
  medium: 'badge-priority-medium',
  high: 'badge-priority-high',
  urgent: 'badge-priority-urgent',
};

import SubtasksSection from './subtasks-section';
import TaskAttachments from './task-attachments';
import WysiwygEditor from './wysiwyg-editor';

const safeDateFormat = (dateVal: any) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

export default function TaskDetailView({
  task,
  subtasks = [],
  projectId,
}: {
  task: any;
  subtasks?: any[];
  projectId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [checklistTitle, setChecklistTitle] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: safeDateFormat(task.dueDate || task.due_date),
    startDate: safeDateFormat(task.startDate || task.start_date),
    estimatedHours: task.estimatedHours || '',
    actualHours: task.actualHours || '',
    assignedToId: task.assignedToId || task.assigned_to_user?.id || null,
  });

  const [activeTask, setActiveTask] = useState(task);

  useEffect(() => {
    setActiveTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: safeDateFormat(task.dueDate || task.due_date),
      startDate: safeDateFormat(task.startDate || task.start_date),
      estimatedHours: task.estimatedHours || '',
      actualHours: task.actualHours || '',
      assignedToId: task.assignedToId || task.assigned_to_user?.id || null,
    });
  }, [task]);

  const fetchTaskDetails = async () => {
    try {
      const response = await api.get(`/api/tasks/${task.id}`);
      const freshData = response.data;
      setActiveTask(freshData);
      setFormData({
        title: freshData.title,
        description: freshData.description,
        status: freshData.status,
        priority: freshData.priority,
        dueDate: safeDateFormat(freshData.dueDate || freshData.due_date),
        startDate: safeDateFormat(freshData.startDate || freshData.start_date),
        estimatedHours: freshData.estimatedHours || '',
        actualHours: freshData.actualHours || '',
        assignedToId: freshData.assignedToId || freshData.assigned_to_user?.id || null,
      });
    } catch (error) {
      console.error('Failed to reload task:', error);
    }
  };

  useEffect(() => {
    // Fetch team members from tenant
    const fetchTeamMembers = async () => {
      try {
        const tenantId = task.tenantId || projectId;
        if (!tenantId) return;

        const response = await api.get(`/api/tenants/${tenantId}/members`);
        const data = response.data;
        const members = data.map((m: any) => ({
          id: m.id,
          userId: m.user?.id || m.userId,
          email: m.user?.email || m.email,
          fullName: m.user?.fullName || m.fullName,
          avatarUrl: m.user?.avatarUrl || m.avatarUrl,
          role: m.role,
          reportsToId: m.reportsToId,
        }));
        setTeamMembers(members);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
      }
    };
    fetchTeamMembers();
  }, [task.tenantId, projectId]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.patch(`/api/tasks/${task.id}`, {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        startDate: formData.startDate || null,
        estimatedHours: formData.estimatedHours || null,
        actualHours: formData.actualHours || null,
        assignedToId: formData.assignedToId === '__unassigned__' ? null : formData.assignedToId,
      });
      toast.success('Task details updated.');
      setEditing(false);
      fetchTaskDetails();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update task';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    try {
      await api.post(`/api/tasks/${task.id}/comments`, { content: commentText });
      toast.success('Comment posted successfully.');
      setCommentText('');
      fetchTaskDetails();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add comment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistTitle.trim()) return;

    setLoading(true);
    try {
      await api.post(`/api/tasks/${task.id}/checklists`, { title: checklistTitle });
      toast.success('Checklist item added.');
      setChecklistTitle('');
      fetchTaskDetails();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to add checklist item';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistToggle = async (itemId: string, checked: boolean) => {
    try {
      await api.patch(`/api/tasks/${task.id}/checklists/${itemId}`, { completed: checked });
      fetchTaskDetails();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to update checklist item.';
      toast.error(errorMessage);
    }
  };

  const handleAssignmentChange = async (value: string) => {
    const userId = value === '__unassigned__' ? null : value;
    setLoading(true);
    try {
      await api.patch(`/api/tasks/${task.id}`, {
        assignedToId: userId,
      });
      setFormData({ ...formData, assignedToId: userId });
      toast.success(userId ? 'Task assigned!' : 'Task unassigned!');
      fetchTaskDetails();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to update assignment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Math metrics for time log progression
  const estHours = parseFloat(formData.estimatedHours || '0');
  const actHours = parseFloat(formData.actualHours || '0');
  const loggedProgress = estHours > 0 ? Math.min(100, Math.round((actHours / estHours) * 100)) : 0;

  // Find assignee reporting line
  const assigneeMember = teamMembers.find(
    (m) => m.userId === (activeTask.assignedToId || activeTask.assigned_to_user?.id),
  );
  const assigneeManager =
    assigneeMember && assigneeMember.reportsToId
      ? teamMembers.find((m) => m.userId === assigneeMember.reportsToId)
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Task Details Panel */}
        <Card className="rounded-lg overflow-hidden bg-card border-border-subtle border">
          <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {editing ? (
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-xl font-bold focus-visible:ring-slate-700 h-10 rounded-sm bg-surface-3 border-border-strong text-foreground border"
                  />
                ) : (
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {activeTask.title}
                  </h1>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-sm"
                onClick={() => setEditing(!editing)}
              >
                {editing ? (
                  <X className="w-4 h-4 text-slate-400" />
                ) : (
                  <Pencil className="w-4 h-4 text-slate-400" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Status and Priority Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="field-label block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={!editing}
                >
                  <SelectTrigger className="text-xs h-9 rounded-sm bg-surface-3 border-border-default text-foreground border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 rounded-sm shadow-none">
                    {STATUSES.map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        className="text-xs capitalize hover:bg-slate-800"
                      >
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="field-label block">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  disabled={!editing}
                >
                  <SelectTrigger className="text-xs h-9 rounded-sm bg-surface-3 border-border-default text-foreground border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 rounded-sm shadow-none">
                    {PRIORITIES.map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        className="text-xs capitalize hover:bg-slate-800"
                      >
                        <span className="capitalize">{p}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Assignee Option */}
            <div className="space-y-1">
              <label className="field-label block">Assignee</label>
              <Select
                value={formData.assignedToId || '__unassigned__'}
                onValueChange={handleAssignmentChange}
                disabled={loading}
              >
                <SelectTrigger className="text-xs h-9 rounded-sm bg-surface-3 border-border-default text-foreground border">
                  {formData.assignedToId &&
                  (activeTask.assigned_to_user || activeTask.assignedTo) ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-4 w-4 rounded-sm">
                        <AvatarImage
                          src={
                            (activeTask.assigned_to_user || activeTask.assignedTo)?.avatarUrl || ''
                          }
                        />
                        <AvatarFallback className="text-[10px] font-bold bg-slate-800 rounded-sm text-slate-300">
                          {(activeTask.assigned_to_user || activeTask.assignedTo)?.fullName
                            ?.substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-slate-200">
                        {(activeTask.assigned_to_user || activeTask.assignedTo)?.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Select team member...</span>
                  )}
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 rounded-sm shadow-none">
                  <SelectItem
                    value="__unassigned__"
                    className="text-xs text-slate-400 hover:bg-slate-800"
                  >
                    Unassigned
                  </SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem
                      key={member.userId}
                      value={member.userId}
                      className="text-xs hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-4 w-4 rounded-sm">
                          <AvatarImage src={member.avatarUrl || ''} />
                          <AvatarFallback className="text-[10px] bg-slate-800 text-slate-300 rounded-sm">
                            {member.fullName?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-200">{member.fullName || member.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <label className="field-label block">Description</label>
              {editing ? (
                <WysiwygEditor
                  value={formData.description || ''}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  placeholder="Add more details about this task..."
                  minHeight="120px"
                />
              ) : (
                <div
                  className="text-xs leading-relaxed p-3 rounded border prose prose-invert max-w-none bg-surface-3 border-border-subtle text-foreground-muted"
                  dangerouslySetInnerHTML={{
                    __html: activeTask.description || '<i>No description provided.</i>',
                  }}
                />
              )}
            </div>

            {/* JIRA dates picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="field-label flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Start Date
                </label>
                {editing ? (
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="text-xs h-9 rounded-sm bg-surface-3 border-border-default text-foreground border"
                  />
                ) : (
                  <p className="text-xs font-semibold p-2.5 rounded border bg-surface-3 border-border-subtle text-foreground-muted">
                    {activeTask.startDate || activeTask.start_date
                      ? formatDate(activeTask.startDate || activeTask.start_date)
                      : 'Not specified'}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="field-label flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Due Date (End)
                </label>
                {editing ? (
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="text-xs h-9 rounded-sm bg-surface-3 border-border-default text-foreground border"
                  />
                ) : (
                  <p className="text-xs font-semibold p-2.5 rounded border bg-surface-3 border-border-subtle text-foreground-muted">
                    {activeTask.dueDate || activeTask.due_date
                      ? formatDate(activeTask.dueDate || activeTask.due_date)
                      : 'Not specified'}
                  </p>
                )}
              </div>
            </div>

            {/* Jira Resource logging parameters */}
            <div className="space-y-2 border-t pt-4 border-border-subtle">
              <div className="flex items-center justify-between">
                <label className="field-label flex items-center gap-1">
                  <Hourglass className="w-3.5 h-3.5 text-slate-500" /> Work Hours Tracking (JIRA)
                </label>
                {!editing && estHours > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] shadow-none rounded-sm h-5 py-0 px-2 bg-surface-3 border-border-default text-foreground-muted"
                  >
                    {loggedProgress}% Resource logged
                  </Badge>
                )}
              </div>

              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Estimated Hours
                    </span>
                    <Input
                      type="number"
                      placeholder="e.g. 40"
                      value={formData.estimatedHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedHours: e.target.value,
                        })
                      }
                      className="text-xs h-8 rounded-sm bg-surface-3 border-border-default text-foreground border"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Actual Logged Hours
                    </span>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      value={formData.actualHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          actualHours: e.target.value,
                        })
                      }
                      className="text-xs h-8 rounded-sm bg-surface-3 border-border-default text-foreground border"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded border space-y-2 bg-surface-3 border-border-subtle">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>
                      Estimate:{' '}
                      <span className="font-bold text-slate-200">
                        {formData.estimatedHours || '0'} hrs
                      </span>
                    </span>
                    <span>
                      Actual Logged:{' '}
                      <span className="font-bold text-foreground">
                        {formData.actualHours || '0'} hrs
                      </span>
                    </span>
                  </div>
                  {estHours > 0 && (
                    <div className="w-full border h-2 rounded overflow-hidden bg-background border-border-subtle">
                      <div
                        className={`h-full rounded-sm transition-all duration-300 ${
                          loggedProgress >= 100
                            ? 'bg-red-500'
                            : loggedProgress >= 80
                              ? 'bg-amber-500'
                              : 'bg-white/30'
                        }`}
                        style={{ width: `${loggedProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Editing actions buttons */}
            {editing && (
              <div className="flex gap-2 pt-2 justify-end border-t border-slate-850">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="btn-primary text-xs h-8 rounded-md"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  className="text-xs h-8 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subtasks Visual Section */}
        {projectId && (
          <SubtasksSection
            taskId={task.id}
            subtasks={activeTask.subtasks || []}
            projectId={projectId}
            onRefresh={fetchTaskDetails}
          />
        )}

        {/* Checklist Section */}
        <Card className="rounded-lg overflow-hidden bg-surface-2 border border-border-subtle">
          <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle">
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
              Checklist Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {activeTask.task_checklists && activeTask.task_checklists.length > 0 ? (
              <div className="space-y-3">
                {activeTask.task_checklists.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded border transition-colors bg-surface-3 border-border-subtle hover:border-border-default"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => handleChecklistToggle(item.id, !!checked)}
                      className="border-border-strong bg-surface-1 data-[state=checked]:bg-white data-[state=checked]:border-white"
                    />
                    <span
                      className={`text-xs ${item.completed ? 'line-through text-slate-500 font-medium' : 'text-slate-200 font-semibold'}`}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">No checklist items defined.</p>
            )}

            <form
              onSubmit={handleAddChecklist}
              className="flex gap-2 pt-3 border-t border-border-subtle"
            >
              <Input
                placeholder="Add checklist item..."
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
                className="border text-slate-200 text-xs h-8 focus-visible:ring-slate-700 rounded-sm bg-surface-3 border-border-default"
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="text-xs h-8 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded"
              >
                Add
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task Comments Stream */}
        <Card className="rounded-lg overflow-hidden bg-card border-border-subtle border">
          <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle">
            <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-slate-500" />
              Comments Stream ({activeTask.task_comments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Feed stream list */}
            {activeTask.task_comments && activeTask.task_comments.length > 0 && (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activeTask.task_comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className="p-3 rounded border text-xs space-y-1 bg-surface-3 border-border-subtle"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        {comment.user?.fullName || 'Unknown'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Post Comments form */}
            <form
              onSubmit={handleAddComment}
              className="space-y-2 border-t pt-4 border-border-subtle"
            >
              <Textarea
                placeholder="Post a work update or ask a question..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="text-slate-200 text-xs rounded focus-visible:ring-slate-700 bg-surface-3 border-border-default"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || !commentText.trim()}
                  size="sm"
                  className="text-xs h-8 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded"
                >
                  {loading ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Task Attributes Panel */}
      <div className="space-y-4">
        {/* Quick Attributes summary */}
        <Card className="rounded-lg overflow-hidden bg-card border-border-subtle border">
          <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle">
            <CardTitle className="text-sm font-bold text-slate-300">Task Attributes</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <p className="text-slate-500 mb-1 font-semibold uppercase tracking-wider text-[9px]">
                Status
              </p>
              <Badge
                className={`shadow-none font-bold text-[10px] h-5 py-0 px-2 rounded-sm ${STATUS_COLORS[activeTask.status] || 'bg-slate-900 text-slate-400'}`}
              >
                {STATUS_LABELS[activeTask.status]}
              </Badge>
            </div>
            <div>
              <p className="text-slate-500 mb-1 font-semibold uppercase tracking-wider text-[9px]">
                Priority
              </p>
              <Badge
                className={`shadow-none font-bold text-[10px] h-5 py-0 px-2 rounded-sm ${PRIORITY_COLORS[activeTask.priority]}`}
              >
                {activeTask.priority}
              </Badge>
            </div>

            {/* Detailed Assignee and workspace hierarchy */}
            <div>
              <p className="text-slate-500 mb-1 font-semibold uppercase tracking-wider text-[9px]">
                Assignee
              </p>
              {activeTask.assigned_to_user || activeTask.assignedTo ? (
                <div className="flex items-center gap-2 p-2 rounded border bg-surface-3 border-border-subtle">
                  <Avatar className="h-6 w-6 rounded-sm">
                    <AvatarImage
                      src={(activeTask.assigned_to_user || activeTask.assignedTo)?.avatarUrl || ''}
                    />
                    <AvatarFallback className="text-[10px] font-bold bg-slate-800 text-slate-300 rounded-sm">
                      {(activeTask.assigned_to_user || activeTask.assignedTo)?.fullName
                        ?.substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-slate-200">
                      {(activeTask.assigned_to_user || activeTask.assignedTo)?.fullName}
                    </p>
                    {assigneeManager && (
                      <p className="text-[10px] text-slate-400">
                        Reports to:{' '}
                        <span className="font-semibold text-slate-200">
                          {assigneeManager.fullName}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">No one assigned</p>
              )}
            </div>

            <div>
              <p className="text-slate-500 mb-1 font-semibold uppercase tracking-wider text-[9px]">
                Task Owner
              </p>
              <p className="font-bold text-slate-200">
                {activeTask.created_by_user?.fullName || 'System Account'}
              </p>
            </div>

            {/* Start and end dates sidebar visual card */}
            <div className="border-t border-border-subtle pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-450">Start Date:</span>
                <span className="font-semibold text-slate-300">
                  {activeTask.startDate || activeTask.start_date
                    ? formatDate(activeTask.startDate || activeTask.start_date)
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-450">End Date:</span>
                <span className="font-semibold text-slate-300">
                  {activeTask.dueDate || activeTask.due_date
                    ? formatDate(activeTask.dueDate || activeTask.due_date)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Attachments Section */}
        <TaskAttachments attachments={activeTask.task_attachments} />
      </div>
    </div>
  );
}
