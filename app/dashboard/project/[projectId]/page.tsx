'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Settings, LayoutGrid, List, Calendar } from 'lucide-react'
import CreateTaskDialog from '@/components/create-task-dialog'
import TaskBoard from '@/components/task-board'
import TaskList from '@/components/task-list'
import TaskCalendar from '@/components/task-calendar'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string | null
  color: string
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date?: string
  assigned_to_user?: { fullName: string; avatarUrl?: string } | null
}

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'board' | 'list' | 'calendar'>('board')

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`),
      ])

      if (!projectRes.ok || !tasksRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const projectData = await projectRes.json()
      const tasksData = await tasksRes.json()

      setProject(projectData)
      setTasks(tasksData)
    } catch (error) {
      console.error('Error fetching project data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  const onTaskCreated = (newTask: any) => {
    setTasks((prev) => [...prev, newTask])
  }

  const onTaskMoved = (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Project not found</h1>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          </div>
          {project.description && (
            <p className="text-gray-500 text-sm ml-7">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/project/${projectId}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
          <CreateTaskDialog projectId={projectId} onSuccess={onTaskCreated}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </CreateTaskDialog>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger value="board" className="gap-2 text-sm">
              <LayoutGrid className="w-4 h-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2 text-sm">
              <List className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
          <span className="text-xs text-gray-400 font-medium">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
          </span>
        </div>

        <TabsContent value="board">
          {tasks.length > 0 ? (
            <TaskBoard
              projectId={projectId}
              tasks={tasks}
              onTaskMoved={onTaskMoved}
              onTaskCreated={onTaskCreated}
            />
          ) : (
            <Card>
              <div className="py-16 text-center">
                <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No tasks yet
                </h3>
                <p className="text-gray-500 mb-6 text-sm">
                  Create your first task to start organizing your project workflow
                </p>
                <CreateTaskDialog projectId={projectId} onSuccess={onTaskCreated}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Task
                  </Button>
                </CreateTaskDialog>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list">
          <TaskList projectId={projectId} tasks={tasks} />
        </TabsContent>

        <TabsContent value="calendar">
          <TaskCalendar projectId={projectId} tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
