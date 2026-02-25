const DEFAULT_ENV_ID = "your-cloud-env-id";

App<IAppOption>({
  globalData: {
    appName: "PairPet",
    cloudEnvId: DEFAULT_ENV_ID
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error("Please use base lib >= 2.2.3 for CloudBase");
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

interface IAppOption {
  globalData: {
    appName: string;
    cloudEnvId: string;
  };
}
