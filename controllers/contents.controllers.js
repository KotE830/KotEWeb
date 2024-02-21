function getContents(req, res) {
  res.render("contents/all-contents", { contents: "" });
}

function createNewContent(req, res) {
  res.render("contents/new-content", { content: "" });
}

module.exports = {
  getContents: getContents,
  createNewContent: createNewContent,
};
