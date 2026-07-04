'use client'

import { useSessionStore } from '@/store/session-store'
import { MistakeList } from '@/components/mistakes/MistakeList'
import { useRouter } from 'next/navigation'
import type { Mistake } from '@/engine/types'
import { AlertTriangle } from 'lucide-react'

export default function MistakesPage() {
  const router = useRouter()
  const { mistakeList } = useSessionStore()

  const handleReview = (mistake: Mistake) => {
    router.push('/train')
  }

  return (
    <div className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center ring-1 ring-destructive/20">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Mistakes</h1>
            <p className="text-xs text-muted-foreground">Spots that need review</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-lg ring-1 ring-border">
          <AlertTriangle className="size-3.5 text-destructive" />
          <span className="text-sm font-semibold tabular-nums">{mistakeList.length}</span>
        </div>
      </div>

      <MistakeList mistakes={mistakeList} onReview={handleReview} />
    </div>
  )
}
