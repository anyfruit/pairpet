function normalizeResult(result) {
  if (result && typeof result.code === "number") {
    return result;
  }

  return {
    code: -1,
    message: "云函数返回格式错误",
    data: null
  };
}

async function callCloud(name, data) {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data: data || {}
    });
    return normalizeResult(res.result);
  } catch (error) {
    console.error("callCloud failed:", error);
    return {
      code: -1,
      message: "云函数调用失败",
      data: null
    };
  }
}

module.exports = {
  callCloud
};
