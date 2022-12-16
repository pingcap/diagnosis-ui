import React, { MutableRefObject, useEffect, useRef } from 'react'

import {
  PromDataAccessor,
  PromQueryGroup,
  TimeSeriesChart,
  TransformNullValue,
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
  // const triggerRef = useRef<Trigger>(null as any)
  // const refreshChart = () => {
  //   triggerRef.current({ start_time: 1666100460, end_time: 1666100910 })
  // }

  // useEffect(() => {
  //   refreshChart()
  // }, [])

  return (
    <>
      <PromDataAccessor
        fetch={(query, tp) => {
          return Promise.resolve(testData as any)
          // return Promise.resolve(emptyData as any)
        }}
        params={{ start_time: 1666100460, end_time: 1666100910 }}
      >
        <SyncTooltip>
          <TimeSeriesChart
            annotations={[
              {
                type: 'line',
                start: [1666100560000, 'min'],
                end: [1666100560000, 'max'],
                style: {
                  lineDash: [4, 4],
                },
                top: true,
                text: {
                  content: 'test',
                },
              },
            ]}
            nullValue={TransformNullValue.AS_ZERO}
          >
            <PromQueryGroup
              queries={[
                // {
                //   promql: 'test',
                //   name: '{sql_type}',
                //   type: 'scatter',
                // },
                {
                  promql:
                    'sum(rate(tidb_tikvclient_request_seconds_sum{store!="0"}[2m])) by (type)/ sum(rate(tidb_tikvclient_request_seconds_count{store!="0"}[2m])) by (type)',
                  name: '{sql_type}',
                  type: 'line',
                },
              ]}
              unit="s"
            />
          </TimeSeriesChart>
        </SyncTooltip>
      </PromDataAccessor>

      {/* <PromDataAccessor
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
      </PromDataAccessor> */}
    </>
  )
}
