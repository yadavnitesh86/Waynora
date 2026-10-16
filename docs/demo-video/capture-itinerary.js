const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const htmlPath = path.join(__dirname, 'composition', 'assets', 'screenshots', 'itinerary.html');
  await page.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, 'composition', 'assets', 'screenshots', 'itinerary.png') });
  console.log('Itinerary screenshot captured');

  await browser.close();
})();
