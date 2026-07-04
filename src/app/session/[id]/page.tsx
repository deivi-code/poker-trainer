'use client'

import { useParams } from 'next/navigation'
import { useSessionStore } from '@/store/session-store'
import { SessionSummaryView } from '@/components/session/SessionSummary'
import { useRouter } from 'next/navigation'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const { sessionHistory } = useSessionStore()

  const summary = sessionHistory.find(s => s.sessionId === params.id)

  if (!summary) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Session not found</p>
          <button
            onClick={() => router.push('/train')}
            className="text-primary underline"
          >
            Start a new session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <SessionSummaryView
        summary={summary}
        onNewSession={() => router.push('/train')}
      />
    </div>
  )
}
