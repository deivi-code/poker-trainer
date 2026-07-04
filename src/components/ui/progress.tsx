"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Progress({
  className,
  indicatorClassName,
  value = 0,
}: React.ComponentProps<"div"> & {
  indicatorClassName?: string
  value?: number
}) {
  return (
    <div
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className={cn(
          "h-full w-full flex-1 rounded-full bg-primary transition-all duration-500 ease-out",
          indicatorClassName
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export { Progress }
