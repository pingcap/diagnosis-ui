import { MixConfig } from '@ant-design/plots'

export const DEFAULT_MIX_CONFIG: MixConfig = {
  tooltip: {
    shared: true,
  },
  legend: {
    flipPage: true,
    maxRow: 2,
    layout: 'horizontal',
    position: 'bottom',
  },
  syncViewPadding: true,
  plots: [
    {
      type: 'line',
      options: {},
    },
  ],
}
