/**
 * Real device push test.
 *
 * Sends one push through the production {@link ExpoPushProvider} to a token you
 * supply, and prints the provider ticket. Use it to verify push delivery on a
 * real phone end-to-end:
 *
 *   1. Run the mobile app on a device, allow notifications, and copy the Expo
 *      push token it registers (ExponentPushToken[…]).
 *   2. pnpm --filter @communitydirect/worker test-push -- 'ExponentPushToken[…]'
 *   3. The device should show the notification; the ticket prints here.
 *
 * Optional: EXPO_ACCESS_TOKEN for a push-security-enabled project.
 */
import { ExpoPushProvider, type PushTicket } from '@communitydirect/push';

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

function ticketLine(ticket: PushTicket): string {
  if (ticket.status === 'ok') {
    return `  OK    ${ticket.token}  receipt=${ticket.receiptId ?? '(none)'}`;
  }
  return `  ERROR ${ticket.token}  ${ticket.errorCode ?? 'Unknown'}${ticket.errorMessage ? `: ${ticket.errorMessage}` : ''}`;
}

async function main(): Promise<void> {
  const token = process.argv[2];
  if (!token) {
    process.stderr.write(
      "usage: tsx src/test-push.ts '<ExpoPushToken>' [title] [body]\n",
    );
    process.exitCode = 1;
    return;
  }
  const title = process.argv[3] ?? 'CommunityDirect test';
  const body = process.argv[4] ?? 'If you can read this, push delivery works. 🎉';

  const provider = new ExpoPushProvider({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  log(`Sending a test push to ${token} …`);

  const result = await provider.send([
    { token, title, body, data: { url: 'communitydirect://messages/test' } },
  ]);

  for (const ticket of result.tickets) log(ticketLine(ticket));
  if (result.invalidTokens.length > 0) {
    log(`Invalid tokens (would be cleaned up): ${result.invalidTokens.join(', ')}`);
  }
  process.exitCode = result.tickets.every((t) => t.status === 'ok') ? 0 : 1;
}

main().catch((err) => {
  process.stderr.write(`fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
