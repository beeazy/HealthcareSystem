import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      <header className="flex justify-center pt-16 pb-6">
        <div className="rounded-full bg-white/80 shadow-lg ring-2 ring-primary/20 p-4 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Healthcare Logo"
            width={96}
            height={96}
            className="object-contain brightness-0"
            priority
          />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Welcome to AfyaOs
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Streamline your healthcare operations with our modern, secure, and efficient management platform. Manage appointments, records, and more—all in one place.
                </p>
              </div>
              <div className="space-x-4">
                <Link
                  href="/auth/login"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Get Started
                </Link>
                <Link
                  href="/about"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-semibold shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex justify-center pb-6">
        <Link href="/terms" className="text-xs text-muted-foreground hover:underline">
          Terms & Conditions
        </Link>
      </footer>
    </div>
  )
}
