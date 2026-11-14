// src/components/folders/folder-filter-bar.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Folder,
  FolderPlus,
  Plus,
  Settings2,
  Trash2,
  Edit2,
  GripVertical,
  Layers,
} from 'lucide-react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface FolderItem {
  id: string
  name: string
  color: string
  debt_count: number
  is_default: boolean
  order_index: number
}

interface FolderFilterBarProps {
  activeFolder: string
  onFolderChange: (folderId: string) => void
  onFoldersLoaded?: (folders: FolderItem[]) => void
}

const COLORS = [
  { name: "Ko'k", value: '#3B82F6' },
  { name: 'Yashil', value: '#10B981' },
  { name: 'Qizil', value: '#EF4444' },
  { name: 'Sariq', value: '#F59E0B' },
  { name: 'Binafsha', value: '#8B5CF6' },
  { name: 'Pushti', value: '#EC4899' },
]

// Sortable Item inside the Management Modal
function SortableFolderRow({
  folder,
  onEdit,
  onDelete,
}: {
  folder: FolderItem
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
      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded touch-none transition-colors"
          title="Tartibini o'zgartirish"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div
          className="w-3.5 h-3.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: folder.color }}
        />
        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
          {folder.name}
        </span>
        <Badge variant="secondary" className="text-xs bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {folder.debt_count || 0} ta qarz
        </Badge>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Tahrirlash"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        {!folder.is_default && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            title="O'chirish"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function FolderFilterBar({
  activeFolder,
  onFolderChange,
  onFoldersLoaded,
}: FolderFilterBarProps) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    color: COLORS[0].value,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
        const loadedFolders = (data.folders || []).map((f: any) => ({
          ...f,
          debt_count: typeof f.debt_count === 'number' ? f.debt_count : 0,
        }))
        setFolders(loadedFolders)
        onFoldersLoaded?.(loadedFolders)
      }
    } catch (error) {
      console.error('Folders fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = folders.findIndex((f) => f.id === active.id)
    const newIndex = folders.findIndex((f) => f.id === over.id)

    const newFolders = arrayMove(folders, oldIndex, newIndex)
    setFolders(newFolders)

    try {
      await Promise.all(
        newFolders.map((folder, index) =>
          fetch(`/api/folders/${folder.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: index }),
          }),
        ),
      )
    } catch (error) {
      console.error('Reorder error:', error)
      fetchFolders()
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

  const handleDeleteFolder = (folderId: string) => {
    toast.warning("Folderni o'chirmoqchimisiz? Ichidagi qarzlar asosiy ro'yxatga ko'chiriladi.", {
      action: {
        label: "O'chirish",
        onClick: async () => {
          try {
            const response = await fetch(`/api/folders/${folderId}`, {
              method: 'DELETE',
            })

            if (response.ok) {
              if (activeFolder === folderId) {
                onFolderChange('all')
              }
              toast.success("Folder muvaffaqiyatli o'chirildi")
              fetchFolders()
            } else {
              toast.error("Folderni o'chirishda xatolik yuz berdi")
            }
          } catch (error) {
            console.error('Delete folder error:', error)
            toast.error("Xatolik yuz berdi")
          }
        },
      },
      cancel: {
        label: 'Bekor qilish',
        onClick: () => {},
      },
    })
  }

  const openEditModal = (folder: FolderItem) => {
    setEditingFolder(folder)
    setFormData({
      name: folder.name,
      color: folder.color,
    })
    setIsEditOpen(true)
  }

  const totalDebts = folders.reduce((sum, f) => sum + f.debt_count, 0)

  return (
    <div className="w-full">
      {/* Horizontal Scrollable Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none no-scrollbar">
        {/* All Debts Chip */}
        <button
          onClick={() => onFolderChange('all')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex-shrink-0 shadow-2xs cursor-pointer',
            activeFolder === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Barcha qarzlar</span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-md text-[10px] font-bold',
              activeFolder === 'all'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
            )}
          >
            {totalDebts}
          </span>
        </button>

        {/* Individual Folder Chips */}
        {folders.map((folder) => {
          const isActive = activeFolder === folder.id
          return (
            <button
              key={folder.id}
              onClick={() => onFolderChange(folder.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex-shrink-0 shadow-2xs cursor-pointer',
                isActive
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: folder.color }}
              />
              <span className="truncate max-w-[130px]">{folder.name}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-md text-[10px] font-bold',
                  isActive
                    ? 'bg-slate-800 dark:bg-slate-200 text-slate-200 dark:text-slate-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
                )}
              >
                {folder.debt_count}
              </span>
            </button>
          )
        })}

        {/* Add Folder Quick Chip */}
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-900/60 hover:border-blue-300 dark:hover:border-blue-700 flex-shrink-0 transition-all cursor-pointer"
          title="Yangi papka qo'shish"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yangi papka</span>
        </button>

        {/* Manage Folders Chip */}
        {folders.length > 0 && (
          <button
            onClick={() => setIsManageOpen(true)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex-shrink-0 transition-colors cursor-pointer"
            title="Papkalarni tartibga solish va boshqarish"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Boshqarish</span>
          </button>
        )}
      </div>

      {/* =========================================================
          FOLDER MANAGEMENT DIALOG
          ========================================================= */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Papkalarni boshqarish
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Qarzlarni guruhlash uchun papkalarni tahrirlang yoki surib tartibini o&apos;zgartiring
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[350px] overflow-y-auto">
            {folders.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">
                Hozircha qo&apos;shimcha papkalar yo&apos;q
              </p>
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
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <SortableFolderRow
                        key={folder.id}
                        folder={folder}
                        onEdit={() => {
                          setIsManageOpen(false)
                          openEditModal(folder)
                        }}
                        onDelete={() => handleDeleteFolder(folder.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto rounded-xl"
              onClick={() => setIsManageOpen(false)}
            >
              Yopish
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              onClick={() => {
                setIsManageOpen(false)
                setIsAddOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Yangi papka
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          ADD FOLDER DIALOG
          ========================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Yangi Papka
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Qarzlaringizni guruhlashtirish uchun papka yarating
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFolder} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="folder_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Papka nomi
              </Label>
              <Input
                id="folder_name"
                placeholder="Masalan: Ulgurji, Bozor, Qarindoshlar"
                required
                className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rang belgisi
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, color: color.value })
                    }
                    className={cn(
                      'p-2.5 rounded-xl border-2 transition-all flex items-center gap-2 text-xs font-semibold',
                      formData.color === color.value
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300',
                    )}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color.value }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                onClick={() => setIsAddOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
              >
                Yaratish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          EDIT FOLDER DIALOG
          ========================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Papkani Tahrirlash
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditFolder} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit_folder_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Papka nomi
              </Label>
              <Input
                id="edit_folder_name"
                required
                className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rang belgisi
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, color: color.value })
                    }
                    className={cn(
                      'p-2.5 rounded-xl border-2 transition-all flex items-center gap-2 text-xs font-semibold',
                      formData.color === color.value
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300',
                    )}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color.value }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                onClick={() => setIsEditOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
              >
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
