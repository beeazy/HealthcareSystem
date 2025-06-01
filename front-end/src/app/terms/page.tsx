import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">Terms & Conditions</h1>
        <div className="text-muted-foreground text-left text-sm md:text-base space-y-4">
          <p>
            By using the AfyaOs platform, you agree to our terms and conditions. Please read them carefully before using our services.
          </p>
          <p>
            <strong>1. Use of Service:</strong> You agree to use the platform only for lawful purposes and in accordance with all applicable laws and regulations.
          </p>
          <p>
            <strong>2. Privacy:</strong> We are committed to protecting your privacy. Please review our Privacy Policy for more information.
          </p>
          <p>
            <strong>3. Data Security:</strong> We use industry-standard security measures to protect your data.
          </p>
          <p>
            <strong>4. Changes:</strong> We may update these terms from time to time. Continued use of the platform constitutes acceptance of the new terms.
          </p>
        </div>
        <Link href="/" className="inline-block mt-4 text-primary hover:underline font-medium">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
} 