import { Tabs } from 'react-native-collapsible-tab';
import { ExampleHeader, makeItems, Row, type Item } from '../shared';

const items = makeItems(80);

/** Header released mid-collapse animates fully open or closed. */
export function Snap() {
  return (
    <Tabs.Container
      snapThreshold={0.5}
      renderHeader={() => (
        <ExampleHeader
          title="Snap"
          subtitle="Release the header half-way — it settles to an edge"
        />
      )}
    >
      <Tabs.Tab name="one" label="One">
        <Tabs.FlatList<Item>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
      <Tabs.Tab name="two" label="Two">
        <Tabs.FlatList<Item>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
    </Tabs.Container>
  );
}

/** Twitter-style: any upward scroll reveals the header immediately. */
export function RevealOnScroll() {
  return (
    <Tabs.Container
      revealHeaderOnScroll
      renderHeader={() => (
        <ExampleHeader
          title="Reveal on scroll"
          subtitle="Scroll deep, then scroll up a little"
        />
      )}
    >
      <Tabs.Tab name="feed" label="Feed">
        <Tabs.FlatList<Item>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
      <Tabs.Tab name="media" label="Media">
        <Tabs.FlatList<Item>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
    </Tabs.Container>
  );
}
