import { MixConfig } from '@ant-design/plots'

export const DEFAULT_MIX_CONFIG: MixConfig = {
  tooltip: {
    shared: true,
  },
  syncViewPadding: true,
  legend: {
    flipPage: true,
    maxRow: 2,
    layout: 'horizontal',
    position: 'bottom',
  },
  // Use default plots so that we can get the chart ref at the initial rendering.
  plots: [
    {
      type: 'line',
      options: {},
    },
  ],
}
