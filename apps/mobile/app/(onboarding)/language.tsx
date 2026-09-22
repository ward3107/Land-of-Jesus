import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@communitydirect/core';
import { useLocale } from '@/lib/locale-context';

export default function LanguageScreen() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.chooseLanguage')}</Text>
      <View style={styles.list}>
        {SUPPORTED_LOCALES.map((l) => {
          const selected = l === locale;
          return (
            <Pressable
              key={l}
              onPress={() => setLocale(l)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {LOCALE_LABELS[l].native}
              </Text>
              <Text style={styles.optionSub}>{LOCALE_LABELS[l].english}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.button} onPress={() => router.push('/(onboarding)/notifications')}>
        <Text style={styles.buttonText}>{t('onboarding.allowNotifications')} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 20, padding: 28, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  list: { gap: 12 },
  option: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, backgroundColor: 'white' },
  optionSelected: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  optionText: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  optionTextSelected: { color: '#4338ca' },
  optionSub: { fontSize: 13, color: '#64748b' },
  button: { backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
