

// normall error handler for server-side err
exports.serverError = function serverSideErrorHandling(err, res) {
  res.status(500);
  res.type('text/plain');
  res.send(err.toString());
  console.log(err);
};
