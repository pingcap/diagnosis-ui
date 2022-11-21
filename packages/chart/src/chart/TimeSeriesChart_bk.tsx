import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
} from 'react'
import ReactECharts from 'echarts-for-react'
import { EChartsOption, SeriesOption } from 'echarts'

import { useDataAccessor } from './data_accessor'
import { ChartRef, useChartRefParams } from './chart_ref'
import { DataPoint, TransformNullValue } from './types'

export interface TimeSeriesChartProps<P = any, TP = any> {
  onEvents?: Record<string, Function>
  modifyOption?: (originOption: EChartsOption) => EChartsOption
  timezone?: number
  nullValue?: TransformNullValue
  renderError?: React.ReactNode
  renderLoading?: React.ReactNode
  children?: React.ReactNode
  style?: React.CSSProperties
}

export const TimeSeriesChart = forwardRef<
  ReactECharts | null,
  TimeSeriesChartProps
>(function TimeSeriesChart(
  {
    onEvents,
    modifyOption = (o: EChartsOption) => o,
    nullValue = TransformNullValue.NULL,
    children,
    style,
  },
  forwardRef
) {
  const { chartId, chartRef } = useChartRefParams()
  const [dataGroup] = useDataAccessor()
  const data = dataGroup?.[chartId]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modifyCallback = useCallback(modifyOption, [])
  const options = useMemo(() => {
    const opts = modifyCallback(data || {})
    opts.series = nullValueTransform(opts.series as SeriesOption[], nullValue)
    return opts
  }, [data, nullValue, modifyCallback])

  useImperativeHandle(forwardRef, () => chartRef.current as ReactECharts, [
    chartRef,
  ])

  console.log(options)

  return (
    <ChartRef identifier={chartId} chartRef={chartRef}>
      <ReactECharts
        ref={chartRef as any}
        onEvents={onEvents as any}
        option={options}
        style={style}
      />
      {children}
    </ChartRef>
  )
})

const nullValueTransform = (
  series: SeriesOption[],
  nullValue: TransformNullValue
) => {
  return series?.map(s => ({
    ...s,
    data: (s.data as DataPoint[]).map(d => [
      d[0],
      !!d[1] ? d[1] : nullValue === TransformNullValue.NULL ? null : 0,
    ]),
    animation: false,
  })) as SeriesOption[]
}
