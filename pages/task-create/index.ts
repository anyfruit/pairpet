import { toDateKey } from "../../utils/date";

Page({
  data: {
    form: {
      title: "",
      points: 10,
      dateKey: toDateKey()
    }
  },

  onTitleInput(event: WechatMiniprogram.Input) {
    this.setData({
      "form.title": event.detail.value
    });
  },

  onPointsInput(event: WechatMiniprogram.Input) {
    const points = Number(event.detail.value || 0);
    this.setData({
      "form.points": points
    });
  },

  onSubmit() {
    wx.showToast({
      title: "Mock: 已创建",
      icon: "success"
    });
  },

  backToTasks() {
    wx.navigateBack();
  }
});
