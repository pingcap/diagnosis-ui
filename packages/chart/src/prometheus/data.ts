import { DEFAULT_MIN_INTERVAL_SEC } from '.'
import { DataPoint } from '../types'
import { TriggerParams } from './prom_data_accessor'
import { isMatrixData, MatrixOrVectorResult } from './types'

const POSITIVE_INFINITY_SAMPLE_VALUE = '+Inf'
const NEGATIVE_INFINITY_SAMPLE_VALUE = '-Inf'

function parseSampleValue(value: string): number {
  switch (value) {
    case POSITIVE_INFINITY_SAMPLE_VALUE:
      return Number.POSITIVE_INFINITY
    case NEGATIVE_INFINITY_SAMPLE_VALUE:
      return Number.NEGATIVE_INFINITY
    default:
      return parseFloat(value)
  }
}

export function processRawData(
  data: MatrixOrVectorResult,
  options: TriggerParams
): DataPoint[] {
  if (isMatrixData(data)) {
    const stepMs = options.step ? options.step * 1000 : NaN
    let baseTimestamp = options.start_time * 1000
    const dps: DataPoint[] = []

    for (const value of data.values) {
      let dpValue: number | null = parseSampleValue(value[1])

      if (isNaN(dpValue)) {
        dpValue = null
      }

      const timestamp = value[0] * 1000
      for (let t = baseTimestamp; t < timestamp; t += stepMs) {
        dps.push([t, null])
      }
      baseTimestamp = timestamp + stepMs
      dps.push([timestamp, dpValue])
    }

    const endTimestamp = options.end_time * 1000
    for (let t = baseTimestamp; t <= endTimestamp; t += stepMs) {
      dps.push([t, null])
    }

    return dps
  }
  return []
}

export function resolveQueryTemplate(
  template: string,
  options: Required<TriggerParams>
): string {
  return template.replace(
    /\$__rate_interval/g,
    `${Math.max(options.step, 4 * DEFAULT_MIN_INTERVAL_SEC)}s`
  )
}
