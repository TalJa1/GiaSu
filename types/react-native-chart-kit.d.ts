declare module 'react-native-chart-kit' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export type ChartProps = ViewProps & { [key: string]: any };

  export const BarChart: ComponentType<ChartProps>;
  export const StackedBarChart: ComponentType<ChartProps>;
  export const LineChart: ComponentType<ChartProps>;
  export const PieChart: ComponentType<ChartProps>;
  export const ProgressChart: ComponentType<ChartProps>;
  export default {
    BarChart: BarChart,
    StackedBarChart: StackedBarChart,
    LineChart: LineChart,
    PieChart: PieChart,
    ProgressChart: ProgressChart,
  };
}
