/*
 * This is a modified file originally from the Camera2 Basic sample.
 *
 * Copyright 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.mrousavy.camera.utils

import android.content.Context
import android.hardware.SensorManager.SENSOR_DELAY_NORMAL
import android.hardware.camera2.CameraCharacteristics
import android.view.OrientationEventListener
import android.view.Surface
import androidx.lifecycle.LiveData


class DeviceRotationLiveData(
  context: Context,
) : LiveData<Int>() {

  private val listener = object : OrientationEventListener(context.applicationContext, SENSOR_DELAY_NORMAL) {
    override fun onOrientationChanged(orientation: Int) {
      val rotation = when {
        orientation <= 45 -> Surface.ROTATION_0
        orientation <= 135 -> Surface.ROTATION_90
        orientation <= 225 -> Surface.ROTATION_180
        orientation <= 315 -> Surface.ROTATION_270
        else -> Surface.ROTATION_0
      }
      if (value != rotation) {
        postValue(rotation)
      }
    }
  }

  /**
   * Calculates closest 90-degree orientation to compensate for the device
   * rotation relative to sensor orientation, i.e., allows user to see camera
   * frames with the expected orientation.
   */
  fun computeCompensatingRotation(characteristics: CameraCharacteristics): Int {
    return computeRotation(characteristics, value ?: Surface.ROTATION_0)
  }

  override fun onActive() {
    super.onActive()
    listener.enable()
  }

  override fun onInactive() {
    super.onInactive()
    listener.disable()
  }

  companion object {

    /**
     * Computes clockwise rotation required to transform from the camera sensor orientation to the
     * device's current orientation in degrees.
     *
     * @param characteristics the [CameraCharacteristics] to query for the sensor orientation.
     * @param surfaceRotation the current device orientation as a Surface constant
     * @return the relative rotation from the camera sensor to the current device orientation.
     */
    @JvmStatic
    private fun computeRotation(
      characteristics: CameraCharacteristics,
      surfaceRotation: Int
    ): Int {
      // https://developer.android.com/reference/android/hardware/camera2/CameraCharacteristics#SENSOR_ORIENTATION
      // Clockwise angle through which the output image needs to be rotated to be upright on the device screen in its native orientation.
      val sensorOrientationDegrees =
        characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION)!!
      val deviceOrientationDegrees = when (surfaceRotation) {
        Surface.ROTATION_0 -> 0
        Surface.ROTATION_90 -> 90
        Surface.ROTATION_180 -> 180
        Surface.ROTATION_270 -> 270
        else -> 0
      }

      // Reverse device orientation for front-facing cameras
      val sign = if (characteristics.get(CameraCharacteristics.LENS_FACING) ==
        CameraCharacteristics.LENS_FACING_FRONT
      ) 1 else -1

      // Calculate desired JPEG rotation relative to camera orientation to make
      // the image upright (basically for it to "look correctly rotated") relative to the device orientation
      return (sensorOrientationDegrees - (deviceOrientationDegrees * sign) + 360) % 360
    }
  }
}
