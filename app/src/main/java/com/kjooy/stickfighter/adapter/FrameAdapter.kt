package com.kjooy.stickfighter.adapter

import android.graphics.*
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.kjooy.stickfighter.R
import com.kjooy.stickfighter.databinding.ItemFrameBinding
import com.kjooy.stickfighter.model.Frame
import com.kjooy.stickfighter.model.JointType
import com.kjooy.stickfighter.model.StickFigure

class FrameAdapter(
    private val bgColor: Int,
    private val onClick: (Int) -> Unit,
    private val onLongClick: (Int) -> Unit
) : RecyclerView.Adapter<FrameAdapter.VH>() {

    private val items = mutableListOf<Frame>()
    var selectedIndex: Int = 0
        set(v) { val old = field; field = v; notifyItemChanged(old); notifyItemChanged(v) }

    fun submitList(list: List<Frame>) {
        items.clear(); items.addAll(list); notifyDataSetChanged()
    }

    fun addFrame(frame: Frame) { items.add(frame); notifyItemInserted(items.lastIndex) }
    fun updateFrame(index: Int, frame: Frame) { items[index] = frame; notifyItemChanged(index) }
    fun removeFrame(index: Int) { items.removeAt(index); notifyDataSetChanged() }
    fun getItems(): List<Frame> = items.toList()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(ItemFrameBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(items[pos], pos == selectedIndex)

    inner class VH(private val b: ItemFrameBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(frame: Frame, selected: Boolean) {
            b.tvFrameNum.text = "${adapterPosition + 1}"
            b.imgFrame.setImageBitmap(generateThumb(frame))
            b.root.strokeColor = if (selected)
                ContextCompat.getColorStateList(b.root.context, R.color.accent)
            else
                ContextCompat.getColorStateList(b.root.context, R.color.surface)
            b.root.strokeWidth = if (selected) 3f else 0f
            b.root.setOnClickListener { onClick(adapterPosition) }
            b.root.setOnLongClickListener { onLongClick(adapterPosition); true }
        }
    }

    private fun generateThumb(frame: Frame): Bitmap {
        val w = 80; val h = 80
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        canvas.drawColor(bgColor)
        val fig = frame.figure
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
