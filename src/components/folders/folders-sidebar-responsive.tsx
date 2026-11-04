// src/components/folders/folders-sidebar-responsive.tsx
'use client'

import { Badge } from '@//components/ui/badge'
import { Button } from '@//components/ui/button'
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
import { Input } from '@//components/ui/input'
import { Label } from '@//components/ui/label'
import { cn } from '@/lib/utils'
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
import { useEffect, useState } from 'react'

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
	{ name: "Ko'k", value: '#3B82F6' },
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
				isActive
					? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
					: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70',
			)}
		>
			{/* Drag Handle */}
			<div
				{...attributes}
				{...listeners}
				className='cursor-move p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg mr-2 touch-none transition-colors'
			>
				<svg
					className='w-4 h-4'
					fill='currentColor'
					viewBox='0 0 16 16'
				>
					<path d='M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z' />
				</svg>
			</div>

			{/* Folder Content */}
			<button
				onClick={onClick}
				className='flex-1 flex items-center gap-3 text-left'
			>
				<div
					className='w-2 h-2 rounded-full'
					style={{ backgroundColor: folder.color }}
				/>
				<span className='font-medium text-slate-900 dark:text-slate-100'>{folder.name}</span>
			</button>

			{/* Actions */}
			<div className='flex items-center gap-2'>
				<Badge variant='secondary' className='dark:bg-slate-800 dark:text-slate-300'>{folder.debt_count || 0}</Badge>

				{!folder.is_default && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='ghost'
								size='icon'
								className='h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-all'
							>
								<svg
									className='w-4 h-4'
									fill='currentColor'
									viewBox='0 0 16 16'
								>
									<path d='M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z' />
								</svg>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='rounded-2xl p-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl'>
							<DropdownMenuItem onClick={onEdit} className='rounded-xl text-xs font-semibold py-2 cursor-pointer transition-colors'>Tahrirlash</DropdownMenuItem>
							<DropdownMenuItem onClick={onDelete} className='rounded-xl text-xs font-semibold py-2 text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer transition-colors'>
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
				const folders = (data.folders || []).map((folder: any) => ({
					...folder,
					debt_count:
						typeof folder.debt_count === 'number' ? folder.debt_count : 0,
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

		const oldIndex = folders.findIndex(f => f.id === active.id)
		const newIndex = folders.findIndex(f => f.id === over.id)

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
					}),
				),
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
		if (
			!confirm(
				"Folderni o'chirmoqchimisiz? Ichidagi qarzlar default folderga ko'chiriladi.",
			)
		) {
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
		<div className='h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col'>
			{/* Header */}
			<div className='p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between'>
				<h2 className='text-lg font-bold text-slate-900 dark:text-slate-100'>Folderlar</h2>
				{onClose && (
					<Button variant='ghost' size='icon' onClick={onClose} className="rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
					</Button>
				)}
			</div>

			{/* Folders List */}
			<div className='flex-1 overflow-y-auto p-4 space-y-2'>
				{/* All Debts */}
				<button
					onClick={() => {
						onFolderChange('all')
						onClose?.()
					}}
					className={cn(
						'w-full flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer',
						activeFolder === 'all'
							? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold'
							: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70',
					)}
				>
					<div className='flex items-center gap-3'>
						<div className='w-2 h-2 rounded-full bg-slate-400' />
						<span className='font-medium text-slate-900 dark:text-slate-100'>Barcha qarzlar</span>
					</div>
					<Badge variant='secondary' className='dark:bg-slate-800 dark:text-slate-300'>{totalDebts}</Badge>
				</button>

				{/* Sortable Folders */}
				{loading ? (
					<div className='text-center py-8 text-slate-400 dark:text-slate-500 text-sm'>Yuklanmoqda...</div>
				) : (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={folders.map(f => f.id)}
							strategy={verticalListSortingStrategy}
						>
							{folders.map(folder => (
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
			<div className='p-4 border-t border-slate-200 dark:border-slate-800'>
				<Button
					variant='outline'
					className='w-full rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs h-10 transition-colors'
					onClick={() => setIsAddOpen(true)}
				>
					<svg
						className='w-4 h-4 mr-2'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M12 4v16m8-8H4'
						/>
					</svg>
					Yangi Folder
				</Button>
			</div>

			{/* Dialogs */}
			<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
				<DialogContent className="sm:max-w-[425px] rounded-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
					<DialogHeader>
						<DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-100">Yangi Folder</DialogTitle>
						<DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
							Qarzlaringizni guruhlashtirish uchun folder yarating
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleAddFolder} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='name' className="text-xs font-bold text-slate-700 dark:text-slate-300">Folder nomi</Label>
							<Input
								id='name'
								placeholder="Masalan: Do'kon"
								required
								value={formData.name}
								onChange={e =>
									setFormData({ ...formData, name: e.target.value })
								}
								className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs h-10 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
							/>
						</div>

						<div className='space-y-2'>
							<Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rang</Label>
							<div className='grid grid-cols-3 gap-2'>
								{COLORS.map(color => (
									<button
										key={color.value}
										type='button'
										onClick={() =>
											setFormData({ ...formData, color: color.value })
										}
										className={cn(
											'p-3 rounded-xl border-2 transition-all cursor-pointer',
											formData.color === color.value
												? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30'
												: 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
										)}
									>
										<div className='flex items-center gap-2'>
											<div
												className='w-4 h-4 rounded-full flex-shrink-0'
												style={{ backgroundColor: color.value }}
											/>
											<span className='text-xs font-medium truncate'>{color.name}</span>
										</div>
									</button>
								))}
							</div>
						</div>

						<DialogFooter className="gap-2 sm:gap-0 pt-2">
							<Button
								type='button'
								variant='outline'
								onClick={() => setIsAddOpen(false)}
								className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
							>
								Bekor qilish
							</Button>
							<Button type='submit' className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">Yaratish</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent className="sm:max-w-[425px] rounded-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
					<DialogHeader>
						<DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-100">Folderni Tahrirlash</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleEditFolder} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='edit_name' className="text-xs font-bold text-slate-700 dark:text-slate-300">Folder nomi</Label>
							<Input
								id='edit_name'
								required
								value={formData.name}
								onChange={e =>
									setFormData({ ...formData, name: e.target.value })
								}
								className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs h-10 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
							/>
						</div>

						<div className='space-y-2'>
							<Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rang</Label>
							<div className='grid grid-cols-3 gap-2'>
								{COLORS.map(color => (
									<button
										key={color.value}
										type='button'
										onClick={() =>
											setFormData({ ...formData, color: color.value })
										}
										className={cn(
											'p-3 rounded-xl border-2 transition-all cursor-pointer',
											formData.color === color.value
												? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30'
												: 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
										)}
									>
										<div className='flex items-center gap-2'>
											<div
												className='w-4 h-4 rounded-full flex-shrink-0'
												style={{ backgroundColor: color.value }}
											/>
											<span className='text-xs font-medium truncate'>{color.name}</span>
										</div>
									</button>
								))}
							</div>
						</div>

						<DialogFooter className="gap-2 sm:gap-0 pt-2">
							<Button
								type='button'
								variant='outline'
								onClick={() => setIsEditOpen(false)}
								className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
							>
								Bekor qilish
							</Button>
							<Button type='submit' className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">Saqlash</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
