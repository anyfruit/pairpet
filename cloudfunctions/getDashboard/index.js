const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const EXP_PER_LEVEL = 20;

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

function isDoneLog(log) {
  return log && (log.status === "done" || log.done === true);
}

function normalizePet(pet) {
  if (!pet) {
    return null;
  }
  return {
    _id: pet._id,
    name: pet.name || "团团",
    species: pet.species || "dog",
    level: Number(pet.level || 1),
    exp: Number(pet.exp || 0),
    stage: pet.stage || "egg",
    mood: pet.mood || "calm",
    intimacy: Number(pet.intimacy || 0),
    expPerLevel: EXP_PER_LEVEL
  };
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const dateKey = String(event.dateKey || toDateKey()).trim();

    const userRes = await db.collection("users").where({ openid }).limit(1).get();
    const user = userRes.data[0];
    if (!user) {
      return fail(4001, "用户不存在，请先初始化");
    }

    if (!user.pairId) {
      return ok(
        {
          dateKey,
          bound: false,
          user,
          pair: null,
          pet: null,
          todaySummary: {
            total: 0,
            completed: 0,
            sharedTotal: 0,
            sharedCompleted: 0,
            sharedTasks: []
          },
          recentIntimacyChange: null
        },
        "未绑定"
      );
    }

    const pairRes = await db.collection("pairs").doc(user.pairId).get();
    const pair = pairRes.data;
    if (!pair || pair.status !== "active") {
      return ok(
        {
          dateKey,
          bound: false,
          user,
          pair: null,
          pet: null,
          todaySummary: {
            total: 0,
            completed: 0,
            sharedTotal: 0,
            sharedCompleted: 0,
            sharedTasks: []
          },
          recentIntimacyChange: null
        },
        "绑定关系不可用"
      );
    }

    let pet = null;
    if (pair.petId) {
      const petRes = await db.collection("pets").doc(pair.petId).get();
      pet = petRes.data || null;
    }

    const [tasksRes, logsRes, intimacyRes] = await Promise.all([
      db
        .collection("tasks")
        .where({
          pairId: pair._id,
          enabled: _.neq(false)
        })
        .orderBy("createdAt", "desc")
        .get(),
      db
        .collection("task_logs")
        .where({
          pairId: pair._id,
          dateKey,
          logType: "task_complete",
          status: "done"
        })
        .get(),
      db
        .collection("intimacy_logs")
        .where({
          pairId: pair._id
        })
        .orderBy("createdAt", "desc")
        .limit(1)
        .get()
    ]);

    const tasks = tasksRes.data || [];
    const logs = logsRes.data || [];
    const otherOpenId = (pair.memberOpenIds || []).find((id) => id !== openid) || "";

    const visibleTasks = tasks.filter((task) => {
      if (task.repeatRule === "daily") {
        return true;
      }
      if (task.repeatRule === "once") {
        return task.onceDateKey === dateKey;
      }
      return false;
    });

    let total = 0;
    let completed = 0;
    let sharedTotal = 0;
    let sharedCompleted = 0;
    const sharedTasks = [];

    visibleTasks.forEach((task) => {
      const taskLogs = logs.filter((log) => log.taskId === task._id);
      const selfDone = taskLogs.some((log) => log.userOpenId === openid && isDoneLog(log));
      const partnerDone = otherOpenId
        ? taskLogs.some((log) => log.userOpenId === otherOpenId && isDoneLog(log))
        : false;

      if (task.scope === "pair") {
        total += 1;
        sharedTotal += 1;
        if (selfDone) {
          completed += 1;
          sharedCompleted += 1;
        }
        sharedTasks.push({
          taskId: task._id,
          title: task.title,
          selfDone,
          partnerDone
        });
        return;
      }

      if (task.scope === "personal" && task.assigneeOpenId === openid) {
        total += 1;
        if (selfDone) {
          completed += 1;
        }
      }
    });

    const recentIntimacyChange = intimacyRes.data[0]
      ? {
          points: Number(intimacyRes.data[0].points || 0),
          sourceType: intimacyRes.data[0].sourceType || "",
          createdAt: intimacyRes.data[0].createdAt
        }
      : null;

    return ok(
      {
        dateKey,
        bound: true,
        user,
        pair: {
          _id: pair._id,
          status: pair.status,
          intimacyScore: Number(pair.intimacyScore || 0),
          memberOpenIds: pair.memberOpenIds || []
        },
        pet: normalizePet(pet),
        todaySummary: {
          total,
          completed,
          sharedTotal,
          sharedCompleted,
          sharedTasks
        },
        recentIntimacyChange
      },
      "首页数据获取成功"
    );
  } catch (error) {
    console.error("getDashboard error:", error);
    return fail(500, "获取首页数据失败");
  }
};
