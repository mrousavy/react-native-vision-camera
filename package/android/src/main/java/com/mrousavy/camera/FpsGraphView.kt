package com.mrousavy.camera

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.TextView
import kotlin.math.max
import kotlin.math.roundToInt

@SuppressLint("SetTextI18n")
class FpsGraphView(context: Context) : FrameLayout(context) {
  private val textView = TextView(context)
  private val graph = Graph(context)

  init {
    textView.textSize = 18f
    textView.setTextColor(Color.WHITE)
    textView.text = "0 FPS"

    graph.callback = object : Graph.Callback {
      override fun onAverageFpsChanged(averageFps: Int) {
        textView.text = "$averageFps FPS"
      }
    }

    val layoutParams = LayoutParams(300, 150)
    layoutParams.setMargins(15, 150, 0, 0)
    layoutParams.gravity = Gravity.TOP or Gravity.LEFT
    addView(graph, layoutParams)
    addView(textView, layoutParams)
  }

  fun onTick() {
    graph.onTick()
  }

  class Graph(context: Context) :
    View(context),
    Runnable {
    private val maxBars = 30
    private val ticks = arrayListOf<Double>()
    private val bars = arrayListOf<Int>()
    private val paint = Paint().apply {
      color = Color.RED
      strokeWidth = 5f
      style = Paint.Style.FILL
    }
    var callback: Callback? = null

    init {
      post(this)
    }

    override fun run() {
      val averageFps = getAverageFps(ticks)
      ticks.clear()

      bars.add(averageFps)
      if (bars.size > maxBars) {
        bars.removeAt(0)
      }

      invalidate()
      postDelayed(this, 1000)

      callback?.onAverageFpsChanged(averageFps)
    }

    private fun getAverageFps(ticks: List<Double>): Int {
      if (ticks.isEmpty()) return 0
      if (ticks.size < 2) return 1

      val totalDuration = ticks.last() - ticks.first()
      val averageFrameDuration = totalDuration / (ticks.size - 1).toDouble()

      val double = 1000.0 / averageFrameDuration
      return double.roundToInt()
    }

    fun onTick() {
      val currentTick = System.currentTimeMillis()
      ticks.add(currentTick.toDouble())
    }

    override fun onDraw(canvas: Canvas) {
      super.onDraw(canvas)

      if (bars.size < 2) return

      val maxFps = max(bars.max().toFloat(), 60f)
      val blockWidth = width.toFloat() / maxBars
      for (i in 0..maxBars) {
        val fps = bars.getOrNull(i)
        if (fps != null) {
          val blockHeight = (fps / maxFps) * height
          canvas.drawRect(
            i * blockWidth,
            height - blockHeight,
            (i + 1) * blockWidth,
            height.toFloat(),
            paint
          )
        }
      }
    }

    interface Callback {
      fun onAverageFpsChanged(averageFps: Int)
    }
  }
}
