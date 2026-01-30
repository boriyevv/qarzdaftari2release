// // src/app/page.tsx
// // Landing page (Home page)

// import Link from 'next/link'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
//       {/* Hero Section */}
//       <div className="container mx-auto px-4 py-16">
//         <div className="text-center space-y-6 max-w-3xl mx-auto">
//           {/* Logo / Title */}
//           <div className="space-y-2">
//             <h1 className="text-5xl font-bold text-slate-900">
//               Qarz Daftari
//             </h1>
//             <p className="text-xl text-slate-600">
//               Qarzlaringizni online boshqaring
//             </p>
//           </div>

//           {/* Description */}
//           <p className="text-lg text-slate-700 leading-relaxed">
//             Do'kon egalari va tadbirkorlar uchun zamonaviy qarz boshqaruv platformasi.
//             Qarzdorlaringizni oson nazorat qiling, SMS eslatmalar yuboring va to'liq hisobotlarni oling.
//           </p>

//           {/* CTA Buttons */}
//           <div className="flex gap-4 justify-center flex-wrap">
//             <Button size="lg" asChild>
//               <Link href="/register">
//                 Ro'yxatdan o'tish
//               </Link>
//             </Button>
//             <Button size="lg" variant="outline" asChild>
//               <Link href="/login">
//                 Kirish
//               </Link>
//             </Button>
//           </div>

//           {/* Badge */}
//           <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
//             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//             </svg>
//             100% Bepul boshlang
//           </div>
//         </div>

//         {/* Features Section */}
//         <div className="grid md:grid-cols-3 gap-6 mt-16">
//           <Card>
//             <CardHeader>
//               <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
//                 <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                 </svg>
//               </div>
//               <CardTitle>Oson Boshqaruv</CardTitle>
//               <CardDescription>
//                 Qarzlaringizni folderlar bo'yicha guruhlang va drag & drop bilan tartiblang
//               </CardDescription>
//             </CardHeader>
//           </Card>

//           <Card>
//             <CardHeader>
//               <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
//                 <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
//                 </svg>
//               </div>
//               <CardTitle>SMS Eslatmalar</CardTitle>
//               <CardDescription>
//                 Qarzdorlarga avtomatik SMS eslatmalar yuboring va to'lovlarni vaqtida oling
//               </CardDescription>
//             </CardHeader>
//           </Card>

//           <Card>
//             <CardHeader>
//               <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
//                 <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                 </svg>
//               </div>
//               <CardTitle>Statistika</CardTitle>
//               <CardDescription>
//                 To'liq hisobotlar, grafiklar va analitika bilan biznesingizni kuzating
//               </CardDescription>
//             </CardHeader>
//           </Card>
//         </div>

//         {/* Pricing Section */}
//         <div className="mt-16">
//           <h2 className="text-3xl font-bold text-center mb-8">Tariflar</h2>
//           <div className="grid md:grid-cols-3 gap-6">
//             {/* Free */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Free</CardTitle>
//                 <CardDescription>Boshlang'ich</CardDescription>
//                 <div className="mt-4">
//                   <span className="text-4xl font-bold">0</span>
//                   <span className="text-slate-600"> so'm/oy</span>
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-2">
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>50 ta qarz</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>2 ta folder</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>Push notifications</span>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Plus */}
//             <Card className="border-blue-500 border-2 relative">
//               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
//                 Mashhur
//               </div>
//               <CardHeader>
//                 <CardTitle>Plus</CardTitle>
//                 <CardDescription>Kichik biznes</CardDescription>
//                 <div className="mt-4">
//                   <span className="text-4xl font-bold">49,900</span>
//                   <span className="text-slate-600"> so'm/oy</span>
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-2">
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>500 ta qarz</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>10 ta folder</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>SMS + Push</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>Export (Excel/PDF)</span>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Pro */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Pro</CardTitle>
//                 <CardDescription>Professional</CardDescription>
//                 <div className="mt-4">
//                   <span className="text-4xl font-bold">99,900</span>
//                   <span className="text-slate-600"> so'm/oy</span>
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-2">
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>Cheksiz qarz</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>Cheksiz folder</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>Priority support</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                   <span>API access</span>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <footer className="border-t bg-white mt-16">
//         <div className="container mx-auto px-4 py-8">
//           <div className="text-center text-slate-600">
//             <p>&copy; 2026 Qarz Daftari. Barcha huquqlar himoyalangan.</p>
//           </div>
//         </div>
//       </footer>
//     </main>
//   )
// }


// src/app/page.tsx
export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1>Qarz Daftari</h1>
      <a href="/login" style={{ 
        padding: '10px 20px', 
        background: '#3B82F6', 
        color: 'white',
        textDecoration: 'none',
        borderRadius: '8px'
      }}>
        Kirish
      </a>
    </div>
  )
}