import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import format from 'string-template'

import {
  DataAccessorContext,
  DataContext,
  ProcessedData,
  ResultGroup,
  useDataAccessor,
} from '../data_accessor'
import { QueryRegister, useQueryRegister } from './query_register'
import {
  PromDataErrorResponse,
  PromDataSuccessResponse,
  PromMatrixData,
} from './types'
import { processRawData, DEFAULT_MIN_INTERVAL_SEC } from './data'
import { computeStepByContainer } from '../utils/chart'

export interface TriggerParams {
  start_time: number
  end_time: number
  step?: number
}

export interface Trigger {
  (params: TriggerParams): void
}

interface Fetch {
  (query: string, triggerParams: Required<TriggerParams>): Promise<
    PromDataSuccessResponse | PromDataErrorResponse
  >
}

export interface PromDataAccessor {
  fetch: Fetch
  params?: TriggerParams
}

export const PromDataAccessor = forwardRef<
  Trigger,
  React.PropsWithChildren<PromDataAccessor>
>(function PromDataAccessor({ fetch, params, children }, ref) {
  const useDataState = useState<DataContext>()

  return (
    <DataAccessorContext.Provider value={useDataState}>
      <QueryRegister>
        <Fetcher fetch={fetch} params={params} ref={ref}>
          {children}
        </Fetcher>
      </QueryRegister>
    </DataAccessorContext.Provider>
  )
})

export type PromMatrixResult = PromMatrixData['result'][0]

const Fetcher = forwardRef<
  Trigger,
  React.PropsWithChildren<{ fetch: Fetch; params?: TriggerParams }>
>(function Fetcher({ fetch, params, children }, ref) {
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
    const results: ResultGroup<PromMatrixResult> = {}
    queryRegister.current?.forEach(queryGroup => {
      const chartId = queryGroup.chartId
      const step = computeStepByContainer(
        queryGroup.chartRef,
        [params.start_time, params.end_time],
        triggerParams.step
      )

      if (!results[chartId]) {
        results[chartId] = []
      }

      // Multiple queries in a query group.
      const promise: Promise<ProcessedData<PromMatrixResult> | null>[] =
        queryGroup.queries.map(q =>
          fetch(q.promql, { ...triggerParams, step }).then(resp => {
            if (resp.status !== 'success') {
              return null
            }
            // TODO: support other data types?
            if (
              Array.isArray(resp.data) ||
              resp.data?.resultType !== 'matrix'
            ) {
              return null
            }
            const result = resp.data.result
            // for empty chart
            if (!result.length) {
              return [
                {
                  color: q.color,
                  type: q.type,
                  name: '',
                  data: [],
                  rawData: {} as any,
                },
              ]
            }
            return result.map(r => ({
              color: q.color,
              type: q.type,
              name: format(q.name, r.metric),
              data: processRawData(r, triggerParams),
              rawData: r,
            }))
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

  useImperativeHandle(ref, () => batchFetch)

  useEffect(() => {
    if (!params) {
      return
    }
    batchFetch(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.start_time, params?.end_time, params?.step])

  return <>{children}</>
})
