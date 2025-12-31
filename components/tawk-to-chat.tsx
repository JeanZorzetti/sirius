'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function TawkToChat() {
  const pathname = usePathname()
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Show Tawk.to only on marketing pages (NOT on dashboard)
    const isMarketingPage = !pathname.startsWith('/dashboard') &&
                           !pathname.startsWith('/login') &&
                           !pathname.startsWith('/register')

    setShouldShow(isMarketingPage)

    // Hide Tawk.to widget if on dashboard
    if (typeof window !== 'undefined' && window.Tawk_API) {
      if (isMarketingPage) {
        window.Tawk_API.showWidget()
      } else {
        window.Tawk_API.hideWidget()
      }
    }
  }, [pathname])

  if (!shouldShow) return null

  return (
    <Script id="tawk-to" strategy="lazyOnload">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/69551ffa442844197c21ef8e/1jdq89qse';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Tawk_API?: {
      showWidget: () => void
      hideWidget: () => void
    }
  }
}
