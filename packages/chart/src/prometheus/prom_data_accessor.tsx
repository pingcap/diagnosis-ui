import React, { useEffect, useState } from 'react'
import { getValueFormat } from '@baurine/grafana-value-formats'
import format from 'string-template'
import {
  TooltipComponentOption,
  SeriesOption,
  RegisteredSeriesOption,
} from 'echarts'

import { DEFAULT_MIN_INTERVAL_SEC } from './index'
import {
  DataAccessorContext,
  DataGroup,
  DataSeries,
  useDataAccessor,
} from '../chart/data_accessor'
import {
  Query,
  QueryGroup,
  QueryRegister,
  useQueryRegister,
} from './query_register'
import {
  PromDataErrorResponse,
  PromDataSuccessResponse,
  PromMatrixData,
} from './types'
import { processRawData } from './data'
import { DataPoint } from '../chart/types'
import { DEFAULT_LIGHT_COLOR } from '../utils/theme/colors'

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
  const useDataState = useState<DataGroup>()
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

type ProcessedData = ({ data: DataPoint[] } & Query)[]
type QueryResult = {
  [id: string]: {
    config: QueryGroup
    promise: Promise<ProcessedData | null>[]
  }
}
type ResultGroup = { [id: string]: ProcessedData }

const Fetcher: React.FC<PromDataAccessor> = ({
  fetch,
  setTrigger,
  children,
}) => {
  const queryRegister = useQueryRegister()
  const [, setDataGroup] = useDataAccessor()

  const batchFetch: Trigger = async params => {
    const triggerParams = { step: DEFAULT_MIN_INTERVAL_SEC, ...params }
    const queryResult: QueryResult = {}
    queryRegister.forEach(queryGroupConfig => {
      if (!queryResult[queryGroupConfig.chartId]) {
        queryResult[queryGroupConfig.chartId] = {
          config: queryGroupConfig,
          promise: [],
        }
      }
      queryResult[queryGroupConfig.chartId].promise.push(
        ...queryGroupConfig.queries.map(q =>
          fetch(q.promql, triggerParams).then(resp => {
            if (resp.status !== 'success') {
              return null
            }
            // TODO: support PromMatrixData only
            if (
              Array.isArray(resp.data) ||
              resp.data?.resultType !== 'matrix'
            ) {
              return null
            }
            const result = resp.data.result
            // transform to series
            return result.map(r => ({
              ...q,
              name: format(q.name, r.metric),
              data: processRawData(r, triggerParams),
            }))
          })
        )
      )
    })

    // await all queries finish inside the data accessor
    // <PromDataAccessor>
    //   ... chart1
    //   <QueryGroup queries={[...]} />
    //   <QueryGroup queries={[...]} />
    //   ... chart2
    //   ...
    const resultGroup: ResultGroup = {}
    await Promise.all(
      Object.entries(queryResult).reduce((allPromise, [k, result]) => {
        const promiseGroup = result.promise.map(p =>
          p.then(d => {
            if (!d) {
              return
            }
            if (!resultGroup[k]) {
              resultGroup[k] = []
            }
            resultGroup[k].push(...d)
          })
        )
        allPromise.push(...promiseGroup)
        return allPromise
      }, [] as Promise<void>[])
    )

    setDataGroup(
      transformToEChartsOption(queryResult, resultGroup, triggerParams)
    )
  }

  useEffect(() => {
    setTrigger?.(batchFetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}

const transformToEChartsOption = (
  queryResult: QueryResult,
  resultGroup: ResultGroup,
  triggerParams: TriggerParams
): DataGroup => {
  return Object.entries(queryResult).reduce((prev, [id, result]) => {
    const { config } = result
    const formatter = (v: any) => {
      let _unit = config.unit || 'none'
      if (['short', 'none'].includes(_unit) && v < 1) {
        return v.toPrecision(3)
      }
      return getValueFormat(_unit)(v, 2)
    }
    let tooltipTriggerBit = 0
    const series = resultGroup[id].map(_d => {
      tooltipTriggerBit = tooltipTriggerBit | tooltipTriggerMap[_d.type]
      return {
        name: _d.name,
        type: _d.type,
        data: _d.data,
      } as SeriesOption
    })

    prev[id] = {
      tooltip: {
        confine: true,
        extraCssText: 'width:auto; white-space:pre-wrap;',
        order: 'valueDesc',
        trigger: TooltipTriggerStr[tooltipTriggerBit] as
          | 'item'
          | 'axis'
          | 'none',
        valueFormatter: formatter,
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        // right: 0,
        // orient: 'vertical',
      },
      xAxis: {
        type: 'time',
        min: triggerParams.start_time * 1000,
        max: triggerParams.end_time * 1000,
        axisPointer: {
          show: true,
          snap: true,
          triggerTooltip: false,
        },
        axisLabel: {
          formatter: {
            day: '{yyyy}-{MM}-{dd}',
          },
        },
      },
      yAxis: {
        axisLabel: {
          formatter,
        },
        axisPointer: {
          show: true,
          triggerTooltip: false,
          label: {
            formatter: ({ value }) => formatter(value),
          },
        },
      },
      series,
      color: DEFAULT_LIGHT_COLOR,
    }
    return prev
  }, {} as DataGroup)
}

enum TooltipTriggerBit {
  Axis = 1,
  Item = 0,
}

const TooltipTriggerStr: { [bit: number]: string } = {
  1: 'axis',
  0: 'item',
}

const tooltipTriggerMap: Record<'line' | 'bar' | 'scatter', TooltipTriggerBit> =
  {
    line: TooltipTriggerBit.Axis,
    bar: TooltipTriggerBit.Axis,
    scatter: TooltipTriggerBit.Item,
  }
