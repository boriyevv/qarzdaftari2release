// src/app/api/auth/me/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { uzumPayment } from '@/lib/payments/uzum'
import { parsePaymentOrder, processSuccessfulPayment } from '@/lib/payments/common'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    console.log('🔍 /api/auth/me called')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Helper to auto-sync pending Uzum transactions in real time
    const syncPendingUzum = async (prof: any) => {
      if (!prof?.id || !uzumPayment.isConfigured()) return prof
      try {
        const { data: pendingUzumTx } = await adminSupabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', prof.id)
          .eq('provider', 'uzum')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (pendingUzumTx) {
          const orderId = pendingUzumTx.external_id || pendingUzumTx.external_data?.orderId
          if (orderId) {
            try {
              const uzumStatus = await uzumPayment.getOrderStatus(orderId)
              if (uzumStatus && (uzumStatus.status === 'COMPLETED' || uzumStatus.status === 'TOP_UP_COMPLETED')) {
                const parsedOrder = pendingUzumTx.external_data?.order || parsePaymentOrder(pendingUzumTx.external_data?.rawTransactionId)
                if (parsedOrder) {
                  await processSuccessfulPayment(adminSupabase, {
                    provider: 'uzum',
                    order: parsedOrder,
                    amount: pendingUzumTx.amount,
                    externalId: orderId,
                    externalData: uzumStatus,
                    transactionRecordId: pendingUzumTx.id,
                  })
                  const { data: updatedProf } = await adminSupabase
                    .from('users')
                    .select('*, sms_credits:sms_credits(*)')
                    .eq('id', prof.id)
                    .maybeSingle()
                  if (updatedProf) return updatedProf
                }
              } else if (uzumStatus && ['DECLINED', 'REVERSED'].includes(uzumStatus.status)) {
                await adminSupabase
                  .from('payment_transactions')
                  .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                  .eq('id', pendingUzumTx.id)
              }
            } catch (uzumErr: any) {
              const errMsg = uzumErr?.message || String(uzumErr)
              if (errMsg.includes('3005') || errMsg.includes('not found') || errMsg.includes('rejected')) {
                console.warn(`⚠️ Uzum order ${orderId} not found or rejected. Marking transaction as cancelled.`)
                await adminSupabase
                  .from('payment_transactions')
                  .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                  .eq('id', pendingUzumTx.id)
              } else {
                console.warn('⚠️ Uzum getOrderStatus warning:', errMsg)
              }
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Uzum auto-sync in /api/auth/me error:', err)
      }
      return prof
    }

    // 1. If not authenticated via Supabase Auth, check phone_user_session cookie or x-phone-session header
    if (authError || !user) {
      const cookieStore = await cookies()
      const { headers } = await import('next/headers')
      const headerStore = await headers()
      const phoneUserId = cookieStore.get('phone_user_session')?.value || headerStore.get('x-phone-session')

      if (phoneUserId) {
        const { data: phoneProfile } = await adminSupabase
          .from('users')
          .select(`
            *,
            sms_credits:sms_credits(*)
          `)
          .eq('id', phoneUserId)
          .maybeSingle()

        if (phoneProfile) {
          if (phoneProfile.is_active === false) {
            return NextResponse.json({ error: 'Akkaunt faolsizlantirilgan' }, { status: 403 })
          }
          console.log('✅ Phone profile found via session cookie:', phoneProfile.full_name)
          const syncedProfile = await syncPendingUzum(phoneProfile)
          const role = syncedProfile.locale_settings?.role || (syncedProfile.is_admin ? 'admin' : 'owner')
          const store_owner_id = syncedProfile.locale_settings?.store_owner_id || syncedProfile.id
          const permissions = syncedProfile.locale_settings?.permissions || ['*']
          const response = NextResponse.json({
            profile: {
              ...syncedProfile,
              role,
              store_owner_id,
              permissions,
            }
          })

          // Slide phone session cookie so active users never get unexpectedly logged out
          response.cookies.set('phone_user_session', phoneUserId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 kun
          })

          return response
        }
      }

      console.log('❌ No auth user or phone session')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Look up profile by auth_id
    const { data: profile } = await adminSupabase
      .from('users')
      .select(`
        *,
        sms_credits:sms_credits(*)
      `)
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profile) {
      if (profile.is_active === false) {
        return NextResponse.json({ error: 'Akkaunt faolsizlantirilgan' }, { status: 403 })
      }
      console.log('✅ Profile found by auth_id:', profile.full_name)
      const syncedProfile = await syncPendingUzum(profile)
      const role = syncedProfile.locale_settings?.role || (syncedProfile.is_admin ? 'admin' : 'owner')
      const store_owner_id = syncedProfile.locale_settings?.store_owner_id || syncedProfile.id
      const permissions = syncedProfile.locale_settings?.permissions || ['*']
      return NextResponse.json({
        profile: {
          ...syncedProfile,
          role,
          store_owner_id,
          permissions,
        }
      })
    }

    console.log('⚠️ Profile not found by auth_id, trying phone...')

    if (user.phone) {
      const { data: phoneProfile } = await adminSupabase
        .from('users')
        .select(`
          *,
          sms_credits:sms_credits(*)
        `)
        .eq('phone', user.phone)
        .is('auth_id', null)
        .maybeSingle()

      if (phoneProfile) {
        if (phoneProfile.is_active === false) {
          return NextResponse.json({ error: 'Akkaunt faolsizlantirilgan' }, { status: 403 })
        }
        console.log('✅ Phone profile found:', phoneProfile.full_name)
        const syncedProfile = await syncPendingUzum(phoneProfile)
        const role = syncedProfile.locale_settings?.role || (syncedProfile.is_admin ? 'admin' : 'owner')
        const store_owner_id = syncedProfile.locale_settings?.store_owner_id || syncedProfile.id
        const permissions = syncedProfile.locale_settings?.permissions || ['*']
        return NextResponse.json({
          profile: {
            ...syncedProfile,
            role,
            store_owner_id,
            permissions,
          }
        })
      }
    }

    console.error('❌ Profile not found in database for user:', user.id)
    return NextResponse.json(
      { error: 'Profile not found. Please contact support.' },
      { status: 404 }
    )
  } catch (error) {
    console.error('❌ Me API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
