'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Sparkles, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error } = await signUp(email, password)
    if (error) {
      setError(error)
      setSubmitting(false)
    } else {
      setSuccess(true)
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full p-8 space-y-6 text-center animate-scale-in">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-success/10 text-success mx-auto">
            <CheckCircle2 className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a confirmation link to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <Link href="/auth/login">
            <Button variant="default" size="xl" className="w-full">
              Go to Sign In
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-sm w-full p-8 space-y-6 animate-fade-in-up">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary mb-1 ring-1 ring-primary/20">
            <UserPlus className="size-6" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Start tracking your progress across sessions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-9"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">At least 6 characters</p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 flex items-center gap-2">
              <Sparkles className="size-3.5 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} variant="default" size="xl" className="w-full">
            {submitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  )
}
