import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { OrgSummary } from '@communitydirect/core';
import { useLocale } from '@/lib/locale-context';
import { discover, follow } from '@/lib/orgs';
import { ensureSession } from '@/lib/session';

export default function DiscoverScreen() {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState('');
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      setOrgs(await discover(q));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load('');
  }, [load]);

  async function onFollow(id: string) {
    await ensureSession();
    try {
      await follow(id, locale, 'app:discover');
      setFollowed((f) => ({ ...f, [id]: true }));
    } catch {
      // Surface a toast in a later iteration.
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('common.discover')}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => load(query)}
        placeholder="Search organizations"
        returnKeyType="search"
        style={styles.search}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#4f46e5" />
      ) : (
        <FlatList
          data={orgs}
          keyExtractor={(o) => o.id}
          ListEmptyComponent={<Text style={styles.empty}>No organizations found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {item.name}
                  {item.verificationStatus === 'VERIFIED' ? '  ✓' : ''}
                </Text>
                <Text style={styles.sub}>{item.category ?? `@${item.slug}`}</Text>
              </View>
              <Pressable
                style={[styles.followBtn, followed[item.id] && styles.followingBtn]}
                onPress={() => onFollow(item.id)}
                disabled={followed[item.id]}
              >
                <Text style={[styles.followText, followed[item.id] && styles.followingText]}>
                  {followed[item.id] ? t('common.following') : t('common.follow')}
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 28, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  search: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'white', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  sub: { fontSize: 13, color: '#64748b' },
  followBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  followingBtn: { backgroundColor: '#e2e8f0' },
  followText: { color: 'white', fontWeight: '600' },
  followingText: { color: '#334155' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
});
