// src/lib/export/debts-export.ts
'use client'

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '@/lib/utils/currency'
import { saveAndShareFile } from './export-helper'

export interface ExportableDebt {
  id: string
  debtor_name: string
  debtor_phone: string
  amount: number
  paid_amount: number
  status: 'pending' | 'paid' | 'overdue' | 'blacklisted' | string
  due_date: string | null
  debt_date: string
  note?: string | null
  folder?: {
    id: string
    name: string
    color: string
  } | null
}

export interface DebtsExportOptions {
  storeName?: string
  filterLabel?: string
  debts: ExportableDebt[]
}

const getStatusLabel = (status: string, remaining: number): string => {
  if (status === 'paid' || remaining <= 0) return "To'langan"
  if (status === 'overdue') return "Muddati o'tgan"
  if (status === 'blacklisted') return 'Qora ro\'yxatda'
  return 'Kutilmoqda'
}

/**
 * 📊 Qarzlar ro'yxatini Excel (.xlsx) formatida yuklab olish
 */
export function exportDebtsToExcel(options: DebtsExportOptions) {
  const { storeName = "Qarz Daftari", filterLabel = "Barchasi", debts } = options
  const dateStr = new Date().toISOString().split('T')[0]
  const cleanStoreName = storeName.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_')

  const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0)
  const totalPaid = debts.reduce((sum, d) => sum + d.paid_amount, 0)
  const totalRemaining = totalAmount - totalPaid

  const wb = XLSX.utils.book_new()

  // Sarlavha va Xulosa bloklari
  const sheetData: (string | number)[][] = [
    ['QARZ DAFTARI — QARZLAR RO\'YXATI VA HISOBOTI'],
    ['Do\'kon / Tashkilot:', storeName],
    ['Filtr holati:', filterLabel],
    ['Hisobot sanasi:', new Date().toLocaleString('uz-UZ')],
    ['Qarzlar soni:', `${debts.length} ta yozuv`],
    [],
    ['UMUMIY KO\'RSATKICHLAR'],
    ['Jami berilgan nasiya:', totalAmount, 'so\'m'],
    ['Jami undirilgan summa:', totalPaid, 'so\'m'],
    ['Joriy qoldiq qarz:', totalRemaining, 'so\'m'],
    [],
    [
      '№',
      'Qarzdor Ismi',
      'Telefon Raqami',
      'Papka / Kategoriya',
      'Jami Qarz (so\'m)',
      'To\'langan Summa (so\'m)',
      'Qoldiq Qarz (so\'m)',
      'Nasiya Sanasi',
      'To\'lov Muddati',
      'Holati',
      'Izoh'
    ]
  ]

  // Qarzlar qatorlari
  debts.forEach((debt, index) => {
    const remaining = Math.max(0, debt.amount - debt.paid_amount)
    const statusLabel = getStatusLabel(debt.status, remaining)
    const debtDate = debt.debt_date ? new Date(debt.debt_date).toLocaleDateString('uz-UZ') : '-'
    const dueDate = debt.due_date ? new Date(debt.due_date).toLocaleDateString('uz-UZ') : 'Muddatsiz'

    sheetData.push([
      index + 1,
      debt.debtor_name,
      debt.debtor_phone || '-',
      debt.folder?.name || 'Asosiy',
      debt.amount,
      debt.paid_amount,
      remaining,
      debtDate,
      dueDate,
      statusLabel,
      debt.note || ''
    ])
  })

  // Yakuniy qator
  sheetData.push([])
  sheetData.push([
    'JAMI',
    '',
    '',
    '',
    totalAmount,
    totalPaid,
    totalRemaining,
    '',
    '',
    '',
    ''
  ])

  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // Ustun kengliklari
  ws['!cols'] = [
    { wch: 6 },  // №
    { wch: 25 }, // Ismi
    { wch: 18 }, // Tel
    { wch: 16 }, // Papka
    { wch: 18 }, // Jami
    { wch: 18 }, // To'langan
    { wch: 18 }, // Qoldiq
    { wch: 14 }, // Sanasi
    { wch: 14 }, // Muddati
    { wch: 15 }, // Holati
    { wch: 30 }, // Izoh
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Qarzlar Ro\'yxati')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAndShareFile({
    filename: `Qarzlar_Royxati_${cleanStoreName}_${dateStr}.xlsx`,
    blob,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    title: 'Qarzlar Ro\'yxati (Excel)',
  })
}

/**
 * 📄 Qarzlar ro'yxatini zamonaviy A4 formatdagi PDF hisobot sifatida yuklab olish
 */
export function exportDebtsToPDF(options: DebtsExportOptions) {
  const { storeName = "Qarz Daftari", filterLabel = "Barchasi", debts } = options
  const dateStr = new Date().toLocaleDateString('uz-UZ')
  const cleanStoreName = storeName.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_')

  const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0)
  const totalPaid = debts.reduce((sum, d) => sum + d.paid_amount, 0)
  const totalRemaining = totalAmount - totalPaid
  const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 1. Yuqori Brand Header Banner
  doc.setFillColor(30, 58, 138) // Deep Blue
  doc.rect(0, 0, pageWidth, 24, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('QARZLAR RO\'YXATI VA MOLIYAVIY HISOBOT', 14, 11)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Do'kon: ${storeName}  |  Filtr: ${filterLabel}`, 14, 18)

  doc.setFontSize(8.5)
  doc.text(`Chop etilgan sana: ${dateStr}`, pageWidth - 14, 11, { align: 'right' })
  doc.text(`Qarz yozuvlari: ${debts.length} ta`, pageWidth - 14, 18, { align: 'right' })

  // 2. 3 ta KPI Statistika Kartalari
  const cardY = 28
  const cardHeight = 16
  const gap = 6
  const cardWidth = (pageWidth - 28 - (gap * 2)) / 3

  // Jami Qarz
  doc.setFillColor(239, 246, 255) // light blue
  doc.setDrawColor(191, 219, 254)
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('JAMI BERILGAN NASIYA', 18, cardY + 5)
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(formatCurrency(totalAmount), 18, cardY + 12)

  // Undirilgan Summa
  const card2X = 14 + cardWidth + gap
  doc.setFillColor(240, 253, 244) // light green
  doc.setDrawColor(187, 247, 208)
  doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(22, 101, 52)
  doc.text(`UNDIRILGAN SUMMA (${collectionRate}%)`, card2X + 4, cardY + 5)
  doc.setFontSize(11)
  doc.setTextColor(21, 128, 61)
  doc.text(formatCurrency(totalPaid), card2X + 4, cardY + 12)

  // Qoldiq Qarz
  const card3X = card2X + cardWidth + gap
  doc.setFillColor(254, 242, 242) // light rose
  doc.setDrawColor(254, 202, 202)
  doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(153, 27, 27)
  doc.text('JORIY QOLDIQ QARZ', card3X + 4, cardY + 5)
  doc.setFontSize(11)
  doc.setTextColor(225, 29, 72)
  doc.text(formatCurrency(totalRemaining), card3X + 4, cardY + 12)

  // 3. Qarzlar Jadvali (autoTable)
  const tableRows = debts.map((debt, index) => {
    const remaining = Math.max(0, debt.amount - debt.paid_amount)
    const statusLabel = getStatusLabel(debt.status, remaining)
    const dueDate = debt.due_date ? new Date(debt.due_date).toLocaleDateString('uz-UZ') : 'Muddatsiz'

    return [
      (index + 1).toString(),
      debt.debtor_name,
      debt.debtor_phone || '-',
      debt.folder?.name || 'Asosiy',
      formatCurrency(debt.amount),
      formatCurrency(debt.paid_amount),
      formatCurrency(remaining),
      dueDate,
      statusLabel,
    ]
  })

  // Jami summasi qatori
  tableRows.push([
    '',
    'JAMI:',
    '',
    '',
    formatCurrency(totalAmount),
    formatCurrency(totalPaid),
    formatCurrency(totalRemaining),
    '',
    '',
  ])

  autoTable(doc, {
    startY: 48,
    head: [[
      '№',
      'Qarzdor Ismi',
      'Telefon Raqami',
      'Papka',
      'Jami Qarz',
      'To\'langan',
      'Qoldiq',
      'To\'lov Muddati',
      'Holati'
    ]],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 34, halign: 'right' },
      5: { cellWidth: 34, halign: 'right', textColor: [22, 101, 52] },
      6: { cellWidth: 34, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
      7: { cellWidth: 26, halign: 'center' },
      8: { cellWidth: 26, halign: 'center' },
    },
    didParseCell: (data) => {
      // Highlight the Total summary row at bottom
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [241, 245, 249]
      }
    },
    margin: { left: 14, right: 14, bottom: 15 },
  })

  // 4. Sahifa Raqamlari va Footer
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Qarz Daftari (debtbook.uz) — Do'konlar uchun avtomatlashtirilgan qarz hisobi tizimi`,
      14,
      pageHeight - 6
    )
    doc.text(`Sahifa ${i} / ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' })
  }

  const pdfBlob = doc.output('blob')
  saveAndShareFile({
    filename: `Qarzlar_Hisoboti_${cleanStoreName}_${dateStr}.pdf`,
    blob: pdfBlob,
    mimeType: 'application/pdf',
    title: 'Qarzlar Hisoboti (PDF)',
  })
}

/**
 * 🧾 Bitta qarz uchun rasmiy kvitansiya / chek (A5 yoki kichik format)
 */
export function exportSingleDebtReceiptPDF(debt: ExportableDebt, storeName: string = "Qarz Daftari") {
  const dateStr = new Date().toLocaleDateString('uz-UZ')
  const cleanDebtor = debt.debtor_name.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_')
  const remaining = Math.max(0, debt.amount - debt.paid_amount)
  const isPaid = debt.status === 'paid' || remaining <= 0

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  })

  const pageWidth = doc.internal.pageSize.getWidth()

  // Header Box
  doc.setFillColor(30, 58, 138)
  doc.rect(0, 0, pageWidth, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('QARZ VA TO\'LOV KVITANSIYASI', 12, 10)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Do'kon: ${storeName}  |  Sana: ${dateStr}`, 12, 16)

  let y = 30

  // Debtor info
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(12, y, pageWidth - 24, 18, 2, 2, 'FD')

  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(`Mijoz: ${debt.debtor_name}`, 16, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.text(`Telefon: ${debt.debtor_phone || 'Kiritilmagan'}`, 16, y + 12)

  doc.text(`Qarz kodi: #${debt.id.slice(0, 8).toUpperCase()}`, pageWidth - 16, y + 6, { align: 'right' })
  doc.text(`Holati: ${isPaid ? "To'langan" : "Qarzdorlik faol"}`, pageWidth - 16, y + 12, { align: 'right' })

  y += 24

  const formatReceiptDate = (dStr?: string | null) => {
    if (!dStr) return '-'
    try {
      const d = new Date(dStr)
      if (isNaN(d.getTime())) return dStr
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}.${month}.${year}`
    } catch {
      return dStr
    }
  }

  // Financial breakdown table (calculated to match page width 124mm precisely)
  const tableContentWidth = pageWidth - 24
  const col0Width = 52
  const col1Width = tableContentWidth - col0Width

  autoTable(doc, {
    startY: y,
    head: [['Ko\'rsatkich', 'Tafsilot / Summa']],
    body: [
      ['Jami Nasiya Summasi', formatCurrency(debt.amount)],
      ['To\'langan Summa', formatCurrency(debt.paid_amount)],
      ['Qoldiq Qarz Summasi', formatCurrency(remaining)],
      ['Nasiya Berilgan Sana', debt.debt_date ? formatReceiptDate(debt.debt_date) : '-'],
      ['To\'lash Muddati', debt.due_date ? formatReceiptDate(debt.due_date) : 'Muddatsiz'],
      ['Izoh / Mahsulotlar', debt.note || 'Ko\'rsatilmagan'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, overflow: 'linebreak', cellPadding: 2.8 },
    columnStyles: {
      0: { cellWidth: col0Width, fontStyle: 'bold', textColor: [51, 65, 85] },
      1: { cellWidth: col1Width, halign: 'right' },
    },
    didParseCell: (data) => {
      // Izoh row should be left-aligned so product lists and notes wrap cleanly inside the cell
      if (data.section === 'body' && data.row.index === 5 && data.column.index === 1) {
        data.cell.styles.halign = 'left'
      }
    },
    margin: { left: 12, right: 12 },
  })

  // Signatures at bottom
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Do\'kon egasi imzosi: ___________________', 14, finalY)
  doc.text('Mijoz imzosi: ___________________', pageWidth - 14, finalY, { align: 'right' })

  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Qarz Daftari dasturi orqali shakllantirildi (debtbook.uz)', pageWidth / 2, finalY + 12, { align: 'center' })

  const receiptBlob = doc.output('blob')
  saveAndShareFile({
    filename: `Kvitansiya_${cleanDebtor}_${debt.id.slice(0, 6)}.pdf`,
    blob: receiptBlob,
    mimeType: 'application/pdf',
    title: `Kvitansiya #${debt.id.slice(0, 6).toUpperCase()}`,
  })
}
