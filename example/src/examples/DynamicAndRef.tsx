import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Tabs,
  type CollapsingTabsRef,
} from '@scanner/react-native-collapsible-tabs';
import { ExampleHeader, makeItems, Row, type Item } from '../shared';

const items = makeItems(40);

function HeaderButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.smallButton} onPress={onPress}>
      <Text style={styles.smallButtonText}>{title}</Text>
    </Pressable>
  );
}

/**
 * Tabs added/removed at runtime keep their scroll positions (offsets are
 * keyed by tab name), and the imperative ref drives navigation + scrolling.
 */
export function DynamicAndRef() {
  const tabsRef = useRef<CollapsingTabsRef>(null);
  const [extraTabs, setExtraTabs] = useState<string[]>([]);

  return (
    <Tabs.Container
      ref={tabsRef}
      renderHeader={() => (
        <ExampleHeader title="Dynamic tabs + ref" subtitle="Runtime tabs, imperative API">
          <View style={styles.buttonRow}>
            <HeaderButton
              title="Add tab"
              onPress={() =>
                setExtraTabs((prev) => [...prev, `extra-${prev.length + 1}`])
              }
            />
            <HeaderButton
              title="Remove tab"
              onPress={() => setExtraTabs((prev) => prev.slice(0, -1))}
            />
            <HeaderButton
              title="Jump to last"
              onPress={() => {
                const last = extraTabs[extraTabs.length - 1] ?? 'second';
                tabsRef.current?.jumpToTab(last);
              }}
            />
            <HeaderButton
              title="Scroll to top"
              onPress={() => tabsRef.current?.scrollToTop()}
            />
            <HeaderButton
              title="All to top"
              onPress={() => tabsRef.current?.scrollAllToTop()}
            />
          </View>
        </ExampleHeader>
      )}
    >
      <Tabs.Tab name="first" label="First">
        <Tabs.FlatList<Item>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
      <Tabs.Tab name="second" label="Second">
        <Tabs.FlatList<Item>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
      {extraTabs.map((name) => (
        <Tabs.Tab key={name} name={name} label={name}>
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
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  smallButton: {
    backgroundColor: '#eef',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallButtonText: { fontSize: 12, fontWeight: '600', color: '#4f46e5' },
});
