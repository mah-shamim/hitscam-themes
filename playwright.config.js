// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const CI = !!process.env.CI;
// স্থানীয়ভাবে শুধু Chromium ইনস্টল থাকলে: PW_FORCE_CHROMIUM=1 npx playwright test  (সব প্রজেক্ট Chromium এ চলবে, ভিউপোর্ট/টাচ একই থাকবে)
const FORCE = !!process.env.PW_FORCE_CHROMIUM;

const proj = (name, device, extra = {}) => ({
  name,
  use: { ...devices[device], ...(FORCE ? { browserName: 'chromium' } : {}), ...extra },
});

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['list'], ['html', { open: 'never' }], ['github']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'bn-BD',
    timezoneId: 'Asia/Dhaka',
    reducedMotion: 'reduce',   // স্মুথ স্ক্রল/অ্যানিমেশনে ক্লিক "not stable" হওয়া ঠেকায়
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/server.js',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !CI,
    timeout: 20_000,
  },
  projects: [
    // ---- ডেস্কটপ ব্রাউজার (৩টি রেন্ডারিং ইঞ্জিন) ----
    proj('chromium', 'Desktop Chrome'),
    proj('firefox', 'Desktop Firefox'),
    proj('webkit', 'Desktop Safari'),
    proj('edge', 'Desktop Edge', FORCE ? {} : { channel: 'msedge' }),
    // ---- মোবাইল ----
    proj('pixel-7', 'Pixel 7'),                 // Android Chrome
    proj('galaxy-s9', 'Galaxy S9+'),            // ছোট Android (320px), Samsung Internet ≈ Chromium
    proj('iphone-14', 'iPhone 14'),             // iOS Safari
    proj('iphone-se', 'iPhone SE'),             // ছোট iOS (320px)
    // ---- ট্যাবলেট ----
    proj('ipad', 'iPad (gen 7)'),               // 810px (md ব্রেকপয়েন্টের ওপরে)
    proj('galaxy-tab', 'Galaxy Tab S4'),        // 712px (md এর নিচে)
  ],
});
