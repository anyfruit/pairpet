import { mockCurrentUser, mockPair, mockPartnerUser } from "../../services/mock";

Page({
  data: {
    currentUser: mockCurrentUser,
    partner: mockPartnerUser,
    pair: mockPair,
    inputCode: ""
  },

  onCodeInput(event: WechatMiniprogram.Input) {
    this.setData({
      inputCode: event.detail.value
    });
  },

  onMockBind() {
    wx.showToast({
      title: "Mock: 绑定成功",
      icon: "success"
    });
  },

  goHome() {
    wx.switchTab({
      url: "/pages/home/index"
    });
  }
});
