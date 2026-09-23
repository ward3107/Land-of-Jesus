import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { OrgSummary } from '@communitydirect/core';
import { useLocale } from '@/lib/locale-context';
import { listFollowing, unfollow } from '@/lib/orgs';
import { reportOrganization } from '@/lib/account';

export default function FollowingScreen() {
  const { t } = useLocale();
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrgs(await listFollowing());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUnfollow(id: string) {
    try {
      await unfollow(id);
      setOrgs((list) => list.filter((o) => o.id !== id));
    } catch {
      // ignore for now
    }
  }

  function onReport(id: string, name: string) {
    Alert.alert(`Report ${name}?`, 'Tell us what’s wrong. A platform reviewer will look into it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Spam', onPress: () => void submitReport(id, 'spam') },
      { text: 'Inappropriate', onPress: () => void submitReport(id, 'inappropriate') },
    ]);
  }

  async function submitReport(id: string, reason: string) {
    try {
      await reportOrganization(id, reason);
      Alert.alert('Thank you', 'Your report has been submitted.');
    } catch {
      Alert.alert('Could not report', 'Please try again later.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('common.following')}</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#4f46e5" />
      ) : (
        <FlatList
          data={orgs}
          keyExtractor={(o) => o.id}
          ListEmptyComponent={
            <Text style={styles.empty}>You’re not following anyone yet. Try Discover.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>@{item.slug}</Text>
              </View>
              <Pressable
                style={styles.btn}
                onPress={() => onUnfollow(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Unfollow ${item.name}`}
              >
                <Text style={styles.btnText}>{t('common.unfollow')}</Text>
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                onPress={() => onReport(item.id, item.name)}
                accessibilityRole="button"
                accessibilityLabel={`Report ${item.name}`}
              >
                <Text style={styles.iconBtnText}>⚑</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  sub: { fontSize: 13, color: '#64748b' },
  btn: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 14, borderRadius: 999 },
  btnText: { color: '#334155', fontWeight: '600' },
  iconBtn: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 999 },
  iconBtnText: { color: '#64748b', fontSize: 16 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
});
