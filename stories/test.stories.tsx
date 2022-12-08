import React, { MutableRefObject, useEffect, useRef } from 'react'

import {
  PromDataAccessor,
  PromQueryGroup,
  TimeSeriesChart,
  Trigger,
} from '@diag-ui/chart/src/index'
import testData from './data.json'
import emptyData from './empty_data.json'
import { SyncTooltip } from '@diag-ui/chart/src/chart/sync_tooltip'

export default {
  title: 'Example/Test',
  Component: <TimeSeriesChart />,
  argTypes: {},
}

export const Test = ({ cteGap, ...args }) => {
  const triggerRef = useRef<Trigger>(null as any)
  const refreshChart = () => {
    triggerRef.current({ start_time: 1666100460, end_time: 1666100910 })
  }

  useEffect(() => {
    refreshChart()
  }, [])

  return (
    <PromDataAccessor
      ref={triggerRef}
      fetch={(query, tp) => Promise.resolve(emptyData as any)}
    >
      <SyncTooltip>
        <TimeSeriesChart
          modifyConfig={c => {
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
              // {
              //   promql: 'test2',
              //   name: '{sql_type}',
              //   type: 'line',
              // },
            ]}
            unit="s"
          />
        </TimeSeriesChart>{' '}
        <TimeSeriesChart
          modifyConfig={c => {
            return c
          }}
        >
          <PromQueryGroup
            queries={[
              {
                promql: 'test2',
                name: '{sql_type}',
                type: 'line',
              },
            ]}
            unit="s"
          />
        </TimeSeriesChart>
      </SyncTooltip>
    </PromDataAccessor>
  )
}
