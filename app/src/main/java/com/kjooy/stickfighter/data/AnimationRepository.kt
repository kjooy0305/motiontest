package com.kjooy.stickfighter.data

import android.content.Context
import com.google.gson.Gson
import com.kjooy.stickfighter.model.Animation
import java.io.File

class AnimationRepository(context: Context) {
    private val dir = File(context.filesDir, "animations").also { it.mkdirs() }
    private val gson = Gson()

    fun getAll(): List<Animation> =
        dir.listFiles { f -> f.extension == "json" }
            ?.sortedByDescending { it.lastModified() }
            ?.mapNotNull { runCatching { gson.fromJson(it.readText(), Animation::class.java) }.getOrNull() }
            ?: emptyList()

    fun get(id: String): Animation? = runCatching {
        gson.fromJson(File(dir, "$id.json").readText(), Animation::class.java)
    }.getOrNull()

    fun save(animation: Animation) {
        File(dir, "${animation.id}.json").writeText(gson.toJson(animation))
    }

    fun delete(id: String) {
        File(dir, "$id.json").delete()
    }
}
