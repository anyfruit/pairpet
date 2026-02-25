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

function createInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function getUniqueInviteCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = createInviteCode();
    const exists = await db.collection("pairs").where({ inviteCode: code }).limit(1).get();
    if (exists.data.length === 0) {
      return code;
    }
  }
  throw new Error("failed to create unique invite code");
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
      return fail(4001, "你已绑定，不能重复生成邀请码");
    }

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
      const pair = pendingRes.data[0];
      return ok(
        {
          pairId: pair._id,
          inviteCode: pair.inviteCode,
          status: pair.status
        },
        "邀请码已存在"
      );
    }

    const inviteCode = await getUniqueInviteCode();
    const pairCreateRes = await db.collection("pairs").add({
      data: {
        inviteCode,
        ownerOpenId: openid,
        memberOpenIds: [openid],
        status: "pending",
        petId: "",
        createdAt: now,
        updatedAt: now
      }
    });

    return ok(
      {
        pairId: pairCreateRes._id,
        inviteCode,
        status: "pending"
      },
      "邀请码生成成功"
    );
  } catch (error) {
    console.error("generateInviteCode error:", error);
    return fail(500, "生成邀请码失败");
  }
};
