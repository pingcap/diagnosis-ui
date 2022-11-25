import React, { createContext, useContext } from 'react'
import { PlotEvent } from '@ant-design/plots'

const SyncTooltipContext = createContext<StandaloneEventBus | null>(null)

interface SyncTooltipProps {}

export const SyncTooltip: React.FC<SyncTooltipProps> = ({ children }) => {
  return (
    <SyncTooltipContext.Provider value={new StandaloneEventBus()}>
      {children}
    </SyncTooltipContext.Provider>
  )
}

export const useSyncTooltip = () => {
  return useContext(SyncTooltipContext)
}

type SyncEvent = {
  type: 'move' | 'hide'
  evt: PlotEvent
  chartId: string
}

type EventFn = (e: SyncEvent) => void

class StandaloneEventBus {
  private events: EventFn[] = []

  public subscribe(evt: EventFn) {
    this.events.push(evt)
    return () => {
      this.events = this.events.filter(e => e !== evt)
    }
  }

  public emit(e: SyncEvent) {
    this.events.forEach(evt => evt(e))
  }
}
