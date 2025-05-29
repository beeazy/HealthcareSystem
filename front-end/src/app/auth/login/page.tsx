"use client"

import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Stethoscope, Shield, Clock } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex items-center justify-center lg:max-w-none lg:grid lg:grid-cols-2 lg:px-0">
      {/* Left side - Branding and Features */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
            <Stethoscope className="h-6 w-6" />
            <span>Healthcare System</span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <div className="space-y-8">
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold tracking-tight">Secure Healthcare Management</h2>
              <p className="mt-4 text-lg leading-relaxed text-blue-100">
                Access your healthcare dashboard securely. Manage appointments, view patient records, and coordinate care - all in one place.
              </p>
            </div>
            <ul className="space-y-4 text-blue-100">
              <li className="flex items-center gap-3 transition-transform hover:translate-x-1">
                <Shield className="h-5 w-5 text-blue-300" />
                <span>Secure and reliable data storage</span>
              </li>
              <li className="flex items-center gap-3 transition-transform hover:translate-x-1">
                <Clock className="h-5 w-5 text-blue-300" />
                <span>24/7 secure access to patient records</span>
              </li>
              <li className="flex items-center gap-3 transition-transform hover:translate-x-1">
                <Stethoscope className="h-5 w-5 text-blue-300" />
                <span>Real-time appointment scheduling</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your healthcare dashboard
            </p>
          </div>

          <div className="animate-fade-in-delay">
            <LoginForm />
          </div>

          <p className="text-center text-sm text-muted-foreground animate-fade-in-delay-2">
            New to the platform?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary hover:text-primary/90 transition-colors underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}