import React, { createContext, useContext, useEffect, useRef } from 'react'
import { ColorAttr } from '@antv/g2plot'

import { useChartRef } from '../chart/chart_ref'

export type ChartType = 'line' | 'bar' | 'column' | 'area' | 'scatter'

export interface Query {
  promql: string
  name: string
  type: ChartType
  color?: ColorAttr
}

export interface QueryGroup {
  chartId: string
  queries: Query[]
  unit: string
  position?: string
}

const QueryRegisterContext = createContext<QueryGroup[]>([])

export const QueryRegister: React.FC = ({ children }) => {
  const register = useRef([])
  return (
    <QueryRegisterContext.Provider value={register.current}>
      {children}
    </QueryRegisterContext.Provider>
  )
}

export const useQueryRegister = () => {
  return useContext(QueryRegisterContext)
}

export const PromQueryGroup: React.FC<Omit<QueryGroup, 'chartId'>> = ({
  queries,
  unit,
  position,
}) => {
  const register = useQueryRegister()
  const chartRef = useChartRef()
  useEffect(() => {
    register.push({ chartId: chartRef.identifier, queries, unit, position })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
