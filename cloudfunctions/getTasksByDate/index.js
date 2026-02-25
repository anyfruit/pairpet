const cloud = require("wx-server-sdk");

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

function isDoneLog(log) {
  return log && (log.status === "done" || log.done === true);
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const dateKey = String(event.dateKey || toDateKey()).trim();

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

    const tasksRes = await db
      .collection("tasks")
      .where({
        pairId: user.pairId,
        enabled: _.neq(false)
      })
      .orderBy("createdAt", "desc")
      .get();

    const logsRes = await db
      .collection("task_logs")
      .where({
        pairId: user.pairId,
        dateKey
      })
      .get();

    const logs = logsRes.data || [];
    const otherOpenId = (pair.memberOpenIds || []).find((id) => id !== openid) || "";
    const tasks = tasksRes.data || [];

    const visibleTasks = tasks.filter((task) => {
      if (task.repeatRule === "daily") {
        return true;
      }
      if (task.repeatRule === "once") {
        return task.onceDateKey === dateKey;
      }
      return false;
    });

    const sharedTasks = [];
    const personalTasks = [];

    visibleTasks.forEach((task) => {
      const taskLogs = logs.filter((log) => log.taskId === task._id);
      const selfDone = taskLogs.some((log) => log.userOpenId === openid && isDoneLog(log));
      const partnerDone = otherOpenId
        ? taskLogs.some((log) => log.userOpenId === otherOpenId && isDoneLog(log))
        : false;

      if (task.scope === "pair") {
        sharedTasks.push({
          ...task,
          selfDone,
          partnerDone
        });
        return;
      }

      if (task.scope === "personal" && task.assigneeOpenId === openid) {
        personalTasks.push({
          ...task,
          selfDone
        });
      }
    });

    return ok(
      {
        dateKey,
        sharedTasks,
        personalTasks
      },
      "任务获取成功"
    );
  } catch (error) {
    console.error("getTasksByDate error:", error);
    return fail(500, "获取任务失败");
  }
};
