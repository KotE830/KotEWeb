const User = require("../models/user.model");
const authUtil = require("../util/authentication");
const sessionFlash = require("../util/session-flash");
const validation = require("../util/validation");

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

async function signup(req, res, next) {
  const enteredData = {
    nickname: req.body.nickname,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body["confirm-password"],
  };

  if (
    !validation.userDetailsAreValid(
      req.body.nickname,
      req.body.email,
      req.body.password,
      req.body.confirmPassword
    ) ||
    !validation.passwordsConfirmed(
      req.body.password,
      req.body["confirm-password"]
    )
  ) {
    sessionFlash.flashDataToSession(
      req,
      {
        errorMessage: "Please check your input.",
        ...enteredData,
      },
      function () {
        res.redirect("/signup");
      }
    );
    return;
  }

  const user = new User(req.body.email, req.body.password, req.body.nickname);

  try {
    const nicknameExistsAlready = await user.nicknameExistsAlready();
    if (nicknameExistsAlready) {
      sessionFlash.flashDataToSession(
        req,
        {
          errorMessage: "Nickname eixsts already! Try logging in instead!",
          ...enteredData,
        },
        function () {
          res.redirect("/signup");
        }
      );
      return;
    }

    const emailExistsAlready = await user.emailExistsAlready();
    if (emailExistsAlready) {
      sessionFlash.flashDataToSession(
        req,
        {
          errorMessage: "Email eixsts already! Try logging in instead!",
          ...enteredData,
        },
        function () {
          res.redirect("/signup");
        }
      );
      return;
    }

    await user.signup();
  } catch (error) {
    next(error);
    return;
  }

  res.redirect("/login");
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

async function login(req, res) {
  const user = new User(req.body.email, req.body.password);

  let existingUser;
  try {
    existingUser = await user.getUserWithSameEmail();
  } catch (error) {
    next(error);
    return;
  }

  const sessionErrorData = {
    errorMessage: "Invalid credentials - please check your email and password!",
    email: user.email,
    password: user.password,
  };

  if (!existingUser) {
    sessionFlash.flashDataToSession(req, sessionErrorData, function () {
      res.redirect("/login");
    });
    return;
  }

  const passwordIsCorrect = await user.hasMatchingPassword(
    existingUser.password
  );

  if (!passwordIsCorrect) {
    sessionFlash.flashDataToSession(req, sessionErrorData, function () {
      res.redirect("/login");
    });
    return;
  }

  authUtil.createUserSession(req, existingUser, function () {
    res.redirect("/");
  });
}

function logout(req, res) {
  authUtil.destroyUserAuthSession(req);
  res.redirect("/");
}

module.exports = {
  getSignup: getSignup,
  signup: signup,
  getLogin: getLogin,
  login: login,
  logout: logout
};
