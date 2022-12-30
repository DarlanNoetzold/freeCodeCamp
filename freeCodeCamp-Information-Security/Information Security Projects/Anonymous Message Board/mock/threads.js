const threads = [];

exports.threads = threads;

exports.getThreadById = (id) => {
  return threads.find((thread) => thread._id === id);
};