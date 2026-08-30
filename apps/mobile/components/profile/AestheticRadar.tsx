import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Line,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';
import type { StyleAxis } from '../../lib/styleDna';
import { useTheme } from '../../contexts/theme';

interface Props {
  axes: StyleAxis[];
  /** diameter of the plotted radar (labels are drawn in the padding around it) */
  size?: number;
}

// Room around the plot for the axis labels (all drawn centre-anchored, so we
// only need half the widest word — "AVANT-GARDE" — plus a little slack).
const PAD_X = 36;
const PAD_Y = 22;

/** Vertex position for axis `i` of `n`, at radius `r` from `center`. */
function vertex(center: number, r: number, i: number, n: number) {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
    angle,
  };
}

function ring(center: number, r: number, n: number): string {
  return Array.from({ length: n }, (_, i) => {
    const p = vertex(center, r, i, n);
    return `${p.x},${p.y}`;
  }).join(' ');
}

export function AestheticRadar({ axes, size = 210 }: Props) {
  const { colors } = useTheme();
  const GRID = colors.border;
  const FILL = colors.surfaceAlt;
  const STROKE = colors.accent;
  const LABEL = colors.muted;

  const n = axes.length;
  const center = size / 2;
  const radius = size / 2 - 2;
  const rings = [0.34, 0.67, 1];

  const w = size + PAD_X * 2;
  const h = size + PAD_Y * 2;

  const dataPoints = axes
    .map((a, i) => {
      const p = vertex(center, radius * a.value, i, n);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={w} height={h} viewBox={`${-PAD_X} ${-PAD_Y} ${w} ${h}`}>
        {/* concentric grid rings */}
        {rings.map((rr) => (
          <Polygon
            key={rr}
            points={ring(center, radius * rr, n)}
            fill="none"
            stroke={GRID}
            strokeWidth={1}
          />
        ))}

        {/* spokes */}
        {axes.map((_, i) => {
          const p = vertex(center, radius, i, n);
          return (
            <Line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke={GRID} strokeWidth={1} />
          );
        })}

        {/* data polygon */}
        <Polygon points={dataPoints} fill={FILL} fillOpacity={0.9} stroke={STROKE} strokeWidth={1.5} />

        {/* data vertices */}
        {axes.map((a, i) => {
          const p = vertex(center, radius * a.value, i, n);
          return <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={STROKE} />;
        })}

        {/* axis labels — centre-anchored so long words stay inside the canvas */}
        {axes.map((a, i) => {
          const p = vertex(center, radius + 16, i, n);
          return (
            <SvgText
              key={i}
              x={p.x}
              y={p.y + 3}
              fill={LABEL}
              fontSize={9}
              fontWeight="600"
              textAnchor="middle"
            >
              {a.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
