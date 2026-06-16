import { StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'react-native-collapsible-tab';
import { TabFlashList } from 'react-native-collapsible-tab/flash-list';
import { TabLegendList } from 'react-native-collapsible-tab/legend-list';
import { ExampleHeader, makeItems, Row, type Item } from '../shared';

const long = makeItems(500);
const short = makeItems(5, 'Short');
const sections = ['A', 'B', 'C', 'D'].map((key) => ({
  title: `Section ${key}`,
  data: makeItems(12, key),
}));

/** FlashList v2 adapter (subpath import; New Architecture only). */
export function FlashListExample() {
  return (
    <Tabs.Container
      renderHeader={() => (
        <ExampleHeader
          title="FlashList v2"
          subtitle="500 items + a short tab (footer-spacer collapse)"
        />
      )}
    >
      <Tabs.Tab name="long" label="500 items">
        <TabFlashList<Item>
          data={long}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
      <Tabs.Tab name="short" label="Short">
        <TabFlashList<Item>
          data={short}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
    </Tabs.Container>
  );
}

/** LegendList adapter (subpath import). */
export function LegendListExample() {
  return (
    <Tabs.Container
      renderHeader={() => (
        <ExampleHeader title="LegendList" subtitle="@legendapp/list adapter" />
      )}
    >
      <Tabs.Tab name="long" label="500 items">
        <TabLegendList<Item>
          data={long}
          keyExtractor={(item: Item) => item.id}
          renderItem={({ item }: { item: Item }) => <Row item={item} />}
          recycleItems
        />
      </Tabs.Tab>
      <Tabs.Tab name="short" label="Short">
        <TabLegendList<Item>
          data={short}
          keyExtractor={(item: Item) => item.id}
          renderItem={({ item }: { item: Item }) => <Row item={item} />}
        />
      </Tabs.Tab>
    </Tabs.Container>
  );
}

export function SectionListExample() {
  return (
    <Tabs.Container
      renderHeader={() => (
        <ExampleHeader title="SectionList" subtitle="Sections with sticky headers" />
      )}
    >
      <Tabs.Tab name="sections" label="Sections">
        <Tabs.SectionList<Item>
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
        />
      </Tabs.Tab>
      <Tabs.Tab name="flat" label="Flat">
        <Tabs.FlatList<Item>
          data={makeItems(30)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
    </Tabs.Container>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666' },
});
