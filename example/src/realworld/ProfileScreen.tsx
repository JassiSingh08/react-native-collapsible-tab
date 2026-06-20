import { useMemo, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  Tabs,
  useCollapseProgress,
  type CollapsingTabsRef,
} from 'react-native-collapsible-tab';
import { TabFlashList } from 'react-native-collapsible-tab/flash-list';
import { Button, EmptyState, PhotoCell, PostRow, StatCard } from './components';
import { makePhotos, makePosts, PROFILE, type Photo, type Post } from './data';

function ProfileHeader({ topInset }: { topInset: number }) {
  // A real consumer animation: avatar shrinks + bio fades as the header collapses.
  const progress = useCollapseProgress();
  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - progress.value * 0.35 }],
    opacity: 1 - progress.value * 0.3,
  }));
  const bioStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  // Pad the header below the status bar / notch. Paired with
  // minHeaderHeight={topInset} so this strip stays opaque when collapsed.
  return (
    <View style={[styles.header, { paddingTop: topInset + 12 }]}>
      <View style={styles.headerTop}>
        <Animated.View style={[styles.avatar, avatarStyle]}>
          <Text style={styles.avatarText}>{PROFILE.initials}</Text>
        </Animated.View>
        <Button title="Follow" primary />
      </View>
      <Text style={styles.name}>{PROFILE.name}</Text>
      <Text style={styles.handle}>{PROFILE.handle}</Text>
      <Animated.View style={bioStyle}>
        <Text style={styles.bio}>{PROFILE.bio}</Text>
        <View style={styles.stats}>
          <StatCard value={PROFILE.followers} label="Followers" />
          <StatCard value={PROFILE.following} label="Following" />
        </View>
      </Animated.View>
    </View>
  );
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabsRef = useRef<CollapsingTabsRef>(null);

  const posts = useMemo(() => makePosts(200, 'post'), []);
  const replies = useMemo(() => makePosts(40, 'reply'), []);
  const photos = useMemo(() => makePhotos(60), []);

  const photoSize = (width - 12) / 3;

  return (
    <Tabs.Container
      ref={tabsRef}
      minHeaderHeight={insets.top}
      headerBackgroundColor="#fff"
      snapThreshold={0.5}
      onTabChange={({ tabName }) => {
        // Tapping the focused tab again scrolls it to top (common app pattern).
        if (tabName === tabsRef.current?.getFocusedTab()) return;
      }}
      renderHeader={() => <ProfileHeader topInset={insets.top} />}
    >
      <Tabs.Tab name="posts" label="Posts">
        <TabFlashList<Post>
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostRow post={item} />}
        />
      </Tabs.Tab>

      <Tabs.Tab name="replies" label="Replies">
        <TabFlashList<Post>
          data={replies}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostRow post={item} />}
        />
      </Tabs.Tab>

      <Tabs.Tab name="media" label="Media">
        <Tabs.FlatList<Photo>
          data={photos}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PhotoCell photo={item} size={photoSize} />}
        />
      </Tabs.Tab>

      <Tabs.Tab name="about" label="About">
        <Tabs.ScrollView>
          <View style={styles.about}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutText}>{PROFILE.bio}</Text>
            <EmptyState text="This short tab still collapses the header fully." />
          </View>
        </Tabs.ScrollView>
      </Tabs.Tab>
    </Tabs.Container>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 24 },
  name: { fontSize: 22, fontWeight: '800', color: '#111' },
  handle: { fontSize: 15, color: '#888', marginTop: 2 },
  bio: { fontSize: 14, color: '#333', lineHeight: 20, marginTop: 10 },
  stats: { flexDirection: 'row', gap: 24, marginTop: 14 },
  about: { padding: 16, gap: 12 },
  aboutTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  aboutText: { fontSize: 14, color: '#444', lineHeight: 21 },
});
