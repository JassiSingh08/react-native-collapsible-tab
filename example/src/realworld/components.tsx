import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Post, Photo } from './data';

export function PostRow({ post }: { post: Post }) {
  return (
    <View style={styles.post}>
      <View style={[styles.avatar, { backgroundColor: post.accent }]}>
        <Text style={styles.avatarText}>{post.avatar}</Text>
      </View>
      <View style={styles.postBody}>
        <Text style={styles.postHeader}>
          <Text style={styles.postAuthor}>{post.author}</Text>
          <Text style={styles.postHandle}>  {post.handle}</Text>
        </Text>
        <Text style={styles.postText}>{post.body}</Text>
        <View style={styles.postStats}>
          <Stat label="💬" value={post.replies} />
          <Stat label="🔁" value={post.reposts} />
          <Stat label="♥" value={post.likes} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Text style={styles.stat}>
      {label} {value}
    </Text>
  );
}

export function PhotoCell({ photo, size }: { photo: Photo; size: number }) {
  return (
    <View style={[styles.photo, { backgroundColor: photo.color, height: size }]}>
      <Text style={styles.photoCaption}>{photo.caption}</Text>
    </View>
  );
}

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Button({
  title,
  primary,
  onPress,
}: {
  title: string;
  primary?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonGhost,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  postBody: { flex: 1, gap: 4 },
  postHeader: { fontSize: 14 },
  postAuthor: { fontWeight: '700', color: '#111' },
  postHandle: { color: '#888' },
  postText: { color: '#333', lineHeight: 20 },
  postStats: { flexDirection: 'row', gap: 20, marginTop: 4 },
  stat: { color: '#888', fontSize: 13 },
  photo: {
    flex: 1,
    margin: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCaption: { color: '#fff', fontWeight: '600' },
  statCard: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 12, color: '#888' },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
  },
  buttonPrimary: { backgroundColor: '#111' },
  buttonGhost: { borderWidth: 1, borderColor: '#ccc' },
  buttonText: { fontWeight: '600', color: '#111', fontSize: 14 },
  buttonTextPrimary: { color: '#fff' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999' },
});
