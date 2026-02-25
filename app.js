const DEFAULT_ENV_ID = "cloud1-4gyj2y9d0985ad05";

App({
  globalData: {
    appName: "PairPet",
    cloudEnvId: DEFAULT_ENV_ID
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以支持云开发");
      return;
    }

    const env =
      this.globalData.cloudEnvId === DEFAULT_ENV_ID
        ? wx.cloud.DYNAMIC_CURRENT_ENV
        : this.globalData.cloudEnvId;

    wx.cloud.init({
      env,
      traceUser: true
    });
  }
});
