// src/lib/services/reviewer-demo.service.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { REVIEWER_DEMO_PHONE } from './otp.service'

/**
 * Ensure Apple App Store and Google Play review team demo account exists with realistic sample data
 */
export async function ensureReviewerDemoAccount() {
  const adminSupabase = createAdminClient()

  // 1. Check if reviewer already exists
  const { data: existingUser } = await adminSupabase
    .from('users')
    .select('*')
    .eq('phone', REVIEWER_DEMO_PHONE)
    .maybeSingle()

  if (existingUser) {
    if (existingUser.is_active === false) {
      await adminSupabase
        .from('users')
        .update({ is_active: true, deletion_requested_at: null })
        .eq('id', existingUser.id)
      existingUser.is_active = true
    }
    return existingUser
  }

  // 2. Create reviewer profile
  const { data: newUser, error: createError } = await adminSupabase
    .from('users')
    .insert({
      full_name: 'Apple / Google Reviewer',
      phone: REVIEWER_DEMO_PHONE,
      username: 'demo_store',
      store_name: "Demo Savdo Do'koni",
      plan_type: 'PRO',
      is_active: true,
      phone_verified: true,
      sms_enabled: true,
    })
    .select()
    .single()

  if (createError || !newUser) {
    console.error('❌ Error creating reviewer demo user:', createError)
    return null
  }

  // 3. Seed demo debts so reviewer has realistic data to test immediately
  try {
    const today = new Date()
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const past3Days = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    await adminSupabase.from('debts').insert([
      {
        user_id: newUser.id,
        debtor_name: 'Alisher Usmonov',
        debtor_phone: '+998901112233',
        amount: 1500000,
        paid_amount: 500000,
        debt_date: todayStr,
        due_date: in7Days,
        status: 'pending',
        note: "Oziq-ovqat mahsulotlari (Un, yog', go'sht)",
        order_index: 0,
      },
      {
        user_id: newUser.id,
        debtor_name: 'Bobur Mirzo',
        debtor_phone: '+998912223344',
        amount: 450000,
        paid_amount: 0,
        debt_date: past3Days,
        due_date: past3Days,
        status: 'overdue',
        note: "Xo'jalik mollari",
        order_index: 1,
      },
      {
        user_id: newUser.id,
        debtor_name: 'Sardor Rahimov',
        debtor_phone: '+998933334455',
        amount: 800000,
        paid_amount: 800000,
        debt_date: past3Days,
        due_date: todayStr,
        status: 'paid',
        note: "To'liq to'langan (Karta orqali)",
        order_index: 2,
      },
    ])
    console.log('✅ Demo reviewer sample debts seeded successfully')
  } catch (seedErr) {
    console.warn('⚠️ Seeding demo debts warning:', seedErr)
  }

  return newUser
}
