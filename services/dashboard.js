const { callCloud } = require("./cloud");

async function getDashboard(dateKey) {
  return callCloud("getDashboard", { dateKey });
}

module.exports = {
  getDashboard
};
