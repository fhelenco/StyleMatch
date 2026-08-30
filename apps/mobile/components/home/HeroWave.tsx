import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  /** screen width — the wave is built at 2× this and scrolls by 1× for a seamless loop */
  width: number;
  color?: string;
  backColor?: string;
}

const AMP_FRONT = 6;
const AMP_BACK = 9;
const MID = 16; // curve baseline inside the SVG (headroom above for the crest)
const SVG_H = 74; // fill runs from the curve down to here; also the band height
const SWELL = 4; // vertical bob, ±SWELL
// Top of the always-on opaque base. Must sit below the lowest the front curve
// can reach (MID + AMP_FRONT + SWELL) so the curvy fill always hides its edge.
const BASE_TOP = MID + AMP_FRONT + SWELL + 3;

/** Sine wave sampled as a polyline, filled from the curve down to `h`. */
function wavePath(w: number, h: number, amp: number, periods: number, phase: number): string {
  const steps = Math.max(32, Math.round(w / 14));
  let d = `M 0 ${(MID).toFixed(1)}`;
  for (let i = 1; i <= steps; i++) {
    const x = (w * i) / steps;
    const y = MID + amp * Math.sin((i / steps) * periods * 2 * Math.PI + phase);
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  d += ` L ${w.toFixed(1)} ${h} L 0 ${h} Z`;
  return d;
}

/**
 * Wave that masks the seam between the hero image and the page below it.
 * An opaque static base seals the seam; two sampled-sine layers travel left at
 * different speeds and the crest gently swells. All motion is on the native
 * driver. The base never moves, so the swell can't open a gap.
 */
export function HeroWave({ width, color = '#FAFAFA', backColor = '#EFE8E2' }: Props) {
  const front = useRef(new Animated.Value(0)).current;
  const back = useRef(new Animated.Value(0)).current;
  const swell = useRef(new Animated.Value(0)).current;

  const W = width * 2;
  // 2 periods per screen width -> 4 across W; translating by `width` is exactly
  // 2 periods, so the loop reset is invisible.
  const frontPath = wavePath(W, SVG_H, AMP_FRONT, 4, 0);
  const backPath = wavePath(W, SVG_H, AMP_BACK, 4, Math.PI / 2);

  useEffect(() => {
    const linLoop = (v: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
    const a = linLoop(front, 7000);
    const b = linLoop(back, 11000);
    const c = Animated.loop(
      Animated.sequence([
        Animated.timing(swell, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(swell, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [front, back, swell]);

  const translateFront = front.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const translateBack = back.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  const translateY = swell.interpolate({ inputRange: [0, 1], outputRange: [SWELL, -SWELL] });

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: W }]}>
      {/* opaque base — sealed well past the hero's clipped bottom edge */}
      <View style={[styles.base, { top: BASE_TOP, backgroundColor: color }]} />

      <Animated.View style={{ transform: [{ translateY }] }}>
        <Animated.View style={{ transform: [{ translateX: translateBack }] }}>
          <Svg width={W} height={SVG_H}>
            <Path d={backPath} fill={backColor} opacity={0.5} />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: translateFront }] }]}>
          <Svg width={W} height={SVG_H}>
            <Path d={frontPath} fill={color} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: -1, left: 0, height: SVG_H },
  base: { position: 'absolute', left: 0, right: 0, bottom: -80 },
});
