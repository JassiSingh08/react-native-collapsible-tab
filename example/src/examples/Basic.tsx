import { Tabs } from '@scanner/react-native-collapsible-tabs';
import { AboutContent, ExampleHeader, makeItems, Row, type Item } from '../shared';

const posts = makeItems(60, 'Post');
const likes = makeItems(6, 'Like');

export function Basic() {
  return (
    <Tabs.Container
      renderHeader={() => (
        <ExampleHeader
          title="Basic"
          subtitle="FlatList + ScrollView, per-tab scroll memory"
        />
      )}
    >
      <Tabs.Tab name="posts" label="Posts">
        <Tabs.FlatList<Item>
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
      <Tabs.Tab name="likes" label="Likes (short)">
        <Tabs.FlatList<Item>
          data={likes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Row item={item} />}
        />
      </Tabs.Tab>
      <Tabs.Tab name="about" label="About">
        <Tabs.ScrollView>
          <AboutContent />
        </Tabs.ScrollView>
      </Tabs.Tab>
    </Tabs.Container>
  );
}
