import { useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

type Example = {
  title: string;
  subtitle: string;
  component: ComponentType;
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
    subtitle: '@scanner/react-native-collapsible-tabs/flash-list',
    component: FlashListExample,
  },
  {
    title: 'LegendList',
    subtitle: '@scanner/react-native-collapsible-tabs/legend-list',
    component: LegendListExample,
  },
];

function Home({ onSelect }: { onSelect: (example: Example) => void }) {
  return (
    <View style={styles.home}>
      <Text style={styles.homeTitle}>@scanner/react-native-collapsible-tabs</Text>
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
    </View>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<Example | null>(null);
  const Current = current?.component;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {current && Current ? (
        <>
          <View style={styles.topBar}>
            <Pressable hitSlop={12} onPress={() => setCurrent(null)}>
              <Text style={styles.back}>‹ Back</Text>
            </Pressable>
            <Text style={styles.topBarTitle}>{current.title}</Text>
          </View>
          <Current />
        </>
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
  home: { padding: 16, gap: 10 },
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
});
