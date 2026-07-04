'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function saveAttempt(input: {
  spotId: string
  userAction: string
  correctAction: string
  isCorrect: boolean
  decisionTimeMs: number
}) {
  const supabase = await createServerSupabaseClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('attempts')
    .insert({
      user_id: user.id,
      spot_id: input.spotId,
      user_action: input.userAction,
      correct_action: input.correctAction,
      is_correct: input.isCorrect,
      decision_time_ms: input.decisionTimeMs,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveSession(input: {
  config: Record<string, unknown>
  accuracy: number
  avgTimeMs: number
  totalDecisions: number
}) {
  const supabase = await createServerSupabaseClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) throw new Error('Not authenticated')

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      config: input.config,
      accuracy: input.accuracy,
      avg_time_ms: input.avgTimeMs,
      total_decisions: input.totalDecisions,
      status: 'completed',
      end_time: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return session
}

export async function saveMistake(input: {
  spotId: string
  errorType: string
  priorityScore: number
}) {
  const supabase = await createServerSupabaseClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('mistakes')
    .upsert({
      user_id: user.id,
      spot_id: input.spotId,
      error_type: input.errorType,
      priority_score: input.priorityScore,
      next_review_at: new Date().toISOString(),
    }, { onConflict: 'user_id,spot_id', ignoreDuplicates: false })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getDueMistakes() {
  const supabase = await createServerSupabaseClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) return []

  const { data, error } = await supabase
    .from('mistakes')
    .select('*, spots(*)')
    .eq('user_id', user.id)
    .lte('next_review_at', new Date().toISOString())
    .order('priority_score', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}

export async function getUserStats() {
  const supabase = await createServerSupabaseClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) return null

  const { data: attempts } = await supabase
    .from('attempts')
    .select('is_correct, decision_time_ms')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(200)

  if (!attempts || attempts.length === 0) return null

  const total = attempts.length
  const correct = attempts.filter(a => a.is_correct).length
  const avgTime = attempts.reduce((s, a) => s + a.decision_time_ms, 0) / total

  return {
    totalDecisions: total,
    accuracy: total > 0 ? correct / total : 0,
    avgTimeMs: avgTime,
  }
}
