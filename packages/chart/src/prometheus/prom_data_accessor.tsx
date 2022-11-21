import React, { useEffect, useState } from 'react'
import format from 'string-template'

import { DEFAULT_MIN_INTERVAL_SEC } from './index'
import {
  DataAccessorContext,
  DataContext,
  ProcessedData,
  ResultGroup,
  useDataAccessor,
} from '../chart/data_accessor'
import { QueryRegister, useQueryRegister } from './query_register'
import { PromDataErrorResponse, PromDataSuccessResponse } from './types'
import { processRawData } from './data'

export interface TriggerParams {
  start_time: number
  end_time: number
  step?: number
}

export interface Trigger {
  (params: TriggerParams): void
}

export interface PromDataAccessor {
  fetch: (
    query: string,
    triggerParams: Required<TriggerParams>
  ) => Promise<PromDataSuccessResponse | PromDataErrorResponse>
  setTrigger?: (trigger: Trigger) => void
}

export const PromDataAccessor: React.FC<PromDataAccessor> = ({
  fetch,
  setTrigger,
  children,
}) => {
  const useDataState = useState<DataContext>()
  return (
    <DataAccessorContext.Provider value={useDataState}>
      <QueryRegister>
        <Fetcher fetch={fetch} setTrigger={setTrigger}>
          {children}
        </Fetcher>
      </QueryRegister>
    </DataAccessorContext.Provider>
  )
}

const Fetcher: React.FC<PromDataAccessor> = ({
  fetch,
  setTrigger,
  children,
}) => {
  const queryRegister = useQueryRegister()
  const [, setDataContext] = useDataAccessor()

  // <PromDataAccessor>
  //   ... chart1
  //   <QueryGroup queries={[...]} />
  //   <QueryGroup queries={[...]} />
  //   ... chart2
  //   ...

  // Batch requests with data accessor.
  const batchFetch: Trigger = async params => {
    const triggerParams = { step: DEFAULT_MIN_INTERVAL_SEC, ...params }
    const results: ResultGroup = {}
    queryRegister.forEach(queryGroup => {
      const chartId = queryGroup.chartId

      if (!results[chartId]) {
        results[chartId] = []
      }

      // Multiple queries in a query group.
      const promise = queryGroup.queries.map(q =>
        fetch(q.promql, triggerParams).then(resp => {
          if (resp.status !== 'success') {
            return null
          }
          // TODO: support PromMatrixData only
          if (Array.isArray(resp.data) || resp.data?.resultType !== 'matrix') {
            return null
          }
          const result = resp.data.result
          return result.map(r => ({
            ...q,
            name: format(q.name, r.metric),
            data: processRawData(r, triggerParams),
          })) as ProcessedData
        })
      )

      // Multiple query groups in a chart.
      // Each query group can have its own yAxis and unit config.
      results[chartId].push({
        promise,
        queryGroup,
      })
    })

    setDataContext({ results, triggerParams })
  }

  useEffect(() => {
    setTrigger?.(batchFetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
