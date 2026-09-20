import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { HeroWave } from '../../components/home/HeroWave';
import { useWeather } from '../../hooks/useWeather';
import { useTheme, useThemedStyles } from '../../contexts/theme';
import type { ThemeColors } from '../../lib/theme';

const HERO_HEIGHT = 520;
const HERO_IMAGE = require('../../assets/hero-rack.jpg');

const CATEGORY_LABELS = ['OUTERWEAR', 'ESSENTIALS', 'BOTTOMS', 'FOOTWEAR'];
const PLACEHOLDER_NAMES = [
  'Structured Linen\nBlazer',
  'Silk Oversized\nShirt',
  'Tailored Wool\nTrousers',
  'Minimalist Leather\nLoafers',
];
const PLACEHOLDER_COLORS: [string, string][] = [
  ['#D4A98A', '#C49080'],
  ['#8BA4B8', '#7090A8'],
  ['#4A4A5A', '#3A3A4A'],
  ['#60B0C8', '#4090B0'],
];
const NUM_SECTIONS = 8;

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const items = useWardrobeStore((s) => s.items);
  const displayItems = items.slice(0, 4);
  const { data: weather, isLoading: weatherLoading } = useWeather();

  const scrollRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Slow, continuous zoom on the hero image (Ken Burns) — kept ≥1.06 so the
  // parallax translate never exposes the image edges.
  const kenBurns = useRef(new Animated.Value(0)).current;

  // Hero entrance
  const wordmarkAnim = useRef(new Animated.Value(0)).current;
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const chevronBounce = useRef(new Animated.Value(0)).current;

  // Section scroll-reveal
  const sectionAnims = useRef(
    Array.from({ length: NUM_SECTIONS }, () => new Animated.Value(0)),
  ).current;
  const sectionPositions = useRef(new Array(NUM_SECTIONS).fill(0));
  const sectionTriggered = useRef(new Array(NUM_SECTIONS).fill(false));

  const staggerCounter = useRef(0);

  const checkSections = useCallback(
    (y: number) => {
      sectionPositions.current.forEach((pos: number, i: number) => {
        if (pos > 0 && !sectionTriggered.current[i] && y > pos - screenHeight + 120) {
          sectionTriggered.current[i] = true;
          const delay = staggerCounter.current * 150;
          staggerCounter.current += 1;
          Animated.timing(sectionAnims[i], {
            toValue: 1,
            duration: 700,
            delay,
            useNativeDriver: true,
          }).start();
        }
      });
    },
    [screenHeight, sectionAnims],
  );

  const registerSection = useCallback(
    (index: number) => (e: any) => {
      sectionPositions.current[index] = e.nativeEvent.layout.y;
      checkSections(0);
    },
    [checkSections],
  );

  useEffect(() => {
    // Staggered hero entrance
    Animated.stagger(200, [
      Animated.timing(wordmarkAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(headlineAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(chevronAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Chevron bounce loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(chevronBounce, {
          toValue: 6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(chevronBounce, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Ken Burns zoom loop on the hero image
    Animated.loop(
      Animated.sequence([
        Animated.timing(kenBurns, {
          toValue: 1,
          duration: 14000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(kenBurns, {
          toValue: 0,
          duration: 14000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const timer = setTimeout(() => checkSections(0), 150);
    return () => clearTimeout(timer);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      checkSections(e.nativeEvent.contentOffset.y);
    },
    [checkSections],
  );

  // Hero parallax — the background drifts down as the page scrolls up, and
  // follows a little on overscroll (negative scrollY at the top).
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-240, 0, HERO_HEIGHT],
    outputRange: [-70, 0, 150],
    extrapolate: 'clamp',
  });
  const heroImageScale = Animated.add(
    kenBurns.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1.13] }),
    scrollY.interpolate({
      inputRange: [-240, 0],
      outputRange: [0.16, 0],
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  const sectionStyle = (i: number) => ({
    opacity: sectionAnims[i],
    transform: [
      {
        translateY: sectionAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: onScroll },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero ─── */}
        <View style={styles.hero}>
          <Animated.View
            style={[styles.heroBg, { transform: [{ translateY: heroTranslateY }] }]}
          >
            {/* warm fallback while the photo decodes / if it fails to load */}
            <LinearGradient
              colors={['#8B7B6E', '#A89888', '#B5A595']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
            />
            <Animated.Image
              source={HERO_IMAGE}
              style={[StyleSheet.absoluteFill, { transform: [{ scale: heroImageScale }] }]}
              resizeMode="cover"
            />
            {/* legibility scrim: darker at the top (wordmark) and bottom (wave seam) */}
            <LinearGradient
              colors={[
                'rgba(38,31,25,0.46)',
                'rgba(38,31,25,0.22)',
                'rgba(38,31,25,0.16)',
                'rgba(38,31,25,0.34)',
              ]}
              locations={[0, 0.32, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View style={styles.heroContent}>
            <Animated.Text style={[styles.wordmark, { opacity: wordmarkAnim }]}>
              StyleMatch
            </Animated.Text>
            <Animated.Text
              style={[
                styles.heroHeadline,
                {
                  opacity: headlineAnim,
                  transform: [
                    {
                      translateY: headlineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              Match it
            </Animated.Text>
            <Animated.View
              style={{
                opacity: buttonAnim,
                transform: [
                  {
                    scale: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={styles.styleItBtn}
                onPress={() => router.push('/matching')}
                activeOpacity={0.85}
              >
                <Text style={styles.styleItText}>STYLE IT</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.chevronWrap,
              {
                opacity: chevronAnim,
                transform: [{ translateY: chevronBounce }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.chevronCircle}
              activeOpacity={0.7}
              onPress={() =>
                scrollRef.current?.scrollTo({ y: HERO_HEIGHT - 40, animated: true })
              }
            >
              <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </Animated.View>

          {/* Animated wave transition */}
          <HeroWave
            width={screenWidth}
            color={colors.background}
            backColor={colors.surfaceAlt}
          />
        </View>

        {/* ─── Philosophy ─── */}
        <Animated.View onLayout={registerSection(0)} style={sectionStyle(0)}>
          <View style={styles.philosophy}>
            <Text style={styles.sectionLabel}>OUR PHILOSOPHY</Text>
            <Text style={styles.philosophyHeadline}>
              Discover your{'\n'}
              <Text style={styles.philosophyItalic}>Signature aesthetic</Text>
            </Text>
            <Text style={styles.philosophyText}>
              StyleMatch leverages neural curation to understand the
              architectural lines of your wardrobe, suggesting pairings that
              feel inevitable yet surprising.
            </Text>
          </View>
        </Animated.View>

        {/* ─── Weather ─── */}
        {weatherLoading ? null : weather ? (
          <View style={styles.weatherCard}>
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherTemp}>{weather.tempC}°C</Text>
              <View>
                <Text style={styles.weatherCity}>{weather.city}</Text>
                <Text style={styles.weatherCondition}>{weather.condition}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.weatherCta}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/occasion-match',
                  // 'casual' is a sensible catch-all vibe for an unprompted daily
                  // suggestion — auto='1' tells the screen to skip the picker
                  // and generate immediately instead of waiting for a tap.
                  params: { season: weather.suggestedSeason, occasion: 'casual', auto: '1' },
                })
              }
            >
              <Text style={styles.weatherCtaText}>SEE A LOOK FOR TODAY</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ─── View Lookbook CTA ─── */}
        <Animated.View onLayout={registerSection(1)} style={sectionStyle(1)}>
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.lookbookCta}
              onPress={() => router.push('/(tabs)/lookbook')}
              activeOpacity={0.8}
            >
              <Text style={styles.lookbookCtaText}>VIEW{'\n'}LOOKBOOK</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── Divider ─── */}
        <Animated.View
          onLayout={registerSection(2)}
          style={[styles.divider, { opacity: sectionAnims[2] }]}
        />

        {/* ─── Curated For You ─── */}
        <Animated.View onLayout={registerSection(3)} style={sectionStyle(3)}>
          <View style={styles.curatedHeader}>
            <Text style={styles.sectionLabel}>CURATED FOR YOU</Text>
            <Text style={styles.curatedTitle}>Daily Selection</Text>
          </View>
        </Animated.View>

        {/* Product Row 1 */}
        <Animated.View onLayout={registerSection(4)} style={sectionStyle(4)}>
          <View style={styles.productRow}>
            {[0, 1].map((i) => (
              <TouchableOpacity
                key={i}
                style={styles.productCard}
                activeOpacity={displayItems[i] ? 0.8 : 1}
                disabled={!displayItems[i]}
                onPress={() => router.push(`/item/${displayItems[i].id}`)}
              >
                {displayItems[i] ? (
                  <Animated.Image
                    source={{ uri: displayItems[i].image_url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={PLACEHOLDER_COLORS[i]}
                    style={styles.productImage}
                  />
                )}
                <Text style={styles.productCategory}>
                  {displayItems[i]?.category?.toUpperCase() || CATEGORY_LABELS[i]}
                </Text>
                <Text style={styles.productName}>
                  {displayItems[i]?.label || PLACEHOLDER_NAMES[i]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Product Row 2 */}
        <Animated.View onLayout={registerSection(5)} style={sectionStyle(5)}>
          <View style={styles.productRow}>
            {[2, 3].map((i) => (
              <TouchableOpacity
                key={i}
                style={styles.productCard}
                activeOpacity={displayItems[i] ? 0.8 : 1}
                disabled={!displayItems[i]}
                onPress={() => router.push(`/item/${displayItems[i].id}`)}
              >
                {displayItems[i] ? (
                  <Animated.Image
                    source={{ uri: displayItems[i].image_url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={PLACEHOLDER_COLORS[i]}
                    style={styles.productImage}
                  />
                )}
                <Text style={styles.productCategory}>
                  {displayItems[i]?.category?.toUpperCase() || CATEGORY_LABELS[i]}
                </Text>
                <Text style={styles.productName}>
                  {displayItems[i]?.label || PLACEHOLDER_NAMES[i]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ─── Divider ─── */}
        <View style={styles.divider} />

        {/* ─── AI Stylist ─── */}
        <Animated.View onLayout={registerSection(6)} style={sectionStyle(6)}>
          <View style={styles.aiCard}>
            <Text style={styles.sparkle}>✦</Text>
            <Text style={styles.sectionLabel}>AI STYLIST</Text>
            <Text style={styles.aiTitle}>Stitch a Look</Text>
            <Text style={styles.aiDesc}>
              Let our AI analyze your pieces and create a balanced ensemble.
            </Text>
            <View style={styles.aiButtons}>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => router.push('/add-item/capture')}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadBtnText}>UPLOAD PIECE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={() => router.push('/matching')}
                activeOpacity={0.85}
              >
                <Text style={styles.generateBtnText}>GENERATE MATCH</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ─── Style Archive ─── */}
        <Animated.View onLayout={registerSection(7)} style={sectionStyle(7)}>
          <View style={styles.archiveSection}>
            <Text style={styles.sectionLabel}>STYLE ARCHIVE</Text>
            <Text style={styles.archiveTitle}>Wardrobe</Text>
            <Text style={styles.archiveSubtitle}>Digitally organized</Text>
            <View style={styles.archiveIcon}>
              <Ionicons name="grid-outline" size={16} color={colors.accent} />
            </View>
            <TouchableOpacity
              style={styles.exploreCta}
              onPress={() => router.push('/(tabs)/wardrobe')}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreCtaText}>EXPLORE{'\n'}VAULT</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 60 },

    /* Hero — sits over the photo, so most colours here are theme-independent */
    hero: { height: HERO_HEIGHT, position: 'relative', overflow: 'hidden' },
    heroBg: {
      position: 'absolute',
      top: -80,
      left: 0,
      right: 0,
      bottom: -80,
    },
    heroContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 12,
      zIndex: 1,
    },
    wordmark: {
      fontSize: 18,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.onImage,
      marginBottom: 8,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 10,
    },
    heroHeadline: {
      fontSize: 56,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.onImage,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.28)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 16,
    },
    styleItBtn: {
      marginTop: 4,
    },
    styleItText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.8)',
      letterSpacing: 4,
    },
    chevronWrap: { alignItems: 'center', paddingBottom: 76, zIndex: 3 },
    chevronCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Weather */
    weatherCard: {
      marginHorizontal: 16,
      marginBottom: 32,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      gap: 14,
    },
    weatherInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    weatherTemp: {
      fontSize: 34,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    weatherCity: { fontSize: 15, fontWeight: '600', color: c.foreground },
    weatherCondition: { fontSize: 13, color: c.muted, marginTop: 2 },
    weatherCta: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: c.accentDark,
    },
    weatherCtaText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.onAccent,
      letterSpacing: 1,
    },

    /* Philosophy */
    philosophy: {
      paddingHorizontal: 32,
      paddingTop: 24,
      paddingBottom: 32,
      alignItems: 'center',
      gap: 16,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.muted,
      letterSpacing: 3,
    },
    philosophyHeadline: {
      fontSize: 28,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
      textAlign: 'center',
      lineHeight: 38,
    },
    philosophyItalic: {
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.accentText,
    },
    philosophyText: {
      fontSize: 14,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 300,
    },

    /* CTA */
    ctaSection: { alignItems: 'center', paddingTop: 0, paddingBottom: 24 },
    lookbookCta: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lookbookCtaText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.foreground,
      letterSpacing: 1,
      textAlign: 'center',
      lineHeight: 16,
    },

    /* Divider */
    divider: {
      width: 1,
      height: 60,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginVertical: 8,
    },

    /* Curated */
    curatedHeader: { alignItems: 'center', paddingTop: 32, paddingBottom: 20, gap: 12 },
    curatedTitle: {
      fontSize: 32,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },

    /* Product Grid */
    productRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 12,
    },
    productCard: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    productImage: { width: '100%', height: 180 },
    productCategory: {
      fontSize: 10,
      fontWeight: '600',
      color: c.accentText,
      letterSpacing: 2,
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    productName: {
      fontSize: 15,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
      paddingHorizontal: 14,
      paddingTop: 4,
      paddingBottom: 14,
      lineHeight: 21,
    },

    /* AI Stylist */
    aiCard: {
      marginHorizontal: 16,
      marginVertical: 16,
      backgroundColor: c.surfaceAlt,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      gap: 12,
    },
    sparkle: { fontSize: 22, color: c.accent },
    aiTitle: {
      fontSize: 28,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    aiDesc: {
      fontSize: 14,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 280,
    },
    aiButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    uploadBtn: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    uploadBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.foreground,
      letterSpacing: 1,
    },
    generateBtn: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 24,
      backgroundColor: c.accentDark,
    },
    generateBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.onAccent,
      letterSpacing: 1,
    },

    /* Style Archive */
    archiveSection: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    archiveTitle: {
      fontSize: 32,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: c.foreground,
    },
    archiveSubtitle: {
      fontSize: 16,
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      color: c.accentText,
    },
    archiveIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    exploreCta: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    exploreCtaText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.foreground,
      letterSpacing: 1,
      textAlign: 'center',
      lineHeight: 16,
    },
  });
