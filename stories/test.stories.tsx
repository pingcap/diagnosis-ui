import React, { MutableRefObject, useEffect, useRef } from 'react'

import {
  PromDataAccessor,
  PromQueryGroup,
  TimeSeriesChart,
  Trigger,
} from '@diag-ui/chart'
import testData from './data.json'

export default {
  title: 'Example/Test',
  Component: <TimeSeriesChart />,
  argTypes: {},
}

export const Test = ({ cteGap, ...args }) => {
  const triggerRef: MutableRefObject<Trigger> = useRef<Trigger>(null as any)
  const refreshChart = () => {
    triggerRef.current({ start_time: 1666100460, end_time: 1666100910 })
  }
  return (
    <PromDataAccessor
      fetch={(query, tp) => Promise.resolve(testData as any)}
      setTrigger={trigger => {
        triggerRef.current = trigger
        refreshChart()
      }}
    >
      <TimeSeriesChart
        modifyConfig={c => {
          console.log(c)
          return c
        }}
      >
        <PromQueryGroup
          queries={[
            {
              promql: 'test',
              name: '{sql_type}',
              type: 'scatter',
            },
          ]}
          unit="s"
        />
      </TimeSeriesChart>
    </PromDataAccessor>
  )
}
