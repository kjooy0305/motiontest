package com.kjooy.stickfighter.view

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import com.kjooy.stickfighter.model.JointType
import com.kjooy.stickfighter.model.StickFigure
import kotlin.math.sqrt

class StickFigureCanvas @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : View(context, attrs) {

    var figure: StickFigure = StickFigure()
        set(value) { field = value; invalidate() }

    var ghostFigure: StickFigure? = null   // onion skin
        set(value) { field = value; invalidate() }

    var bgColor: Int = Color.parseColor("#1A1A2E")
        set(value) { field = value; invalidate() }

    var showHandles: Boolean = true
    var onFigureChanged: ((StickFigure) -> Unit)? = null

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var selectedJoint: JointType? = null
    private val history = ArrayDeque<StickFigure>()
    private val TOUCH_RADIUS_PX get() = 48f * resources.displayMetrics.density

    // ── Draw ──────────────────────────────────────────────────────────
    override fun onDraw(canvas: Canvas) {
        canvas.drawColor(bgColor)
        ghostFigure?.let { drawFigure(canvas, it, alpha = 60, joints = false) }
        drawFigure(canvas, figure, alpha = 255, joints = showHandles)
    }

    private fun drawFigure(canvas: Canvas, fig: StickFigure, alpha: Int, joints: Boolean) {
        val w = width.toFloat()
        val h = height.toFloat()

        // Limbs
        paint.style = Paint.Style.STROKE
        paint.strokeCap = Paint.Cap.ROUND
        paint.strokeWidth = fig.limbThickness / 100f * w
        paint.color = fig.color
        paint.alpha = alpha
        for ((a, b) in StickFigure.LIMBS) {
            val from = fig.joints[a] ?: continue
            val to   = fig.joints[b] ?: continue
            canvas.drawLine(from.x * w, from.y * h, to.x * w, to.y * h, paint)
        }

        // Head
        val head = fig.joints[JointType.HEAD] ?: return
        paint.style = Paint.Style.FILL
        paint.color = fig.color
        paint.alpha = alpha
        canvas.drawCircle(head.x * w, head.y * h, fig.headRadius / 100f * w, paint)

        // Joint handles
        if (joints) {
            fig.joints.forEach { (type, joint) ->
                val isHead = type == JointType.HEAD
                val selected = type == selectedJoint
                val r = if (isHead) fig.headRadius / 100f * w else 14f
                paint.style = Paint.Style.STROKE
                paint.strokeWidth = 2.5f
                paint.color = if (selected) Color.parseColor("#FFD700") else Color.parseColor("#AAFFFFFF")
                paint.alpha = 255
                canvas.drawCircle(joint.x * w, joint.y * h, r, paint)
            }
        }
    }

    // ── Touch ─────────────────────────────────────────────────────────
    override fun onTouchEvent(event: MotionEvent): Boolean {
        val nx = event.x / width
        val ny = event.y / height
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                history.addLast(figure)
                if (history.size > 50) history.removeFirst()
                selectedJoint = figure.joints.entries.minByOrNull { (_, j) ->
                    val dx = (j.x - nx) * width
                    val dy = (j.y - ny) * height
                    sqrt((dx * dx + dy * dy).toDouble())
                }?.takeIf { (_, j) ->
                    val dx = (j.x - nx) * width
                    val dy = (j.y - ny) * height
                    sqrt((dx * dx + dy * dy).toDouble()) < TOUCH_RADIUS_PX
                }?.key
            }
            MotionEvent.ACTION_MOVE -> {
                selectedJoint?.let { type ->
                    figure = figure.withJoint(type, nx, ny)
                    onFigureChanged?.invoke(figure)
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                selectedJoint = null
                invalidate()
            }
        }
        return true
    }

    fun undo() {
        if (history.isNotEmpty()) {
            figure = history.removeLast()
            onFigureChanged?.invoke(figure)
        }
    }

    fun hasHistory() = history.isNotEmpty()

    // Generate thumbnail bitmap
    fun generateThumbnail(w: Int, h: Int): Bitmap {
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        val p = Paint(Paint.ANTI_ALIAS_FLAG)
        c.drawColor(bgColor)
        val fig = figure
        p.style = Paint.Style.STROKE
        p.strokeCap = Paint.Cap.ROUND
        p.strokeWidth = fig.limbThickness / 100f * w
        p.color = fig.color
        for ((a, b) in StickFigure.LIMBS) {
            val from = fig.joints[a] ?: continue
            val to   = fig.joints[b] ?: continue
            c.drawLine(from.x * w, from.y * h, to.x * w, to.y * h, p)
        }
        val head = fig.joints[JointType.HEAD] ?: return bmp
        p.style = Paint.Style.FILL
        c.drawCircle(head.x * w, head.y * h, fig.headRadius / 100f * w, p)
        return bmp
    }
}
