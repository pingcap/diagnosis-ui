import React, { createContext, useContext, useEffect } from 'react'
import { useChartRef } from '../chart/chart_ref'

export interface Query {
  promql: string
  name: string
  color: string
  type: 'line' | 'bar' | 'column' | 'area' | 'scatter'
}

export interface QueryGroup {
  chartId: string
  queries: Query[]
  unit: string
  position?: string
}

const QueryRegisterContext = createContext<QueryGroup[]>([])

export const QueryRegister: React.FC = ({ children }) => {
  const register = new Array()
  return (
    <QueryRegisterContext.Provider value={register}>
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
