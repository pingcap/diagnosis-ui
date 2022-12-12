import { Chart } from '../chart'
import { DEFAULT_MIN_INTERVAL_SEC } from '../prometheus/data'

export function computeStepByContainer(
  containerRef: React.RefObject<Chart>,
  range: [number, number],
  minIntervalSec = DEFAULT_MIN_INTERVAL_SEC,
  legendWidth: number = 0,
  minBinWidth: number = 5
) {
  const maxDataPoints =
    (((containerRef.current?.getChart()?.container as any).offsetWidth || 0) -
      legendWidth) /
    minBinWidth
  if (maxDataPoints <= 0) {
    return minIntervalSec
  }
  const interval = (range[1] - range[0]) / maxDataPoints
  const roundedInterval = Math.floor(interval / minIntervalSec) * minIntervalSec
  return Math.max(minIntervalSec, roundedInterval)
}
