const express = require("express");
const { doubleCsrf } = require("csrf-csrf");

const {
  generateToken, // Use this in your routes to provide a CSRF hash + token cookie and token.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf({
  getSecret: () => "supersecret",
  cookieName: "_csrf",
  cookieOptions: {
    secure: true,
  },
  getTokenFromRequest: (req) => req.body.csrfToken,
});

const addCsrfToken = () => {
  express.use(doubleCsrfProtection);

  res.locals.csrfToken = generateToken(req, res);
  next();
}


module.exports = addCsrfToken;
