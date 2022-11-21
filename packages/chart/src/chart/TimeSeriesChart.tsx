import { Mix, MixConfig } from '@ant-design/plots'
import { getValueFormat } from '@baurine/grafana-value-formats'
import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import { TriggerParams } from '../prometheus/prom_data_accessor'

import { ChartRef, useChartRefParams } from './chart_ref'
import { ProcessedData, Result, useDataAccessor } from './data_accessor'
import { TransformNullValue } from './types'

export interface TimeSeriesChartProps<P = any, TP = any> {
  onEvents?: Record<string, Function>
  modifyConfig?: (originConfig: MixConfig) => MixConfig
  timezone?: number
  nullValue?: TransformNullValue
  renderError?: React.ReactNode
  renderLoading?: React.ReactNode
  children?: React.ReactNode
  style?: React.CSSProperties
}

export const TimeSeriesChart = forwardRef<
  typeof Mix | null,
  TimeSeriesChartProps
>(function TimeSeriesChart(
  {
    onEvents,
    modifyConfig = (cfg: MixConfig) => cfg,
    nullValue = TransformNullValue.NULL,
    children,
    style,
  },
  forwardRef
) {
  const { chartId, chartRef } = useChartRefParams()
  const [dataContext] = useDataAccessor()
  const { results, triggerParams } = dataContext || {}
  const result = results?.[chartId]
  const [plots, setPlots] = useState<MixConfig['plots']>([])
  const config: MixConfig = useMemo(
    () => ({ ...DEFAULT_MIX_CONFIG, plots }),
    [plots]
  )

  useEffect(() => {
    async function fetchData() {
      if (!result) {
        return
      }

      const chartData = await Promise.all(
        result.map(rst => processPlots(rst, triggerParams!))
      )

      console.log(chartData)
      const plots: MixConfig['plots'] = []
      chartData.forEach(cd => plots.push(...cd!))
      setPlots(plots)
    }

    fetchData()
  }, [result, triggerParams])

  return (
    <ChartRef identifier={chartId} chartRef={chartRef}>
      {plots!.length && <Mix {...config} />}
      {children}
    </ChartRef>
  )
})

async function processPlots(
  result: Result,
  triggerParams: TriggerParams
): Promise<MixConfig['plots']> {
  const { promise, queryGroup } = result
  const { position, unit } = queryGroup
  const dataList = await Promise.all(promise)
  const plots: { [type: string]: any } = {}

  const formatter = (v: any) => {
    let _unit = unit || 'none'
    if (['short', 'none'].includes(_unit) && v < 1) {
      return v.toPrecision(3)
    }
    return getValueFormat(_unit)(v, 2)
  }

  dataList.forEach(data => {
    data?.forEach(d => {
      if (!plots[d.type]) {
        plots[d.type] = {
          type: d.type,
          options: {
            data: [],
            xField: 'timestamp',
            yField: 'data',
            shape: 'circle',
            colorField: 'name',
            seriesField: 'name',
            meta: {
              timestamp: {
                sync: true,
                type: 'time',
                min: triggerParams.start_time * 1000,
                max: triggerParams.end_time * 1000,
              },
              data: {
                nice: true,
                formatter,
              },
            },
          },
        } as any
      }

      plots[d.type].options.data.push(
        ...d.data.map(_d => ({
          timestamp: _d[0],
          data: _d[1],
          name: d.name,
        }))
      )
    })
  })

  return Object.values(plots)
}

const DEFAULT_MIX_CONFIG: MixConfig = {
  tooltip: {
    shared: true,
  },
  legend: {
    flipPage: true,
    maxRow: 2,
    layout: 'horizontal',
    position: 'bottom',
  },
  syncViewPadding: true,
}
