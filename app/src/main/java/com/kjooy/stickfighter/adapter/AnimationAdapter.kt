package com.kjooy.stickfighter.adapter

import android.graphics.*
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.kjooy.stickfighter.databinding.ItemAnimationBinding
import com.kjooy.stickfighter.model.Animation
import com.kjooy.stickfighter.model.JointType
import com.kjooy.stickfighter.model.StickFigure
import java.text.SimpleDateFormat
import java.util.*

class AnimationAdapter(
    private val onEdit: (Animation) -> Unit,
    private val onPlay: (Animation) -> Unit,
    private val onDelete: (Animation) -> Unit
) : RecyclerView.Adapter<AnimationAdapter.VH>() {

    private val items = mutableListOf<Animation>()

    fun submitList(list: List<Animation>) {
        items.clear(); items.addAll(list); notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(ItemAnimationBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(h: VH, pos: Int) {
        val anim = items[pos]
        h.bind(anim)
    }

    inner class VH(private val b: ItemAnimationBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(anim: Animation) {
            b.tvName.text = anim.name
            b.tvInfo.text = "${anim.frames.size}프레임 · ${anim.fps}fps"
            b.tvDate.text = SimpleDateFormat("MM/dd HH:mm", Locale.getDefault())
                .format(Date(anim.createdAt))
            b.imgThumb.setImageBitmap(generateThumb(anim))
            b.root.setOnClickListener { onEdit(anim) }
            b.btnPlay.setOnClickListener { onPlay(anim) }
            b.root.setOnLongClickListener { onDelete(anim); true }
        }
    }

    private fun generateThumb(anim: Animation): Bitmap {
        val w = 120; val h = 120
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        canvas.drawColor(anim.bgColor)
        val fig = anim.frames.firstOrNull()?.figure ?: StickFigure()
        paint.style = Paint.Style.STROKE
        paint.strokeCap = Paint.Cap.ROUND
        paint.strokeWidth = fig.limbThickness / 100f * w
        paint.color = fig.color
        for ((a, b) in StickFigure.LIMBS) {
            val from = fig.joints[a] ?: continue
            val to   = fig.joints[b] ?: continue
            canvas.drawLine(from.x * w, from.y * h, to.x * w, to.y * h, paint)
        }
        val head = fig.joints[JointType.HEAD] ?: return bmp
        paint.style = Paint.Style.FILL
        canvas.drawCircle(head.x * w, head.y * h, fig.headRadius / 100f * w, paint)
        return bmp
    }
}
