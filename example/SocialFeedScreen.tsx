import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StatusBar,
  SafeAreaView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSimulatedInsets, useSimulatedFontScale } from 'rn-device-preview';

// RN's SafeAreaView only applies inset padding on iOS; on Android it's a
// plain View. StatusBar.currentHeight (Android-only, undefined on iOS) is
// the standard way to reserve that space manually — same trick this
// library's own DeviceFrame.tsx uses for the same reason.
const ANDROID_STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

type Post = {
  id: string;
  username: string;
  avatarId: number;
  timestamp: string;
  imageId: number;
  caption: string;
  likes: number;
};

const POSTS: Post[] = [
  { id: '1', username: 'mira.codes', avatarId: 64, timestamp: '2h', imageId: 1015, caption: 'Sunrise over the ridge this morning. Worth the early alarm.', likes: 128 },
  { id: '2', username: 'devon.travels', avatarId: 65, timestamp: '4h', imageId: 1016, caption: "Coffee, laptop, and a view. Remote work isn't so bad.", likes: 94 },
  { id: '3', username: 'aki.makes', avatarId: 91, timestamp: '6h', imageId: 1024, caption: 'New workbench setup, finally organized.', likes: 212 },
  { id: '4', username: 'sana.eats', avatarId: 22, timestamp: '9h', imageId: 292, caption: 'Homemade pasta night. Recipe in bio.', likes: 341 },
  { id: '5', username: 'theo.builds', avatarId: 33, timestamp: '12h', imageId: 1041, caption: 'Foundations poured. Next stop, framing.', likes: 76 },
  { id: '6', username: 'noor.reads', avatarId: 44, timestamp: '1d', imageId: 24, caption: 'Rainy day, good book, no notifications.', likes: 189 },
  { id: '7', username: 'kai.rides', avatarId: 55, timestamp: '1d', imageId: 1035, caption: 'Longest ride of the season so far.', likes: 267 },
  { id: '8', username: 'liv.paints', avatarId: 77, timestamp: '2d', imageId: 106, caption: 'Still figuring out the color palette for this one.', likes: 153 },
];

function Stat({
  label,
  value,
  fontScale,
  bold,
}: {
  label: string;
  value: string;
  fontScale: number;
  bold: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text
        style={[
          styles.statValue,
          { fontSize: 16 * fontScale, fontWeight: bold ? '800' : '700' },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.statLabel, { fontSize: 12 * fontScale }]}>
        {label}
      </Text>
    </View>
  );
}

function ProfileHeader() {
  const insets = useSimulatedInsets();
  const { fontScale, boldText } = useSimulatedFontScale();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerRow}>
        <Image
          source={{ uri: 'https://picsum.photos/id/64/160' }}
          style={styles.avatar}
        />
        <View style={styles.stats}>
          <Stat label="Posts" value="128" fontScale={fontScale} bold={boldText} />
          <Stat label="Followers" value="4.2k" fontScale={fontScale} bold={boldText} />
          <Stat label="Following" value="312" fontScale={fontScale} bold={boldText} />
        </View>
      </View>
      <Text
        style={[
          styles.name,
          { fontSize: 17 * fontScale, fontWeight: boldText ? '800' : '700' },
        ]}
      >
        Mira Chen
      </Text>
      <Text style={[styles.bio, { fontSize: 13 * fontScale }]}>
        Product designer. Building small things, mostly outdoors.
      </Text>
    </View>
  );
}

function PostCard({
  post,
  fontScale,
  boldText,
}: {
  post: Post;
  fontScale: number;
  boldText: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: `https://picsum.photos/id/${post.avatarId}/80` }}
          style={styles.cardAvatar}
        />
        <View>
          <Text
            style={[
              styles.cardUsername,
              { fontSize: 13 * fontScale, fontWeight: boldText ? '800' : '700' },
            ]}
          >
            {post.username}
          </Text>
          <Text style={[styles.cardTimestamp, { fontSize: 11 * fontScale }]}>
            {post.timestamp} ago
          </Text>
        </View>
      </View>
      <Image
        source={{ uri: `https://picsum.photos/id/${post.imageId}/800/1000` }}
        style={styles.cardImage}
      />
      <View style={styles.cardActions}>
        <Text style={styles.actionIcon}>♡</Text>
        <Text style={styles.actionIcon}>💬</Text>
        <Text style={styles.actionIcon}>↗</Text>
      </View>
      <Text
        style={[
          styles.cardLikes,
          { fontSize: 13 * fontScale, fontWeight: boldText ? '800' : '700' },
        ]}
      >
        {post.likes} likes
      </Text>
      <Text style={[styles.cardCaption, { fontSize: 13 * fontScale }]}>
        <Text style={{ fontWeight: boldText ? '800' : '700' }}>
          {post.username}{' '}
        </Text>
        {post.caption}
      </Text>
    </View>
  );
}

export default function SocialFeedScreen() {
  const insets = useSimulatedInsets();
  const { fontScale, boldText } = useSimulatedFontScale();

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: ANDROID_STATUS_BAR_HEIGHT }]}
    >
      <StatusBar barStyle="dark-content" />
      <FlatList
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        data={POSTS}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ProfileHeader}
        renderItem={({ item }) => (
          <PostCard post={item} fontScale={fontScale} boldText={boldText} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginRight: 20 },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center' },
  statValue: { color: '#111' },
  statLabel: { color: '#666', marginTop: 2 },
  name: { color: '#111', marginBottom: 2 },
  bio: { color: '#444' },
  card: { marginBottom: 20 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  cardAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  cardUsername: { color: '#111' },
  cardTimestamp: { color: '#999', marginTop: 1 },
  cardImage: { width: '100%', aspectRatio: 4 / 5, backgroundColor: '#f0f0f0' },
  cardActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 16,
  },
  actionIcon: { fontSize: 22, color: '#222' },
  cardLikes: { paddingHorizontal: 16, marginTop: 8, color: '#111' },
  cardCaption: {
    paddingHorizontal: 16,
    marginTop: 4,
    color: '#222',
    lineHeight: 18,
  },
});
