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

exports.main = async () => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const now = new Date();

    let userDoc = await db.collection("users").where({ openid }).limit(1).get();
    let user = userDoc.data[0];

    if (!user) {
      const createRes = await db.collection("users").add({
        data: {
          openid,
          nickname: "微信用户",
          avatarUrl: "",
          pairId: "",
          createdAt: now,
          updatedAt: now
        }
      });
      const created = await db.collection("users").doc(createRes._id).get();
      user = created.data;
    } else {
      await db.collection("users").doc(user._id).update({
        data: {
          updatedAt: now
        }
      });
      user.updatedAt = now;
    }

    let pair = null;
    let pet = null;

    if (user.pairId) {
      const pairRes = await db.collection("pairs").doc(user.pairId).get();
      pair = pairRes.data || null;
      if (pair && pair.petId) {
        const petRes = await db.collection("pets").doc(pair.petId).get();
        pet = petRes.data || null;
      }
    } else {
      const pendingRes = await db
        .collection("pairs")
        .where({
          ownerOpenId: openid,
          status: "pending"
        })
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      if (pendingRes.data.length > 0) {
        pair = pendingRes.data[0];
      }
    }

    return ok(
      {
        user,
        pair,
        pet
      },
      "用户初始化成功"
    );
  } catch (error) {
    console.error("initUser error:", error);
    return fail(500, "初始化用户失败");
  }
};
