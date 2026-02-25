import { mockTasks } from "../../services/mock";

Page({
  data: {
    tasks: mockTasks
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
  }
});
