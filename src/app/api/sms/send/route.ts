// src/app/api/sms/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { smsService, getUserSmsCredits, deductUserSmsCredits } from '@/lib/services/sms.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { 
      debt_id, 
      recipient_phone, 
      message,
      type = 'custom' // custom, debt_created, payment_reminder, payment_confirmation
    } = body

    if (!recipient_phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message required' },
        { status: 400 }
      )
    }

    // Check if SMS service is configured
    if (!smsService.isConfigured()) {
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 503 }
      )
    }

    // Validate phone format
    const cleanPhone = recipient_phone.replace(/[\s-]/g, '')
    if (!cleanPhone.match(/^\+?998\d{9}$/)) {
      return NextResponse.json(
        { error: 'Invalid phone format. Use: +998901234567' },
        { status: 400 }
      )
    }

    // Check internal SMS credits
    const { balance: remainingCredits } = await getUserSmsCredits(supabase, profile.id)

    if (remainingCredits < 1) {
      return NextResponse.json(
        { 
          error: 'SMS kredit yetarli emas', 
          remaining: remainingCredits,
          need_to_buy: true,
        },
        { status: 400 }
      )
    }

    // Check Eskiz balance
    try {
      const eskizBalance = await smsService.getBalance()
      console.log('💰 Eskiz balance:', eskizBalance)
      
      if (eskizBalance < 1) {
        return NextResponse.json(
          { 
            error: 'Eskiz hisobida mablag\' yetarli emas. Hisobni to\'ldiring.',
            provider_balance: eskizBalance,
          },
          { status: 503 }
        )
      }
    } catch (error) {
      console.warn('⚠️ Could not check Eskiz balance:', error)
      // Continue anyway - SMS might still work
    }

    // Send SMS
    let externalId: string | null = null
    let smsSuccess = false

    try {
      console.log('📱 Sending SMS via smsService...')
      
      externalId = await smsService.sendSMS(cleanPhone, message)
      smsSuccess = true

    } catch (error: any) {
      console.error('❌ SMS Provider Error:', error)
      
      return NextResponse.json(
        { 
          error: 'SMS yuborishda xato', 
          details: error.message,
          provider_error: true,
        },
        { status: 500 }
      )
    }

    // Deduct internal credit
    await deductUserSmsCredits(supabase, profile.id, 1)

    // Log SMS usage
    const { error: logError } = await supabase
      .from('sms_usage_log')
      .insert({
        user_id: profile.id,
        debt_id: debt_id || null,
        recipient_phone: cleanPhone,
        message,
        credits_used: 1,
        status: 'sent',
        external_id: externalId,
      })

    if (logError) {
      console.error('❌ Failed to log SMS usage:', logError)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'sms_sent',
      entity_type: 'sms',
      entity_id: debt_id,
      metadata: {
        recipient: cleanPhone,
        message_length: message.length,
        type: type,
        external_id: externalId,
      },
    })

    console.log('✅ SMS sent and logged successfully')

    return NextResponse.json({
      success: true,
      message: 'SMS muvaffaqiyatli yuborildi',
      remaining_credits: remainingCredits - 1,
      external_id: externalId,
    })
  } catch (error: any) {
    console.error('❌ SMS Send API error:', error)
    return NextResponse.json(
      { 
        error: 'Server xatosi', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// GET endpoint - Check SMS service status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get SMS service status
    const serviceStatus = smsService.getStatus()

    // Get Eskiz balance
    let eskizBalance = 0
    try {
      eskizBalance = await smsService.getBalance()
    } catch (error) {
      console.error('Balance check failed:', error)
    }

    // Get user's internal credits
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    let internalCredits = 0
    if (profile) {
      const { balance } = await getUserSmsCredits(supabase, profile.id)
      internalCredits = balance
    }

    return NextResponse.json({
      service: serviceStatus,
      internal_credits: internalCredits,
      eskiz_balance: eskizBalance,
      can_send: serviceStatus.configured && internalCredits > 0 && eskizBalance > 0,
    })
  } catch (error: any) {
    console.error('❌ Status check error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    )
  }
}