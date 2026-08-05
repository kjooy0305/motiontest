package com.kjooy.stickfighter

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.kjooy.stickfighter.adapter.AnimationAdapter
import com.kjooy.stickfighter.data.AnimationRepository
import com.kjooy.stickfighter.databinding.ActivityMainBinding
import com.kjooy.stickfighter.model.Animation
import com.kjooy.stickfighter.model.Frame

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var repo: AnimationRepository
    private lateinit var adapter: AnimationAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)

        repo = AnimationRepository(this)

        adapter = AnimationAdapter(
            onEdit   = { openEditor(it) },
            onPlay   = { openPlayer(it) },
            onDelete = { confirmDelete(it) }
        )
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter

        binding.fab.setOnClickListener { showCreateDialog() }
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    private fun refresh() {
        val list = repo.getAll()
        adapter.submitList(list)
        binding.tvEmpty.visibility = if (list.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun showCreateDialog() {
        val input = EditText(this).apply {
            hint = "애니메이션 이름"
            val p = (16 * resources.displayMetrics.density).toInt()
            setPadding(p, p / 2, p, p / 2)
        }
        AlertDialog.Builder(this)
            .setTitle("새 애니메이션")
            .setView(input)
            .setPositiveButton("만들기") { _, _ ->
                val name = input.text.toString().trim().ifEmpty { "새 애니메이션" }
                val anim = Animation(name = name).apply {
                    frames.add(Frame())
                }
                repo.save(anim)
                openEditor(anim)
            }
            .setNegativeButton("취소", null)
            .show()
    }

    private fun confirmDelete(anim: Animation) {
        AlertDialog.Builder(this)
            .setTitle("삭제")
            .setMessage("'${anim.name}'을(를) 삭제할까요?")
            .setPositiveButton("삭제") { _, _ ->
                repo.delete(anim.id)
                refresh()
            }
            .setNegativeButton("취소", null)
            .show()
    }

    private fun openEditor(anim: Animation) {
        startActivity(Intent(this, AnimationEditorActivity::class.java)
            .putExtra("anim_id", anim.id))
    }

    private fun openPlayer(anim: Animation) {
        startActivity(Intent(this, PlayerActivity::class.java)
            .putExtra("anim_id", anim.id))
    }
}
