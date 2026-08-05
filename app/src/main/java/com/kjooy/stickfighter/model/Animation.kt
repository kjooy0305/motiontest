package com.kjooy.stickfighter.model

import android.graphics.Color
import java.util.UUID

data class Frame(
    val id: String = UUID.randomUUID().toString(),
    val figure: StickFigure = StickFigure()
)

data class Animation(
    val id: String = UUID.randomUUID().toString(),
    val name: String = "새 애니메이션",
    val fps: Int = 12,
    val bgColor: Int = Color.parseColor("#1A1A2E"),
    val frames: MutableList<Frame> = mutableListOf(),
    val createdAt: Long = System.currentTimeMillis()
)
