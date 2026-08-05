package com.kjooy.stickfighter.view

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import com.kjooy.stickfighter.model.JointType
import com.kjooy.stickfighter.model.StickFigure

class PlayerCanvas @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : View(context, attrs) {

    var figure: StickFigure = StickFigure()
        set(value) { field = value; invalidate() }

    var bgColor: Int = Color.parseColor("#1A1A2E")
        set(value) { field = value; invalidate() }

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)

    override fun onDraw(canvas: Canvas) {
        val w = width.toFloat()
        val h = height.toFloat()
        canvas.drawColor(bgColor)

        paint.style = Paint.Style.STROKE
        paint.strokeCap = Paint.Cap.ROUND
        paint.strokeWidth = figure.limbThickness / 100f * w
        paint.color = figure.color

        for ((a, b) in StickFigure.LIMBS) {
            val from = figure.joints[a] ?: continue
            val to   = figure.joints[b] ?: continue
            canvas.drawLine(from.x * w, from.y * h, to.x * w, to.y * h, paint)
        }

        val head = figure.joints[JointType.HEAD] ?: return
        paint.style = Paint.Style.FILL
        canvas.drawCircle(head.x * w, head.y * h, figure.headRadius / 100f * w, paint)
    }
}
