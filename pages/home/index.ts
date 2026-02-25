import { mockCurrentUser, mockPair, mockPet, mockTasks } from "../../services/mock";
import { toDateKey } from "../../utils/date";

Page({
  data: {
    dateKey: toDateKey(),
    user: mockCurrentUser,
    pair: mockPair,
    pet: mockPet,
    todayTaskCount: mockTasks.length,
    doneTaskCount: mockTasks.filter((item) => item.status === "done").length
  },

  goTasks() {
    wx.switchTab({
      url: "/pages/tasks/index"
    });
  },

  goPair() {
    wx.navigateTo({
      url: "/pages/pair/index"
    });
  }
});
