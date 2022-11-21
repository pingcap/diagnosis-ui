import { Mix, MixConfig } from '@ant-design/plots'
import { getValueFormat } from '@baurine/grafana-value-formats'
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { TriggerParams } from '../../prometheus/prom_data_accessor'

import { ChartRef, useChartRefParams } from '../chart_ref'
import { Result, useDataAccessor } from '../../data_accessor'
import { GetElementType, TransformNullValue } from '../types'
import { DEFAULT_MIX_CONFIG } from './default_config'

type Plot = GetElementType<Required<MixConfig>['plots']>

export interface TimeSeriesChartProps<P = any, TP = any> {
  onEvents?: Record<string, Function>
  modifyConfig?: (originConfig: MixConfig) => MixConfig
  timezone?: number
  nullValue?: TransformNullValue
  renderError?: React.ReactNode
  renderLoading?: React.ReactNode
  width?: number
  height?: number
  autoFit?: boolean
  children?: React.ReactNode
}

export const TimeSeriesChart = forwardRef<
  typeof Mix | null,
  TimeSeriesChartProps
>(function TimeSeriesChart(
  {
    onEvents,
    modifyConfig = (cfg: MixConfig) => cfg,
    timezone,
    nullValue = TransformNullValue.NULL,
    renderError,
    renderLoading,
    width,
    height,
    autoFit = true,
    children,
  },
  forwardRef
) {
  const { chartId, chartRef } = useChartRefParams()
  const [dataContext] = useDataAccessor()
  const { results, triggerParams } = dataContext || {}
  const result = results?.[chartId]
  const [plots, setPlots] = useState<Required<MixConfig>['plots']>(
    DEFAULT_MIX_CONFIG.plots!
  )
  const config: MixConfig = useMemo(
    () =>
      modifyConfig({
        ...DEFAULT_MIX_CONFIG,
        width,
        height,
        autoFit,
        plots,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plots]
  )

  useImperativeHandle(forwardRef, () => chartRef.current as typeof Mix, [
    chartRef,
  ])

  useEffect(() => {
    async function fetchData() {
      if (!result) {
        return
      }

      const chartData = await Promise.all(
        result.map(rst => dataToPlots(rst, triggerParams!, nullValue))
      )

      console.log(chartData)
      const plots: MixConfig['plots'] = []
      chartData.forEach(cd => plots.push(...cd!))
      setPlots(plots)
    }

    fetchData()
  }, [result, triggerParams, nullValue])

  return (
    <ChartRef identifier={chartId} chartRef={chartRef}>
      <Mix {...config} ref={chartRef} />
      {children}
    </ChartRef>
  )
})

async function dataToPlots(
  result: Result,
  triggerParams: TriggerParams,
  nullValue: TransformNullValue
): Promise<MixConfig['plots']> {
  const { promise, queryGroup } = result
  const { position, unit } = queryGroup
  const dataList = await Promise.all(promise)
  const plots: { [type: string]: Plot } = {}

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
                alias: 'Time',
                type: 'time',
                min: triggerParams.start_time * 1000,
                max: triggerParams.end_time * 1000,
                mask: 'YYYY-MM-DD HH:mm:ss',
              },
              data: {
                sync: true,
                nice: true,
                alias: 'Value',
                formatter,
              },
              name: {
                alias: 'Name',
              },
            },
            color: d.color,
          },
        } as Plot
      }

      plots[d.type].options.data!.push(
        ...d.data.map(_d => ({
          timestamp: _d[0],
          data: !!_d[1]
            ? _d[1]
            : nullValue === TransformNullValue.NULL
            ? null
            : 0,
          name: d.name,
        }))
      )
    })
  })

  return Object.values(plots)
}