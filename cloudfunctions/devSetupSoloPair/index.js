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

    const userRes = await db.collection("users").where({ openid }).limit(1).get();
    let user = userRes.data[0];
    if (!user) {
      const createUser = await db.collection("users").add({
        data: {
          openid,
          nickname: "微信用户",
          avatarUrl: "",
          pairId: "",
          createdAt: now,
          updatedAt: now
        }
      });
      const createdUser = await db.collection("users").doc(createUser._id).get();
      user = createdUser.data;
    }

    if (user.pairId) {
      const pairRes = await db.collection("pairs").doc(user.pairId).get();
      const petRes = pairRes.data && pairRes.data.petId ? await db.collection("pets").doc(pairRes.data.petId).get() : null;
      return ok(
        {
          user,
          pair: pairRes.data || null,
          pet: petRes ? petRes.data : null
        },
        "已是绑定状态"
      );
    }

    const petCreate = await db.collection("pets").add({
      data: {
        name: "团团",
        species: "dog",
        level: 1,
        exp: 0,
        intimacy: 0,
        stage: "egg",
        mood: "calm",
        createdAt: now,
        updatedAt: now
      }
    });

    const pairCreate = await db.collection("pairs").add({
      data: {
        inviteCode: "",
        ownerOpenId: openid,
        memberOpenIds: [openid, "dev-partner-placeholder"],
        status: "active",
        petId: petCreate._id,
        intimacyScore: 0,
        createdAt: now,
        updatedAt: now,
        activatedAt: now,
        isDevMock: true
      }
    });

    await db.collection("pets").doc(petCreate._id).update({
      data: {
        pairId: pairCreate._id,
        updatedAt: now
      }
    });

    await db.collection("users").doc(user._id).update({
      data: {
        pairId: pairCreate._id,
        updatedAt: now
      }
    });

    const pair = await db.collection("pairs").doc(pairCreate._id).get();
    const pet = await db.collection("pets").doc(petCreate._id).get();

    return ok(
      {
        pair: pair.data,
        pet: pet.data
      },
      "开发模式单人绑定成功"
    );
  } catch (error) {
    console.error("devSetupSoloPair error:", error);
    return fail(500, "开发绑定失败");
  }
};
