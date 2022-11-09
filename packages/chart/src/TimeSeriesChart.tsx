import React from 'react'
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
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  onEvents,
  modifyOption = o => o,
  nullValue = TransformNullValue.NULL,
  children,
}) => {
  const { chartId, chartRef } = useChartRefParams()
  const [dataGroup] = useDataAccessor()
  const options = modifyOption(dataGroup?.[chartId] || {})

  options.series = nullValueTransform(
    options.series as SeriesOption[],
    nullValue
  )

  console.log(options)

  return (
    <ChartRef identifier={chartId} chartRef={chartRef}>
      <ReactECharts ref={chartRef} onEvents={onEvents} option={options} />
      {children}
    </ChartRef>
  )
}

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
  })) as SeriesOption[]
}
