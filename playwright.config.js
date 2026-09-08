import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:5199/phonobuddy/', viewport: { width: 820, height: 1180 }, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', testMatch: ['phonobuddy.spec.js', 'reading-voice.spec.js'], use: { browserName: 'chromium' } },
    // Windows WebKit cannot persist Blob data in its test IndexedDB store.
    // Run the real recording persistence suite in Chromium; keep WebKit UI and
    // non-Blob reading persistence coverage separate and explicit.
    { name: 'webkit', testMatch: ['webkit-reading.spec.js', 'reading-voice.spec.js'], use: { browserName: 'webkit' } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5199 --strictPort', url: 'http://127.0.0.1:5199/phonobuddy/', reuseExistingServer: false },
});
