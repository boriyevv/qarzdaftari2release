// src/components/folders/folders-sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Badge } from '@/src/components/ui/badge'
import { cn } from '@/src/lib/utills'

interface Folder {
  id: string
  name: string
  color: string
  icon: string
  is_default: boolean
  debts: Array<{ count: number }>
}

interface FoldersSidebarProps {
  activeFolder: string
  onFolderChange: (folderId: string) => void
}

export function FoldersSidebar({ activeFolder, onFolderChange }: FoldersSidebarProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6')

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
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

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          color: newFolderColor,
        }),
      })

      if (response.ok) {
        setNewFolderName('')
        setNewFolderColor('#3B82F6')
        setIsAddOpen(false)
        fetchFolders()
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch (error) {
      console.error('Add folder error:', error)
    }
  }

  const getTotalDebts = () => {
    return folders.reduce((sum, folder) => sum + (folder.debts?.[0]?.count || 0), 0)
  }

  const colors = [
    { name: 'Ko\'k', value: '#3B82F6' },
    { name: 'Yashil', value: '#10B981' },
    { name: 'Qizil', value: '#EF4444' },
    { name: 'Sariq', value: '#F59E0B' },
    { name: 'Binafsha', value: '#8B5CF6' },
    { name: 'Pushti', value: '#EC4899' },
  ]

  if (loading) {
    return (
      <div className="w-64 border-r bg-slate-50 p-4">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r bg-slate-50 p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">
          Folderlar
        </h3>
      </div>

      {/* All Debts */}
      <button
        onClick={() => onFolderChange('all')}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
          activeFolder === 'all'
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-slate-100 text-slate-700'
        )}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span className="font-medium">Barcha qarzlar</span>
        </div>
        <Badge variant="secondary">{getTotalDebts()}</Badge>
      </button>

      {/* Folders List */}
      <div className="space-y-1">
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onFolderChange(folder.id)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
              activeFolder === folder.id
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-slate-100 text-slate-700'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
              <span className="font-medium truncate">{folder.name}</span>
            </div>
            <Badge variant="secondary">{folder.debts?.[0]?.count || 0}</Badge>
          </button>
        ))}
      </div>

      {/* Add Folder Button */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Yangi Folder
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi Folder</DialogTitle>
            <DialogDescription>Qarzlaringizni guruhlash uchun folder yarating</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder nomi</Label>
              <Input
                id="folder-name"
                placeholder="Do'kon qarzlari"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Rang</Label>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewFolderColor(color.value)}
                    className={cn(
                      'w-10 h-10 rounded-lg transition-all',
                      newFolderColor === color.value && 'ring-2 ring-offset-2 ring-blue-500'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleAddFolder}>Yaratish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}