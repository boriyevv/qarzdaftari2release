// src/app/login/login-content.tsx
'use client'

import { OTPInput } from '@/components/auth/otp-input'
import { ThemeToggle } from '@/components/theme/theme-toggle'
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

	// Cashier login form
	const [cashierForm, setCashierForm] = useState({
		identifier: '',
		password: '',
	})

	const handleCashierLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')
		setSuccess('')

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					auth_method: 'cashier',
					identifier: cashierForm.identifier,
					password: cashierForm.password,
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				setError(data.error || 'Kassir kirishida xatolik')
				return
			}

			if (data.user?.id && typeof window !== 'undefined') {
				localStorage.setItem('phone_user_session', data.user.id)
			}

			setSuccess("Muvaffaqiyatli! Kassa oynasiga yo'naltirilmoqda...")
			setTimeout(() => {
				window.location.href = '/dashboard'
			}, 300)
		} catch (err) {
			setError('Tarmoq xatosi')
		} finally {
			setLoading(false)
		}
	}

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

			if (loginData.user?.id && typeof window !== 'undefined') {
				localStorage.setItem('phone_user_session', loginData.user.id)
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
		<div className='min-h-screen flex justify-center items-start pt-12 sm:pt-[15vh] lg:pt-[18vh] pb-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-4 relative'>
			{/* Top Right Theme Toggle */}
			<div className="absolute top-4 right-4 z-20">
				<ThemeToggle />
			</div>

			<Card className='w-full max-w-md transition-all duration-300 ease-in-out shadow-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'>
				<CardHeader className='space-y-1'>
					<CardTitle className='text-2xl font-bold text-center text-slate-900 dark:text-slate-100'>
						Qarz Daftari
					</CardTitle>
					<CardDescription className='text-center text-slate-500 dark:text-slate-400'>
						Hisobingizga kirish
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue='email' className='w-full'>
						<TabsList className='grid w-full grid-cols-3 bg-slate-100/90 dark:bg-slate-800/80'>
							<TabsTrigger value='email'>Email</TabsTrigger>
							<TabsTrigger value='phone'>Telefon ⚡</TabsTrigger>
							<TabsTrigger value='cashier'>Kassir 👥</TabsTrigger>
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
													className='w-full text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-rose-300 dark:border-rose-900/60 hover:bg-slate-50 dark:hover:bg-slate-700'
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
							<Alert className='mt-4 bg-green-50 dark:bg-emerald-950/40 text-green-900 dark:text-emerald-300 border-green-200 dark:border-emerald-800'>
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
										<div className='p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg text-blue-900 dark:text-blue-200 text-sm space-y-1.5 shadow-2xs'>
											<div className='flex items-center justify-between'>
												<span className='font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 text-xs sm:text-sm'>
													ℹ️ Sinov kodi (Eskiz to&apos;lovisiz):
												</span>
												<span className='font-mono text-base font-semibold bg-white dark:bg-slate-850 text-blue-900 dark:text-blue-300 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 tracking-wider shadow-2xs'>
													{displayCode}
												</span>
											</div>
											<p className='text-xs text-blue-700 dark:text-blue-300/90'>
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

						{/* Cashier Login Tab */}
						<TabsContent value='cashier' className='mt-4'>
							<form onSubmit={handleCashierLogin} className='space-y-4'>
								<div className='p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/50 text-xs text-purple-800 dark:text-purple-300'>
									Do&apos;kon egasi tomonidan berilgan telefon raqami yoki login hamda parolni kiriting.
								</div>

								<div className='space-y-2'>
									<Label htmlFor='cashier-identifier'>Telefon yoki Login</Label>
									<Input
										id='cashier-identifier'
										placeholder='+998901234567 yoki ali_kassir'
										required
										value={cashierForm.identifier}
										onChange={e =>
											setCashierForm({ ...cashierForm, identifier: e.target.value })
										}
										disabled={loading}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='cashier-password'>Kassir Paroli</Label>
									<Input
										id='cashier-password'
										type='password'
										placeholder='Parolingizni kiriting'
										required
										value={cashierForm.password}
										onChange={e =>
											setCashierForm({ ...cashierForm, password: e.target.value })
										}
										disabled={loading}
									/>
								</div>

								<Button
									type='submit'
									className='w-full bg-purple-600 hover:bg-purple-700 text-white'
									disabled={loading || !cashierForm.identifier || !cashierForm.password}
								>
									{loading ? 'Tekshirilmoqda...' : 'Kassir sifatida kirish'}
								</Button>
							</form>
						</TabsContent>
					</Tabs>

					<div className='mt-6 text-center text-sm'>
						<span className='text-slate-600 dark:text-slate-400'>Hisobingiz yo&apos;qmi? </span>
						<Link
							href='/register'
							className='text-blue-600 dark:text-blue-400 hover:underline font-semibold'
						>
							Ro&apos;yxatdan o&apos;ting
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
