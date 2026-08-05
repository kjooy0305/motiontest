package com.kjooy.stickfighter.model

import android.graphics.Color
import com.kjooy.stickfighter.model.JointType.*

data class Joint(val x: Float, val y: Float)

data class StickFigure(
    val joints: Map<JointType, Joint> = defaultJoints(),
    val color: Int = Color.WHITE,
    val headRadius: Float = 5f,    // % of canvas width
    val limbThickness: Float = 2.5f // % of canvas width
) {
    fun withJoint(type: JointType, x: Float, y: Float) =
        copy(joints = joints + (type to Joint(x.coerceIn(0f, 1f), y.coerceIn(0f, 1f))))

    companion object {
        val LIMBS: List<Pair<JointType, JointType>> = listOf(
            HEAD to NECK,
            NECK to SHOULDER_L,   NECK to SHOULDER_R,
            SHOULDER_L to ELBOW_L, SHOULDER_R to ELBOW_R,
            ELBOW_L to HAND_L,    ELBOW_R to HAND_R,
            NECK to PELVIS,
            PELVIS to HIP_L,      PELVIS to HIP_R,
            HIP_L to KNEE_L,      HIP_R to KNEE_R,
            KNEE_L to FOOT_L,     KNEE_R to FOOT_R
        )

        fun defaultJoints(): Map<JointType, Joint> = mapOf(
            HEAD       to Joint(0.50f, 0.12f),
            NECK       to Joint(0.50f, 0.23f),
            SHOULDER_L to Joint(0.35f, 0.29f),
            SHOULDER_R to Joint(0.65f, 0.29f),
            ELBOW_L    to Joint(0.28f, 0.43f),
            ELBOW_R    to Joint(0.72f, 0.43f),
            HAND_L     to Joint(0.22f, 0.57f),
            HAND_R     to Joint(0.78f, 0.57f),
            PELVIS     to Joint(0.50f, 0.53f),
            HIP_L      to Joint(0.42f, 0.55f),
            HIP_R      to Joint(0.58f, 0.55f),
            KNEE_L     to Joint(0.39f, 0.71f),
            KNEE_R     to Joint(0.61f, 0.71f),
            FOOT_L     to Joint(0.36f, 0.88f),
            FOOT_R     to Joint(0.64f, 0.88f)
        )
    }
}
