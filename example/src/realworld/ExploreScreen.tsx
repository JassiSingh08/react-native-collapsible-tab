import { useCallback, useMemo, useState } from 'react';
import { Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  Tabs,
  useActiveTabScrollY,
  useAnimatedTabIndex,
  useCurrentTabScrollY,
  useFocusedTab,
  useHeaderMeasurements,
  useHeaderScrollY,
  useIsTabFocused,
  useTabIndex,
  type TabBarRenderProps,
} from 'react-native-collapsible-tab';
import { PostRow } from './components';
import { makePosts, type Post } from './data';

const TABS = [
  { name: 'trending', label: 'Trending' },
  { name: 'latest', label: 'Latest' },
  { name: 'people', label: 'People' },
];

/** One indicator dot, lit by how close the fractional pager index is to `i`. */
function TabDot({ index }: { index: number }) {
  const tabIndex = useAnimatedTabIndex();
  const dotStyle = useAnimatedStyle(() => {
    const active = 1 - Math.min(Math.abs(tabIndex.value - index), 1);
    return { opacity: 0.3 + active * 0.7, transform: [{ scale: 0.8 + active * 0.4 }] };
  });
  return <Animated.View style={[styles.dot, dotStyle]} />;
}

/**
 * Header that reads several UI-thread hooks at once:
 *  - useHeaderScrollY: raw px collapsed → parallax shift + fade on the title
 *  - useHeaderMeasurements: header height (collapsible-tab-view compatible)
 *  - useActiveTabScrollY: focused tab's offset → a "depth" progress bar
 *  - useAnimatedTabIndex (in TabDot): fractional pager position → indicator dots
 */
function ExploreHeader({ topInset }: { topInset: number }) {
  const collapsed = useHeaderScrollY();
  const { height } = useHeaderMeasurements();

  // Fade the whole collapsible body out as it collapses — no upward translate,
  // so nothing rides up into the status-bar strip and overlaps.
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      collapsed.value,
      [0, Math.max(height - topInset, 1) * 0.6],
      [1, 0],
      'clamp',
    ),
  }));

  return (
    <View style={styles.header}>
      {/* Opaque status-bar strip — stays put (minHeaderHeight reserves it). */}
      <View style={{ height: topInset }} />
      <Animated.View style={[styles.headerBody, bodyStyle]}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Pull any list down to refresh ↻</Text>
          <View style={styles.dots}>
            {TABS.map((_, i) => (
              <TabDot key={i} index={i} />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/** Thin reading-progress bar — pinned in the tab bar, so it stays visible
 *  even when the collapsible header is fully scrolled away. */
function ScrollProgressBar() {
  const activeScroll = useActiveTabScrollY();
  const FULL_SCROLL = 5000;
  const depthStyle = useAnimatedStyle(() => {
    const pct = (activeScroll.value / FULL_SCROLL) * 100;
    return { width: `${Math.max(0, Math.min(pct, 100))}%` };
  });
  return (
    <View style={styles.depthTrack}>
      <Animated.View style={[styles.depthFill, depthStyle]} />
    </View>
  );
}

/** In-tab badge proving the JS-state hooks re-render on focus + report index. */
function TabBadge() {
  const index = useTabIndex();
  const trendingFocused = useIsTabFocused('trending');
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        Tab #{index}
        {trendingFocused ? ' · trending is focused' : ''}
      </Text>
    </View>
  );
}

/** Custom tab bar driven by useAnimatedTabIndex via the render props. */
function ExploreTabBar({
  tabNames,
  tabLabels,
  activeIndex,
  onTabPress,
}: TabBarRenderProps) {
  return (
    <View>
      <View style={styles.tabBar}>
        {tabNames.map((name, i) => (
          <Text
            key={name}
            onPress={() => onTabPress(name)}
            style={[styles.tab, i === activeIndex && styles.tabActive]}
          >
            {tabLabels[name] ?? name}
          </Text>
        ))}
      </View>
      <ScrollProgressBar />
    </View>
  );
}

const PULL_THRESHOLD = 90; // px of overscroll needed to trigger a refresh

/**
 * Pull-to-refresh that plays nicely with the collapsing header — and is
 * deliberately PLATFORM-SPLIT, because the two platforms overscroll differently:
 *
 *  - iOS lists BOUNCE: contentOffset.y goes negative past the top, so we can
 *    read the pull distance from useCurrentTabScrollY() and drive our own big,
 *    always-visible spinner. (The native RefreshControl spinner would render at
 *    the padded content origin — hidden behind the header.)
 *
 *  - Android lists DON'T bounce: the offset stays clamped at 0 (you get a
 *    stretch/glow instead), so an offset-driven pull can't work. There we fall
 *    back to the native RefreshControl, positioned with progressViewOffset so
 *    its spinner clears the header.
 */
function FeedTab({ seed }: { seed: string }) {
  const myScroll = useCurrentTabScrollY();
  const { height: headerHeight } = useHeaderMeasurements();
  const [data, setData] = useState<Post[]>(() => makePosts(60, seed));
  const [refreshing, setRefreshing] = useState(false);
  const armed = useSharedValue(false);

  const triggerRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setData(makePosts(60, `${seed}-${Date.now() % 1000}`));
      setRefreshing(false);
    }, 1200);
  }, [seed]);

  // iOS only: arm while pulling past the threshold, fire once the user eases back.
  useAnimatedReaction(
    () => myScroll.value,
    (y, prev) => {
      if (prev === null || Platform.OS !== 'ios') return;
      if (y <= -PULL_THRESHOLD) {
        armed.value = true;
      } else if (armed.value && y > -PULL_THRESHOLD * 0.4) {
        armed.value = false;
        runOnJS(triggerRefresh)();
      }
    },
  );

  // Big iOS spinner: grows + brightens as you pull, pinned just under the header.
  const spinnerStyle = useAnimatedStyle(() => {
    const pull = Math.max(0, -myScroll.value);
    const progress = Math.min(pull / PULL_THRESHOLD, 1);
    return {
      opacity: refreshing ? 1 : Math.min(progress * 1.4, 1),
      transform: [
        { translateY: Math.min(pull * 0.6, 60) },
        { rotate: `${(refreshing ? 2 : progress) * 360}deg` },
        { scale: 0.7 + progress * 0.6 },
      ],
    };
  });
  // The label below the spinner switches from "pull" to "release" past threshold.
  const readyStyle = useAnimatedStyle(() => ({
    opacity: -myScroll.value >= PULL_THRESHOLD || refreshing ? 1 : 0,
  }));

  return (
    <>
      {Platform.OS === 'ios' && (
        <Animated.View
          style={[styles.spinnerWrap, { top: headerHeight + 8 }, spinnerStyle]}
          pointerEvents="none"
        >
          <View style={styles.spinner}>
            <Text style={styles.spinnerIcon}>{refreshing ? '⟳' : '↓'}</Text>
          </View>
          <Animated.Text style={[styles.spinnerLabel, readyStyle]}>
            {refreshing ? 'Refreshing…' : 'Release to refresh'}
          </Animated.Text>
        </Animated.View>
      )}
      <Tabs.FlatList<Post>
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostRow post={item} />}
        ListHeaderComponent={<TabBadge />}
        refreshControl={
          Platform.OS === 'android' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={triggerRefresh}
              progressViewOffset={headerHeight}
            />
          ) : undefined
        }
      />
    </>
  );
}

/** Shows useFocusedTab on the UI thread by tinting a bar per focused tab. */
function FocusedTabBar() {
  const focused = useFocusedTab();
  const style = useAnimatedStyle(() => {
    const colors: Record<string, string> = {
      trending: '#6366f1',
      latest: '#14b8a6',
      people: '#ec4899',
    };
    return { backgroundColor: colors[focused.value] ?? '#999' };
  });
  return <Animated.View style={[styles.focusBar, style]} />;
}

export function ExploreScreen() {
  const insets = useSafeAreaInsets();

  const tabs = useMemo(() => TABS, []);

  return (
    <View style={styles.root}>
      <FocusedTabBar />
      <Tabs.Container
        minHeaderHeight={insets.top}
        headerBackgroundColor="#fff"
        revealHeaderOnScroll
        renderHeader={() => <ExploreHeader topInset={insets.top} />}
        renderTabBar={(props) => <ExploreTabBar {...props} />}
      >
        {tabs.map((t) => (
          <Tabs.Tab key={t.name} name={t.name} label={t.label}>
            <FeedTab seed={t.name} />
          </Tabs.Tab>
        ))}
      </Tabs.Container>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  focusBar: { height: 3, width: '100%' },
  header: {},
  headerBody: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: { color: '#888', fontSize: 13 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6366f1' },
  depthTrack: {
    height: 3,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  depthFill: { height: 3, backgroundColor: '#6366f1' },
  tabBar: {
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  tab: { fontSize: 15, color: '#999', fontWeight: '600' },
  tabActive: { color: '#111' },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5ff',
  },
  badgeText: { color: '#6366f1', fontSize: 12, fontWeight: '600' },
  spinnerWrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    alignItems: 'center',
  },
  spinner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  spinnerIcon: { color: '#fff', fontSize: 28, fontWeight: '800' },
  spinnerLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
  },
});
