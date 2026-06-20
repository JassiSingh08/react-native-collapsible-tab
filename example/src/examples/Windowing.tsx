import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'react-native-collapsible-tab';
import { ExampleHeader, makeItems, Row, type Item } from '../shared';

const TAB_COUNT = 60;

// <Activity> is React 19.2+. This example app runs on Expo SDK 54 (React 19.1,
// no Activity yet), so windowConfig here exercises the graceful fallback: the
// container warns once and keeps every visited tab mounted. The code is exactly
// what you'd ship; on React 19.2+ (e.g. Expo SDK 55+) the window actually frees
// out-of-window tabs and you'll see 🔴 logs.
const ACTIVITY_AVAILABLE =
  'Activity' in React || 'unstable_Activity' in React;

/**
 * windowConfig caps how many tabs stay mounted at once. With {ahead:1, behind:1}
 * only the focused tab plus its immediate neighbors stay live (3 max); the rest
 * are hidden via React's <Activity>, which frees their native views but keeps
 * React state + scroll position for instant restore.
 *
 * Watch the Metro logs: each tab logs 🟢 when it enters the window and 🔴 when
 * it falls out. Swipe across the tabs and you'll see live tabs stay capped at 3.
 *
 * Requires React 19.2+ (for <Activity>). On older React the container warns once
 * and keeps every visited tab mounted instead.
 */
function WindowedTab({ name, data }: { name: string; data: Item[] }) {
  useEffect(() => {
    console.log(`🟢 ${name} mounted`);
    return () => console.log(`🔴 ${name} unmounted`);
  }, [name]);

  return (
    <Tabs.FlatList<Item>
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Row item={item} />}
      ListHeaderComponent={
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {ACTIVITY_AVAILABLE
              ? `${name} — check Metro logs for 🟢 / 🔴`
              : `${name} — React 19.2+ needed for live windowing (this app is on 19.1)`}
          </Text>
        </View>
      }
    />
  );
}

export function Windowing() {
  const tabs = useMemo(
    () =>
      Array.from({ length: TAB_COUNT }, (_, i) => ({
        name: `tab-${i}`,
        label: `Cat ${i + 1}`,
        data: makeItems(200, `T${i}`),
      })),
    [],
  );

  return (
    <Tabs.Container
      windowConfig={{ ahead: 1, behind: 1 }}
      renderHeader={() => (
        <ExampleHeader
          title="Windowed tabs"
          subtitle={`${TAB_COUNT} tabs, only 3 stay mounted (focused ±1)`}
        />
      )}
    >
      {tabs.map((t) => (
        <Tabs.Tab key={t.name} name={t.name} label={t.label}>
          <WindowedTab name={t.name} data={t.data} />
        </Tabs.Tab>
      ))}
    </Tabs.Container>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#eef2ff',
  },
  bannerText: { color: '#4f46e5', fontSize: 12, fontWeight: '600' },
});
