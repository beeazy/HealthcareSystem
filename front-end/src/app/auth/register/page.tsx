import { RegisterForm } from "@/components/auth/register-form"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function RegisterPage() {
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
              Welcome to HealthCare
            </h1>
            <p className="text-sm text-muted-foreground">
              Create your account to get started.
            </p>
          </div>
          <Card className="border-none shadow-none">
            <CardContent className="p-0">
              <RegisterForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
