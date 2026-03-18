import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/analytics',
        '/debtor/',
        '/pricing',
        '/profile',
        '/sms-credits',
      ],
    },
    sitemap: 'https://debtbook.uz/sitemap.xml',
  }
}