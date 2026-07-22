import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'Bridge - Summer Learning Adventure',
  description: 'Adaptive learning platform for rising 6th graders',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}