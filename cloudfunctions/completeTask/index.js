const cloud = require("wx-server-sdk");
const crypto = require("crypto");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

function ok(data, message) {
  return {
    code: 0,
    message: message || "ok",
    data: data || null
  };
}

function fail(code, message) {
  return {
    code,
    message,
    data: null
  };
}

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeStableId(prefix, raw) {
  const digest = crypto.createHash("sha1").update(raw).digest("hex").slice(0, 28);
  return `${prefix}${digest}`;
}

function isDuplicateError(error) {
  const text = String((error && (error.errMsg || error.message)) || "").toLowerCase();
  return text.includes("duplicate") || text.includes("exist") || text.includes("conflict");
}

function calcPetState(expValue) {
  const exp = Number(expValue || 0);
  const level = Math.floor(exp / 20) + 1;
  let stage = "egg";
  if (level >= 3 && level <= 5) {
    stage = "baby";
  }
  if (level >= 6) {
    stage = "grow";
  }
  const mood = stage === "egg" ? "calm" : stage === "baby" ? "happy" : "excited";
  return { exp, level, stage, mood };
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const now = new Date();

    const taskId = String(event.taskId || "").trim();
    const dateKey = String(event.dateKey || toDateKey(now)).trim();
    if (!taskId) {
      return fail(4000, "taskId 不能为空");
    }

    const userRes = await db.collection("users").where({ openid }).limit(1).get();
    const user = userRes.data[0];
    if (!user || !user.pairId) {
      return fail(4001, "请先绑定搭子");
    }

    const pairRes = await db.collection("pairs").doc(user.pairId).get();
    const pair = pairRes.data;
    if (!pair || pair.status !== "active") {
      return fail(4002, "绑定关系不可用");
    }

    const taskRes = await db.collection("tasks").doc(taskId).get();
    const task = taskRes.data;
    if (!task || task.pairId !== pair._id || task.enabled === false) {
      return fail(4003, "任务不存在或不可用");
    }

    if (task.scope === "personal" && task.assigneeOpenId !== openid) {
      return fail(4004, "无权限完成该个人任务");
    }
    if (task.repeatRule === "once" && task.onceDateKey && task.onceDateKey !== dateKey) {
      return fail(4005, "该一次性任务不在当前日期");
    }

    const completeLogId = makeStableId("c", `${pair._id}|${taskId}|${dateKey}|${openid}`);
    try {
      await db.collection("task_logs").add({
        data: {
          _id: completeLogId,
          pairId: pair._id,
          taskId,
          userOpenId: openid,
          dateKey,
          logType: "task_complete",
          status: "done",
          pointsAwarded: Number(task.points || 0),
          createdAt: now
        }
      });
    } catch (error) {
      if (isDuplicateError(error)) {
        const latestPair = await db.collection("pairs").doc(pair._id).get();
        const latestPet = pair.petId ? await db.collection("pets").doc(pair.petId).get() : { data: null };
        return ok(
          {
            alreadyCompleted: true,
            basePoints: 0,
            bonusTriggered: false,
            bonusPoints: 0,
            levelUp: false,
            pairIntimacyScore: (latestPair.data && latestPair.data.intimacyScore) || 0,
            pet: latestPet.data || null
          },
          "今日已完成（幂等）"
        );
      }
      throw error;
    }

    const basePoints = Number(task.points || 0);
    if (basePoints > 0) {
      await db.collection("intimacy_logs").add({
        data: {
          pairId: pair._id,
          userOpenId: openid,
          sourceType: "task_complete",
          taskId,
          dateKey,
          points: basePoints,
          createdAt: now
        }
      });
    }

    await db.collection("pairs").doc(pair._id).update({
      data: {
        intimacyScore: _.inc(basePoints),
        updatedAt: now
      }
    });

    let pet = null;
    if (pair.petId) {
      const petRes = await db.collection("pets").doc(pair.petId).get();
      pet = petRes.data || null;
    }
    if (!pet) {
      const createdPet = await db.collection("pets").add({
        data: {
          pairId: pair._id,
          name: "团团",
          species: "dog",
          exp: 0,
          level: 1,
          stage: "egg",
          mood: "calm",
          intimacy: 0,
          createdAt: now,
          updatedAt: now
        }
      });
      const createdPetRes = await db.collection("pets").doc(createdPet._id).get();
      pet = createdPetRes.data;
      await db.collection("pairs").doc(pair._id).update({
        data: {
          petId: pet._id,
          updatedAt: now
        }
      });
    }

    const beforeLevel = Number(pet.level || 1);
    const baseNextExp = Number(pet.exp || 0) + basePoints;
    const baseState = calcPetState(baseNextExp);
    let nextIntimacy = Number(pet.intimacy || 0) + basePoints;

    await db.collection("pets").doc(pet._id).update({
      data: {
        exp: baseState.exp,
        level: baseState.level,
        stage: baseState.stage,
        mood: baseState.mood,
        intimacy: nextIntimacy,
        updatedAt: now
      }
    });

    let bonusTriggered = false;
    let bonusPoints = 0;
    let currentExp = baseState.exp;
    let currentLevel = baseState.level;
    let currentStage = baseState.stage;
    let currentMood = baseState.mood;

    if (task.scope === "pair" && Number(task.bonusPoints || 0) > 0) {
      const doneLogsRes = await db
        .collection("task_logs")
        .where({
          pairId: pair._id,
          taskId,
          dateKey,
          logType: "task_complete",
          status: "done"
        })
        .get();

      const doneUsers = new Set((doneLogsRes.data || []).map((item) => item.userOpenId));
      const memberOpenIds = pair.memberOpenIds || [];
      const bothDone = memberOpenIds.length >= 2 && memberOpenIds.every((id) => doneUsers.has(id));

      // Bonus guard: create a stable lock log first, so duplicate clicks cannot issue bonus twice.
      if (bothDone) {
        const bonusLockId = makeStableId("b", `${pair._id}|${taskId}|${dateKey}|bonus`);
        try {
          await db.collection("task_logs").add({
            data: {
              _id: bonusLockId,
              pairId: pair._id,
              taskId,
              dateKey,
              logType: "double_bonus_lock",
              createdAt: now
            }
          });

          bonusTriggered = true;
          bonusPoints = Number(task.bonusPoints || 0);

          await db.collection("intimacy_logs").add({
            data: {
              pairId: pair._id,
              userOpenId: openid,
              sourceType: "double_complete_bonus",
              taskId,
              dateKey,
              points: bonusPoints,
              createdAt: now
            }
          });

          await db.collection("pairs").doc(pair._id).update({
            data: {
              intimacyScore: _.inc(bonusPoints),
              updatedAt: now
            }
          });

          const bonusExp = currentExp + bonusPoints;
          const bonusState = calcPetState(bonusExp);
          nextIntimacy += bonusPoints;
          currentExp = bonusState.exp;
          currentLevel = bonusState.level;
          currentStage = bonusState.stage;
          currentMood = bonusState.mood;

          await db.collection("pets").doc(pet._id).update({
            data: {
              exp: currentExp,
              level: currentLevel,
              stage: currentStage,
              mood: currentMood,
              intimacy: nextIntimacy,
              updatedAt: now
            }
          });
        } catch (error) {
          if (!isDuplicateError(error)) {
            throw error;
          }
        }
      }
    }

    const latestPair = await db.collection("pairs").doc(pair._id).get();
    const latestPet = await db.collection("pets").doc(pet._id).get();
    const levelUp = Number((latestPet.data && latestPet.data.level) || currentLevel) > beforeLevel;

    return ok(
      {
        alreadyCompleted: false,
        basePoints,
        bonusTriggered,
        bonusPoints,
        levelUp,
        pairIntimacyScore: (latestPair.data && latestPair.data.intimacyScore) || 0,
        pet: latestPet.data || null
      },
      "打卡成功"
    );
  } catch (error) {
    console.error("completeTask error:", error);
    return fail(500, "打卡失败");
  }
};
