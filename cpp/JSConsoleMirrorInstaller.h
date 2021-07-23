//
//  JSConsoleMirrorInstaller.h
//  VisionCamera
//
//  Created by Marc Rousavy on 23.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#ifndef JSConsoleMirrorInstaller_h
#define JSConsoleMirrorInstaller_h

#include <stdio.h>
#include <jsi/jsi.h>
#include <React-callinvoker/ReactCommon/CallInvoker.h>

namespace vision {

using namespace facebook;

/**
 Installs a `console` mirror object into the `mirrorRuntime`'s global namespace which redirects all log calls to the `originalRuntime`.
 */
void installJSConsoleMirror(jsi::Runtime& originalRuntime,
                            jsi::Runtime& mirrorRuntime,
                            std::shared_ptr<react::CallInvoker> callInvoker);

}

#endif /* JSConsoleMirrorInstaller_h */
