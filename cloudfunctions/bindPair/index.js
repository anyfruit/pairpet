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

exports.main = async (event) => {
  try {
    const inviteCode = String(event.inviteCode || "")
      .trim()
      .toUpperCase();
    if (!inviteCode) {
      return fail(4000, "请输入邀请码");
    }

    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const now = new Date();

    const selfRes = await db.collection("users").where({ openid }).limit(1).get();
    let selfUser = selfRes.data[0];
    if (!selfUser) {
      const createSelf = await db.collection("users").add({
        data: {
          openid,
          nickname: "微信用户",
          avatarUrl: "",
          pairId: "",
          createdAt: now,
          updatedAt: now
        }
      });
      const createdSelf = await db.collection("users").doc(createSelf._id).get();
      selfUser = createdSelf.data;
    }

    if (selfUser.pairId) {
      return fail(4001, "你已绑定，不能重复绑定");
    }

    const pairRes = await db.collection("pairs").where({ inviteCode }).limit(1).get();
    const pair = pairRes.data[0];
    if (!pair) {
      return fail(4004, "无效邀请码");
    }

    if (pair.ownerOpenId === openid) {
      return fail(4002, "不能绑定自己的邀请码");
    }

    if (pair.status !== "pending") {
      return fail(4003, "该邀请码已失效");
    }

    const ownerRes = await db.collection("users").where({ openid: pair.ownerOpenId }).limit(1).get();
    let ownerUser = ownerRes.data[0];
    if (!ownerUser) {
      const createOwner = await db.collection("users").add({
        data: {
          openid: pair.ownerOpenId,
          nickname: "微信用户",
          avatarUrl: "",
          pairId: "",
          createdAt: now,
          updatedAt: now
        }
      });
      const createdOwner = await db.collection("users").doc(createOwner._id).get();
      ownerUser = createdOwner.data;
    }

    if (ownerUser.pairId && ownerUser.pairId !== pair._id) {
      return fail(4005, "邀请方已绑定其他关系");
    }

    const petRes = await db.collection("pets").add({
      data: {
        pairId: pair._id,
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

    await db.collection("pairs").doc(pair._id).update({
      data: {
        status: "active",
        memberOpenIds: [pair.ownerOpenId, openid],
        petId: petRes._id,
        activatedAt: now,
        updatedAt: now
      }
    });

    await Promise.all([
      db.collection("users").doc(ownerUser._id).update({
        data: {
          pairId: pair._id,
          updatedAt: now
        }
      }),
      db.collection("users").doc(selfUser._id).update({
        data: {
          pairId: pair._id,
          updatedAt: now
        }
      })
    ]);

    const activePair = await db.collection("pairs").doc(pair._id).get();
    const pet = await db.collection("pets").doc(petRes._id).get();

    return ok(
      {
        pair: activePair.data,
        pet: pet.data
      },
      "绑定成功"
    );
  } catch (error) {
    console.error("bindPair error:", error);
    return fail(500, "绑定失败");
  }
};
