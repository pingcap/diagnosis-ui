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

// const transformToEChartsOption = (
//   queryResult: QueryResult,
//   resultGroup: ResultGroup,
//   triggerParams: TriggerParams
// ): DataGroup => {
//   return Object.entries(queryResult).reduce((prev, [id, result]) => {
//     const { config } = result
//     const formatter = (v: any) => {
//       let _unit = config.unit || 'none'
//       if (['short', 'none'].includes(_unit) && v < 1) {
//         return v.toPrecision(3)
//       }
//       return getValueFormat(_unit)(v, 2)
//     }
//     let tooltipTriggerBit = 0
//     const series = resultGroup[id].map(_d => {
//       tooltipTriggerBit = tooltipTriggerBit | tooltipTriggerMap[_d.type]
//       return {
//         name: _d.name,
//         type: _d.type,
//         data: _d.data,
//       } as SeriesOption
//     })

//     prev[id] = {
//       tooltip: {
//         confine: true,
//         extraCssText: 'width:auto; white-space:pre-wrap;',
//         order: 'valueDesc',
//         trigger: TooltipTriggerStr[tooltipTriggerBit] as
//           | 'item'
//           | 'axis'
//           | 'none',
//         valueFormatter: formatter,
//       },
//       legend: {
//         type: 'scroll',
//         bottom: 0,
//         // right: 0,
//         // orient: 'vertical',
//       },
//       xAxis: {
//         type: 'time',
//         min: triggerParams.start_time * 1000,
//         max: triggerParams.end_time * 1000,
//         axisPointer: {
//           show: true,
//           snap: true,
//           triggerTooltip: false,
//         },
//         axisLabel: {
//           formatter: {
//             day: '{yyyy}-{MM}-{dd}',
//           },
//         },
//       },
//       yAxis: {
//         axisLabel: {
//           formatter,
//         },
//         axisPointer: {
//           show: true,
//           triggerTooltip: false,
//           label: {
//             formatter: ({ value }) => formatter(value),
//           },
//         },
//       },
//       series,
//       color: DEFAULT_LIGHT_COLOR,
//     }
//     return prev
//   }, {} as DataGroup)
// }

// enum TooltipTriggerBit {
//   Axis = 1,
//   Item = 0,
// }

// const TooltipTriggerStr: { [bit: number]: string } = {
//   1: 'axis',
//   0: 'item',
// }

// const tooltipTriggerMap: Record<'line' | 'bar' | 'scatter', TooltipTriggerBit> =
//   {
//     line: TooltipTriggerBit.Axis,
//     bar: TooltipTriggerBit.Axis,
//     scatter: TooltipTriggerBit.Item,
//   }
