import { useState, type ComponentType } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Basic } from './examples/Basic';
import { CustomTabBar } from './examples/CustomTabBar';
import { DynamicAndRef } from './examples/DynamicAndRef';
import { Lazy } from './examples/Lazy';
import {
  FlashListExample,
  LegendListExample,
  SectionListExample,
} from './examples/Lists';
import { RevealOnScroll, Snap } from './examples/SnapAndReveal';
import { Windowing } from './examples/Windowing';
import { ExploreScreen } from './realworld/ExploreScreen';
import { ProfileScreen } from './realworld/ProfileScreen';

type Example = {
  title: string;
  subtitle: string;
  component: ComponentType;
  /** Real-world screens own their safe-area inset, so render them edge-to-edge. */
  fullBleed?: boolean;
};

const EXAMPLES: Example[] = [
  {
    title: 'Basic',
    subtitle: 'FlatList + ScrollView tabs, per-tab scroll memory',
    component: Basic,
  },
  {
    title: 'Snap',
    subtitle: 'snapThreshold={0.5} — header settles open/closed',
    component: Snap,
  },
  {
    title: 'Reveal on scroll',
    subtitle: 'revealHeaderOnScroll — Twitter-style header',
    component: RevealOnScroll,
  },
  {
    title: 'Lazy mounting',
    subtitle: 'lazy + placeholder, no intermediate-tab mounting',
    component: Lazy,
  },
  {
    title: 'Custom tab bar',
    subtitle: 'renderTabBar with pill buttons',
    component: CustomTabBar,
  },
  {
    title: 'Dynamic tabs + imperative ref',
    subtitle: 'Add/remove tabs at runtime, jumpToTab, scrollToTop',
    component: DynamicAndRef,
  },
  {
    title: 'SectionList',
    subtitle: 'Tabs.SectionList with sticky section headers',
    component: SectionListExample,
  },
  {
    title: 'FlashList v2',
    subtitle: 'react-native-collapsible-tab/flash-list',
    component: FlashListExample,
  },
  {
    title: 'LegendList',
    subtitle: 'react-native-collapsible-tab/legend-list',
    component: LegendListExample,
  },
  {
    title: 'Windowed memory',
    subtitle: 'windowConfig — cap mounted tabs (React 19.2+)',
    component: Windowing,
  },
  {
    title: 'Real world · Profile',
    subtitle: 'Insets, collapsing avatar, FlashList + scroll memory',
    component: ProfileScreen,
    fullBleed: true,
  },
  {
    title: 'Real world · Explore',
    subtitle: 'Every hook, custom tab bar, pull-to-refresh',
    component: ExploreScreen,
    fullBleed: true,
  },
];

function Home({ onSelect }: { onSelect: (example: Example) => void }) {
  return (
    <ScrollView
      contentContainerStyle={styles.home}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.homeTitle}>react-native-collapsible-tab</Text>
      <Text style={styles.homeSubtitle}>Pick an example</Text>
      {EXAMPLES.map((example) => (
        <Pressable
          key={example.title}
          style={styles.card}
          onPress={() => onSelect(example)}
        >
          <Text style={styles.cardTitle}>{example.title}</Text>
          <Text style={styles.cardSubtitle}>{example.subtitle}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<Example | null>(null);
  const Current = current?.component;

  // Full-bleed screens reserve their own top inset (minHeaderHeight + padding),
  // so the menu must NOT add paddingTop or they'd double up. We also drop the
  // top bar there and show a floating Back chip instead, so the collapsing
  // header runs edge to edge.
  const fullBleed = current?.fullBleed ?? false;

  return (
    <View style={[styles.root, !fullBleed && { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {current && Current ? (
        fullBleed ? (
          <>
            <Current />
            <Pressable
              hitSlop={12}
              onPress={() => setCurrent(null)}
              style={[styles.floatingBack, { top: insets.top + 6 }]}
            >
              <Text style={styles.floatingBackText}>‹ Back</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.topBar}>
              <Pressable hitSlop={12} onPress={() => setCurrent(null)}>
                <Text style={styles.back}>‹ Back</Text>
              </Pressable>
              <Text style={styles.topBarTitle}>{current.title}</Text>
            </View>
            <Current />
          </>
        )
      ) : (
        <Home onSelect={setCurrent} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Root />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  home: { padding: 16, paddingBottom: 32, gap: 10 },
  homeTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  homeSubtitle: { fontSize: 14, color: '#777', marginBottom: 8 },
  card: {
    backgroundColor: '#f7f7f8',
    borderRadius: 12,
    padding: 14,
    gap: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardSubtitle: { fontSize: 12.5, color: '#777' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  back: { fontSize: 16, color: '#4f46e5', fontWeight: '600' },
  topBarTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  floatingBack: {
    position: 'absolute',
    left: 12,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  floatingBackText: { fontSize: 15, color: '#4f46e5', fontWeight: '700' },
});
