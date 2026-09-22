import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginTop: 24 },
  subtitle: { fontSize: 15, color: '#475569', marginTop: 6 },
  body: { marginTop: 16 },
});
