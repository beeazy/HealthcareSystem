import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">About HealthCare System</h1>
        <p className="text-muted-foreground text-lg">
          HealthCare System is a modern, secure, and efficient platform designed to streamline healthcare operations for clinics, hospitals, and patients. Our mission is to empower healthcare professionals and patients with easy-to-use tools for managing appointments, records, and communication—all in one place.
        </p>
        <Link href="/" className="inline-block mt-4 text-primary hover:underline font-medium">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
} 