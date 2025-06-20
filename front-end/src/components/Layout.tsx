import { ReactNode } from 'react'
import Navigation from './Navigation'
interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {

  return (
    <div className="min-h-screen bg-background">
      {/* <Navigation /> */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
} 