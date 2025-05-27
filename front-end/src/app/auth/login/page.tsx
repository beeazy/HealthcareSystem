import { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex items-center justify-center lg:max-w-none lg:grid lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-indigo-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="hover:text-blue-200 transition-colors">
            Healthcare System
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Secure Healthcare Management</h2>
            <p className="text-lg leading-relaxed text-blue-100">
              Access your healthcare dashboard securely. Manage appointments, view patient records, and coordinate care - all in one place.
            </p>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
                Secure and reliable data storage
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
                24/7 secure access to patient records
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
                Real-time appointment scheduling
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your healthcare dashboard
            </p>
          </div>
          <LoginForm />
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 rounded-lg border p-2 hover:bg-muted transition-colors">
              <span>Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg border p-2 hover:bg-muted transition-colors">
              <span>GitHub</span>
            </button>
          </div> */}
          <p className="text-center text-sm text-muted-foreground">
            New to the platform?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary hover:text-primary/90 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}