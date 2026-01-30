// src/components/debts/add-debt-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AddDebtModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Folder {
  id: string
  name: string
  color: string
}

export function AddDebtModal({ open, onOpenChange, onSuccess }: AddDebtModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [folders, setFolders] = useState<Folder[]>([])
  const [formData, setFormData] = useState({
    debtor_name: '',
    debtor_phone: '',
    amount: '',
    due_date: '',
    folder_id: '',
    note: '',
  })

  // Fetch folders when modal opens
useEffect(() => {
  if (open) {
    fetchFolders()
  }
}, [open])

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders')
      const data = await response.json()
      if (response.ok) {
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Folders fetch error:', error)
    }
  }

  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/\D/g, '')
    if (!cleaned.startsWith('998') && cleaned.length > 0) {
      cleaned = '998' + cleaned
    }
    const formatted = cleaned.length > 0 ? '+' + cleaned : ''
    setFormData({ ...formData, debtor_phone: formatted.slice(0, 13) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtor_name: formData.debtor_name,
          debtor_phone: formData.debtor_phone,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date || undefined,
          folder_id: formData.folder_id || undefined,
          note: formData.note || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Xato yuz berdi')
        return
      }

      // Reset form
      setFormData({
        debtor_name: '',
        debtor_phone: '',
        amount: '',
        due_date: '',
        folder_id: '',
        note: '',
      })

      // Close modal and refresh
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      setError('Tarmoq xatosi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yangi Qarz Qo'shish</DialogTitle>
          <DialogDescription>Qarzdor ma'lumotlarini kiriting</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="debtor_name">
              To'liq ism <span className="text-red-500">*</span>
            </Label>
            <Input
              id="debtor_name"
              placeholder="Ali Valiyev"
              required
              value={formData.debtor_name}
              onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="debtor_phone">
              Telefon raqam <span className="text-red-500">*</span>
            </Label>
            <Input
              id="debtor_phone"
              type="tel"
              placeholder="+998901234567"
              required
              value={formData.debtor_phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Qarz summasi (so'm) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="1000000"
              required
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Qaytarish muddati</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder_id">Folder</Label>
            <Select
              value={formData.folder_id}
              onValueChange={(value) => setFormData({ ...formData, folder_id: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Folder tanlang" />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Izoh</Label>
            <Textarea
              id="note"
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Yuklanmoqda...' : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}