const { toDateKey } = require("../../utils/date");
const { getTasksByDate, completeTask } = require("../../services/task");

Page({
  data: {
    dateKey: toDateKey(),
    sharedTasks: [],
    personalTasks: [],
    loading: false,
    submittingTaskId: "",
    empty: false,
    errorMessage: ""
  },

  onShow() {
    this.refreshTasks();
  },

  async refreshTasks() {
    const dateKey = toDateKey();
    this.setData({
      loading: true,
      errorMessage: "",
      dateKey
    });
    const res = await getTasksByDate(dateKey);
    if (res.code !== 0) {
      this.setData({
        loading: false,
        sharedTasks: [],
        personalTasks: [],
        empty: true,
        errorMessage: res.message || "任务加载失败"
      });
      return;
    }

    const sharedTasks = (res.data && res.data.sharedTasks) || [];
    const personalTasks = (res.data && res.data.personalTasks) || [];
    this.setData({
      loading: false,
      sharedTasks,
      personalTasks,
      empty: sharedTasks.length + personalTasks.length === 0
    });
  },

  goCreate() {
    wx.navigateTo({
      url: "/pages/task-create/index"
    });
  },

  goHome() {
    wx.switchTab({
      url: "/pages/home/index"
    });
  },

  async onCompleteTask(event) {
    const taskId = event.currentTarget.dataset.taskId;
    if (!taskId) {
      return;
    }
    this.setData({
      submittingTaskId: taskId
    });
    const res = await completeTask(taskId, this.data.dateKey);
    this.setData({
      submittingTaskId: ""
    });

    if (res.code !== 0) {
      wx.showToast({
        title: res.message || "打卡失败",
        icon: "none"
      });
      return;
    }

    const data = res.data || {};
    const tips = [`+${Number(data.basePoints || 0)} 亲密值`];
    if (data.bonusTriggered) {
      tips.push(`双人奖励 +${Number(data.bonusPoints || 0)}`);
    }
    if (data.levelUp) {
      tips.push("宠物升级啦");
    }
    if (data.alreadyCompleted) {
      tips.length = 0;
      tips.push("今日已完成（幂等）");
    }

    await this.refreshTasks();
    wx.setStorageSync("home_need_refresh", true);
    wx.showToast({
      title: tips.join("，"),
      icon: "none",
      duration: 2400
    });
  },

  onClockPlaceholder() {
    wx.showToast({
      title: "下一阶段实现",
      icon: "none"
    });
  }
});