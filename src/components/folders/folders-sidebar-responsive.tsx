// src/components/folders/folders-sidebar-responsive.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@//components/ui/button'
import { Badge } from '@//components/ui/badge'
import { Input } from '@//components/ui/input'
import { Label } from '@//components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@//components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@//components/ui/dropdown-menu'
import { cn } from '@//lib/utills'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MainNav } from '../layout/main-nav'


interface Folder {
  id: string
  name: string
  color: string
  debt_count: number
  is_default: boolean
  order_index: number
}

interface FoldersSidebarResponsiveProps {
  activeFolder: string
  onFolderChange: (folderId: string) => void
  onClose?: () => void
}

const COLORS = [
  { name: 'Ko\'k', value: '#3B82F6' },
  { name: 'Yashil', value: '#10B981' },
  { name: 'Qizil', value: '#EF4444' },
  { name: 'Sariq', value: '#F59E0B' },
  { name: 'Binafsha', value: '#8B5CF6' },
  { name: 'Pushti', value: '#EC4899' },
]

// Sortable Folder Item Component
function SortableFolderItem({
  folder,
  isActive,
  onClick,
  onEdit,
  onDelete,
}: {
  folder: Folder
  isActive: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center justify-between p-3 rounded-lg transition-colors',
        isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move p-1 hover:bg-slate-200 rounded mr-2 touch-none"
      >
        <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
        </svg>
      </div>

      {/* Folder Content */}
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-3 text-left"
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: folder.color }}
        />
        <span className="font-medium">{folder.name}</span>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{folder.debt_count || 0}</Badge>

        {!folder.is_default && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                Tahrirlash
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                O'chirish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export function FoldersSidebarResponsive({
  activeFolder,
  onFolderChange,
  onClose,
}: FoldersSidebarResponsiveProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    color: COLORS[0].value,
  })

  // DND Kit sensors for touch and mouse
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement to activate
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/folders')
      const data = await response.json()

      if (response.ok) {
        const folders = (data.folders || []).map((folder: any) => ({
          ...folder,
          debt_count: typeof folder.debt_count === 'number' ? folder.debt_count : 0,
        }))
        setFolders(folders)
      }
    } catch (error) {
      console.error('Folders fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = folders.findIndex((f) => f.id === active.id)
    const newIndex = folders.findIndex((f) => f.id === over.id)

    const newFolders = arrayMove(folders, oldIndex, newIndex)
    setFolders(newFolders)

    // Update order in backend
    try {
      await Promise.all(
        newFolders.map((folder, index) =>
          fetch(`/api/folders/${folder.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: index }),
          })
        )
      )
    } catch (error) {
      console.error('Reorder error:', error)
      fetchFolders() // Revert on error
    }
  }

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({ name: '', color: COLORS[0].value })
        setIsAddOpen(false)
        fetchFolders()
      }
    } catch (error) {
      console.error('Add folder error:', error)
    }
  }

  const handleEditFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFolder) return

    try {
      const response = await fetch(`/api/folders/${editingFolder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          color: formData.color,
        }),
      })

      if (response.ok) {
        setIsEditOpen(false)
        setEditingFolder(null)
        fetchFolders()
      }
    } catch (error) {
      console.error('Edit folder error:', error)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Folderni o\'chirmoqchimisiz? Ichidagi qarzlar default folderga ko\'chiriladi.')) {
      return
    }

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (activeFolder === folderId) {
          onFolderChange('all')
        }
        fetchFolders()
      }
    } catch (error) {
      console.error('Delete folder error:', error)
    }
  }

  const openEditModal = (folder: Folder) => {
    setEditingFolder(folder)
    setFormData({
      name: folder.name,
      color: folder.color,
    })
    setIsEditOpen(true)
  }

  const totalDebts = folders.reduce((sum, folder) => sum + folder.debt_count, 0)

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Folderlar</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg> */}
          </Button>
        )}
      </div>

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* All Debts */}
        <button
          onClick={() => {
            onFolderChange('all')
            onClose?.()
          }}
          className={cn(
            'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
            activeFolder === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="font-medium">Barcha qarzlar</span>
          </div>
          <Badge variant="secondary">{totalDebts}</Badge>
        </button>

        {/* Sortable Folders */}
        {loading ? (
          <div className="text-center py-8 text-slate-500">Yuklanmoqda...</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={folders.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {folders.map((folder) => (
                <SortableFolderItem
                  key={folder.id}
                  folder={folder}
                  isActive={activeFolder === folder.id}
                  onClick={() => {
                    onFolderChange(folder.id)
                    onClose?.()
                  }}
                  onEdit={() => openEditModal(folder)}
                  onDelete={() => handleDeleteFolder(folder.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Folder Button */}
      <div className="p-4 border-t">
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsAddOpen(true)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yangi Folder
        </Button>


      </div>

<div className="p-4 border-t">

</div>

      {/* Dialogs (same as before) */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi Folder</DialogTitle>
            <DialogDescription>Qarzlaringizni guruhlashtirish uchun folder yarating</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFolder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Folder nomi</Label>
              <Input
                id="name"
                placeholder="Masalan: Do'kon"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Rang</Label>
              <div className="grid grid-cols-3 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all',
                      formData.color === color.value
                        ? 'border-blue-600 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-sm">{color.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit">Yaratish</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Folderni Tahrirlash</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFolder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Folder nomi</Label>
              <Input
                id="edit_name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Rang</Label>
              <div className="grid grid-cols-3 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all',
                      formData.color === color.value
                        ? 'border-blue-600 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-sm">{color.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit">Saqlash</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}