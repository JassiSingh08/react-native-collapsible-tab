import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type LayoutChangeEvent,
} from 'react-native';
import {
  Tabs,
  type TabBarRenderProps,
} from 'react-native-collapsible-tab';
import { ExampleHeader, makeItems, Row, type Item } from '../shared';

const items = makeItems(40);

// Enough tabs to overflow the screen several times over, so the auto-scroll
// is obvious. A plain ScrollView renders every pill up front (no
// virtualization) — fine to a few dozen short labels; past that, swap the bar
// for a virtualized list. The tab *content* stays cheap at any count: native
// PagerView only keeps the current page ±1, and the windowConfig below caps
// the React side too (see <Tabs.Container> props).
const TABS = [
  'all',
  'starred',
  'archived',
  'shared',
  'recent',
  'trash',
  'drafts',
  'sent',
  'spam',
  'flagged',
  'pinned',
  'muted',
  'snoozed',
  'scheduled',
  'important',
];

type PillLayout = { x: number; width: number };

/**
 * Like the basic pill bar, but wrapped in a horizontal ScrollView that keeps
 * the active pill centered. A custom tab bar must do this itself — the built-in
 * DefaultTabBar scrolls to the active tab, but `renderTabBar` hands you full
 * layout control, so the auto-scroll is your responsibility.
 */
function ScrollablePillTabBar({
  tabNames,
  tabLabels,
  activeIndex,
  onTabPress,
}: TabBarRenderProps) {
  const scrollRef = useRef<ScrollView>(null);
  const layouts = useRef<PillLayout[]>([]);
  const [barWidth, setBarWidth] = useState(0);

  const onItemLayout = useCallback((i: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[i] = { x, width };
  }, []);

  useEffect(() => {
    if (barWidth === 0) return;
    const l = layouts.current[activeIndex];
    if (!l) return;
    scrollRef.current?.scrollTo({
      x: Math.max(0, l.x + l.width / 2 - barWidth / 2),
      animated: true,
    });
  }, [activeIndex, barWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bar}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {tabNames.map((name, i) => {
        const focused = i === activeIndex;
        return (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            style={[styles.pill, focused && styles.pillActive]}
            onLayout={(e) => onItemLayout(i, e)}
            onPress={() => onTabPress(name)}
          >
            <Text style={[styles.pillText, focused && styles.pillTextActive]}>
              {tabLabels[name] ?? name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function ScrollableTabBar() {
  return (
    <Tabs.Container
      renderHeader={() => (
        <ExampleHeader
          title="Scrollable tab bar"
          subtitle="Pill bar that auto-scrolls the active tab into view"
        />
      )}
      renderTabBar={(props) => <ScrollablePillTabBar {...props} />}
      // With this many tabs, cap how many stay mounted: only the focused tab
      // plus one either side keep their native views; the rest hide via
      // <Activity>, keeping React state + scroll position. No-op (every visited
      // tab stays mounted) on React < 19.2, so it's safe to set unconditionally.
      windowConfig={{ ahead: 1, behind: 1 }}
    >
      {TABS.map((name) => (
        <Tabs.Tab key={name} name={name} label={name[0]!.toUpperCase() + name.slice(1)}>
          <Tabs.FlatList<Item>
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Row item={item} />}
          />
        </Tabs.Tab>
      ))}
    </Tabs.Container>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f0f0f0',
  },
  pillActive: { backgroundColor: '#4f46e5' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#555' },
  pillTextActive: { color: '#fff' },
});
