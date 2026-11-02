// src/lib/export/analytics-export.ts
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '@/lib/utils/currency'

export interface ExportDebtItem {
  id: string
  debtor_name: string
  debtor_phone: string
  amount: number
  paid_amount: number
  remaining_amount: number
  status: string
  status_label?: string
  debt_date: string
  due_date: string
}

export interface ExportAnalyticsSummary {
  totalIssued: number
  totalReturned: number
  totalRemaining: number
  repaymentRate: number
  overdueCount: number
  overdueAmount: number
  averageDebtAmount: number
  totalDebtsCount: number
  activeDebtorsCount: number
}

export interface ExportTopDebtor {
  name: string
  phone: string
  amount: number
  debtCount?: number
  isOverdue?: boolean
}

export interface ExportOptions {
  storeName?: string
  period: 'monthly' | 'semi_annual' | 'annual'
  summary: ExportAnalyticsSummary
  topDebtors: ExportTopDebtor[]
  debts: ExportDebtItem[]
}

const getPeriodLabel = (period: string) => {
  switch (period) {
    case 'semi_annual':
      return '6 oylik hisobot'
    case 'annual':
      return '1 yillik hisobot'
    default:
      return 'Oylik hisobot (oxirgi 30 kun)'
  }
}

/**
 * 📊 EXCEL (.xlsx) formatida eksport qilish
 */
export function exportAnalyticsToExcel(options: ExportOptions) {
  const { storeName = "Qarz Daftari", period, summary, topDebtors, debts } = options
  const dateStr = new Date().toISOString().split('T')[0]
  const cleanStoreName = storeName.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_')

  const wb = XLSX.utils.book_new()

  // 1-VAROQ: Umumiy Xulosa (Summary)
  const summaryData = [
    ['MOLIYAVIY HISOBOT XULOSASI'],
    ['Do\'kon nomi:', storeName],
    ['Hisobot davri:', getPeriodLabel(period)],
    ['Yaratilgan sana:', new Date().toLocaleString('uz-UZ')],
    [],
    ['ASOSIY KO\'RSATKICHLAR (KPI)', 'QIYMATI', 'IZOH'],
    ['Jami berilgan nasiya', formatCurrency(summary.totalIssued), `${summary.totalDebtsCount} ta qarz yozuvi`],
    ['Jami undirilgan summa', formatCurrency(summary.totalReturned), 'Kutilayotgan tushumlar'],
    ['Undirish samaradorligi', `${summary.repaymentRate}%`, 'Jami berilgandan undirilgani'],
    ['Joriy qoldiq qarz', formatCurrency(summary.totalRemaining), `${summary.activeDebtorsCount} ta faol qarzdorda`],
    ['Muddati o\'tgan qarzlar soni', `${summary.overdueCount} ta mijoz`, 'Kechiktirilgan'],
    ['Muddati o\'tgan qarz summasi', formatCurrency(summary.overdueAmount), 'Xavfli qoldiq'],
    ['O\'rtacha qarz miqdori', formatCurrency(summary.averageDebtAmount), 'Bitta yozuvga to\'g\'ri keladigan'],
    [],
    ['TOP 5 ENG KATTA QARZDORLAR'],
    ['№', 'Mijoz ismi', 'Telefon raqami', 'Qoldiq qarz', 'Faol qarzlar soni', 'Holati'],
    ...topDebtors.map((td, idx) => [
      idx + 1,
      td.name,
      td.phone || 'Telefon yo\'q',
      formatCurrency(td.amount),
      td.debtCount || 1,
      td.isOverdue ? 'Kechikkan' : 'Kutilmoqda'
    ])
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  wsSummary['!cols'] = [
    { wch: 28 },
    { wch: 30 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 }
  ]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Umumiy Xulosa')

  // 2-VAROQ: Batafsil Qarzlar Jadvali
  const debtsData = [
    ['№', 'Mijoz ismi', 'Telefon raqami', 'Berilgan sana', 'To\'lash muddati', 'Qarz summasi (so\'m)', 'To\'langan (so\'m)', 'Qoldiq (so\'m)', 'Holati'],
    ...debts.map((d, idx) => [
      idx + 1,
      d.debtor_name,
      d.debtor_phone || 'Kiritilmagan',
      d.debt_date,
      d.due_date,
      d.amount,
      d.paid_amount,
      d.remaining_amount,
      d.status_label || (d.status === 'paid' ? 'To\'langan' : d.status === 'overdue' ? 'Kechikkan' : 'Kutilmoqda')
    ])
  ]

  const wsDebts = XLSX.utils.aoa_to_sheet(debtsData)
  wsDebts['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 }
  ]
  XLSX.utils.book_append_sheet(wb, wsDebts, 'Barcha Qarzlar')

  // Faylni yuklab olish
  XLSX.writeFile(wb, `${cleanStoreName}_Hisobot_${dateStr}.xlsx`)
}

/**
 * 📄 PDF formatida eksport qilish (Professional A4 format)
 */
export function exportAnalyticsToPDF(options: ExportOptions) {
  const { storeName = "Qarz Daftari", period, summary, topDebtors, debts } = options
  const dateStr = new Date().toISOString().split('T')[0]
  const cleanStoreName = storeName.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_')

  // A4 Portrait
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 1. Header Banner
  doc.setFillColor(30, 64, 175) // #1e40af (Dark Blue)
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('MOLIYAVIY HISOBOT', 14, 12)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${storeName} | Qarz Daftari avtomatlashtirilgan tahlili`, 14, 19)

  doc.setFontSize(8)
  doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, pageWidth - 14, 12, { align: 'right' })
  doc.text(`Davr: ${getPeriodLabel(period)}`, pageWidth - 14, 19, { align: 'right' })

  // 2. KPI Xulosa Qutilari (Summary Cards)
  let currentY = 36

  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('ASOSIY MOLIAVIY KO\'RSATKICHLAR (KPI)', 14, currentY)
  currentY += 4

  const kpis = [
    { title: 'BERILGAN NASIYA', val: formatCurrency(summary.totalIssued), sub: `${summary.totalDebtsCount} ta qarz` },
    { title: 'UNDIRILGAN', val: formatCurrency(summary.totalReturned), sub: `${summary.repaymentRate}% yig'ildi` },
    { title: 'QOLDIQ QARZ', val: formatCurrency(summary.totalRemaining), sub: `${summary.activeDebtorsCount} ta qarzdorda` },
    { title: 'MUDDATI O\'TGAN', val: `${summary.overdueCount} ta mijoz`, sub: formatCurrency(summary.overdueAmount) },
  ]

  const cardWidth = (pageWidth - 28 - 9) / 4
  const cardHeight = 18

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 3)
    doc.setFillColor(248, 250, 252) // slate-50
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD')

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text(kpi.title, x + 3, currentY + 5)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(kpi.val, x + 3, currentY + 11)

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(kpi.sub, x + 3, currentY + 15)
  })

  currentY += cardHeight + 8

  // 3. Top 5 Qarzdorlar Jadvali
  if (topDebtors.length > 0) {
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('ENG KO\'P QARZDORLAR (TOP 5)', 14, currentY)
    currentY += 2

    const topTableData = topDebtors.map((td, i) => [
      (i + 1).toString(),
      td.name,
      td.phone || 'Telefon yo\'q',
      formatCurrency(td.amount),
      `${td.debtCount || 1} ta`,
      td.isOverdue ? 'Kechikkan' : 'Kutilmoqda'
    ])

    autoTable(doc, {
      startY: currentY,
      head: [['№', 'Mijoz ismi', 'Telefon raqami', 'Qoldiq qarz', 'Qarzlar soni', 'Holati']],
      body: topTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235], // blue-600
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        3: { fontStyle: 'bold', textColor: [37, 99, 235] },
        5: { fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // 4. Barcha qarzlar batafsil jadvali
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('BATAFSIL QARZLAR RO\'YXATI', 14, currentY)
  currentY += 2

  const debtsTableData = debts.map((d, i) => [
    (i + 1).toString(),
    d.debtor_name,
    d.debtor_phone || '-',
    d.debt_date,
    d.due_date,
    formatCurrency(d.amount),
    formatCurrency(d.paid_amount),
    formatCurrency(d.remaining_amount),
    d.status_label || (d.status === 'paid' ? 'To\'langan' : d.status === 'overdue' ? 'Kechikkan' : 'Kutilmoqda')
  ])

  autoTable(doc, {
    startY: currentY,
    head: [['№', 'Mijoz ismi', 'Telefon', 'Sana', 'Muddat', 'Summa', 'To\'langan', 'Qoldiq', 'Holati']],
    body: debtsTableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: 255,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { fontStyle: 'bold' },
      7: { fontStyle: 'bold', textColor: [180, 83, 9] }, // amber-700
      8: { fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14, bottom: 15 },
    didDrawPage: (data) => {
      // Footer page numbering on every page
      const pageStr = `Sahifa ${data.pageNumber} / ${doc.internal.pages.length - 1}`
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text(pageStr, pageWidth - 14, pageHeight - 6, { align: 'right' })
      doc.text('Qarz Daftari - www.qarzdaftari.uz', 14, pageHeight - 6)
    }
  })

  // Faylni yuklab olish
  doc.save(`${cleanStoreName}_Hisobot_${dateStr}.pdf`)
}
