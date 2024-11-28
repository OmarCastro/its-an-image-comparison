import { test } from '../../test-utils/ui/test.util.js'

test('image comparison base element visual test', async ({ page, expect }) => {
  await page.goto('./build/docs/test-page.html')
  const qrCode = page.locator('.image-comparison-1')
  await expect.soft(await qrCode.screenshot()).toMatchSnapshot('image-comparison--hello-world.png')
})

test('image comparison transparent image element visual test', async ({ page, expect }) => {
  await page.goto('./build/docs/test-page.html')
  const qrCode = page.locator('.image-comparison-2')
  await expect.soft(await qrCode.screenshot()).toMatchSnapshot('image-comparison--alpha-light.png')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect.soft(await qrCode.screenshot()).toMatchSnapshot('image-comparison--alpha-dark.png')
})
