import { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { ErrorBoundary } from './ErrorBoundary'
import AIChat from '../dashboard/AIChat'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <AIChat />
      </div>
    </ErrorBoundary>
  )
}
