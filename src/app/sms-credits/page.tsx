// src/app/sms-credits/page.tsx
'use client'

import { AppShell } from '@/components/layout/app-shell'
import { ClickOnSiteModal } from '@/components/payments/click-on-site-modal'
import {
	ClickLogo,
	PaymeLogo,
	UzumBankLogo,
} from '@/components/payments/payment-logos'
import { UzumPaymentModal } from '@/components/payments/uzum-payment-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { SMS_PACKAGES } from '@/lib/constants/plans'
import { useUser } from '@/lib/contexts/user-context'
import { formatCurrency } from '@/lib/utils/currency'
import { Check, History, MessageSquare, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SMSCreditsData {
	total_credits: number
	used_credits: number
	remaining_credits: number
	recent_purchases: Array<{
		credits: number
		amount: number
		created_at: string
	}>
	usage_history: Array<{
		recipient_phone: string
		created_at: string
	}>
}

export default function SMSCreditsPage() {
	const { user } = useUser()
	const [credits, setCredits] = useState<SMSCreditsData | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
	const [showProviderModal, setShowProviderModal] = useState(false)
	const [showClickOnSiteModal, setShowClickOnSiteModal] = useState(false)
	const [clickInitialTab, setClickInitialTab] = useState<'card' | 'invoice'>(
		'card',
	)
	const [showUzumModal, setShowUzumModal] = useState(false)
	const [uzumPaymentUrl, setUzumPaymentUrl] = useState<string | null>(null)
	const [purchaseLoading, setPurchaseLoading] = useState(false)

	useEffect(() => {
		fetchCredits()
	}, [])

	const fetchCredits = async () => {
		try {
			const response = await fetch('/api/sms-credits')
			const data = await response.json()
			if (response.ok) {
				setCredits(data)
			}
		} catch (error) {
			console.error('Failed to fetch credits:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleSelectPackage = (packageId: string) => {
		setSelectedPackage(packageId)
		setShowProviderModal(true)
	}

	const handlePurchase = async (provider: string) => {
		const pkg = SMS_PACKAGES.find(p => p.id === selectedPackage)
		if (!pkg) return

		if (provider === 'click' || provider === 'click_card') {
			setClickInitialTab(provider === 'click_card' ? 'card' : 'invoice')
			setShowProviderModal(false)
			setShowClickOnSiteModal(true)
			return
		}

		setPurchaseLoading(true)

		try {
			const response = await fetch('/api/sms-credits/purchase', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					packageId: pkg.id,
					credits: pkg.credits,
					amount: pkg.price,
					provider,
				}),
			})

			const data = await response.json()

			if (data.paymentUrl) {
				if (provider === 'uzum') {
					setUzumPaymentUrl(data.paymentUrl)
					setShowProviderModal(false)
					setShowUzumModal(true)
					return
				}
				window.location.href = data.paymentUrl
			} else {
				alert(data.error || 'Xato yuz berdi')
			}
		} catch (error) {
			console.error('Purchase error:', error)
			alert('Xato yuz berdi')
		} finally {
			setPurchaseLoading(false)
			setShowProviderModal(false)
		}
	}

	const formatPrice = (price: number) => {
		return formatCurrency(price)
	}

	return (
		<AppShell
			title='SMS Kredits'
			subtitle='Qarzdorlarga eslatma yuborish uchun SMS paketlar'
		>
			<div className='max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6'>
				{/* Current Balance */}
				{loading ? (
					// Ma'lumot yuklanguncha ko'rinib turadigan chiroyli skeleton
					<div className='h-32 w-full bg-slate-200/70 animate-pulse rounded-2xl' />
				) : credits ? (
					// Ma'lumot kelgach o'rniga tushadigan ko'k karta
					<Card className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md border-0'>
						<CardContent className='pt-6'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-blue-100 text-xs font-semibold uppercase tracking-wider'>
										Mavjud SMS balansi
									</p>
									<p className='text-4xl font-black mt-1'>
										{credits.remaining_credits}
									</p>
									<p className='text-blue-100 text-xs mt-2'>
										Jami olingan:{' '}
										<span className='font-bold'>{credits.total_credits}</span> |
										Ishlatilgan:{' '}
										<span className='font-bold'>{credits.used_credits}</span>
									</p>
								</div>
								<div className='w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xs'>
									<MessageSquare className='w-8 h-8 text-white' />
								</div>
							</div>
						</CardContent>
					</Card>
				) : null}

				{/* Packages */}
				<div>
					<h2 className='text-lg font-bold text-slate-900 mb-4'>
						SMS Paketlar
					</h2>
					<div className='grid md:grid-cols-3 gap-4'>
						{SMS_PACKAGES.map(pkg => (
							<Card
								key={pkg.id}
								className={`relative rounded-2xl border-slate-200/90 shadow-2xs hover:shadow-md transition-all ${
									pkg.popular ? 'border-blue-500 border-2' : ''
								}`}
							>
								{pkg.popular && (
									<div className='absolute -top-3 left-1/2 -translate-x-1/2'>
										<Badge className='bg-blue-600 text-white font-bold text-[10px] px-3'>
											Mashhur
										</Badge>
									</div>
								)}

								<CardHeader className='pb-3'>
									<CardTitle className='text-xl font-bold text-slate-900'>
										{pkg.name}
									</CardTitle>
									<CardDescription className='pt-1'>
										<span className='text-2xl font-black text-slate-900'>
											{formatPrice(pkg.price)}
										</span>
									</CardDescription>
								</CardHeader>

								<CardContent className='space-y-2.5 pb-4'>
									<div className='flex items-center gap-2'>
										<Check className='w-4 h-4 text-emerald-600' />
										<span className='text-xs sm:text-sm font-semibold text-slate-800'>
											{pkg.credits} ta SMS
										</span>
									</div>
									<div className='flex items-center gap-2'>
										<Check className='w-4 h-4 text-emerald-600' />
										<span className='text-xs sm:text-sm text-slate-600'>
											{formatPrice(pkg.pricePerSMS)} / SMS
										</span>
									</div>
									{pkg.savings && (
										<div className='flex items-center gap-2'>
											<Zap className='w-4 h-4 text-amber-500' />
											<span className='text-xs font-bold text-amber-600'>
												{pkg.savings}
											</span>
										</div>
									)}
								</CardContent>
								<CardFooter>
									<Button
										onClick={() => handleSelectPackage(pkg.id)}
										className='w-full rounded-xl font-bold text-xs'
										variant={pkg.popular ? 'default' : 'outline'}
									>
										Sotib olish
									</Button>
								</CardFooter>
							</Card>
						))}
					</div>
				</div>

				{/* Recent Activity */}
				{credits && credits.usage_history.length > 0 && (
					<Card className='rounded-2xl border-slate-200/80 shadow-2xs'>
						<CardHeader className='pb-3 border-b border-slate-100'>
							<CardTitle className='flex items-center gap-2 text-base font-bold text-slate-900'>
								<History className='w-4 h-4 text-blue-600' />
								So&apos;ngi yuborilgan SMSlar
							</CardTitle>
						</CardHeader>
						<CardContent className='pt-3'>
							<div className='space-y-3'>
								{credits.usage_history.slice(0, 5).map((item, index) => (
									<div
										key={index}
										className='flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0'
									>
										<div>
											<p className='font-semibold text-sm text-slate-900'>
												{item.recipient_phone}
											</p>
											<p className='text-xs text-slate-500'>
												{new Date(item.created_at).toLocaleString('uz-UZ')}
											</p>
										</div>
										<Badge variant='outline' className='text-xs bg-slate-50'>
											1 kredit
										</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Payment Provider Selection Modal */}
			<Dialog open={showProviderModal} onOpenChange={setShowProviderModal}>
				<DialogContent className='sm:max-w-md rounded-3xl p-6 border border-slate-200/80 shadow-2xl bg-white'>
					<DialogHeader className='space-y-1 pb-1'>
						<DialogTitle className='text-xl font-black text-slate-900 tracking-tight'>
							To&apos;lov tizimini tanlang
						</DialogTitle>
						<DialogDescription className='text-xs text-slate-500'>
							SMS kredit sotib olish uchun to&apos;lov tizimini tanlang
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-3 pt-3'>
						{/* Uzum Bank */}
						<Button
							className='group w-full justify-start h-20 py-3 px-4 hover:border-purple-400 hover:bg-purple-50/40 transition-all rounded-2xl border-slate-200/80 shadow-xs'
							variant='outline'
							onClick={() => handlePurchase('uzum')}
							disabled={purchaseLoading}
						>
							<div className='flex items-center gap-3.5 w-full'>
								<div className='flex-shrink-0 w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200/80 p-2 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform'>
									<UzumBankLogo className='h-9 w-auto' />
								</div>
								<div className='text-left flex-1 min-w-0'>
									<div className='font-bold text-slate-900 flex items-center gap-2'>
										<span>Uzum Bank</span>
										<Badge
											variant='secondary'
											className='bg-purple-100 text-purple-700 text-[10px] font-bold py-0 px-2 rounded-full'
										>
											Tavsiya etiladi
										</Badge>
									</div>
									<div className='text-xs text-slate-500 truncate mt-0.5'>
										Uzcard, Humo, Visa va Mastercard orqali saytda to&apos;lov
									</div>
								</div>
							</div>
						</Button>

						{/* Click */}
						<Button
							className='group w-full justify-start h-20 py-3 px-4 hover:border-blue-400 hover:bg-blue-50/40 transition-all rounded-2xl border-slate-200/80 shadow-xs'
							variant='outline'
							onClick={() => handlePurchase('click')}
							disabled={purchaseLoading}
						>
							<div className='flex items-center gap-3.5 w-full'>
								<div className='flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 p-2 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform'>
									<ClickLogo className='h-7 w-auto' />
								</div>
								<div className='text-left flex-1 min-w-0'>
									<div className='font-bold text-slate-900 flex items-center gap-2'>
										<span>Click</span>
										<Badge
											variant='secondary'
											className='bg-blue-100 text-blue-700 text-[10px] font-bold py-0 px-2 rounded-full'
										>
											Saytda to&apos;lov
										</Badge>
									</div>
									<div className='text-xs text-slate-500 truncate mt-0.5'>
										Bank kartasi yoki Click Up ilovasi orqali to&apos;lov
									</div>
								</div>
							</div>
						</Button>

						{/* Payme */}
						<Button
							className='group w-full justify-start h-20 py-3 px-4 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all rounded-2xl border-slate-200/80 shadow-xs'
							variant='outline'
							onClick={() => handlePurchase('payme')}
							disabled={purchaseLoading}
						>
							<div className='flex items-center gap-3.5 w-full'>
								<div className='flex-shrink-0 w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-2 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform'>
									<PaymeLogo className='h-7 w-auto' />
								</div>
								<div className='text-left flex-1 min-w-0'>
									<div className='font-bold text-slate-900 flex items-center gap-2'>
										<span>Payme</span>
										<Badge
											variant='secondary'
											className='bg-emerald-100 text-emerald-700 text-[10px] font-bold py-0 px-2 rounded-full'
										>
											Tezkor
										</Badge>
									</div>
									<div className='text-xs text-slate-500 truncate mt-0.5'>
										Payme ilovasi yoki karta orqali to&apos;lov
									</div>
								</div>
							</div>
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* On-Site Click Payment Modal */}
			{selectedPackage &&
				(() => {
					const pkg = SMS_PACKAGES.find(p => p.id === selectedPackage)
					if (!pkg) return null
					return (
						<ClickOnSiteModal
							open={showClickOnSiteModal}
							onOpenChange={setShowClickOnSiteModal}
							amount={pkg.price}
							type='sms'
							credits={pkg.credits}
							packageId={pkg.id}
							initialTab={clickInitialTab}
							defaultPhone={user?.phone}
							onSuccess={() => {
								fetchCredits()
								setShowClickOnSiteModal(false)
							}}
						/>
					)
				})()}

			{/* On-Site Uzum Payment Modal */}
			{selectedPackage &&
				(() => {
					const pkg = SMS_PACKAGES.find(p => p.id === selectedPackage)
					if (!pkg) return null
					return (
						<UzumPaymentModal
							open={showUzumModal}
							onOpenChange={setShowUzumModal}
							paymentUrl={uzumPaymentUrl}
							amount={pkg.price}
							planTitle={`${pkg.credits} ta SMS paketi`}
							onSuccess={() => {
								fetchCredits()
								setShowUzumModal(false)
							}}
						/>
					)
				})()}
		</AppShell>
	)
}
