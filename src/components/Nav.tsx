'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { Zap, Goal, Grid3X3, Sun, Moon, LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/train', label: 'Train', shortcut: 'T', icon: Zap },
  { href: '/mistakes', label: 'Mistakes', shortcut: 'M', icon: Goal },
  { href: '/range-painter', label: 'Range', shortcut: 'P', icon: Grid3X3 },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    router.push('/train')
  }

  return (
    <nav className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 overflow-x-auto [&::-webkit-scrollbar]:hidden">
      <Link href="/" className="shrink-0 size-8 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors">
        <span className="text-primary font-bold text-base">♠</span>
      </Link>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0 sm:gap-0.5 px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="size-4 sm:size-3.5" />
              <span className="hidden sm:inline leading-none">{item.label}</span>
              <span className="sm:hidden leading-none mt-px">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 ml-auto shrink-0">
        <button
          onClick={toggleTheme}
          className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {loading ? (
          <span className="text-xs text-muted-foreground px-2 shrink-0">...</span>
        ) : user ? (
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleSignOut}
              className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="text-[10px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition-all shadow-sm shrink-0"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
