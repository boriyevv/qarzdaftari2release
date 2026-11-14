// src/lib/export/export-helper.ts
'use client'

import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { toast } from 'sonner'

export interface SaveAndShareOptions {
  filename: string
  blob: Blob
  mimeType: string
  title?: string
}

/**
 * Universal file saver & sharer:
 * - Native Android/iOS (Capacitor): Writes to cache and triggers native Share/Open Sheet with files: [...]
 * - Mobile Web: Uses Web Share API (navigator.share)
 * - iOS Safari Fallback: Opens in new tab with native iOS PDF viewer + Share/Save to Files
 * - Desktop Web Fallback: Standard browser download (<a download>)
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

      // 1. Write file to Cache directory
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      })

      // 2. Share using native share sheet
      // IMPORTANT: In Capacitor 4+, `files: [savedFile.uri]` is REQUIRED so Android/iOS
      // attaches the actual file (via FileProvider) rather than a plain text URI string.
      await Share.share({
        title,
        files: [savedFile.uri],
        dialogTitle: `${filename} faylini ochish yoki ulashish`,
      })
      toast.success("Fayl muvaffaqiyatli tayyorlandi!")
      return
    } catch (err: unknown) {
      const errMessage = (err as Error)?.message?.toLowerCase() || ''
      if (
        (err as Error)?.name === 'AbortError' ||
        errMessage.includes('canceled') ||
        errMessage.includes('cancelled') ||
        errMessage.includes('dismiss')
      ) {
        return
      }
      console.warn('Native saveAndShareFile fallback:', err)
    }
  }

  // 2. Web Share API fallback (supported on Chrome Android & Safari iOS)
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      const file = new File([blob], filename, { type: mimeType })
      if ('canShare' in navigator && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
        })
        toast.success("Fayl muvaffaqiyatli ulashildi!")
        return
      }
    } catch (err: unknown) {
      const errMessage = (err as Error)?.message?.toLowerCase() || ''
      if (
        (err as Error)?.name === 'AbortError' ||
        errMessage.includes('canceled') ||
        errMessage.includes('cancelled')
      ) {
        return
      }
      console.warn('Web Share API error, falling back:', err)
    }
  }

  // 3. Platform-specific Web & Desktop fallback
  if (typeof window !== 'undefined') {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    const url = URL.createObjectURL(blob)

    // iOS Safari ignores <a download> for blobs. Open in new tab for native iOS PDF view & save
    if (isIOS) {
      const newTab = window.open(url, '_blank')
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        window.location.href = url
      }
      toast.success("PDF hisobot ochildi!", {
        description: "Uni saqlash yoki yuborish uchun 'Ulashish' (Share) tugmasini bosing.",
      })
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      return
    }

    // Standard download for Android Chrome & Desktop browsers
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success("Hisobot yuklab olindi!")
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
}
