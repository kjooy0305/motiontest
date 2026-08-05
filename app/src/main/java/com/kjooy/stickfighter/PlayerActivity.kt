package com.kjooy.stickfighter

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.MenuItem
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import com.kjooy.stickfighter.data.AnimationRepository
import com.kjooy.stickfighter.databinding.ActivityPlayerBinding
import com.kjooy.stickfighter.model.Animation

class PlayerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPlayerBinding
    private lateinit var animation: Animation
    private val handler = Handler(Looper.getMainLooper())
    private var currentFrame = 0
    private var isPlaying = false
    private var loop = true

    private val ticker = object : Runnable {
        override fun run() {
            if (!isPlaying) return
            nextFrame()
            handler.postDelayed(this, (1000L / animation.fps))
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPlayerBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val repo = AnimationRepository(this)
        animation = repo.get(intent.getStringExtra("anim_id")!!) ?: run { finish(); return }
        supportActionBar?.title = animation.name

        currentFrame = 0
        showFrame(0)

        binding.btnPlayPause.setOnClickListener { togglePlay() }
        binding.btnLoop.setOnClickListener {
            loop = !loop
            binding.btnLoop.alpha = if (loop) 1f else 0.4f
        }
        binding.btnRestart.setOnClickListener { currentFrame = 0; showFrame(0) }
        binding.btnPrev.setOnClickListener {
            isPlaying = false
            updatePlayButton()
            handler.removeCallbacks(ticker)
            if (currentFrame > 0) { currentFrame--; showFrame(currentFrame) }
        }
        binding.btnNext.setOnClickListener {
            isPlaying = false
            updatePlayButton()
            handler.removeCallbacks(ticker)
            nextFrame()
        }

        play()
    }

    private fun showFrame(index: Int) {
        if (animation.frames.isEmpty()) return
        val frame = animation.frames[index]
        binding.canvas.bgColor = animation.bgColor
        binding.canvas.figure = frame.figure
        binding.tvFrameCounter.text = "${index + 1}/${animation.frames.size}"
    }

    private fun nextFrame() {
        if (animation.frames.isEmpty()) return
        currentFrame++
        if (currentFrame >= animation.frames.size) {
            if (loop) {
                currentFrame = 0
            } else {
                currentFrame = animation.frames.lastIndex
                isPlaying = false
                updatePlayButton()
                handler.removeCallbacks(ticker)
            }
        }
        showFrame(currentFrame)
    }

    private fun play() {
        if (animation.frames.size < 2) return
        isPlaying = true
        updatePlayButton()
        handler.postDelayed(ticker, (1000L / animation.fps))
    }

    private fun togglePlay() {
        if (isPlaying) {
            isPlaying = false
            handler.removeCallbacks(ticker)
        } else {
            play()
        }
        updatePlayButton()
    }

    private fun updatePlayButton() {
        binding.btnPlayPause.setIconResource(
            if (isPlaying) android.R.drawable.ic_media_pause
            else android.R.drawable.ic_media_play
        )
    }

    override fun onPause() {
        super.onPause()
        isPlaying = false
        handler.removeCallbacks(ticker)
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == android.R.id.home) { finish(); return true }
        return super.onOptionsItemSelected(item)
    }
}
