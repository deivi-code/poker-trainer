'use client'

import { useState } from 'react'
import { RangeGrid, RangeLegend, ScenarioSelector, useRangeState } from '@/components/range-painter/RangeGrid'
import { RangeScenario } from '@/engine/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Grid3X3, Eraser, Lightbulb, ListChecks } from 'lucide-react'

const DEFAULT_SCENARIO: RangeScenario = { context: 'open', heroPosition: 'BTN', label: 'BTN Open' }

export default function RangePainterPage() {
  const [scenario, setScenario] = useState<RangeScenario>(DEFAULT_SCENARIO)
  const { range, toggleCell, resetRange } = useRangeState()

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full p-4 space-y-4">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center ring-1 ring-accent/20">
            <Grid3X3 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Range Painter</h1>
            <p className="text-xs text-muted-foreground">
              Select a scenario and paint your range
            </p>
          </div>
        </div>
      </div>

      <Card className="p-4 space-y-3 animate-fade-in-up">
        <ScenarioSelector selected={scenario} onSelect={setScenario} />
      </Card>

      <Card className="p-4 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{scenario.label}</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
              {Object.values(range).filter(Boolean).length} hands
            </span>
          </div>
          <Button
            onClick={resetRange}
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
          >
            <Eraser className="size-3" />
            Clear
          </Button>
        </div>
        <RangeGrid scenario={scenario} range={range} onCellToggle={toggleCell} />
      </Card>

      <Card className="p-3 animate-fade-in-up">
        <RangeLegend />
      </Card>

      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
        <Card className="p-3 space-y-1.5 animate-fade-in-up">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Lightbulb className="size-3.5 text-accent" />
            Tip
          </div>
          <p className="leading-relaxed">Each cell cycles through action types. The diagonal (pairs) is highlighted for opening ranges.</p>
        </Card>
        <Card className="p-3 space-y-1.5 animate-fade-in-up">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <ListChecks className="size-3.5 text-primary" />
            Actions
          </div>
          <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
            <li><span className="text-red-400">Fold</span> — hands you fold</li>
            <li><span className="text-blue-400">Call</span> — hands you call with</li>
            <li><span className="text-emerald-400">2bet</span> — raise the open</li>
            <li><span className="text-purple-400">3bet</span> — re-raise</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
