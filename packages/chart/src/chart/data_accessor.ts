import { createContext, useContext, useState } from 'react'
import { ColorAttr } from '@antv/g2plot'

import { TriggerParams } from '../prometheus/prom_data_accessor'
import { ChartType, QueryGroup } from '../prometheus/query_register'
import { DataPoint } from './types'

export type ProcessedData = {
  data: DataPoint[]
  name: string
  type: ChartType
  color?: ColorAttr
}[]

export type Result = {
  queryGroup: QueryGroup
  promise: Promise<ProcessedData | null>[]
}

export type ResultGroup = {
  [id: string]: Result[]
}

export type DataContext = { results: ResultGroup; triggerParams: TriggerParams }

export const DataAccessorContext =
  createContext < ReturnType < typeof useState < DataContext >>> (null as any)

export const useDataAccessor = () => {
  return useContext(DataAccessorContext)
}
