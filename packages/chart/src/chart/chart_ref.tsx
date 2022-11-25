import React, { createContext, useContext, useRef } from 'react'
import { MixConfig, Plot } from '@ant-design/plots'

export interface GetChartRef {
  getChart: () => Plot<MixConfig>
}

interface ChartRefProps {
  identifier: string
  chartRef: React.RefObject<GetChartRef>
}

const ChartRefContext = createContext<ChartRefProps>(null as any)

export const ChartRef: React.FC<ChartRefProps> = ({
  identifier,
  chartRef,
  children,
}) => {
  return (
    <ChartRefContext.Provider value={{ identifier, chartRef }}>
      {children}
    </ChartRefContext.Provider>
  )
}

const SENTINEL = {}
let incrementalId = 0

export const useChartRefParams = () => {
  const chartRef = useRef<GetChartRef>(null)
  const chartId = useRef(SENTINEL)
  if (chartId.current === SENTINEL) {
    chartId.current = ++incrementalId
  }
  return { chartRef, chartId: `${chartId.current}` }
}

export const useChartRef = () => {
  return useContext(ChartRefContext)
}
