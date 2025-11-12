import os.lock

final class Counter {
  /**
    * https://forums.swift.org/t/atomic-property-wrapper-for-standard-library/30468/18
  */
  private var unfair_lock: os_unfair_lock_t
  private var count = 1
  init() {
    unfair_lock = .allocate(capacity: 1)
    unfair_lock.initialize(to: os_unfair_lock())
  }
  deinit {
    unfair_lock.deinitialize(count: 1)
    unfair_lock.deallocate()
  }
  private func lock() {
    os_unfair_lock_lock(unfair_lock)
  }
  private func unlock() {
    os_unfair_lock_unlock(unfair_lock)
  }
  func increment() -> Int {
    lock()
    defer { unlock() }
    count &+= 1
    return count
  }
  func check(_ count: Int) -> Bool {
    lock()
    defer { unlock() }
    return self.count == count
  }
}
