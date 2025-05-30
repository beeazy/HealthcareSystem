"use client"

import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/20">
      <div className="container flex h-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center">
              <div className="rounded-full">
                <Image
                  src="/logo.png"
                  alt="Healthcare Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your healthcare dashboard
            </p>
          </div>
          <div className="animate-fade-in">
            <LoginForm />
          </div>
          <p className="text-center text-sm text-muted-foreground animate-fade-in-delay">
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