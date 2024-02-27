const User = require("../models/user.model");

async function getMypage(req, res) {
  try {
    const user = await User.findById(req.session.uid);
    res.render("mypage/mypage", { user: user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMypage: getMypage,
};
