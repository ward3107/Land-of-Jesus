import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useLocale } from '@/lib/locale-context';

export default function HomeScreen() {
  const { t } = useLocale();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.welcomeTitle')}</Text>
      <Text style={styles.subtitle}>
        The latest messages from the organizations you follow will appear here.
      </Text>
      <Link href="/(onboarding)/welcome" style={styles.button}>
        {t('onboarding.discoverOrganizations')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 14, padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 15, color: '#475569' },
  button: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#4f46e5', color: 'white', fontWeight: '600', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, overflow: 'hidden' },
});
