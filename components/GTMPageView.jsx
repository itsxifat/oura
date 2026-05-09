'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { trackPageView } from '@/lib/gtm'

export default function GTMPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs = searchParams.toString()
    trackPageView(pathname + (qs ? `?${qs}` : ''))
  }, [pathname, searchParams])

  return null
}
