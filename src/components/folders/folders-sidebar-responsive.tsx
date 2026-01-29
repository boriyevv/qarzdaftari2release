// src/components/folders/folders-sidebar-responsive.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { cn } from '@/src/lib/utills'

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
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    color: COLORS[0].value,
  })

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/folders')
      const data = await response.json()
      if (response.ok) {
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Folders fetch error:', error)
    } finally {
      setLoading(false)
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

  // Drag and drop handlers
  const handleDragStart = (folderId: string) => {
    setDraggedItem(folderId)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetId) return

    const draggedIdx = folders.findIndex(f => f.id === draggedItem)
    const targetIdx = folders.findIndex(f => f.id === targetId)

    if (draggedIdx === -1 || targetIdx === -1) return

    const newFolders = [...folders]
    const [removed] = newFolders.splice(draggedIdx, 1)
    newFolders.splice(targetIdx, 0, removed)

    setFolders(newFolders)
  }

  const handleDragEnd = async () => {
    if (!draggedItem) return

    // Update order_index in backend
    const updates = folders.map((folder, index) => ({
      id: folder.id,
      order_index: index,
    }))

    try {
      await Promise.all(
        updates.map(({ id, order_index }) =>
          fetch(`/api/folders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index }),
          })
        )
      )
    } catch (error) {
      console.error('Reorder error:', error)
      fetchFolders() // Revert on error
    }

    setDraggedItem(null)
  }

  const totalDebts = folders.reduce((sum, folder) => sum + folder.debt_count, 0)

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Folderlar</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
            activeFolder === 'all'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-slate-50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span className="font-medium">Barcha qarzlar</span>
          </div>
          <Badge variant="secondary">{totalDebts}</Badge>
        </button>

        {/* Folder Items */}
        {loading ? (
          <div className="text-center py-8 text-slate-500">Yuklanmoqda...</div>
        ) : (
          folders.map((folder) => (
            <div
              key={folder.id}
              draggable
              onDragStart={() => handleDragStart(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group flex items-center justify-between p-3 rounded-lg transition-colors cursor-move',
                activeFolder === folder.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-slate-50',
                draggedItem === folder.id && 'opacity-50'
              )}
            >
              <button
                onClick={() => {
                  onFolderChange(folder.id)
                  onClose?.()
                }}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: folder.color }}
                ></div>
                <span className="font-medium">{folder.name}</span>
              </button>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">{folder.debt_count}</Badge>

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
                      <DropdownMenuItem onClick={() => openEditModal(folder)}>
                        Tahrirlash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="text-red-600"
                      >
                        O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))
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

      {/* Add Folder Dialog */}
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
                      ></div>
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

      {/* Edit Folder Dialog */}
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
                      ></div>
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