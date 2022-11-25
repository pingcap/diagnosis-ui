import { MixConfig } from '@ant-design/plots'

export const DEFAULT_MIX_CONFIG: MixConfig = {
  tooltip: {
    shared: true,
    showCrosshairs: true,
  },
  syncViewPadding: true,
  legend: {
    flipPage: true,
    maxRow: 1,
    layout: 'horizontal',
    position: 'bottom',
    slidable: true,
  } as any,
  // Use default plots so that we can get the chart ref at the initial rendering.
  plots: [
    {
      type: 'line',
      options: {},
    },
  ],
}
