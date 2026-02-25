const { toDateKey } = require("../../utils/date");
const { createTask } = require("../../services/task");

Page({
  data: {
    scopeOptions: [
      { label: "共同任务", value: "pair" },
      { label: "我的任务", value: "personal" }
    ],
    repeatOptions: [
      { label: "每天", value: "daily" },
      { label: "一次", value: "once" }
    ],
    scopeIndex: 0,
    repeatIndex: 0,
    loading: false,
    form: {
      title: "",
      scope: "pair",
      points: 10,
      repeatRule: "daily",
      bonusPoints: 0,
      onceDateKey: toDateKey()
    }
  },

  onTitleInput(event) {
    this.setData({
      "form.title": event.detail.value
    });
  },

  onPointsInput(event) {
    const points = Number(event.detail.value || 0);
    this.setData({
      "form.points": points
    });
  },

  onBonusInput(event) {
    const bonusPoints = Number(event.detail.value || 0);
    this.setData({
      "form.bonusPoints": bonusPoints
    });
  },

  onScopeChange(event) {
    const scopeIndex = Number(event.detail.value);
    const scope = this.data.scopeOptions[scopeIndex].value;
    this.setData({
      scopeIndex,
      "form.scope": scope
    });
  },

  onRepeatChange(event) {
    const repeatIndex = Number(event.detail.value);
    const repeatRule = this.data.repeatOptions[repeatIndex].value;
    this.setData({
      repeatIndex,
      "form.repeatRule": repeatRule
    });
  },

  async onSubmit() {
    const payload = {
      title: this.data.form.title.trim(),
      scope: this.data.form.scope,
      repeatRule: this.data.form.repeatRule,
      points: Number(this.data.form.points || 0),
      bonusPoints: Number(this.data.form.bonusPoints || 0),
      onceDateKey: this.data.form.onceDateKey
    };

    if (!payload.title) {
      wx.showToast({
        title: "请输入任务标题",
        icon: "none"
      });
      return;
    }

    this.setData({ loading: true });
    const res = await createTask(payload);
    this.setData({ loading: false });
    if (res.code !== 0) {
      wx.showToast({
        title: res.message || "创建失败",
        icon: "none"
      });
      return;
    }

    wx.setStorageSync("tasks_need_refresh", true);
    wx.showToast({
      title: "任务已创建",
      icon: "success"
    });

    setTimeout(() => {
      this.backToTasks();
    }, 500);
  },

  backToTasks() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({
      url: "/pages/tasks/index"
    });
  }
});