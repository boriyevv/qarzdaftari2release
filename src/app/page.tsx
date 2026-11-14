// src/app/page.tsx
// Ultra-modern SaaS Landing Page for Qarz Daftari (debtbook.uz)
'use client'

import Image from 'next/image'
import { PaymentMethodsRow } from '@/components/payments/payment-logos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	AlertCircle,
	ArrowRight,
	BarChart3,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	CreditCard,
	FileText,
	FolderOpen,
	Lock,
	Mail,
	Menu,
	MessageSquare,
	Phone,
	ShieldCheck,
	Sparkles,
	TrendingUp,
	X,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/contexts/user-context'
import { isNativePlatform } from '@/lib/native'

export default function Home() {
	const { user, loading: userLoading } = useUser()
	const router = useRouter()

	// If already authenticated or opened inside installed mobile app / PWA, go straight to dashboard
	useEffect(() => {
		if (typeof window === 'undefined') return

		const hasPhoneSession = Boolean(localStorage.getItem('phone_user_session'))
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone === true ||
			document.referrer.includes('android-app://')

		// 1. If logged in, jump straight to dashboard
		if (user || hasPhoneSession) {
			router.replace('/dashboard')
			return
		}

		// 2. If opened from installed mobile app or PWA and not logged in, go to login
		if (!userLoading && (isNativePlatform() || isStandalone)) {
			router.replace('/login')
		}
	}, [user, userLoading, router])

	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
		'monthly',
	)
	const [openFaq, setOpenFaq] = useState<number | null>(0)
	const [smsSent, setSmsSent] = useState(false)

	// Prevent landing page flicker if user already has an active session
	const hasActiveSession =
		Boolean(user) ||
		(typeof window !== 'undefined' && Boolean(localStorage.getItem('phone_user_session')))

	if (hasActiveSession) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
				<div className="text-center space-y-3">
					<div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="text-xs text-slate-400 font-medium">Boshqaruv paneli yuklanmoqda...</p>
				</div>
			</div>
		)
	}

	const handleTestSms = () => {
		setSmsSent(true)
		setTimeout(() => setSmsSent(false), 3000)
	}

	const faqs = [
		{
			q: 'Qarz Daftari platformasidan foydalanish bepulmi?',
			a: "Ha! Barcha yangi foydalanuvchilar uchun 30 kunlik to'liq imkoniyatli Free Trial (bepul sinov) taqdim etiladi. Keyinchalik biznesingiz hajmiga qarab bepul tarifda qolishingiz yoki Plus/Pro rejalariga o'tishingiz mumkin.",
		},
		{
			q: 'Qarzdorlarga SMS eslatmalar qanday ishlaydi?',
			a: "Tizimda har bir qarz uchun to'lov muddatini belgilaysiz. Muddat yaqinlashganda yoki o'tib ketganda, bir bosish orqali mijozning telefoniga chiroyli va xushmuomala SMS eslatma jo'natiladi.",
		},
		{
			q: "Ma'lumotlarim xavfsiz saqlanadimi?",
			a: "Albatta. Barcha ma'lumotlar shifrlangan holatda zamonaviy bulutli serverlarda saqlanadi. Ma'lumotlaringiz faqat sizga tegishli bo'lib, xavfsizlik PCI-DSS va eng yuqori sanoat standartlariga to'liq javob beradi.",
		},
		{
			q: "Telefonim yo'qolsa yoki o'zgarsa ma'lumotlarim o'chib ketmaydimi?",
			a: "Yo'q, hech narsa yo'qolmaydi! Qarz Daftari online platforma bo'lganligi sababli, har qanday yangi telefon, planshet yoki kompyuterdan o'z raqamingiz bilan kirib ma'lumotlaringizni darhol ko'rishingiz mumkin.",
		},
		{
			q: "Obuna uchun qanday to'lov usullari mavjud?",
			a: "Biz Uzum Bank, Click, Payme hamda barcha Uzcard va Humo bank kartalarini qabul qilamiz. Barcha to'lovlar 100% rasmiy va darhol faollashadi.",
		},
	]

	return (
		<div className='min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white'>
			{/* Background Decorative Ambient Gradients */}
			<div className='fixed inset-0 pointer-events-none overflow-hidden z-0'>
				<div className='absolute top-[-150px] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl rounded-full' />
				<div className='absolute top-[600px] -left-48 w-96 h-96 bg-purple-600/15 blur-[120px] rounded-full' />
				<div className='absolute top-[1200px] -right-48 w-96 h-96 bg-blue-600/15 blur-[120px] rounded-full' />
				<div className='absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25' />
			</div>

			{/* Floating Modern Header */}
			<header className='sticky top-0 z-50 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 transition-all'>
				<div className='max-w-7xl mx-auto flex items-center justify-between h-14'>
					{/* Brand Mark */}
					<Link href='/' className='flex items-center gap-3 group'>
						<div className='w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300 flex-shrink-0'>
							<Image src='/appleicon.png' alt='Qarz Daftari' width={36} height={36} className='w-full h-auto object-contain rounded-lg' />
						</div>
						<div className='flex flex-col'>
							<span className='font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5'>
								Qarz Daftari
								<span className='inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
							</span>
							<span className='text-[10px] text-slate-400 font-medium tracking-wide'>
								debtbook.uz
							</span>
						</div>
					</Link>

					{/* Desktop Nav */}
					<nav className='hidden lg:flex items-center gap-1 bg-slate-800/60 p-1 rounded-full border border-slate-700/60 backdrop-blur-md'>
						<Link
							href='#features'
							className='px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-full transition-colors hover:bg-slate-700/50'
						>
							Imkoniyatlar
						</Link>
						<Link
							href='#how-it-works'
							className='px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-full transition-colors hover:bg-slate-700/50'
						>
							Qanday ishlaydi
						</Link>
						<Link
							href='#pricing'
							className='px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-full transition-colors hover:bg-slate-700/50'
						>
							Tariflar
						</Link>
						<Link
							href='#faq'
							className='px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-full transition-colors hover:bg-slate-700/50'
						>
							FAQ
						</Link>
						<Link
							href='/payment-terms'
							className='px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-full transition-colors hover:bg-slate-700/50'
						>
							To'lov shartlari
						</Link>
					</nav>

					{/* Action Buttons */}
					<div className='hidden sm:flex items-center gap-3'>
						<Button
							variant='ghost'
							size='sm'
							asChild
							className='text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold'
						>
							<Link href='/login'>Kirish</Link>
						</Button>
						<Button
							size='sm'
							asChild
							className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 shadow-lg shadow-blue-600/30 rounded-xl transition-all hover:scale-105 active:scale-95'
						>
							<Link href='/register' className='flex items-center gap-1.5'>
								<span>Bepul boshlash</span>
								<ArrowRight className='w-3.5 h-3.5' />
							</Link>
						</Button>
					</div>

					{/* Mobile Menu Trigger */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className='lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white'
						aria-label='Toggle menu'
					>
						{mobileMenuOpen ? (
							<X className='w-5 h-5' />
						) : (
							<Menu className='w-5 h-5' />
						)}
					</button>
				</div>

				{/* Mobile Dropdown Menu */}
				{mobileMenuOpen && (
					<div className='lg:hidden mt-2 p-4 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl space-y-3'>
						<Link
							href='#features'
							onClick={() => setMobileMenuOpen(false)}
							className='block text-sm text-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-700'
						>
							Imkoniyatlar
						</Link>
						<Link
							href='#how-it-works'
							onClick={() => setMobileMenuOpen(false)}
							className='block text-sm text-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-700'
						>
							Qanday ishlaydi
						</Link>
						<Link
							href='#pricing'
							onClick={() => setMobileMenuOpen(false)}
							className='block text-sm text-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-700'
						>
							Tariflar
						</Link>
						<Link
							href='#faq'
							onClick={() => setMobileMenuOpen(false)}
							className='block text-sm text-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-700'
						>
							FAQ
						</Link>
						<Link
							href='/payment-terms'
							onClick={() => setMobileMenuOpen(false)}
							className='block text-sm text-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-700'
						>
							To'lov shartlari
						</Link>
						<div className='pt-3 border-t border-slate-700/80 flex flex-col gap-2.5'>
							<Button
								variant='ghost'
								size='default'
								asChild
								className='w-full h-11 text-sm font-semibold text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-all'
							>
								<Link href='/login' onClick={() => setMobileMenuOpen(false)}>
									Kirish
								</Link>
							</Button>
							<Button
								size='default'
								asChild
								className='w-full h-11 text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md shadow-blue-600/25 transition-all'
							>
								<Link
									href='/register'
									onClick={() => setMobileMenuOpen(false)}
									className='flex items-center justify-center gap-1.5'
								>
									<span>Bepul boshlash</span>
									<ArrowRight className='w-4 h-4' />
								</Link>
							</Button>
						</div>
					</div>
				)}
			</header>

			{/* Hero Section */}
			<section className='relative z-10 pt-16 pb-20 md:pt-24 md:pb-28 px-4'>
				<div className='max-w-7xl mx-auto'>
					{/* Hero Header */}
					<div className='text-center max-w-4xl mx-auto space-y-6'>
						{/* Pill Tag */}
						<div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-blue-500/30 backdrop-blur-md shadow-lg shadow-blue-500/10 hover:border-blue-500/60 transition-all cursor-default'>
							<span className='flex h-2 w-2 rounded-full bg-blue-400 animate-pulse' />
							<span className='text-xs font-semibold text-slate-200'>
								Qarz Daftari 2.0 • Avtomatik SMS & Uzum Bank to'lovlari
							</span>
							<Sparkles className='w-3.5 h-3.5 text-blue-400' />
						</div>

						{/* Headline */}
						<h1 className='text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]'>
							Nasiya va qarzlarni nazorat qilishda{' '}
							<span className='bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent'>
								zamonaviy aniqlik
							</span>
						</h1>

						{/* Subhead */}
						<p className='text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed'>
							Qog'oz daftarlardan butunlay voz keching. Do'koningizdagi barcha
							qarzlar, to'lov muddatlari va mijozlar hisob-kitobini yagona aqlli
							bulutli platformada xavfsiz boshqaring.
						</p>

						{/* CTA Buttons */}
						<div className='flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 w-full max-w-sm sm:max-w-none mx-auto'>
							<Button
								size='lg'
								asChild
								className='group w-full sm:w-auto h-12 sm:h-14 px-7 sm:px-8 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all hover:scale-[1.02] active:scale-[0.98]'
							>
								<Link href='/register' className='flex items-center justify-center gap-2'>
									<span>30 kun bepul sinab ko'ring</span>
									<ArrowRight className='w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200' />
								</Link>
							</Button>
							<Button
								size='lg'
								variant='ghost'
								asChild
								className='w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-medium border border-slate-700/80 hover:border-slate-500 bg-slate-800/70 hover:bg-slate-700 text-slate-100 hover:text-white rounded-2xl backdrop-blur-md transition-all active:scale-[0.98]'
							>
								<Link href='#pricing' className='flex items-center justify-center'>
									<span>Tariflarni ko'rish</span>
								</Link>
							</Button>
						</div>

						{/* Micro Trust Pills */}
						<div className='flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-slate-400'>
							<span className='flex items-center gap-1.5'>
								<Check className='w-4 h-4 text-emerald-400' /> Boshlash uchun
								karta talab etilmaydi
							</span>
							<span className='flex items-center gap-1.5'>
								<Check className='w-4 h-4 text-emerald-400' /> 30 soniyada
								ro'yxatdan o'tish
							</span>
							<span className='flex items-center gap-1.5'>
								<Check className='w-4 h-4 text-emerald-400' /> O'zbekiston
								bo'ylab 500+ do'konlar
							</span>
						</div>
					</div>

					{/* Interactive Live Product Showcase Mockup */}
					<div className='mt-14 relative max-w-5xl mx-auto'>
						{/* Ambient Backlight Behind Showcase */}
						<div className='absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/10 blur-2xl -z-10 rounded-3xl' />

						{/* The Main Showcase Window Frame */}
						<div className='rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-2xl backdrop-blur-xl overflow-hidden'>
							{/* Window Titlebar */}
							<div className='px-4 py-3 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<span className='w-3 h-3 rounded-full bg-rose-500/80 inline-block' />
									<span className='w-3 h-3 rounded-full bg-amber-500/80 inline-block' />
									<span className='w-3 h-3 rounded-full bg-emerald-500/80 inline-block' />
									<span className='ml-2 text-xs font-mono text-slate-400 hidden sm:inline'>
										debtbook.uz/dashboard
									</span>
								</div>
								<div className='flex items-center gap-2'>
									<span className='text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1'>
										<span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block' />
										Jonli tizim
									</span>
								</div>
							</div>

							{/* Inside Mockup Content */}
							<div className='p-4 sm:p-6 space-y-6'>
								{/* 4 KPI Cards */}
								<div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
									<div className='p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 relative overflow-hidden'>
										<div className='text-xs text-slate-400 font-medium'>
											Jami Nasiya
										</div>
										<div className='text-lg sm:text-2xl font-bold text-white mt-1'>
											48,250,000
										</div>
										<div className='text-[11px] text-blue-400 mt-1 flex items-center gap-1'>
											<TrendingUp className='w-3 h-3' /> 42 ta mijoz
										</div>
									</div>

									<div className='p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 relative overflow-hidden'>
										<div className='text-xs text-slate-400 font-medium'>
											Qaytarilgan
										</div>
										<div className='text-lg sm:text-2xl font-bold text-emerald-400 mt-1'>
											32,100,000
										</div>
										<div className='text-[11px] text-emerald-500 mt-1 font-medium'>
											✓ 84% muvaffaqiyat
										</div>
									</div>

									<div className='p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 relative overflow-hidden'>
										<div className='text-xs text-slate-400 font-medium'>
											Kechikkan
										</div>
										<div className='text-lg sm:text-2xl font-bold text-rose-400 mt-1'>
											3,400,000
										</div>
										<div className='text-[11px] text-rose-400 mt-1'>
											2 ta mijozga eslatish lozim
										</div>
									</div>

									<div className='p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 relative overflow-hidden'>
										<div className='text-xs text-slate-400 font-medium'>
											SMS Yetkazildi
										</div>
										<div className='text-lg sm:text-2xl font-bold text-indigo-300 mt-1'>
											99.4%
										</div>
										<div className='text-[11px] text-indigo-400 mt-1'>
											Aktiv eslatma xizmati
										</div>
									</div>
								</div>

								{/* Simulated Debtor Table */}
								<div className='rounded-xl border border-slate-700/60 bg-slate-800/30 overflow-hidden'>
									<div className='px-4 py-3 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between text-xs font-semibold text-slate-300'>
										<span>So'nggi qarz yozuvlari</span>
										<span className='text-blue-400 font-normal'>
											Papkalar: Barchasi (42)
										</span>
									</div>

									<div className='divide-y divide-slate-800'>
										{/* Row 1 */}
										<div className='p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition'>
											<div className='flex items-center gap-3'>
												<div className='w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs'>
													AK
												</div>
												<div>
													<div className='font-semibold text-sm text-white'>
														Akmal Karimov
													</div>
													<div className='text-xs text-slate-400'>
														+998 (90) 123-45-67 • Oziq-ovqat
													</div>
												</div>
											</div>
											<div className='flex items-center justify-between sm:justify-end gap-4'>
												<div className='text-right'>
													<div className='font-bold text-sm text-white'>
														1,450,000 so'm
													</div>
													<div className='text-[11px] text-rose-400 font-medium flex items-center gap-1 justify-end'>
														<AlertCircle className='w-3 h-3' /> 3 kun kechikdi
													</div>
												</div>
												<Button
													size='sm'
													onClick={handleTestSms}
													className={`h-8 text-xs font-semibold rounded-lg transition-all ${
														smsSent
															? 'bg-emerald-600 hover:bg-emerald-600 text-white'
															: 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
													}`}
												>
													<MessageSquare className='w-3.5 h-3.5 mr-1' />
													{smsSent ? 'SMS yuborildi! ✓' : 'SMS eslatish'}
												</Button>
											</div>
										</div>

										{/* Row 2 */}
										<div className='p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition'>
											<div className='flex items-center gap-3'>
												<div className='w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs'>
													DR
												</div>
												<div>
													<div className='font-semibold text-sm text-white'>
														Dilshod Rahimov
													</div>
													<div className='text-xs text-slate-400'>
														+998 (93) 987-65-43 • Qurilish mollari
													</div>
												</div>
											</div>
											<div className='flex items-center justify-between sm:justify-end gap-4'>
												<div className='text-right'>
													<div className='font-bold text-sm text-emerald-400'>
														850,000 so'm
													</div>
													<div className='text-[11px] text-emerald-400 font-medium flex items-center gap-1 justify-end'>
														<CheckCircle2 className='w-3 h-3' /> To'liq to'landi
													</div>
												</div>
												<span className='text-xs text-slate-500 px-3 py-1 bg-slate-800 rounded-md'>
													Yopilgan
												</span>
											</div>
										</div>

										{/* Row 3 */}
										<div className='p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition'>
											<div className='flex items-center gap-3'>
												<div className='w-9 h-9 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs'>
													SO
												</div>
												<div>
													<div className='font-semibold text-sm text-white'>
														Sardor Olimov
													</div>
													<div className='text-xs text-slate-400'>
														+998 (97) 555-44-33 • Ulgurji
													</div>
												</div>
											</div>
											<div className='flex items-center justify-between sm:justify-end gap-4'>
												<div className='text-right'>
													<div className='font-bold text-sm text-white'>
														2,300,000 so'm
													</div>
													<div className='text-[11px] text-amber-400 font-medium flex items-center gap-1 justify-end'>
														<Clock className='w-3 h-3' /> Muddati: 5-noyabr
													</div>
												</div>
												<Button
													size='sm'
													variant='ghost'
													className='h-8 text-xs border border-slate-700/80 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white'
												>
													Tafsilotlar
												</Button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Floating Live Indicator Badge (Top Right) */}
						<div className='hidden lg:flex absolute -top-6 -right-6 items-center gap-3 bg-slate-800/90 border border-emerald-500/40 p-3 rounded-2xl shadow-xl backdrop-blur-xl'>
							<div className='w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold'>
								✓
							</div>
							<div className='text-xs'>
								<div className='font-bold text-white'>
									+1,200,000 so'm to'lov
								</div>
								<div className='text-emerald-400'>
									Uzum Bank orqali qabul qilindi
								</div>
							</div>
						</div>

						{/* Floating Live Indicator Badge (Bottom Left) */}
						<div className='hidden lg:flex absolute -bottom-6 -left-6 items-center gap-3 bg-slate-800/90 border border-blue-500/40 p-3 rounded-2xl shadow-xl backdrop-blur-xl'>
							<div className='w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold'>
								<MessageSquare className='w-5 h-5' />
							</div>
							<div className='text-xs'>
								<div className='font-bold text-white'>
									Avtomatik SMS eslatma
								</div>
								<div className='text-blue-400'>99.8% tezlikda yetkazildi</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Trust & Scale Metrics Strip */}
			<section className='relative z-10 border-y border-slate-800/80 bg-slate-900/60 backdrop-blur-md py-10 px-4'>
				<div className='max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center'>
					<div>
						<div className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight'>
							500+
						</div>
						<div className='text-xs sm:text-sm text-slate-400 mt-1'>
							Faol savdo nuqtalari
						</div>
					</div>
					<div>
						<div className='text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight'>
							12 mlrd+
						</div>
						<div className='text-xs sm:text-sm text-slate-400 mt-1'>
							so'm hisoblangan qarzlar
						</div>
					</div>
					<div>
						<div className='text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight'>
							99.8%
						</div>
						<div className='text-xs sm:text-sm text-slate-400 mt-1'>
							SMS yetkazilish darajasi
						</div>
					</div>
					<div>
						<div className='text-3xl sm:text-4xl font-extrabold text-indigo-300 tracking-tight'>
							0%
						</div>
						<div className='text-xs sm:text-sm text-slate-400 mt-1'>
							Yashirin komissiyalar
						</div>
					</div>
				</div>
			</section>

			{/* Bento Grid Features Section */}
			<section id='features' className='relative z-10 py-24 px-4'>
				<div className='max-w-7xl mx-auto space-y-16'>
					<div className='text-center max-w-3xl mx-auto space-y-3'>
						<Badge variant='outline' className='bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1'>
							Kuchli Imkoniyatlar
						</Badge>
						<h2 className='text-3xl sm:text-5xl font-extrabold text-white tracking-tight'>
							Biznesingizni yuksaltiruvchi barcha vositalar
						</h2>
						<p className='text-slate-400 text-sm sm:text-base'>
							Qarz Daftari shunchaki yozuvlar ro'yxati emas — bu sizning
							daromadingizni o'z vaqtida qaytarishga yordam beradigan to'liq
							moliya ekotizimidir.
						</p>
					</div>

					{/* Bento Grid */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						{/* Card 1: Large (2 Cols) */}
						<div className='md:col-span-2 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/80 p-6 sm:p-8 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300'>
							<div className='w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-6'>
								<FolderOpen className='w-6 h-6' />
							</div>
							<h3 className='text-2xl font-bold text-white mb-2'>
								Drag & Drop va Aqlli Papkalar
							</h3>
							<p className='text-slate-300 text-sm leading-relaxed max-w-lg mb-6'>
								Mijozlaringizni toifalarga ajrating: "Ulgurji xaridorlar",
								"Chakana savdo", "Muddati o'tganlar". Qarz yozuvlarini
								sichqoncha yoki barmoq orqali tortib, oson tartibga soling.
							</p>
							{/* Interactive Folder Pill Preview */}
							<div className='flex flex-wrap gap-2 pt-2'>
								<span className='px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5'>
									📁 Ulgurji savdo (18)
								</span>
								<span className='px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5'>
									📁 Chakana (24)
								</span>
								<span className='px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5'>
									📁 Kechikkanlar (2)
								</span>
							</div>
						</div>

						{/* Card 2: Medium (1 Col) */}
						<div className='rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/80 p-6 sm:p-8 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300'>
							<div className='w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-6'>
								<MessageSquare className='w-6 h-6' />
							</div>
							<h3 className='text-2xl font-bold text-white mb-2'>
								Avtomatik SMS Eslatmalar
							</h3>
							<p className='text-slate-300 text-sm leading-relaxed'>
								Mijozlarga xushmuomala SMS eslatmalar yuboring. Kimga qachon va
								qancha qarz haqida eslatma ketgani tarixda to'liq saqlanadi.
							</p>
							<div className='mt-6 p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 space-y-1'>
								<span className='text-blue-400 font-semibold block text-[11px]'>
									📱 SMS namunasi:
								</span>
								"Hurmatli Akmal aka! 'Grand Market'dan 1,450,000 so'm nasiyangiz
								mavjud. Iltimos, o'z vaqtida to'lashingizni so'raymiz."
							</div>
						</div>

						{/* Card 3: Medium (1 Col) */}
						<div className='rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/80 p-6 sm:p-8 relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300'>
							<div className='w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-6'>
								<BarChart3 className='w-6 h-6' />
							</div>
							<h3 className='text-2xl font-bold text-white mb-2'>
								Moliyaviy Analitika
							</h3>
							<p className='text-slate-300 text-sm leading-relaxed'>
								Qaysi oyda qancha qarz berildi va qancha qismi undirildi? Barcha
								hisobotlar rangli interaktiv grafiklarda ko'z o'ngingizda
								namoyon bo'ladi.
							</p>
							<div className='mt-6 flex items-end gap-2 h-16 pt-2'>
								<div className='flex-1 bg-blue-500/30 rounded-t h-8' />
								<div className='flex-1 bg-blue-500/50 rounded-t h-12' />
								<div className='flex-1 bg-blue-500/70 rounded-t h-10' />
								<div className='flex-1 bg-blue-500 rounded-t h-16' />
								<div className='flex-1 bg-emerald-500 rounded-t h-14' />
							</div>
						</div>

						{/* Card 4: Large (2 Cols) */}
						<div className='md:col-span-2 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/80 p-6 sm:p-8 relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-300'>
							<div className='w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-6'>
								<CreditCard className='w-6 h-6' />
							</div>
							<h3 className='text-2xl font-bold text-white mb-2'>
								100% Rasmiy To'lovlar: Uzum Bank, Click, Payme
							</h3>
							<p className='text-slate-300 text-sm leading-relaxed max-w-lg mb-6'>
								Xizmatimiz O'zbekistonning eng yirik to'lov tizimlari bilan
								to'g'ridan-to'g'ri integratsiya qilingan. Humo va Uzcard
								kartalari orqali xavfsiz va bir zumda to'lang.
							</p>
							<div className='pt-2'>
								<PaymentMethodsRow className='justify-start bg-slate-900/70 p-3 rounded-2xl border border-slate-700/60 inline-flex' />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works (3 Steps) */}
			<section
				id='how-it-works'
				className='relative z-10 py-20 px-4 border-t border-slate-800/80 bg-slate-900/40'
			>
				<div className='max-w-7xl mx-auto space-y-16'>
					<div className='text-center max-w-2xl mx-auto space-y-3'>
						<Badge variant='outline' className='bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1'>
							Oddiy va Qulay
						</Badge>
						<h2 className='text-3xl sm:text-5xl font-extrabold text-white tracking-tight'>
							3 qadamda ishni boshlang
						</h2>
						<p className='text-slate-400 text-sm sm:text-base'>
							Hech qanday murakkab sozlamalarsiz, 1 daqiqada hisobingiz tayyor
							bo'ladi.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
						{/* Step 1 */}
						<div className='p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 relative'>
							<div className='text-5xl font-black text-slate-700 mb-4'>01</div>
							<h3 className='text-xl font-bold text-white mb-2'>
								Ro'yxatdan o'ting
							</h3>
							<p className='text-slate-400 text-sm leading-relaxed'>
								Telefon raqamingiz orqali 30 soniyada kiring. Yangi
								foydalanuvchilar uchun 30 kunlik sinov davri mutlaqo bepul.
							</p>
						</div>

						{/* Step 2 */}
						<div className='p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 relative'>
							<div className='text-5xl font-black text-blue-500/40 mb-4'>
								02
							</div>
							<h3 className='text-xl font-bold text-white mb-2'>
								Qarzdorlarni kiriting
							</h3>
							<p className='text-slate-400 text-sm leading-relaxed'>
								Mijoz ismi, telefon raqami, summa va to'lov muddatini yozing.
								Ularni papkalarga taqsimlang.
							</p>
						</div>

						{/* Step 3 */}
						<div className='p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 relative'>
							<div className='text-5xl font-black text-emerald-500/40 mb-4'>
								03
							</div>
							<h3 className='text-xl font-bold text-white mb-2'>
								Avtomatik nazorat qiling
							</h3>
							<p className='text-slate-400 text-sm leading-relaxed'>
								SMS eslatmalar jo'nating, qarz qaytarilishini kuzating va
								daftardagi barcha chalkashliklarga chek qo'ying.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section id='pricing' className='relative z-10 py-24 px-4'>
				<div className='max-w-7xl mx-auto space-y-12'>
					<div className='text-center max-w-3xl mx-auto space-y-4'>
						<Badge variant='outline' className='bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1'>
							Shaffof Tariflar
						</Badge>
						<h2 className='text-3xl sm:text-5xl font-extrabold text-white tracking-tight'>
							Biznesingiz uchun mos rejani tanlang
						</h2>
						<p className='text-slate-400 text-sm sm:text-base'>
							Kichik do'konlardan tortib yirik savdo tarmoqlarigacha. Yashirin
							to'lovlarsiz, 100% kafolatli.
						</p>

						{/* Billing Toggle */}
						<div className='inline-flex items-center p-1 bg-slate-800 rounded-2xl border border-slate-700 mt-4'>
							<button
								onClick={() => setBillingCycle('monthly')}
								className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all ${
									billingCycle === 'monthly'
										? 'bg-blue-600 text-white shadow-sm'
										: 'text-slate-400 hover:text-white'
								}`}
							>
								Oylik to'lov
							</button>
							<button
								onClick={() => setBillingCycle('annual')}
								className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
									billingCycle === 'annual'
										? 'bg-blue-600 text-white shadow-sm'
										: 'text-slate-400 hover:text-white'
								}`}
							>
								<span>Yillik to'lov</span>
								<span className='bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold'>
									-10% tejash
								</span>
							</button>
						</div>
					</div>

					{/* Pricing Cards Grid */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
						{/* Free Trial Card */}
						<div className='rounded-3xl bg-slate-800/40 border border-slate-700/80 p-8 flex flex-col justify-between hover:border-slate-600 transition-all'>
							<div>
								<div className='text-lg font-bold text-white'>Free Trial</div>
								<div className='text-xs text-slate-400 mt-1'>
									Yangi foydalanuvchilar uchun 30 kun bepul
								</div>

								<div className='mt-6'>
									<span className='text-4xl font-extrabold text-white'>0</span>
									<span className='text-slate-400 text-sm'> so'm/oy</span>
								</div>

								<div className='mt-8 space-y-3.5 text-xs text-slate-300'>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span>50 tagacha qarz yozuvi</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span>2 ta papka (folder)</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span>Mijozlar telefon raqamlari</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span>Brauzer bildirishnomalari</span>
									</div>
								</div>
							</div>

							<div className='pt-8'>
								<Button
									asChild
									className='w-full h-11 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl'
								>
									<Link href='/register'>Bepul boshlash</Link>
								</Button>
							</div>
						</div>

						{/* Plus Card (Featured) */}
						<div className='rounded-3xl bg-gradient-to-b from-blue-950/40 via-slate-800/80 to-slate-900 border-2 border-blue-500 p-8 flex flex-col justify-between relative shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-all'>
							<div className='absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md'>
								Eng ommabop
							</div>

							<div>
								<div className='text-lg font-bold text-white'>Plus</div>
								<div className='text-xs text-slate-400 mt-1'>
									Kichik va o'rta savdo do'konlari uchun
								</div>

								<div className='mt-6'>
									<span className='text-4xl font-extrabold text-white'>
										{billingCycle === 'annual' ? '44,900' : '49,900'}
									</span>
									<span className='text-slate-400 text-sm'> so'm/oy</span>
								</div>

								<div className='mt-8 space-y-3.5 text-xs text-slate-200'>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-blue-400 flex-shrink-0' />
										<span>
											<strong>500 ta</strong> qarz yozuvi
										</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-blue-400 flex-shrink-0' />
										<span>
											<strong>10 ta</strong> papka (folder)
										</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-blue-400 flex-shrink-0' />
										<span>
											<strong>Avtomatik SMS</strong> eslatmalar
										</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-blue-400 flex-shrink-0' />
										<span>Excel va PDF formatida yuklash</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-blue-400 flex-shrink-0' />
										<span>1 oylik to'liq analitika hisoboti</span>
									</div>
								</div>
							</div>

							<div className='pt-8'>
								<Button
									asChild
									className='w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30'
								>
									<Link href='/register?plan=plus'>Plus rejasini tanlash</Link>
								</Button>
							</div>
						</div>

						{/* Pro Card */}
						<div className='rounded-3xl bg-slate-800/40 border border-slate-700/80 p-8 flex flex-col justify-between hover:border-slate-600 transition-all'>
							<div>
								<div className='text-lg font-bold text-white'>Pro</div>
								<div className='text-xs text-slate-400 mt-1'>
									Yirik ulgurji va savdo tarmoqlari
								</div>

								<div className='mt-6'>
									<span className='text-4xl font-extrabold text-white'>
										{billingCycle === 'annual' ? '89,900' : '99,900'}
									</span>
									<span className='text-slate-400 text-sm'> so'm/oy</span>
								</div>

								<div className='mt-8 space-y-3.5 text-xs text-slate-300'>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span>
											<strong>Cheksiz</strong> qarz yozuvlari
										</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span>
											<strong>Cheksiz</strong> papkalar
										</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span>Prioritet SMS yetkazish tezligi</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span>1 yillik kengaytirilgan analitika</span>
									</div>
									<div className='flex items-center gap-2.5'>
										<Check className='w-4 h-4 text-emerald-400 flex-shrink-0' />
										<span>24/7 shaxsiy menejer yordami</span>
									</div>
								</div>
							</div>

							<div className='pt-8'>
								<Button
									asChild
									className='w-full h-11 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl'
								>
									<Link href='/register?plan=pro'>Pro rejasini tanlash</Link>
								</Button>
							</div>
						</div>
					</div>

					{/* Secure Payment Systems Banner */}
					<div className='max-w-4xl mx-auto p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-center space-y-4'>
						<div className='text-xs font-semibold text-slate-300 uppercase tracking-wider'>
							Qo'llab-quvvatlanadigan rasmiy to'lov tizimlari:
						</div>
						<PaymentMethodsRow className='justify-center' />
						<div className='text-[11px] text-slate-400 max-w-lg mx-auto'>
							Barcha to'lovlar Uzum Bank, Payme va Click xavfsiz protokollari
							orqali amalga oshiriladi. Kartangiz ma'lumotlari saqlanmaydi va
							to'liq himoyalangan.
						</div>
					</div>
				</div>
			</section>

			{/* Customer Testimonials */}
			<section className='relative z-10 py-20 px-4 border-t border-slate-800/80 bg-slate-900/60'>
				<div className='max-w-7xl mx-auto space-y-14'>
					<div className='text-center max-w-2xl mx-auto space-y-3'>
						<Badge variant='outline' className='bg-purple-600/20 text-purple-400 border border-purple-500/30 px-3 py-1'>
							Mijozlarimiz fikri
						</Badge>
						<h2 className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight'>
							Tadbirkorlar biz haqimizda nima deydi?
						</h2>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div className='p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-4'>
							<div className='flex text-amber-400 text-sm'>★★★★★</div>
							<p className='text-xs sm:text-sm text-slate-300 leading-relaxed'>
								"Ilgari 3 ta qalin daftarda hisob yuritar edik, oxiri sahifalar
								yirtilib yoki yo'qolib chalkashlik bo'lardi. Qarz Daftari orqali
								barcha qarzlarimiz tartibga tushdi, SMS eslatma esa mijozlarga
								juda yaxshi ta'sir qildi."
							</p>
							<div className='pt-2 border-t border-slate-700/60 flex items-center gap-3'>
								<div className='w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold'>
									B
								</div>
								<div>
									<div className='text-xs font-bold text-white'>
										Bahodir Mirzayev
									</div>
									<div className='text-[11px] text-slate-400'>
										Chilonzor kiyim do'koni
									</div>
								</div>
							</div>
						</div>

						<div className='p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-4'>
							<div className='flex text-amber-400 text-sm'>★★★★★</div>
							<p className='text-xs sm:text-sm text-slate-300 leading-relaxed'>
								"Muddati o'tib ketgan qarzlarni eslatish juda qiyin edi. Qarz
								Daftari orqali bir tugma bilan SMS jo'natyapmiz. 2 hafta ichida
								kechikkan pullarimizning 80% qaytib keldi."
							</p>
							<div className='pt-2 border-t border-slate-700/60 flex items-center gap-3'>
								<div className='w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold'>
									S
								</div>
								<div>
									<div className='text-xs font-bold text-white'>
										Sardor Alimov
									</div>
									<div className='text-[11px] text-slate-400'>
										Qo'qon ulgurji savdo bazasi
									</div>
								</div>
							</div>
						</div>

						<div className='p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-4'>
							<div className='flex text-amber-400 text-sm'>★★★★★</div>
							<p className='text-xs sm:text-sm text-slate-300 leading-relaxed'>
								"Uzum Bank va Click orqali oylik obuna to'lash juda qulay
								bo'ldi. Telefonim yangilansa ham, barcha mijozlarim va summalar
								darhol qaytib chiqdi. 10/10 tavsiya qilaman!"
							</p>
							<div className='pt-2 border-t border-slate-700/60 flex items-center gap-3'>
								<div className='w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold'>
									J
								</div>
								<div>
									<div className='text-xs font-bold text-white'>
										Jasur Qodirov
									</div>
									<div className='text-[11px] text-slate-400'>
										Samarqand qurilish mollari
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Interactive FAQ Accordion */}
			<section id='faq' className='relative z-10 py-24 px-4'>
				<div className='max-w-4xl mx-auto space-y-12'>
					<div className='text-center space-y-3'>
						<Badge variant='outline' className='bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1'>
							Savol-Javoblar
						</Badge>
						<h2 className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight'>
							Ko'p beriladigan savollar
						</h2>
					</div>

					<div className='space-y-3'>
						{faqs.map((faq, index) => {
							const isOpen = openFaq === index
							return (
								<div
									key={index}
									className='rounded-2xl border border-slate-700/80 bg-slate-800/40 overflow-hidden transition-all'
								>
									<button
										onClick={() => setOpenFaq(isOpen ? null : index)}
										className='w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white hover:text-blue-400 transition-colors'
									>
										<span>{faq.q}</span>
										{isOpen ? (
											<ChevronUp className='w-5 h-5 text-blue-400 flex-shrink-0' />
										) : (
											<ChevronDown className='w-5 h-5 text-slate-400 flex-shrink-0' />
										)}
									</button>
									{isOpen && (
										<div className='px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-700/40'>
											{faq.a}
										</div>
									)}
								</div>
							)
						})}
					</div>
				</div>
			</section>

			{/* High-Conversion Bottom Banner */}
			<section className='relative z-10 py-20 px-4'>
				<div className='max-w-6xl mx-auto rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl'>
					<div className='absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px] opacity-10' />

					<div className='relative z-10 max-w-2xl mx-auto space-y-6'>
						<h2 className='text-3xl sm:text-5xl font-extrabold tracking-tight'>
							Eski daftarlarga bugunoq chek qo'ying
						</h2>
						<p className='text-blue-100 text-sm sm:text-base'>
							Minglab tadbirkorlar allaqachon Qarz Daftari yordamida o'z
							mablag'larini xavfsiz boshqarishmoqda.
						</p>
						<div className='pt-2'>
							<Button
								size='lg'
								asChild
								className='w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-bold bg-white text-blue-900 hover:bg-blue-50 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95'
							>
								<Link href='/register'>30 kun bepul boshlash</Link>
							</Button>
						</div>
						<div className='text-xs text-blue-200'>
							Kredit karta talab etilmaydi • 30 soniyada ro'yxatdan o'tish
						</div>
					</div>
				</div>
			</section>

			{/* Modern Fintech Audited Footer */}
			<footer className='relative z-10 border-t border-slate-800 bg-slate-950 text-slate-400 text-xs'>
				<div className='max-w-7xl mx-auto px-4 py-14'>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-10 mb-12'>
						{/* Col 1 */}
						<div className='space-y-3'>
							<div className='flex items-center gap-2'>
								<div className='w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-sm'>
									<Image src='/appleicon.png' alt='Qarz Daftari' width={28} height={28} className='w-full h-auto object-contain rounded-md' />
								</div>
								<span className='font-extrabold text-base text-white'>
									Qarz Daftari
								</span>
							</div>
							<p className='text-slate-400 leading-relaxed'>
								Tadbirkorlar va do'kon egalari uchun zamonaviy qarz va
								hisob-kitob boshqaruvi platformasi.
							</p>
							<div className='space-y-1 text-slate-500 pt-2 text-[11px]'>
								<p>
									<strong>Yuridik shaxs:</strong> «ASADBEK BURIYEV WS» NTM
								</p>
								<p>
									<strong>Rasmiy sayt:</strong> https://debtbook.uz
								</p>
							</div>
						</div>

						{/* Col 2 */}
						<div className='space-y-3'>
							<h4 className='font-bold text-white uppercase tracking-wider text-[11px]'>
								Hujjatlar / Документы
							</h4>
							<ul className='space-y-2'>
								<li>
									<Link
										href='/terms'
										className='hover:text-blue-400 transition flex items-center gap-1.5'
									>
										<FileText className='w-3.5 h-3.5 text-blue-400' />
										<span>Ommaviy Oferta</span>
									</Link>
								</li>
								<li>
									<Link
										href='/security'
										className='hover:text-blue-400 transition flex items-center gap-1.5'
									>
										<ShieldCheck className='w-3.5 h-3.5 text-emerald-400' />
										<span>Xavfsizlik & Antifraud</span>
									</Link>
								</li>
								<li>
									<Link
										href='/payment-terms'
										className='hover:text-blue-400 transition flex items-center gap-1.5'
									>
										<CreditCard className='w-3.5 h-3.5 text-purple-400' />
										<span>To'lov va mablag' qaytarish</span>
									</Link>
								</li>
								<li>
									<Link
										href='/privacy'
										className='hover:text-blue-400 transition flex items-center gap-1.5'
									>
										<Lock className='w-3.5 h-3.5 text-slate-400' />
										<span>Maxfiylik siyosati</span>
									</Link>
								</li>
							</ul>
						</div>

						{/* Col 3 */}
						<div className='space-y-3'>
							<h4 className='font-bold text-white uppercase tracking-wider text-[11px]'>
								Havolalar
							</h4>
							<ul className='space-y-2'>
								<li>
									<Link
										href='#features'
										className='hover:text-blue-400 transition'
									>
										Imkoniyatlar
									</Link>
								</li>
								<li>
									<Link
										href='#pricing'
										className='hover:text-blue-400 transition'
									>
										Tariflar
									</Link>
								</li>
								<li>
									<Link
										href='/sms-credits'
										className='hover:text-blue-400 transition'
									>
										SMS Xizmati
									</Link>
								</li>
								<li>
									<Link
										href='/login'
										className='hover:text-blue-400 transition'
									>
										Tizimga kirish
									</Link>
								</li>
								<li>
									<Link
										href='/register'
										className='hover:text-blue-400 transition'
									>
										Ro'yxatdan o'tish
									</Link>
								</li>
							</ul>
						</div>

						{/* Col 4 */}
						<div className='space-y-3'>
							<h4 className='font-bold text-white uppercase tracking-wider text-[11px]'>
								Aloqa / Qo'llab-quvvatlash
							</h4>
							<div className='space-y-2 text-slate-300'>
								<p className='flex items-center gap-2'>
									<Phone className='w-3.5 h-3.5 text-blue-400' />
									<span>+998 (90) 443-55-67</span>
								</p>
								<p className='flex items-center gap-2'>
									<Mail className='w-3.5 h-3.5 text-blue-400' />
									<span>boriyevdev08@gmail.com</span>
								</p>
								<p className='text-[11px] text-slate-500'>
									Ish vaqti: Du-Ju, 09:00 - 18:00
								</p>
							</div>

							<div className='pt-3 border-t border-slate-800'>
								<div className='flex items-center gap-2 text-emerald-400 font-medium text-[11px]'>
									<span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
									Barcha to'lov shlyuzlari faol
								</div>
							</div>
						</div>
					</div>

					<div className='border-t border-slate-800/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500'>
						<p>
							&copy; 2026 Qarz Daftari («ASADBEK BURIYEV WS» NTM). Barcha
							huquqlar himoyalangan.
						</p>
						<div className='flex items-center gap-4'>
							<Link href='/terms' className='hover:underline'>
								Oferta
							</Link>
							<span>•</span>
							<Link href='/security' className='hover:underline'>
								Antifraud
							</Link>
							<span>•</span>
							<Link href='/payment-terms' className='hover:underline'>
								To'lov & Qaytarish
							</Link>
							<span>•</span>
							<Link href='/privacy' className='hover:underline'>
								Maxfiylik
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
