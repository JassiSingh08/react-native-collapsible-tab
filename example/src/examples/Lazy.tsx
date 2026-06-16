import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Tabs } from '@scanner/react-native-collapsible-tabs';
import { ExampleHeader, makeItems, Row, type Item } from '../shared';

const items = makeItems(50);

function Placeholder({ name }: { name: string }) {
  return (
    <View style={styles.placeholder}>
      <ActivityIndicator />
      <Text style={styles.placeholderText}>Mounting “{name}”…</Text>
    </View>
  );
}

/**
 * Tabs mount on first focus. Jumping from tab 1 to tab 4 mounts ONLY tab 4 —
 * intermediates stay as placeholders (collapsible-tab-view #417).
 */
export function Lazy() {
  return (
    <Tabs.Container
      lazy
      renderLazyPlaceholder={({ name }) => <Placeholder name={name} />}
      renderHeader={() => (
        <ExampleHeader title="Lazy" subtitle="Tabs mount on first focus" />
      )}
    >
      {['one', 'two', 'three', 'four'].map((name) => (
        <Tabs.Tab key={name} name={name} label={`Tab ${name}`}>
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
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { color: '#888' },
});
