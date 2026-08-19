import { expect, test } from '@playwright/test'

test('long API member headings wrap on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.goto(
    '/api/react-native-vision-camera/hybrid-objects/CameraController',
  )
  await page.waitForLoadState('networkidle')

  const heading = page
    .locator('h3')
    .filter({ hasText: 'convertWhiteBalanceTemperatureAndTintValues(...)' })
  await expect(heading).toBeVisible()

  const metrics = await heading.evaluate((element) => {
    const link = element.querySelector('a')
    if (link == null) throw new Error('API member heading link not found')

    const lineHeight = Number.parseFloat(getComputedStyle(link).lineHeight)

    return {
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      headingClientWidth: element.clientWidth,
      headingScrollWidth: element.scrollWidth,
      linkHeight: link.getBoundingClientRect().height,
      lineHeight,
    }
  })

  expect(metrics.headingScrollWidth).toBeLessThanOrEqual(
    metrics.headingClientWidth,
  )
  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(
    metrics.documentClientWidth,
  )
  expect(metrics.linkHeight).toBeGreaterThan(metrics.lineHeight * 1.5)
})
