import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';

/**
 * Deep-link target for `communitydirect://messages/<uuid>`. In Phase C/D this
 * fetches the message (RLS-scoped) and renders title, body, media and CTA.
 */
export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Screen title="Message" subtitle={`Message id: ${id ?? 'unknown'}`} />;
}
