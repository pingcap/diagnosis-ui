import { createContext, useContext, useState } from 'react'
import { ColorAttr } from '@antv/g2plot'

import { TriggerParams } from './prometheus/prom_data_accessor'
import { ChartType, QueryGroup } from './prometheus/query_register'
import { DataPoint } from './chart/types'

export type ProcessedData<T = any> = {
  data: DataPoint[]
  rawData: T
  name: string
  type: ChartType
  color?: ColorAttr
}[]

export type Result<T = any> = {
  queryGroup: QueryGroup
  promise: Promise<ProcessedData<T> | null>[]
}

export type ResultGroup<T = any> = {
  [id: string]: Result<T>[]
}

export type DataContext = { results: ResultGroup; triggerParams: TriggerParams }

export const DataAccessorContext =
  createContext < ReturnType < typeof useState < DataContext >>> (null as any)

export const useDataAccessor = () => {
  return useContext(DataAccessorContext)
}
