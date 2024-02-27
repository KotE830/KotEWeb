function handleErrors(error, req, res, next) {
  console.log(error);

  if (error.code === 404) {
    return res.status(404).render("shared/errors/404");
  }

  res.status(500).render("shared/errors/500");
}

module.exports = handleErrors