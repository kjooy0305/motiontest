package com.kjooy.stickfighter

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.MenuItem
import android.widget.EditText
import android.widget.SeekBar
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.kjooy.stickfighter.adapter.FrameAdapter
import com.kjooy.stickfighter.data.AnimationRepository
import com.kjooy.stickfighter.databinding.ActivityAnimationEditorBinding
import com.kjooy.stickfighter.model.Animation
import com.kjooy.stickfighter.model.Frame
import com.kjooy.stickfighter.model.StickFigure

class AnimationEditorActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAnimationEditorBinding
    private lateinit var repo: AnimationRepository
    private lateinit var animation: Animation
    private lateinit var frameAdapter: FrameAdapter
    private var currentFrameIndex = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAnimationEditorBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        repo = AnimationRepository(this)
        animation = repo.get(intent.getStringExtra("anim_id")!!) ?: run { finish(); return }

        supportActionBar?.title = animation.name
        setupFrameList()
        setupButtons()
        selectFrame(0)
    }

    private fun setupFrameList() {
        frameAdapter = FrameAdapter(
            bgColor = animation.bgColor,
            onClick = { index -> saveCurrentFrame(); selectFrame(index) },
            onLongClick = { index -> confirmDeleteFrame(index) }
        )
        binding.rvFrames.layoutManager =
            LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        binding.rvFrames.adapter = frameAdapter
        frameAdapter.submitList(animation.frames.toList())
    }

    private fun setupButtons() {
        binding.btnAddFrame.setOnClickListener { addFrame() }
        binding.btnPlay.setOnClickListener { openPlayer() }
        binding.btnFps.setOnClickListener { showFpsDialog() }
        binding.btnRename.setOnClickListener { showRenameDialog() }
        binding.btnBgColor.setOnClickListener { showBgColorDialog() }
    }

    private fun selectFrame(index: Int) {
        if (animation.frames.isEmpty()) return
        currentFrameIndex = index.coerceIn(0, animation.frames.lastIndex)
        frameAdapter.selectedIndex = currentFrameIndex
        binding.rvFrames.scrollToPosition(currentFrameIndex)

        val frame = animation.frames[currentFrameIndex]
        binding.canvas.bgColor = animation.bgColor
        binding.canvas.figure = frame.figure
        binding.canvas.ghostFigure = animation.frames.getOrNull(currentFrameIndex - 1)?.figure
        binding.canvas.onFigureChanged = { fig ->
            animation.frames[currentFrameIndex] = animation.frames[currentFrameIndex].copy(figure = fig)
            frameAdapter.updateFrame(currentFrameIndex, animation.frames[currentFrameIndex])
        }
        binding.tvFrameInfo.text = "${currentFrameIndex + 1} / ${animation.frames.size}"

        // Toolbar buttons
        binding.btnUndo.setOnClickListener { binding.canvas.undo() }
        binding.btnCopyPrev.setOnClickListener {
            if (currentFrameIndex > 0) {
                val prevFig = animation.frames[currentFrameIndex - 1].figure
                binding.canvas.figure = prevFig
                animation.frames[currentFrameIndex] = animation.frames[currentFrameIndex].copy(figure = prevFig)
                frameAdapter.updateFrame(currentFrameIndex, animation.frames[currentFrameIndex])
            }
        }
        binding.btnColor.setOnClickListener { showFigureColorDialog() }
        binding.btnThickness.setOnClickListener { showThicknessDialog() }

        // Prev/Next buttons
        binding.btnPrevFrame.setOnClickListener {
            if (currentFrameIndex > 0) { saveCurrentFrame(); selectFrame(currentFrameIndex - 1) }
        }
        binding.btnNextFrame.setOnClickListener {
            if (currentFrameIndex < animation.frames.lastIndex) { saveCurrentFrame(); selectFrame(currentFrameIndex + 1) }
        }
    }

    private fun saveCurrentFrame() {
        if (animation.frames.isEmpty()) return
        animation.frames[currentFrameIndex] =
            animation.frames[currentFrameIndex].copy(figure = binding.canvas.figure)
    }

    private fun addFrame() {
        saveCurrentFrame()
        val lastFig = animation.frames.lastOrNull()?.figure ?: StickFigure()
        AlertDialog.Builder(this)
            .setTitle("프레임 추가")
            .setItems(arrayOf("빈 프레임 (기본 자세)", "이전 프레임 복사")) { _, which ->
                val newFig = if (which == 1) lastFig else StickFigure()
                val newFrame = Frame(figure = newFig)
                animation.frames.add(newFrame)
                frameAdapter.addFrame(newFrame)
                selectFrame(animation.frames.lastIndex)
                repo.save(animation)
            }
            .show()
    }

    private fun confirmDeleteFrame(index: Int) {
        if (animation.frames.size <= 1) {
            AlertDialog.Builder(this).setMessage("마지막 프레임은 삭제할 수 없습니다.").setPositiveButton("확인", null).show()
            return
        }
        AlertDialog.Builder(this)
            .setTitle("프레임 삭제")
            .setMessage("이 프레임을 삭제할까요?")
            .setPositiveButton("삭제") { _, _ ->
                animation.frames.removeAt(index)
                frameAdapter.removeFrame(index)
                selectFrame(currentFrameIndex.coerceAtMost(animation.frames.lastIndex))
                repo.save(animation)
            }
            .setNegativeButton("취소", null)
            .show()
    }

    private fun showFpsDialog() {
        val currentFps = animation.fps  // capture before apply{} to avoid View.animation shadowing
        val seek = SeekBar(this)
        seek.max = 29; seek.progress = currentFps - 1
        val label = TextView(this).apply { text = "$currentFps fps"; textSize = 14f }
        seek.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(sb: SeekBar, p: Int, u: Boolean) { label.text = "${p + 1} fps" }
            override fun onStartTrackingTouch(sb: SeekBar) {}
            override fun onStopTrackingTouch(sb: SeekBar) {}
        })
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            val pad = (16 * resources.displayMetrics.density).toInt()
            setPadding(pad, pad, pad, pad)
            addView(label)
            addView(seek)
        }
        AlertDialog.Builder(this)
            .setTitle("재생 속도 (FPS)")
            .setView(layout)
            .setPositiveButton("확인") { _, _ ->
                animation = animation.copy(fps = seek.progress + 1)
                repo.save(animation)
                binding.btnFps.text = "${animation.fps}fps"
            }
            .setNegativeButton("취소", null)
            .show()
        binding.btnFps.text = "${animation.fps}fps"
    }

    private fun showRenameDialog() {
        val currentName = animation.name  // capture before apply{} to avoid View.animation shadowing
        val input = EditText(this).apply {
            setText(currentName)
            selectAll()
            val p = (16 * resources.displayMetrics.density).toInt()
            setPadding(p, p / 2, p, p / 2)
        }
        AlertDialog.Builder(this)
            .setTitle("이름 변경")
            .setView(input)
            .setPositiveButton("변경") { _, _ ->
                val name = input.text.toString().trim().ifEmpty { animation.name }
                animation = animation.copy(name = name)
                supportActionBar?.title = name
                repo.save(animation)
            }
            .setNegativeButton("취소", null)
            .show()
    }

    private fun showBgColorDialog() {
        showColorGrid("배경 색상") { color ->
            animation = animation.copy(bgColor = Color.parseColor(color))
            binding.canvas.bgColor = animation.bgColor
            frameAdapter.submitList(animation.frames.toList())
            repo.save(animation)
        }
    }

    private fun showFigureColorDialog() {
        showColorGrid("캐릭터 색상") { color ->
            val c = Color.parseColor(color)
            val fig = binding.canvas.figure.copy(color = c)
            binding.canvas.figure = fig
            animation.frames[currentFrameIndex] = animation.frames[currentFrameIndex].copy(figure = fig)
        }
    }

    private fun showColorGrid(title: String, onPick: (String) -> Unit) {
        val colors = listOf(
            "#FFFFFF", "#FFFF00", "#FF6B35", "#FF0000",
            "#00FF00", "#00FFFF", "#0080FF", "#8000FF",
            "#FF69B4", "#FFA500", "#808080", "#000000"
        )
        val rv = androidx.recyclerview.widget.RecyclerView(this).apply {
            layoutManager = androidx.recyclerview.widget.GridLayoutManager(context, 4)
            val pad = (8 * resources.displayMetrics.density).toInt()
            setPadding(pad, pad, pad, pad)
        }
        val adapter = object : androidx.recyclerview.widget.RecyclerView.Adapter<androidx.recyclerview.widget.RecyclerView.ViewHolder>() {
            inner class VH(v: android.view.View) : androidx.recyclerview.widget.RecyclerView.ViewHolder(v)
            override fun onCreateViewHolder(parent: android.view.ViewGroup, t: Int): VH {
                val sz = (56 * resources.displayMetrics.density).toInt()
                val m  = (4 * resources.displayMetrics.density).toInt()
                val v = android.view.View(parent.context).apply {
                    layoutParams = androidx.recyclerview.widget.RecyclerView.LayoutParams(sz, sz)
                        .also { it.setMargins(m, m, m, m) }
                }
                return VH(v)
            }
            override fun onBindViewHolder(h: androidx.recyclerview.widget.RecyclerView.ViewHolder, p: Int) {
                h.itemView.setBackgroundColor(Color.parseColor(colors[p]))
            }
            override fun getItemCount() = colors.size
        }
        rv.adapter = adapter
        var dialog: AlertDialog? = null
        adapter.registerAdapterDataObserver(object : androidx.recyclerview.widget.RecyclerView.AdapterDataObserver() {})
        rv.addOnItemTouchListener(object : androidx.recyclerview.widget.RecyclerView.OnItemTouchListener {
            val gesture = android.view.GestureDetector(this@AnimationEditorActivity,
                object : android.view.GestureDetector.SimpleOnGestureListener() {
                    override fun onSingleTapUp(e: android.view.MotionEvent): Boolean {
                        val child = rv.findChildViewUnder(e.x, e.y) ?: return false
                        val pos = rv.getChildAdapterPosition(child)
                        if (pos >= 0) { onPick(colors[pos]); dialog?.dismiss() }
                        return true
                    }
                })
            override fun onInterceptTouchEvent(rv: androidx.recyclerview.widget.RecyclerView, e: android.view.MotionEvent) = gesture.onTouchEvent(e)
            override fun onTouchEvent(rv: androidx.recyclerview.widget.RecyclerView, e: android.view.MotionEvent) {}
            override fun onRequestDisallowInterceptTouchEvent(b: Boolean) {}
        })
        dialog = AlertDialog.Builder(this).setTitle(title).setView(rv)
            .setNegativeButton("취소", null).create()
        dialog.show()
    }

    private fun showThicknessDialog() {
        val seek = SeekBar(this).also { it.max = 8; it.progress = binding.canvas.figure.limbThickness.toInt() - 1 }
        val label = TextView(this).apply { text = "${binding.canvas.figure.limbThickness.toInt()}"; textSize = 14f }
        seek.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(sb: SeekBar, p: Int, u: Boolean) { label.text = "${p + 1}" }
            override fun onStartTrackingTouch(sb: SeekBar) {}
            override fun onStopTrackingTouch(sb: SeekBar) {}
        })
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            val pad = (16 * resources.displayMetrics.density).toInt()
            setPadding(pad, pad, pad, pad)
            addView(label)
            addView(seek)
        }
        AlertDialog.Builder(this)
            .setTitle("선 두께")
            .setView(layout)
            .setPositiveButton("적용") { _, _ ->
                val thickness = (seek.progress + 1).toFloat()
                val fig = binding.canvas.figure.copy(limbThickness = thickness)
                binding.canvas.figure = fig
                animation.frames[currentFrameIndex] = animation.frames[currentFrameIndex].copy(figure = fig)
            }
            .setNegativeButton("취소", null)
            .show()
    }

    private fun openPlayer() {
        saveCurrentFrame()
        repo.save(animation)
        startActivity(Intent(this, PlayerActivity::class.java)
            .putExtra("anim_id", animation.id))
    }

    override fun onPause() {
        super.onPause()
        saveCurrentFrame()
        repo.save(animation)
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == android.R.id.home) { finish(); return true }
        return super.onOptionsItemSelected(item)
    }
}
