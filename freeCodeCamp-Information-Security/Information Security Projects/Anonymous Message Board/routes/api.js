"use strict";

const crypto = require("crypto");

const { threads, getThreadById } = require("../mock/threads");

const generateKey = () => {
  return crypto.randomBytes(20).toString("hex");
};

const getCurrentDate = () => {
  return new Date().toISOString();
};

const sortByDateDesc = (arr, key) => {
  return [...arr].sort((a, b) => {
    return new Date(b[key]) - new Date(a[key]);
  });
};

module.exports = function (app) {
  app
    .route("/api/threads/:board")
    .get(async function (req, res) {
      const board = req.params.board;
      console.time("[GET] - /api/threads/:board");

      const result = sortByDateDesc(
        threads.filter((thread) => thread.board === board),
        "bumped_on"
      )
        .slice(0, 10)
        .map((thread) => {
          return {
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: sortByDateDesc(thread.replies, "created_on")
              .slice(0, 3)
              .map((reply) => {
                return {
                  _id: reply._id,
                  text: reply.text,
                  created_on: reply.created_on,
                };
              }),
            replycount: thread.replies.length,
          };
        });

      console.timeEnd("[GET] - /api/threads/:board");

      res.json(result);
    })
    .post(async function (req, res) {
      const board = req.params.board;
      const { text, delete_password } = req.body;
      console.time("[POST] - /api/threads/:board");

      let currentDate = getCurrentDate();
      let data = {
        _id: generateKey(),
        board,
        text,
        delete_password,
        created_on: currentDate,
        bumped_on: currentDate,
        reported: false,
        replies: [],
      };

      threads.push(data);

      console.timeEnd("[POST] - /api/threads/:board");

      res.redirect(`/b/${board}/`);
    })
    .put(async function (req, res) {
      const { report_id } = req.body;
      console.time("[PUT] - /api/threads/:board");
      const thread = getThreadById(report_id);
      console.timeEnd("[PUT] - /api/threads/:board");
      if (!thread) return res.send("Not found");
      thread.reported = true;
      thread.bumped_on = getCurrentDate();
      res.send("reported");
    })
    .delete(async function (req, res) {
      try {
        const { thread_id, delete_password } = req.body;
        console.time("[DELETE] - /api/threads/:board");
        const index = threads.findIndex(
          (thread) =>
            thread._id === thread_id &&
            thread.delete_password === delete_password
        );
        console.timeEnd("[DELETE] - /api/threads/:board");
        if (index === -1) return res.send("incorrect password");
        threads.splice(index, 1);
        res.send("success");
      } catch (err) {
        console.error(err);
        res.send(err.message);
      }
    });

  app
    .route("/api/replies/:board")
    .get(async function (req, res) {
      const threadId = req.query.thread_id;
      console.time("[GET] - /api/replies/:board");

      const thread = getThreadById(threadId);

      if (!thread) return res.send("Thread not found");

      const newThread = {...thread};

      delete newThread.delete_password;
      delete newThread.reported;
      delete newThread.board;
      
      newThread.replies = newThread.replies.map((reply) => {
        return {
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on,
        };
      });

      console.timeEnd("[GET] - /api/replies/:board");
      res.json(newThread);
    })
    .post(async function (req, res) {
      const board = req.params.board;
      console.time("[POST] - /api/replies/:board");
      const { text, delete_password, thread_id } = req.body;

      const thread = getThreadById(thread_id);
      if (!thread) return res.send("Thread not found");

      let reply = {
        _id: generateKey(),
        text,
        thread_id,
        delete_password: delete_password.trim(),
        reported: false,
        created_on: getCurrentDate(),
      };

      thread.replies.push(reply);
      thread.bumped_on = reply.created_on;

      console.timeEnd("[POST] - /api/replies/:board");
      res.redirect(`/b/${board}/${thread._id.toString()}`);
    })
    .put(async function (req, res) {
      const { thread_id, reply_id } = req.body;
      console.time("[PUT] - /api/replies/:board");

      const thread = getThreadById(thread_id);
      if (!thread) return res.send("Thread not found");

      const reply = thread.replies.find((reply) => reply._id === reply_id);
      if (!reply) return res.send("Reply not found");

      reply.reported = true;

      console.timeEnd("[PUT] - /api/replies/:board");
      if (!reply) return res.send("Not found");
      res.send("reported");
    })
    .delete(async function (req, res) {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        console.time("[DELETE] - /api/replies/:board");
        const thread = getThreadById(thread_id);
        if (!thread) {
          console.timeEnd("[DELETE] - /api/replies/:board");
          return res.send("Thread not found");
        }

        const reply = thread.replies.find((reply) => {
          return reply._id === reply_id;
        });
        if (!reply) {
          console.timeEnd("[DELETE] - /api/replies/:board");
          return res.send("Reply not found");
        }

        if (reply.delete_password !== delete_password.trim()) {
          console.timeEnd("[DELETE] - /api/replies/:board");
          return res.send("incorrect password");
        }
        reply.text = "[deleted]";

        console.timeEnd("[DELETE] - /api/replies/:board");

        res.send("success");
      } catch (err) {
        console.error(err);
        res.send(err.message);
      }
    });
};
