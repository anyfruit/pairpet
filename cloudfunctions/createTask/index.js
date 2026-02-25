const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

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

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const now = new Date();

    const title = String(event.title || "").trim();
    const scope = event.scope === "personal" ? "personal" : "pair";
    const repeatRule = event.repeatRule === "once" ? "once" : "daily";
    const points = Number(event.points || 0);
    const bonusPoints = Number(event.bonusPoints || 0);
    const onceDateKey = String(event.onceDateKey || toDateKey(now));

    if (!title) {
      return fail(4000, "任务标题不能为空");
    }
    if (points < 0 || Number.isNaN(points)) {
      return fail(4000, "任务分值不合法");
    }
    if (bonusPoints < 0 || Number.isNaN(bonusPoints)) {
      return fail(4000, "额外奖励分值不合法");
    }

    const userRes = await db.collection("users").where({ openid }).limit(1).get();
    const user = userRes.data[0];
    if (!user) {
      return fail(4001, "用户不存在，请先初始化");
    }
    if (!user.pairId) {
      return fail(4002, "请先绑定搭子再创建任务");
    }

    const pairRes = await db.collection("pairs").doc(user.pairId).get();
    const pair = pairRes.data;
    if (!pair || pair.status !== "active") {
      return fail(4003, "当前绑定关系不可用");
    }

    const taskData = {
      taskType: "custom",
      title,
      scope,
      repeatRule,
      points: Math.floor(points),
      bonusPoints: scope === "pair" ? Math.floor(bonusPoints) : 0,
      pairId: pair._id,
      creatorOpenId: openid,
      assigneeOpenId: scope === "personal" ? openid : "",
      enabled: true,
      onceDateKey: repeatRule === "once" ? onceDateKey : "",
      createdAt: now,
      updatedAt: now
    };

    const createRes = await db.collection("tasks").add({
      data: taskData
    });
    const taskRes = await db.collection("tasks").doc(createRes._id).get();

    return ok(taskRes.data, "任务创建成功");
  } catch (error) {
    console.error("createTask error:", error);
    return fail(500, "创建任务失败");
  }
};
