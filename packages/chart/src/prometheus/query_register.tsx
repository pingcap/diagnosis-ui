import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  RefObject,
  MutableRefObject,
} from 'react'
import { ColorAttr } from '@antv/g2plot'

import { Chart, useChartRef } from '../chart/chart_ref'

export type ChartType = 'line' | 'bar' | 'column' | 'area' | 'scatter'

export interface Query {
  promql: string
  name: string
  type: ChartType
  color?: ColorAttr
}

export interface QueryGroup {
  chartId: string
  chartRef: React.RefObject<Chart>
  queries: Query[]
  unit: string
  position?: string
}

const QueryRegisterContext = createContext<RefObject<QueryGroup[]>>(null as any)

export const QueryRegister: React.FC = ({ children }) => {
  const register = useRef([])
  return (
    <QueryRegisterContext.Provider value={register}>
      {children}
    </QueryRegisterContext.Provider>
  )
}

export const useQueryRegister = () => {
  return useContext(QueryRegisterContext)
}

export const PromQueryGroup: React.FC<
  Omit<QueryGroup, 'chartId' | 'chartRef'>
> = ({ queries, unit, position }) => {
  const register = useQueryRegister() as MutableRefObject<QueryGroup[]>
  const chartRef = useChartRef()
  useEffect(() => {
    const group = {
      chartId: chartRef.identifier,
      chartRef: chartRef.chartRef,
      queries,
      unit,
      position,
    }
    register.current?.push(group)
    return () => {
      register.current = register.current.filter(g => g !== group)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries, unit, position])
  return null
}
