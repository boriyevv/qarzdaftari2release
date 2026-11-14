// src/lib/export/debtor-statement.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '@/lib/utils/currency'
import { saveAndShareFile } from './export-helper'

export interface StatementDebt {
  id: string
  amount: number
  paid_amount: number
  status: string
  due_date: string | null
  created_at: string
  note: string | null
}

export interface DebtorStatementOptions {
  storeName?: string
  debtorName: string
  debtorPhone: string
  totalAmount: number
  totalPaid: number
  totalRemaining: number
  debts: StatementDebt[]
}

/**
 * 📋 Telegram / WhatsApp / SMS uchun matnli xulosa
 */
export function generateDebtorTelegramText(options: DebtorStatementOptions): string {
  const { storeName = "Qarz Daftari", debtorName, debtorPhone, totalAmount, totalPaid, totalRemaining, debts } = options
  const dateStr = new Date().toLocaleDateString('uz-UZ')

  const openDebtsCount = debts.filter(d => (d.amount - d.paid_amount) > 0).length

  return `🧾 HISOB-KITOB VARAQASI (AKT SVERKA)
🏪 Do'kon: ${storeName}
👤 Hurmatli ${debtorName} (${debtorPhone})
📅 Holat sanasi: ${dateStr}

📊 Moliyaviy ko'rsatkichlar:
• Jami olingan nasiya: ${formatCurrency(totalAmount)}
• To'langan summa: ${formatCurrency(totalPaid)}
• ❗ Qoldiq qarz: ${formatCurrency(totalRemaining)}
• Faol ochiq qarzlar: ${openDebtsCount} ta

Iltimos, o'z vaqtida hisob-kitob qilishingizni so'raymiz.
Rahmat!`
}

/**
 * 📄 Rasmiy PDF Akt-sverka hujjati (A4 formatda imzo/muhr bloki bilan)
 */
export async function exportDebtorStatementPDF(options: DebtorStatementOptions): Promise<void> {
  const { storeName = "Qarz Daftari", debtorName, debtorPhone, totalAmount, totalPaid, totalRemaining, debts } = options
  const dateStr = new Date().toLocaleDateString('uz-UZ')
  const cleanName = debtorName.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 1. Header Banner
  doc.setFillColor(30, 58, 138) // #1e3a8a (Deep Navy Blue)
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('HISOB-KITOB VARAQASI (AKT SVERKA)', 14, 12)

  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Do'kon / Tashkilot: ${storeName}`, 14, 19)

  doc.setFontSize(8.5)
  doc.text(`Sana: ${dateStr}`, pageWidth - 14, 12, { align: 'right' })
  doc.text(`Mijoz: ${debtorName}`, pageWidth - 14, 19, { align: 'right' })

  // 2. Mijoz Ma'lumotlari Bloki
  let currentY = 36

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'FD')

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(51, 65, 85)
  doc.text(`Mijoz: ${debtorName}`, 18, currentY + 6)
  doc.text(`Telefon: ${debtorPhone}`, 18, currentY + 12)

  doc.setFont('helvetica', 'normal')
  doc.text(`Hisobot sanasi: ${dateStr}`, pageWidth - 18, currentY + 6, { align: 'right' })
  doc.text(`Qarz yozuvlari soni: ${debts.length} ta`, pageWidth - 18, currentY + 12, { align: 'right' })

  currentY += 22

  // 3. Jamlama Moliyaviy Ko'rsatkichlar (KPIs)
  const cardWidth = (pageWidth - 28 - 6) / 3
  const cardHeight = 16

  const stats = [
    { label: 'JAMI BERILGAN NASIYA', val: formatCurrency(totalAmount), color: [37, 99, 235] },
    { label: 'TO\'LANGAN SUMMA', val: formatCurrency(totalPaid), color: [16, 185, 129] },
    { label: 'JORIY QOLDIQ QARZ', val: formatCurrency(totalRemaining), color: totalRemaining > 0 ? [225, 29, 72] : [16, 185, 129] },
  ]

  stats.forEach((st, idx) => {
    const x = 14 + idx * (cardWidth + 3)
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD')

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text(st.label, x + 3, currentY + 5)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(st.color[0], st.color[1], st.color[2])
    doc.text(st.val, x + 3, currentY + 12)
  })

  currentY += cardHeight + 8

  // 4. Barcha operatsiyalar jadvali
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('OPERATSIYALAR VA QARZLAR TARIXI', 14, currentY)
  currentY += 2

  const debtsTableData = debts.map((d, idx) => {
    const createdStr = d.created_at ? d.created_at.split('T')[0] : '-'
    const dueStr = d.due_date ? d.due_date.split('T')[0] : 'Belgilanmagan'
    const remaining = Math.max(0, d.amount - d.paid_amount)
    const isPaid = d.status === 'paid' || (d.amount > 0 && d.paid_amount >= d.amount)

    return [
      (idx + 1).toString(),
      createdStr,
      dueStr,
      formatCurrency(d.amount),
      formatCurrency(d.paid_amount),
      formatCurrency(remaining),
      isPaid ? 'To\'langan' : 'Kutilmoqda',
      d.note || '-'
    ]
  })

  autoTable(doc, {
    startY: currentY,
    head: [['№', 'Berilgan sana', 'Muddat', 'Nasiya summasi', 'To\'langan', 'Qoldiq', 'Holati', 'Izoh']],
    body: debtsTableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      5: { fontStyle: 'bold', textColor: [180, 83, 9] }, // amber-700
      6: { fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14, bottom: 35 },
  })

  // 5. Imzo va Muhr Bloki (Signature Block)
  const finalY = Math.min((doc as any).lastAutoTable.finalY + 12, pageHeight - 30)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Yuqoridagi hisob-kitoblar to\'g\'riligini tasdiqlaymiz:', 14, finalY)

  doc.setFont('helvetica', 'bold')
  doc.text(`Do'kon vakili: _______________________ (imzo)`, 14, finalY + 10)
  doc.text(`Mijoz: _______________________ (imzo)`, pageWidth - 14, finalY + 10, { align: 'right' })

  // Footer
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Qarz Daftari avtomatlashtirilgan tizimi orqali shakllantirildi - www.qarzdaftari.uz', 14, pageHeight - 6)

  // Faylni yuklab olish / yuborish
  const pdfBlob = doc.output('blob')
  await saveAndShareFile({
    filename: `${cleanName}_Akt_Sverka_${dateStr.replace(/\./g, '_')}.pdf`,
    blob: pdfBlob,
    mimeType: 'application/pdf',
    title: `${debtorName} - Akt-sverka (PDF)`,
  })
}
