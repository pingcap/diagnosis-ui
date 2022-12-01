import { MixConfig } from '@ant-design/plots'

export const DEFAULT_MIX_CONFIG: MixConfig = {
  tooltip: {
    shared: true,
    showCrosshairs: true,
    domStyles: {
      'g2-tooltip-value': {
        maxWidth: '200px',
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
      },
    },
  },
  syncViewPadding: true,
  legend: {
    flipPage: true,
    maxRow: 2,
    layout: 'horizontal',
    position: 'bottom',
    radio: {},
  } as any,
  // Use default plots so that we can get the chart ref at the initial rendering.
  plots: [
    {
      type: 'line',
      options: {},
    },
  ],
}
