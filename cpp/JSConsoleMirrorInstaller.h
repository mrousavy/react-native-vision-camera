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

namespace vision {

using namespace facebook;

/**
 Installs a `console` mirror object into the `toRuntime`'s global namespace which redirects all log calls to the original `fromRuntime`.
 */
void installJSConsoleMirror(jsi::Runtime& fromRuntime, jsi::Runtime& toRuntime);

}

#endif /* JSConsoleMirrorInstaller_h */
