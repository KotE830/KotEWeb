const bcrypt = require("bcryptjs");
const mongodb = require("mongodb");

const db = require("../data/database");

class User {
  constructor(email, password, nickname) {
    this.email = email;
    this.password = password;
    this.nickname = nickname;
  }

  static async findById(userId) {
    const uid = new mongodb.ObjectId(userId);

    const user = await db
      .getDb()
      .collection("users")
      .findOne({ _id: uid }, { projection: { password: 0 } });

    if (!user) {
      const error = new Error("Could not find user with provided id.");
      error.code = 404;
      throw error;
    }

    return new User(user.email, user.password, user.nickname);
  }

  async nicknameExistsAlready() {
    const existingUser = await db
      .getDb()
      .collection("users")
      .findOne({ nickname: this.nickname });
    if (existingUser) {
      return true;
    }
    return false;
  }

  getUserWithSameEmail() {
    return db.getDb().collection("users").findOne({ email: this.email });
  }

  async emailExistsAlready() {
    const existingUser = await this.getUserWithSameEmail();
    if (existingUser) {
      return true;
    }
    return false;
  }

  async signup() {
    const hashedPassword = await bcrypt.hash(this.password, 12);

    await db.getDb().collection("users").insertOne({
      nickname: this.nickname,
      email: this.email,
      password: hashedPassword,
    });
  }

  hasMatchingPassword(hashedPassword) {
    return bcrypt.compare(this.password, hashedPassword);
  }

  remove() {
    const nickname = this.nickname;
    return db.getDb().collection("users").deleteOne({ "nickname": nickname });
  }
}

module.exports = User;
