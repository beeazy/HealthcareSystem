'use client'

import Link from 'next/link'

interface AuthErrorProps {
  title: string
  message: string
  action?: {
    text: string
    href: string
  }
}

export function AuthError({ title, message, action }: AuthErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        {action && (
          <div>
            <Link
              href={action.href}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {action.text}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 