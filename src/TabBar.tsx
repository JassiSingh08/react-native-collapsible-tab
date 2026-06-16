import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

type TabLayout = { x: number; width: number };

export type DefaultTabBarProps = {
  tabNames: string[];
  /** Display labels keyed by tab name; falls back to the name. */
  tabLabels?: Record<string, string>;
  focusedTab: SharedValue<string>;
  indexDecimal: SharedValue<number>;
  onTabPress: (name: string) => void;
  /** React-state mirror of the active tab, for label styling. */
  activeIndex: number;
  /**
   * Scrollable bar (tabs size to their label, bar scrolls horizontally) vs
   * fixed bar (tabs share the width equally). Defaults to scrollable.
   */
  scrollable?: boolean;
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  indicatorColor?: string;
  style?: StyleProp<ViewStyle>;
  tabStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  indicatorStyle?: StyleProp<ViewStyle>;
  renderLabel?: (props: {
    name: string;
    label: string;
    index: number;
    focused: boolean;
    color: string;
  }) => React.ReactNode;
};

/**
 * Simple tab bar with a swipe-tracking underline indicator. Fully optional —
 * pass `renderTabBar` to the container for a custom one.
 */
export function DefaultTabBar({
  tabNames,
  tabLabels,
  indexDecimal,
  onTabPress,
  activeIndex,
  scrollable = true,
  backgroundColor = 'transparent',
  activeColor = '#111111',
  inactiveColor = '#888888',
  indicatorColor = '#111111',
  style,
  tabStyle,
  labelStyle,
  indicatorStyle: userIndicatorStyle,
  renderLabel,
}: DefaultTabBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const layoutsSV = useSharedValue<TabLayout[]>([]);
  const layoutsJS = useRef<TabLayout[]>([]);
  const [barWidth, setBarWidth] = useState(0);

  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  }, []);

  const onItemLayout = useCallback(
    (index: number, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      layoutsJS.current[index] = { x, width };
      const next = layoutsSV.value.slice();
      next[index] = { x, width };
      layoutsSV.value = next;
    },
    [layoutsSV],
  );

  // Keep the active tab centered in a scrollable bar.
  useEffect(() => {
    if (!scrollable || barWidth === 0) return;
    const layout = layoutsJS.current[activeIndex];
    if (!layout) return;
    scrollRef.current?.scrollTo({
      x: Math.max(0, layout.x + layout.width / 2 - barWidth / 2),
      animated: true,
    });
  }, [activeIndex, scrollable, barWidth]);

  const indicatorStyle = useAnimatedStyle(() => {
    const layouts = layoutsSV.value;
    const count = tabNames.length;
    if (layouts.length < count) return { opacity: 0 };
    for (let i = 0; i < count; i++) {
      if (!layouts[i]) return { opacity: 0 };
    }
    const pos = Math.min(Math.max(indexDecimal.value, 0), count - 1);
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, count - 1);
    const fraction = pos - i0;
    const l0 = layouts[i0] as TabLayout;
    const l1 = layouts[i1] as TabLayout;
    const x = l0.x + (l1.x - l0.x) * fraction;
    const width = l0.width + (l1.width - l0.width) * fraction;
    return { opacity: 1, width, transform: [{ translateX: x }] };
  }, [tabNames.length]);

  const items = tabNames.map((name, i) => {
    const focused = i === activeIndex;
    const color = focused ? activeColor : inactiveColor;
    const label = tabLabels?.[name] ?? name;
    return (
      <Pressable
        key={name}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        style={[styles.tab, scrollable ? null : styles.tabFixed, tabStyle]}
        onLayout={(e) => onItemLayout(i, e)}
        onPress={() => onTabPress(name)}
      >
        {renderLabel ? (
          renderLabel({ name, label, index: i, focused, color })
        ) : (
          <Text
            style={[
              styles.label,
              { color, fontWeight: focused ? '600' : '400' },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    );
  });

  const indicator = (
    <Animated.View
      style={[
        styles.indicator,
        { backgroundColor: indicatorColor },
        userIndicatorStyle,
        indicatorStyle,
      ]}
    />
  );

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor }, style]}
      onLayout={onBarLayout}
    >
      {scrollable ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items}
          {indicator}
        </ScrollView>
      ) : (
        <View style={styles.fixedRow}>
          {items}
          {indicator}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  fixedRow: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabFixed: {
    flex: 1,
  },
  label: {
    fontSize: 15,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: 1,
  },
});
