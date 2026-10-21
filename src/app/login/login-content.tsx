// src/app/login/login-content.tsx
'use client'

import { OTPInput } from '@/components/auth/otp-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function LoginPageContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [otpSent, setOtpSent] = useState(false)
	const [displayCode, setDisplayCode] = useState<string | null>(null)

	// Staggered bottom-up animation to fill OTP digit by digit like mobile apps
	const animateFillOTP = (code: string) => {
		setPhoneForm(prev => ({ ...prev, otp: '' }))
		const chars = code.split('')
		chars.forEach((_, i) => {
			setTimeout(
				() => {
					setPhoneForm(prev => ({
						...prev,
						otp: code.slice(0, i + 1),
					}))
				},
				(i + 1) * 85,
			)
		})
	}

	// Email login form
	const [emailForm, setEmailForm] = useState({
		email: '',
		password: '',
	})

	// Phone login form
	const [phoneForm, setPhoneForm] = useState({
		phone: '',
		otp: '',
	})

	// Check for reset password success message
	useState(() => {
		const message = searchParams.get('message')
		if (message === 'password_updated') {
			setSuccess('Parol muvaffaqiyatli yangilandi! Login qiling.')
		}
	})

	const handleEmailLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		const supabase = createClient()

		const { error } = await supabase.auth.signInWithPassword({
			email: emailForm.email,
			password: emailForm.password,
		})

		if (error) {
			setError("Email yoki parol noto'g'ri")
			setLoading(false)
			return
		}

		window.location.href = '/dashboard'
	}

	const handlePhoneChange = (value: string) => {
		let cleaned = value.replace(/\D/g, '')
		if (!cleaned.startsWith('998') && cleaned.length > 0) {
			cleaned = '998' + cleaned
		}
		const formatted = cleaned.length > 0 ? '+' + cleaned : ''
		setPhoneForm({ ...phoneForm, phone: formatted.slice(0, 13) })
	}

	const handleSendOTP = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')
		setSuccess('')
		setDisplayCode(null)

		try {
			const response = await fetch('/api/auth/send-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone: phoneForm.phone,
					type: 'login',
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				setError(data.error || 'OTP yuborishda xato')
				return
			}

			setOtpSent(true)
			setSuccess('SMS kod tayyorlandi!')

			if (data.code) {
				setDisplayCode(data.code)
				animateFillOTP(data.code)
				console.log(
					'%c🔑 [QARZ DAFTARI] SMS KODINGIZ: ' + data.code,
					'background: #2563eb; color: #ffffff; font-size: 16px; font-weight: bold; padding: 6px 12px; border-radius: 6px;',
				)
			}
		} catch (error) {
			setError('Tarmoq xatosi')
		} finally {
			setLoading(false)
		}
	}

	const handlePhoneLogin = async () => {
		if (phoneForm.otp.length !== 6) {
			setError('6 ta raqam kiriting')
			return
		}

		setLoading(true)
		setError('')
		setSuccess('')

		try {
			// Verify OTP
			const verifyResponse = await fetch('/api/auth/verify-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone: phoneForm.phone,
					code: phoneForm.otp,
					type: 'login',
				}),
			})

			const verifyData = await verifyResponse.json()

			if (!verifyResponse.ok) {
				setError(verifyData.error || "Kod noto'g'ri")
				return
			}

			// Login
			const loginResponse = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					auth_method: 'phone',
					phone: phoneForm.phone,
					otp_verified: true,
				}),
			})

			const loginData = await loginResponse.json()

			if (!loginResponse.ok) {
				setError(loginData.error || 'Login xatosi')
				return
			}

			setSuccess("Muvaffaqiyatli! Yo'naltirilmoqda...")

			setTimeout(() => {
				window.location.href = '/dashboard'
			}, 300)
		} catch (error) {
			setError('Tarmoq xatosi')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='min-h-screen flex justify-center items-start pt-12 sm:pt-[15vh] lg:pt-[18vh] pb-12 bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
			<Card className='w-full max-w-md transition-all duration-300 ease-in-out shadow-xl border-slate-200'>
				<CardHeader className='space-y-1'>
					<CardTitle className='text-2xl font-bold text-center'>
						Qarz Daftari
					</CardTitle>
					<CardDescription className='text-center'>
						Hisobingizga kirish
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue='email' className='w-full'>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='email'>Email</TabsTrigger>
							<TabsTrigger value='phone'>Telefon ⚡</TabsTrigger>
						</TabsList>

						{/* Alerts */}
						{error && (
							<Alert variant='destructive' className='mt-4'>
								<AlertDescription className='space-y-2'>
									<div>{error}</div>
									{(error.includes("ro'yxatdan o'ting") ||
										error.includes('topilmadi')) && (
										<div className='pt-1'>
											<Link href='/register'>
												<Button
													type='button'
													variant='outline'
													size='sm'
													className='w-full text-xs bg-white text-slate-800 border-red-300 hover:bg-slate-50'
												>
													Yangi hisob yaratish (Ro&apos;yxatdan o&apos;tish) →
												</Button>
											</Link>
										</div>
									)}
								</AlertDescription>
							</Alert>
						)}
						{success && (
							<Alert className='mt-4 bg-green-50 text-green-900 border-green-200'>
								<AlertDescription>{success}</AlertDescription>
							</Alert>
						)}

						{/* Email Login Tab */}
						<TabsContent value='email' className='mt-4'>
							<form onSubmit={handleEmailLogin} className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='email'>Email</Label>
									<Input
										id='email'
										type='email'
										placeholder='email@example.com'
										required
										value={emailForm.email}
										onChange={e =>
											setEmailForm({ ...emailForm, email: e.target.value })
										}
										disabled={loading}
									/>
								</div>

								<div className='space-y-2'>
									<div className='flex items-center justify-between'>
										<Label htmlFor='password'>Parol</Label>
										<Link
											href='/forgot-password'
											className='text-sm text-blue-600 hover:underline'
										>
											Parolni unutdingizmi?
										</Link>
									</div>
									<Input
										id='password'
										type='password'
										placeholder='••••••••'
										required
										value={emailForm.password}
										onChange={e =>
											setEmailForm({ ...emailForm, password: e.target.value })
										}
										disabled={loading}
									/>
								</div>

								<Button type='submit' className='w-full' disabled={loading}>
									{loading ? 'Kirish...' : 'Kirish'}
								</Button>
							</form>
						</TabsContent>

						{/* Phone Login Tab */}
						<TabsContent value='phone' className='mt-4'>
							{!otpSent ? (
								<form onSubmit={handleSendOTP} className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='phone'>Telefon raqam</Label>
										<Input
											id='phone'
											type='tel'
											placeholder='+998901234567'
											required
											value={phoneForm.phone}
											onChange={e => handlePhoneChange(e.target.value)}
											disabled={loading}
										/>
									</div>

									<Button type='submit' className='w-full' disabled={loading}>
										{loading ? 'Yuborilmoqda...' : 'SMS Kod Yuborish'}
									</Button>
								</form>
							) : (
								<div className='space-y-4'>
									{displayCode && (
										<div className='p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm space-y-1.5 shadow-sm'>
											<div className='flex items-center justify-between'>
												<span className='font-semibold text-blue-800 flex items-center gap-1.5 text-xs sm:text-sm'>
													ℹ️ Sinov kodi (Eskiz to&apos;lovisiz):
												</span>
												<span className='font-mono text-base font-semibold bg-white text-blue-900 px-2.5 py-0.5 rounded border border-blue-200 tracking-wider shadow-2xs'>
													{displayCode}
												</span>
											</div>
											<p className='text-xs text-blue-700'>
												Eskiz.uz SMS to&apos;lovisiz sinash uchun kod ekranga
												chiqarildi va avtomatik kiritildi.
											</p>
										</div>
									)}

									<div className='space-y-3'>
										<Label className='text-center block text-sm font-medium'>
											Tasdiqlash kodi
										</Label>
										<OTPInput
											value={phoneForm.otp}
											onChange={otp => setPhoneForm({ ...phoneForm, otp })}
											disabled={loading}
										/>
										<p className='text-xs text-center text-slate-500'>
											{phoneForm.phone} raqamiga yuborilgan 6 raqamli kodni
											kiriting
										</p>
									</div>

									<div className='flex gap-2'>
										<Button
											type='button'
											variant='outline'
											className='flex-1'
											onClick={() => {
												setOtpSent(false)
												setDisplayCode(null)
												setPhoneForm({ ...phoneForm, otp: '' })
											}}
											disabled={loading}
										>
											Orqaga
										</Button>
										<Button
											type='button'
											className='flex-1'
											onClick={handlePhoneLogin}
											disabled={loading || phoneForm.otp.length !== 6}
										>
											{loading ? 'Tekshirilmoqda...' : 'Kirish'}
										</Button>
									</div>
								</div>
							)}
						</TabsContent>
					</Tabs>

					<div className='mt-6 text-center text-sm'>
						<span className='text-slate-600'>Hisobingiz yo&apos;qmi? </span>
						<Link
							href='/register'
							className='text-blue-600 hover:underline font-medium'
						>
							Ro&apos;yxatdan o&apos;ting
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
