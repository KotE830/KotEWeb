const sessionFlash = require("../util/session-flash");

function getSignup(req, res) {
  let sessionData = sessionFlash.getSessionData(req);

  if (!sessionData) {
    sessionData = {
      email: "",
      password: "",
      confirmPassword: "",
      nickname: "",
    };
  }

  res.render("auth/signup", { inputData: sessionData });
}

function getLogin(req, res) {
  let sessionData = sessionFlash.getSessionData(req);

  if (!sessionData) {
    sessionData = {
      email: "",
      password: "",
    };
  }

  res.render("auth/login", { inputData: sessionData });
}

module.exports = {
  getSignup: getSignup,
  getLogin: getLogin,
};
