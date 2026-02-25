const { callCloud } = require("./cloud");

async function createTask(payload) {
  return callCloud("createTask", payload);
}

async function getTasksByDate(dateKey) {
  return callCloud("getTasksByDate", { dateKey });
}

async function completeTask(taskId, dateKey) {
  return callCloud("completeTask", { taskId, dateKey });
}

module.exports = {
  createTask,
  getTasksByDate,
  completeTask
};
