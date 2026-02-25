const { callCloud } = require("../../services/cloud");

Page({
  data: {
    user: null,
    pair: null,
    pet: null,
    inputCode: "",
    loading: false,
    statusText: "未绑定"
  },

  onShow() {
    this.refreshUserStatus();
  },

  async refreshUserStatus() {
    this.setData({ loading: true });
    const res = await callCloud("initUser");
    if (res.code !== 0) {
      this.setData({ loading: false });
      wx.showToast({
        title: res.message || "初始化失败",
        icon: "none"
      });
      return;
    }

    const pair = res.data && res.data.pair ? res.data.pair : null;
    const pet = res.data && res.data.pet ? res.data.pet : null;
    this.setData({
      user: res.data ? res.data.user : null,
      pair,
      pet,
      statusText: pair && pair.status === "active" ? "已绑定" : "未绑定",
      loading: false
    });
  },

  onCodeInput(event) {
    this.setData({
      inputCode: event.detail.value
    });
  },

  async onGenerateCode() {
    this.setData({ loading: true });
    const res = await callCloud("generateInviteCode");
    this.setData({ loading: false });
    if (res.code !== 0) {
      wx.showToast({
        title: res.message || "生成失败",
        icon: "none"
      });
      return;
    }
    await this.refreshUserStatus();
    wx.showToast({
      title: "邀请码已更新",
      icon: "success"
    });
  },

  async onBindPair() {
    const inviteCode = (this.data.inputCode || "").trim();
    if (!inviteCode) {
      wx.showToast({
        title: "请输入邀请码",
        icon: "none"
      });
      return;
    }

    this.setData({ loading: true });
    const res = await callCloud("bindPair", { inviteCode });
    this.setData({ loading: false });
    if (res.code !== 0) {
      wx.showToast({
        title: res.message || "绑定失败",
        icon: "none"
      });
      return;
    }

    wx.showToast({
      title: "绑定成功",
      icon: "success"
    });

    setTimeout(() => {
      wx.switchTab({
        url: "/pages/home/index"
      });
    }, 600);
  },

  async onDevSetupSoloPair() {
    this.setData({ loading: true });
    const res = await callCloud("devSetupSoloPair");
    this.setData({ loading: false });
    if (res.code !== 0) {
      wx.showToast({
        title: res.message || "开发绑定失败",
        icon: "none"
      });
      return;
    }
    await this.refreshUserStatus();
    wx.showToast({
      title: "开发单人绑定完成",
      icon: "success"
    });
  },

  goHome() {
    wx.switchTab({
      url: "/pages/home/index"
    });
  }
});