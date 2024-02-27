function isEmpty(value) {
  return !value || value.trim() === "";
}

function userCredentialsAreValid(email, password) {
  return (
    email && email.includes("@") && password && password.trim().length >= 8
  );
}

function userDetailsAreValid(nickname, email, password, confirmPassword) {
  return !isEmpty(nickname) && userCredentialsAreValid(email, password);
}

function passwordsConfirmed(password, confirmPassword) {
  return password === confirmPassword;
}

module.exports = {
  userDetailsAreValid: userDetailsAreValid,
  passwordsConfirmed: passwordsConfirmed,
};
