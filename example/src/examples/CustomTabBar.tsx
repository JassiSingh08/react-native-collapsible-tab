import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Tabs,
  type TabBarRenderProps,
} from 'react-native-collapsible-tab';
import { ExampleHeader, makeItems, Row, type Item } from '../shared';

const items = makeItems(40);

function PillTabBar({
  tabNames,
  tabLabels,
  activeIndex,
  onTabPress,
}: TabBarRenderProps) {
  return (
    <View style={styles.bar}>
      {tabNames.map((name, i) => {
        const focused = i === activeIndex;
        return (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            style={[styles.pill, focused && styles.pillActive]}
            onPress={() => onTabPress(name)}
          >
            <Text style={[styles.pillText, focused && styles.pillTextActive]}>
              {tabLabels[name] ?? name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CustomTabBar() {
  return (
    <Tabs.Container
      renderHeader={() => (
        <ExampleHeader title="Custom tab bar" subtitle="Pill-style renderTabBar" />
      )}
      renderTabBar={(props) => <PillTabBar {...props} />}
    >
      <Tabs.Tab name="all" label="All">
        <Tabs.FlatList<Item>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
      <Tabs.Tab name="starred" label="Starred">
        <Tabs.FlatList<Item>
          data={items.slice(0, 12)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
      <Tabs.Tab name="archived" label="Archived">
        <Tabs.FlatList<Item>
          data={items.slice(0, 5)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
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
