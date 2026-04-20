import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  private func valueForLaunchArgument(_ name: String) -> String? {
    let args = ProcessInfo.processInfo.arguments
    guard let index = args.firstIndex(of: name), index + 1 < args.count else {
      return nil
    }
    return args[index + 1]
  }

  private func configureMetroFromLaunchContext() {
    let defaults = UserDefaults.standard
    let launchArgJsLocation = valueForLaunchArgument("-RCT_jsLocation")
    let launchArgPackagerScheme = valueForLaunchArgument("-RCT_packager_scheme")

    // react-native internally reads from UserDefaults when constructing the metro url, so we store it there.
    // This is needed for harness e2e tests running on AWS device farm where we need to pass a custom metro ipv6.
    // This is passed in apps/simple-camera/rn-harness.config.mjs as part of the launch args.
    if let jsLocation = launchArgJsLocation {
      defaults.set(jsLocation, forKey: "RCT_jsLocation")
    }

    if let packagerScheme = launchArgPackagerScheme {
      defaults.set(packagerScheme, forKey: "RCT_packager_scheme")
    }
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    configureMetroFromLaunchContext()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    let initialProperties = [
      "grantPermissionsOnLaunch": valueForLaunchArgument("-VisionCameraGrantPermissionsOnLaunch") == "YES"
    ]

    factory.startReactNative(
      withModuleName: "SimpleCamera",
      in: window,
      initialProperties: initialProperties,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
