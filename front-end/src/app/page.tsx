import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background/80 to-muted/20">
      <header className="flex justify-center pt-20 pb-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative rounded-full bg-background/40 backdrop-blur-sm p-6 flex items-center justify-center transform transition-all duration-500 group-hover:scale-105 group-hover:bg-background/60">
            <Image
              src="/logo.png"
              alt="Healthcare Logo"
              width={96}
              height={96}
              className="object-contain brightness-0 transition-transform duration-500 group-hover:scale-110"
              priority
            />
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <section className="w-full max-w-6xl mx-auto py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-primary via-cyan-500 to-cyan-600 bg-clip-text text-transparent animate-gradient">
                  Welcome to AfyaOS
                </h1>
                <p className="mx-auto max-w-[700px] text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Streamline your healthcare operations with our modern, secure, and efficient management platform. Manage appointments, records, and more—all in one place.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 hover:scale-105 hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-primary/20 bg-background/50 px-8 text-base font-semibold text-foreground shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-primary/5 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex justify-center pb-8 pt-4">
        <Link 
          href="/terms" 
          className="text-sm text-muted-foreground/80 hover:text-muted-foreground transition-colors duration-200 hover:underline underline-offset-4"
        >
          Terms & Conditions
        </Link>
      </footer>
    </div>
  )
}

// Add this to your global CSS file
const styles = `
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-gradient {
  background-size: 200% auto;
  animation: gradient 8s linear infinite;
}`;
