import { Mix, MixConfig } from '@ant-design/plots'
import { Annotation } from '@antv/g2plot'
import { getValueFormat } from '@baurine/grafana-value-formats'
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'

import {
  PromMatrixResult,
  TriggerParams,
} from '../../prometheus/prom_data_accessor'
import { Chart, ChartRef, useChartRefParams } from '../chart_ref'
import { Result, useDataAccessor } from '../../data_accessor'
import { GetElementType, TransformNullValue } from '../types'
import { DEFAULT_MIX_CONFIG } from './default_config'
import { useSyncTooltip } from '../sync_tooltip'

type PlotConfig = GetElementType<Required<MixConfig>['plots']>

export interface TimeSeriesChartProps<P = any, TP = any> {
  onEvents?: MixConfig['onEvent']
  onReady?: MixConfig['onReady']
  modifyConfig?: (originConfig: MixConfig) => MixConfig
  timezone?: number
  nullValue?: TransformNullValue
  renderError?: React.ReactNode
  renderLoading?: React.ReactNode
  onLoadingChange?: (isLoading: boolean) => void
  width?: number
  height?: number
  autoFit?: boolean
  annotations?: Annotation[]
  children?: React.ReactNode
}

export const TimeSeriesChart = forwardRef<Chart, TimeSeriesChartProps>(
  function TimeSeriesChart(
    {
      onEvents,
      onReady,
      modifyConfig = (cfg: MixConfig) => cfg,
      timezone,
      nullValue = TransformNullValue.NULL,
      renderError,
      renderLoading,
      onLoadingChange,
      width,
      height,
      autoFit = true,
      annotations,
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

    useImperativeHandle(forwardRef, () => chartRef.current as any, [chartRef])

    useEffect(() => {
      async function fetchData() {
        if (!result) {
          return
        }

        onLoadingChange?.(true)
        const chartData = await Promise.all(
          result.map(rst =>
            dataToPlots(rst, triggerParams!, nullValue, annotations)
          )
        )

        const plots: MixConfig['plots'] = []
        chartData.forEach(cd => plots.push(...cd!))
        setPlots(plots)
        onLoadingChange?.(false)
      }

      fetchData()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result, triggerParams])

    const syncTooltip = useSyncTooltip()

    useEffect(() => {
      if (!syncTooltip) {
        return
      }

      // event of the other charts send to current chart
      const unsubscribe = syncTooltip.subscribe(e => {
        if (e.chartId === chartId) {
          return
        }

        if (e.type === 'move') {
          chartRef.current!.getChart().chart.showTooltip({
            x: e.evt.x || e.evt.data?.x,
            y: e.evt.y || e.evt.data?.y,
          })
          return
        }

        // if (e.type === 'hide') {
        //   chartRef.current!.getChart().chart.hideTooltip()
        //   return
        // }
      })

      // event of the current chart to other charts
      // chartRef.current!.getChart().on('element:mousemove', (evt: PlotEvent) => {
      //   syncTooltip.emit({ type: 'move', chartId, evt })
      // })
      // chartRef.current!.getChart().on('tooltip:hide', (evt: PlotEvent) => {
      //   syncTooltip.emit({ type: 'hide', chartId, evt })
      // })

      return () => {
        if (!syncTooltip) {
          return
        }
        unsubscribe()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <ChartRef identifier={chartId} chartRef={chartRef}>
        <Mix {...config} ref={chartRef} onReady={onReady} onEvent={onEvents} />
        {children}
      </ChartRef>
    )
  }
)

async function dataToPlots(
  result: Result<PromMatrixResult>,
  triggerParams: TriggerParams,
  nullValue: TransformNullValue,
  annotations?: Annotation[]
): Promise<MixConfig['plots']> {
  const { promise, queryGroup } = result
  const { position, unit } = queryGroup
  const dataList = await Promise.all(promise)
  const plots: { [type: string]: PlotConfig } = {}

  const dataFormatter = (v: any) => {
    if (v === null) {
      return v
    }
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
            xAxis: {
              sync: true,
              nice: false,
              alias: 'Time',
              type: 'time',
              min: triggerParams.start_time * 1000,
              max: triggerParams.end_time * 1000,
              mask: 'YYYY-MM-DD HH:mm:ss',
            },
            yAxis: {
              sync: true,
              nice: true,
              alias: 'Value',
            },
            meta: {
              data: {
                formatter: dataFormatter,
              },
              name: {
                alias: 'Name',
              },
            },
            color: d.color,
          },
        } as PlotConfig
      }

      plots[d.type].options.data!.push(
        ...d.data.map(_d => ({
          timestamp: _d[0],
          // Not support Infinity
          // https://github.com/antvis/G2/pull/438/files#diff-99d8cc124f84dcc0550b633ae5ee452474b01b8bb88281acd493809635c3c78bR11
          data:
            !!_d[1] &&
            _d[1] !== Number.POSITIVE_INFINITY &&
            _d[1] !== Number.NEGATIVE_INFINITY
              ? _d[1]
              : nullValue === TransformNullValue.NULL
              ? null
              : 0,
          name: d.name,
          rawData: d.rawData,
        }))
      )
    })
  })

  const plotsValues = Object.values(plots)
  const noData = plotsValues.every(p => !p.options.data?.length)
  const havePlot = !!plotsValues[0]

  if (havePlot && noData) {
    plotsValues[0].options.data?.push(
      // placeholder for y axis if there's no data in the plot
      {
        timestamp: 0,
        data: 1,
      }
    )
  }

  // attach annotations
  if (havePlot) {
    ;(plotsValues[0].options as Mutable<PlotConfig['options']>).annotations =
      annotations
  }

  return plotsValues
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] }
