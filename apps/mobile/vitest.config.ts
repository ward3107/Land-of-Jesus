import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Only pure, framework-free logic is unit-tested here. React Native screen
    // testing (jest-expo) is planned for Phase C.
    include: ['lib/**/*.test.ts'],
  },
});
