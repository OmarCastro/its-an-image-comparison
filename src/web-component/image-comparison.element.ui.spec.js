import { test } from '../../test-utils/ui/test.util.js'

test('qr-code element visual test', async ({ page, expect }) => {
  await page.goto('./build/docs/test-page.html');
  const qrCode = page.locator('.image-comparison-1')
  await expect.soft(await qrCode.screenshot()).toMatchSnapshot('image-comparison--hello-world.png');
});

