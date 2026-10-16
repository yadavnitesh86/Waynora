const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // 1. Landing page
  console.log('Capturing landing page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-landing.png'), fullPage: false });
  console.log('  -> 01-landing.png');

  // 2. Sign In page
  console.log('Capturing sign-in page...');
  await page.goto('http://localhost:5173/signin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02-signin.png'), fullPage: false });
  console.log('  -> 02-signin.png');

  // 3. Sign in with credentials and navigate to chat
  console.log('Signing in...');
  await page.fill('input[type="email"]', 'yadavneha282003@gmail.com');
  await page.fill('input[type="password"]', 'yadavneha282003@gmail.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // 4. Chat page (empty state)
  console.log('Capturing chat page...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03-chat-empty.png'), fullPage: false });
  console.log('  -> 03-chat-empty.png');

  // 5. Type a travel request and submit
  console.log('Typing travel request...');
  const textarea = page.locator('textarea').first();
  await textarea.click();
  await textarea.fill('Plan a 5-day trip to Jaipur, Rajasthan in December');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04-chat-typed.png'), fullPage: false });
  console.log('  -> 04-chat-typed.png');

  // Submit the request
  console.log('Submitting request...');
  const sendBtn = page.locator('button:has-text("Send"), button[aria-label*="send" i], button[type="submit"]').first();
  await sendBtn.click();
  await page.waitForTimeout(3000);

  // 6. Waiting state with 2048 game
  console.log('Capturing waiting state...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05-waiting.png'), fullPage: false });
  console.log('  -> 05-waiting.png');

  // Wait a bit more for the waiting experience to develop
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06-waiting-later.png'), fullPage: false });
  console.log('  -> 06-waiting-later.png');

  // 7. Play the 2048 game a bit
  console.log('Playing 2048...');
  const gameBoard = page.locator('[class*="game"], [class*="board"], [class*="2048"]').first();
  if (await gameBoard.count() > 0) {
    await gameBoard.click();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07-game-played.png'), fullPage: false });
  console.log('  -> 07-game-played.png');

  // 8. Wait for itinerary response (up to 5 minutes, check every 10 seconds)
  console.log('Waiting for itinerary response...');
  let itineraryFound = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    await page.waitForTimeout(10000);
    const content = await page.content();
    // Check if itinerary content has appeared (look for markdown content, day plans, etc.)
    const assistantMessages = page.locator('[class*="assistant"], [class*="response"], [class*="itinerary"], [class*="markdown"]');
    const count = await assistantMessages.count();
    if (count > 0) {
      // Check if there's substantial content
      for (let i = 0; i < count; i++) {
        const text = await assistantMessages.nth(i).textContent();
        if (text && text.length > 200) {
          console.log(`  Itinerary detected at attempt ${attempt + 1} (length: ${text.length})`);
          itineraryFound = true;
          break;
        }
      }
    }
    if (itineraryFound) break;
    console.log(`  Attempt ${attempt + 1}: no itinerary yet...`);
  }

  if (itineraryFound) {
    console.log('Capturing itinerary result...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08-itinerary.png'), fullPage: false });
    console.log('  -> 08-itinerary.png');

    // Scroll down to see more of the itinerary
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09-itinerary-scroll.png'), fullPage: false });
    console.log('  -> 09-itinerary-scroll.png');
  } else {
    console.log('  Itinerary not ready yet, capturing current state...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08-current-state.png'), fullPage: false });
    console.log('  -> 08-current-state.png');
  }

  // 9. Mobile view
  console.log('Capturing mobile view...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10-mobile.png'), fullPage: false });
  console.log('  -> 10-mobile.png');

  await browser.close();
  console.log('Done! All screenshots saved to docs/demo-video/screenshots/');
})();
