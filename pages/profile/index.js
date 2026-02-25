const { mockCurrentUser, mockPair, mockPet } = require("../../services/mock");

Page({
  data: {
    user: mockCurrentUser,
    pair: mockPair,
    pet: mockPet
  },

  goPair() {
    wx.navigateTo({
      url: "/pages/pair/index"
    });
  }
});