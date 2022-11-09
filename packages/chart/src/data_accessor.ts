import { createContext, useContext, useState } from 'react'
import { Query } from './prometheus/query_register'
import { EChartsOption } from 'echarts'
import { DataPoint } from './types'

export type DataSeries = {
  name: string
  color: string
  type: 'line' | 'bar' | 'scatter'
  data: DataPoint[]
}

export type DataGroup = { [id: string]: EChartsOption }

export const DataAccessorContext =
  createContext < ReturnType < typeof useState < DataGroup >>> (null as any)

export const useDataAccessor = () => {
  return useContext(DataAccessorContext)
}
