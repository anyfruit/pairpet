const { getDashboard } = require("../../services/dashboard");
const { PET_STAGE_TEXT, PET_MOOD_TEXT, EXP_PER_LEVEL } = require("../../constants/pet");
const { toDateKey } = require("../../utils/date");

Page({
  data: {
    dateKey: toDateKey(),
    user: null,
    pair: null,
    pet: null,
    todaySummary: {
      total: 0,
      completed: 0,
      sharedTotal: 0,
      sharedCompleted: 0,
      sharedTasks: []
    },
    recentIntimacyChange: null,
    hasBound: false,
    loading: false,
    errorMessage: "",
    petStageText: "",
    petMoodText: "",
    petExpProgress: 0,
    expCurrentInLevel: 0,
    expNeededInLevel: EXP_PER_LEVEL
  },

  onShow() {
    if (wx.getStorageSync("home_need_refresh")) {
      wx.removeStorageSync("home_need_refresh");
    }
    this.refreshHomeData();
  },

  onPullDownRefresh() {
    this.refreshHomeData(true);
  },

  buildPetViewState(pet) {
    if (!pet) {
      return {
        petStageText: "",
        petMoodText: "",
        petExpProgress: 0,
        expCurrentInLevel: 0,
        expNeededInLevel: EXP_PER_LEVEL
      };
    }
    const exp = Number(pet.exp || 0);
    const expCurrentInLevel = exp % EXP_PER_LEVEL;
    const petExpProgress = Math.min(100, Math.floor((expCurrentInLevel / EXP_PER_LEVEL) * 100));
    return {
      petStageText: PET_STAGE_TEXT[pet.stage] || pet.stage || "-",
      petMoodText: PET_MOOD_TEXT[pet.mood] || pet.mood || "-",
      petExpProgress,
      expCurrentInLevel,
      expNeededInLevel: EXP_PER_LEVEL
    };
  },

  async refreshHomeData(fromPullDown = false) {
    this.setData({
      loading: true,
      errorMessage: ""
    });
    const res = await getDashboard(toDateKey());
    if (res.code !== 0) {
      this.setData({
        loading: false,
        errorMessage: res.message || "加载失败"
      });
      wx.showToast({
        title: res.message || "加载失败",
        icon: "none"
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
      return;
    }

    const data = res.data || {};
    const pair = data.pair || null;
    const pet = data.pet || null;
    const todaySummary = data.todaySummary || {
      total: 0,
      completed: 0,
      sharedTotal: 0,
      sharedCompleted: 0,
      sharedTasks: []
    };
    const hasBound = !!data.bound;
    const petViewState = this.buildPetViewState(pet);

    this.setData({
      dateKey: data.dateKey || toDateKey(),
      user: data.user || null,
      pair,
      pet,
      todaySummary,
      recentIntimacyChange: data.recentIntimacyChange || null,
      hasBound,
      ...petViewState,
      loading: false
    });
    if (fromPullDown) {
      wx.stopPullDownRefresh();
    }
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
  },

  goTaskCreate() {
    wx.navigateTo({
      url: "/pages/task-create/index"
    });
  }
});