import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Recharts components loaded dynamically to avoid SSR + reduce bundle
// Each import triggers a separate chunk — only loaded on pages that use charts
export const ResponsiveContainer = dynamic(
  () => import('recharts').then(m => m.ResponsiveContainer) as any,
  { ssr: false }
) as ComponentType<any>;

export const LineChart = dynamic(
  () => import('recharts').then(m => m.LineChart) as any,
  { ssr: false }
) as ComponentType<any>;

export const Line = dynamic(
  () => import('recharts').then(m => m.Line) as any,
  { ssr: false }
) as ComponentType<any>;

export const BarChart = dynamic(
  () => import('recharts').then(m => m.BarChart) as any,
  { ssr: false }
) as ComponentType<any>;

export const Bar = dynamic(
  () => import('recharts').then(m => m.Bar) as any,
  { ssr: false }
) as ComponentType<any>;

export const XAxis = dynamic(
  () => import('recharts').then(m => m.XAxis) as any,
  { ssr: false }
) as ComponentType<any>;

export const YAxis = dynamic(
  () => import('recharts').then(m => m.YAxis) as any,
  { ssr: false }
) as ComponentType<any>;

export const Tooltip = dynamic(
  () => import('recharts').then(m => m.Tooltip) as any,
  { ssr: false }
) as ComponentType<any>;

export const Legend = dynamic(
  () => import('recharts').then(m => m.Legend) as any,
  { ssr: false }
) as ComponentType<any>;

export const CartesianGrid = dynamic(
  () => import('recharts').then(m => m.CartesianGrid) as any,
  { ssr: false }
) as ComponentType<any>;

export const AreaChart = dynamic(
  () => import('recharts').then(m => m.AreaChart) as any,
  { ssr: false }
) as ComponentType<any>;

export const Area = dynamic(
  () => import('recharts').then(m => m.Area) as any,
  { ssr: false }
) as ComponentType<any>;

export const RadarChart = dynamic(
  () => import('recharts').then(m => m.RadarChart) as any,
  { ssr: false }
) as ComponentType<any>;

export const PolarGrid = dynamic(
  () => import('recharts').then(m => m.PolarGrid) as any,
  { ssr: false }
) as ComponentType<any>;

export const PolarAngleAxis = dynamic(
  () => import('recharts').then(m => m.PolarAngleAxis) as any,
  { ssr: false }
) as ComponentType<any>;

export const PolarRadiusAxis = dynamic(
  () => import('recharts').then(m => m.PolarRadiusAxis) as any,
  { ssr: false }
) as ComponentType<any>;

export const Radar = dynamic(
  () => import('recharts').then(m => m.Radar) as any,
  { ssr: false }
) as ComponentType<any>;

export const Cell = dynamic(
  () => import('recharts').then(m => m.Cell) as any,
  { ssr: false }
) as ComponentType<any>;

export const PieChart = dynamic(
  () => import('recharts').then(m => m.PieChart) as any,
  { ssr: false }
) as ComponentType<any>;

export const Pie = dynamic(
  () => import('recharts').then(m => m.Pie) as any,
  { ssr: false }
) as ComponentType<any>;
