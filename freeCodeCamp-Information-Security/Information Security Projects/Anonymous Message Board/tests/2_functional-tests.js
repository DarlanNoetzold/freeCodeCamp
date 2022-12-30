const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const mongoose = require("mongoose");
const Thread = require("../models/Thread");
// const db = require("../db");
const { threads, getThreadById} = require("../mock/threads");

const promiseThread = () => {
    return Promise.resolve(threads);
}

chai.use(chaiHttp);

suite("Functional Tests", function () {
  //Before starting the test, create a sandboxed database connection
  //Once a connection is established invoke done()
  //   let connection;
  //   before(function (done) {
  //     connection = mongoose.createConnection(process.env.MONGODB_URI);
  //     connection.on("error", console.error.bind(console, "connection error"));
  //     connection.once("open", function () {
  //       console.log("We are connected to test database!");
  //       done();
  //     });
  //   });
  //   //After all tests are finished drop database and close connection
  //   after(function (done) {
  //     connection.db.dropDatabase(function () {
  //       connection.close(done);
  //     });
  //   });

//   after(function (done) {
//     db.dropDatabase(function (err) {
//       if (err) {
//         console.error(err);
//         return done(err);
//       }
//       console.log("Database dropped");
//       done();
//     });
//   });

  test("Creating a new thread: POST request to /api/threads/{board}", function (done) {
    chai
      .request(server)
      .post("/api/threads/general")
      .send({ text: "My thread", delete_password: "password" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });
  test("Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", function (done) {
    chai
      .request(server)
      .get("/api/threads/general")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, "response should be an array");
        assert.property(
          res.body[0],
          "text",
          "Threads in array should contain text"
        );
        done();
      });
  });
  test("Reporting a thread: PUT request to /api/threads/{board}", function (done) {
    promiseThread().then((threads) => {
      chai
        .request(server)
        .put("/api/threads/general")
        .send({ report_id: threads[0]._id })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "reported");
          assert.equal(threads[0].reported, true);
          done();
        });
    });
  });
  test("Creating a new reply: POST request to /api/replies/{board}", function (done) {
    promiseThread().then((threads) => {
      chai
        .request(server)
        .post(`/api/replies/general?threadId=${threads[0]._id}`)
        .send({
          thread_id: threads[0]._id,
          text: "My Reply",
          delete_password: "password",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });
  });
  test("Viewing a single thread with all replies: GET request to /api/replies/{board}", function (done) {
    promiseThread().then((threads) => {
      chai
        .request(server)
        .get(`/api/replies/general?threadId=${threads[0]._id}`)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body, "body should be an object");
          done();
        });
    });
  });
  test("Reporting a reply: PUT request to /api/replies/{board}", function (done) {
    promiseThread().then((threads) => {
      chai
        .request(server)
        .put(`/api/replies/general`)
        .send({
          thread_id: threads[0]._id,
          reply_id: threads[0].replies[0]._id,
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "reported");
          assert.equal(threads[0].replies[0].reported, true);

          done();
        });
    });
  });
  test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", function (done) {
    promiseThread().then((threads) => {
      chai
        .request(server)
        .delete(`/api/replies/general`)
        .send({
          thread_id: threads[0]._id,
          reply_id: threads[0].replies[0]._id,
          delete_password: "wrongpassword",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "incorrect password");
          done();
        });
    });
  });
  test("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", function (done) {
    promiseThread().then((threads) => {
      chai
        .request(server)
        .delete(`/api/replies/general`)
        .send({
          thread_id: threads[0]._id,
          reply_id: threads[0].replies[0]._id,
          delete_password: "password",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
    });
  });
  test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", function (done) {
    promiseThread().then((threads) => {
      chai
        .request(server)
        .delete("/api/threads/general")
        .send({ thread_id: threads[0]._id, delete_password: "wrong" })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "incorrect password");
          done();
        });
    });
  });
  test("Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password", function (done) {
    promiseThread().then((threads) => {
      chai
        .request(server)
        .delete("/api/threads/general")
        .send({ thread_id: threads[0]._id, delete_password: "password" })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
    });
  });
});
