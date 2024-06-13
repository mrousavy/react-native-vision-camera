# cocoapods-check

[![license](https://img.shields.io/badge/license-apache_2.0-red.svg?style=flat)](https://raw.githubusercontent.com/square/keywhiz/master/LICENSE)

cocoapods-check displays the differences between locked and installed Pods. It can save time by quickly showing whether it's necessary to run `pod install`. For more information see https://github.com/CocoaPods/CocoaPods/issues/4385 and https://github.com/CocoaPods/CocoaPods/issues/4346.

## Installation

    $ gem install cocoapods-check

## Usage

`pod check` will display a list of Pods that will be installed by running `pod install`:

    $ pod check
    ~SquareData, +SquareItems, ~SquareTables
    [!] `pod install` will install 3 Pods.

The symbol before each Pod name indicates the status of the Pod. A `~` indicates a version of a Pod exists locally, but the version specified in `Podfile.lock` is different. A `+` indicates no version of the Pod exists locally. Pods that don't require an update will not be listed. For development pods the modified time of the Pod's files are checked against the modified time of the lockfile to determine whether the Pod needs installation.

Verbose mode shows a bit more detail:

    $ pod check --verbose
    SquareData 1.2.1 -> 1.2.2
    SquareItems newly added
    SquareTables (SquareTables/SomeSource.m)
    [!] `pod install` will install 3 Pods.

For development Pods verbose mode shows the files that are newer than the lockfile in parentheses.

If no Pods are out of date, then the output looks like:

    $ pod check
    The Podfile's dependencies are satisfied

## Exit Code

If any Pods are out of date, `pod check` will exit with a non-zero exit code. Otherwise it will exit with an exit code of zero.

## License

cocoapods-check is under the Apache 2.0 license. See the [LICENSE](LICENSE) file for details.

