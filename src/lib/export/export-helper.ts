// src/lib/export/export-helper.ts
'use client'

import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export interface SaveAndShareOptions {
  filename: string
  blob: Blob
  mimeType: string
  title?: string
}

/**
 * Universal file saver & sharer:
 * - Native Android/iOS: Writes to cache and triggers native Share/Open Sheet
 * - Mobile Web: Uses Web Share API (navigator.share)
 * - Desktop Web: Standard browser download
 */
export async function saveAndShareFile(options: SaveAndShareOptions): Promise<void> {
  const { filename, blob, mimeType, title = options.filename } = options

  // 1. Capacitor Native platform (Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string
          const base64 = res.split(',')[1] || ''
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      const base64Data = await base64Promise

      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      })

      await Share.share({
        title,
        url: savedFile.uri,
        dialogTitle: `${filename} faylini ochish yoki yuborish`,
      })
      return
    } catch (err) {
      console.warn('Native saveAndShareFile fallback:', err)
    }
  }

  // 2. Web Share API fallback (supported on Chrome Android & Safari iOS)
  if (typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator) {
    try {
      const file = new File([blob], filename, { type: mimeType })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
        })
        return
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
    }
  }

  // 3. Desktop / Standard Browser download fallback
  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
}
