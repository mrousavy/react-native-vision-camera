#!/usr/bin/env node

import { remote } from 'webdriverio'

const capabilities = {
  platformName: 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:bundleId': process.env.HARNESS_IOS_BUNDLE_ID,
  'appium:udid': process.env.DEVICEFARM_DEVICE_UDID,
  'appium:deviceName': process.env.DEVICEFARM_DEVICE_NAME,
  'appium:platformVersion': process.env.DEVICEFARM_DEVICE_OS_VERSION,
  'appium:derivedDataPath': process.env.DEVICEFARM_APPIUM_WDA_DERIVED_DATA_PATH,
  'appium:usePrebuiltWDA': true,
  'appium:autoAcceptAlerts': true,
  'appium:noReset': true,
  'appium:forceAppLaunch': true,
  'appium:shouldTerminateApp': false,
  'appium:newCommandTimeout': 7200,
  'appium:processArguments': {
    args: ['-VisionCameraGrantPermissionsOnLaunch', 'YES'],
  },
}

const driver = await remote({
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',
  logLevel: 'warn',
  connectionRetryCount: 3,
  connectionRetryTimeout: 120_000,
  capabilities,
})

console.log(`Started Appium iOS permission bootstrap session ${driver.sessionId}`)
await driver.pause(15_000)
console.log(`Stopping Appium iOS permission bootstrap session ${driver.sessionId}`)
await driver.deleteSession()
