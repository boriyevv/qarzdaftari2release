import { Metadata } from 'next'
import ContactPage from './page'

export const metadata: Metadata = {
  title: 'Kirish',
  description: 'Qarz Daftari ga kiring',
}

export default function LoginPage() {
  return <ContactPage />
}