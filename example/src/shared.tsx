import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useCollapseProgress } from 'react-native-collapsible-tab';

export type Item = { id: string; title: string; color: string };

const PALETTE = ['#FFD8BE', '#C9E4DE', '#C6DEF1', '#DBCDF0', '#F2C6DE', '#FAEDCB'];

export function makeItems(count: number, prefix = 'Item'): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `${prefix} ${i + 1}`,
    color: PALETTE[i % PALETTE.length] as string,
  }));
}

export function Row({ item }: { item: Item }) {
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.thumb, { backgroundColor: item.color }]} />
      <View>
        <Text style={rowStyles.title}>{item.title}</Text>
        <Text style={rowStyles.subtitle}>Swipe tabs, drag the header</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  title: { fontSize: 15, fontWeight: '600', color: '#111' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
});

/**
 * Demo header: the tap counter proves buttons inside the header receive
 * presses while the header itself stays drag-to-scrollable — the
 * most-requested unfixed feature of react-native-collapsible-tab-view.
 */
export function ExampleHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  const progress = useCollapseProgress();
  const [taps, setTaps] = useState(0);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.6,
  }));

  return (
    <View style={headerStyles.container}>
      <Animated.View style={fadeStyle}>
        <View style={headerStyles.avatar} />
        <Text style={headerStyles.title}>{title}</Text>
        {subtitle ? <Text style={headerStyles.subtitle}>{subtitle}</Text> : null}
      </Animated.View>
      <Pressable
        style={headerStyles.button}
        onPress={() => setTaps((t) => t + 1)}
      >
        <Text style={headerStyles.buttonText}>
          {taps === 0 ? 'Tap me — then drag me' : `Tapped ${taps}× and still scrollable`}
        </Text>
      </Pressable>
      {children}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4f46e5',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  button: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export function AboutContent() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {makeItems(4, 'Paragraph').map((p) => (
        <View key={p.id} style={{ gap: 6 }}>
          <Text style={{ fontWeight: '600', color: '#111' }}>{p.title}</Text>
          <Text style={{ color: '#555', lineHeight: 20 }}>
            Short content tab: the container pads it so the header can still
            fully collapse, with no dead bounce-back.
          </Text>
        </View>
      ))}
    </View>
  );
}
