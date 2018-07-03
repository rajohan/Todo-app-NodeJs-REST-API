const expect = require("expect");
const request = require("supertest");
const {ObjectID} = require("mongodb");

const {app} = require("./../server");
const {Todo} = require("./../models/todo");
const {User} = require("./../models/user");
const {todos, populateTodos, users, populateUsers} = require("./seed/seed");

beforeEach(populateUsers);
beforeEach(populateTodos);

describe("POST /todos", () => {
    it("should create a new todo", (done) => {
        let text = "Test todo";

        request(app)
            .post("/todos")
            .set("x-auth", users[0].tokens[0].token)
            .send({text})
            .expect(200)
            .expect((response) => {
                expect(response.body.text).toBe(text);
            })
            .end((error, response) => {
                if(error) {
                    return done(error);
                }

                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((error) => done(error));
            });
    });

    it("should not create a todo with invalid body data", (done) => {
        request(app)
            .post("/todos")
            .set("x-auth", users[0].tokens[0].token)
            .send({})
            .expect(400)
            .end((error, response) => {
                if(error) {
                    return done(error);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((error) => done(error));
            });
    });
});

describe("GET /todos", () => {
    it("Should get all todos created by user", (done) => {
        request(app)
            .get("/todos")
            .set("x-auth", users[0].tokens[0].token)
            .expect(200)
            .expect((response) => {
                expect(response.body.todos.length).toBe(1);
            })
            .end(done)
    });
});

describe("GET /todos/:id", () => {
    it("should return todo doc", (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .set("x-auth", users[0].tokens[0].token)
            .expect(200)
            .expect((response) => {
                expect(response.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });

    it("should not return doc created by other user", (done) => {
        request(app)
            .get(`/todos/${todos[1]._id.toHexString()}`)
            .set("x-auth", users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });


    it("should return 404 if todo not found", (done) => {
        request(app)
            .get(`/todos/${new ObjectID().toHexString()}`)
            .set("x-auth", users[0].tokens[0].token)
            .expect(404)
            .end(done)
    });

    it("should return 404 for non-objects ids", (done) => {
        request(app)
            .get("/todos/123")
            .set("x-auth", users[0].tokens[0].token)
            .expect(404)
            .end(done)
    });
});

describe("DELETE /todos/:id", () => {
    it("should remove a todo", (done) => {
        let hexId = todos[1]._id.toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .set("x-auth", users[1].tokens[0].token)
            .expect(200)
            .expect((response) => {
                expect(response.body.todo._id).toBe(hexId);
            })
            .end((error, response) => {
                if(error) {
                    return done(error);
                }

                Todo.findById(hexId).then((todo) => {
                    expect(todo).toBeFalsy();
                    done();
                }).catch(error => done(error));
            });
    });

    it("should not remove a todo created by other user", (done) => {
        let hexId = todos[0]._id.toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .set("x-auth", users[1].tokens[0].token)
            .expect(404)
            .end((error, response) => {
                if(error) {
                    return done(error);
                }

                Todo.findById(hexId).then((todo) => {
                    expect(todo).toBeTruthy();
                    done();
                }).catch(error => done(error));
            });
    });

    it("should return 404 if todo not found", (done) => {
        request(app)
            .delete(`/todos/${new ObjectID().toHexString()}`)
            .set("x-auth", users[1].tokens[0].token)
            .expect(404)
            .end(done)
    });

    it("should return 404 if object id is invalid", (done) => {
        request(app)
            .delete("/todos/123")
            .set("x-auth", users[1].tokens[0].token)
            .expect(404)
            .end(done)
    });
});

describe("PATCH /todos/:id", () => {
    it("should update the todo", (done) => {
        let hexId = todos[0]._id.toHexString();
        let update = {
            text: "updated text",
            completed: true
        };

        request(app)
            .patch(`/todos/${hexId}`)
            .set("x-auth", users[0].tokens[0].token)
            .send(update)
            .expect(200)
            .expect((response) => {
                expect(response.body.todo.text).toBe(update.text);
                expect(response.body.todo.completed).toBeTruthy();
                expect(typeof(response.body.todo.completedAt)).toBe("number");
            })
            .end(done);
    });

    it("should not update todo created by other user", (done) => {
        let hexId = todos[0]._id.toHexString();
        let update = {
            text: "updated text",
            completed: true
        };

        request(app)
            .patch(`/todos/${hexId}`)
            .set("x-auth", users[1].tokens[0].token)
            .send(update)
            .expect(404)
            .end(done);
    });

    it("should clear completedAt when todo is not completed", (done) => {
        let hexId = todos[1]._id.toHexString();
        let update = {
            text: "updated text!!",
            completed: false
        };

        request(app)
            .patch(`/todos/${hexId}`)
            .set("x-auth", users[1].tokens[0].token)
            .send(update)
            .expect(200)
            .expect((response) => {
                expect(response.body.todo.text).toBe(update.text);
                expect(response.body.todo.completed).toBeFalsy();
                expect(response.body.todo.completedAt).toBeFalsy();
            })
            .end(done);
    });

    it("should return 404 if todo not found", (done) => {
        request(app)
            .patch(`/todos/${new ObjectID().toHexString()}`)
            .set("x-auth", users[1].tokens[0].token)
            .expect(404)
            .end(done)
    });

    it("should return 404 if object id is invalid", (done) => {
        request(app)
            .patch("/todos/123")
            .set("x-auth", users[1].tokens[0].token)
            .expect(404)
            .end(done)
    });
});

describe("GET /users/me", () => {
    it("should return user if authenticated", (done) => {
        request(app)
            .get("/users/me")
            .set("x-auth", users[0].tokens[0].token)
            .expect(200)
            .expect((response) => {
                expect(response.body._id).toBe(users[0]._id.toHexString());
                expect(response.body.email).toBe(users[0].email);
            })
            .end(done);
    });

    it("should return 401 if not authenticated", (done) => {
        request(app)
            .get("/users/me")
            .expect(401)
            .expect((response) => {
                expect(response.body).toEqual({});
            })
            .end(done);

    });

    it('should return 401 with wrong jwt signature', (done) => {
        request(app)
            .get('/users/me')
            .set({'x-auth': users[0].tokens[0].token.slice(0, -1)})
            .expect(401)
            .expect((response) => {
                expect(response.body).toEqual({});
            })
            .end(done);
    });
});

describe("POST /users", () => {
    it("should create a user", (done) => {
        let email = "testuser@test.com";
        let password = "test12";

        request(app)
            .post("/users")
            .send({email, password})
            .expect(200)
            .expect((response) => {
                expect(response.headers["x-auth"]).toBeTruthy();
                expect(response.body._id).toBeTruthy();
                expect(response.body.email).toBe(email);
            })
            .end((error, response) => {
                if(error) {
                    return done(error);
                }

                User.findOne({email}).then((user) => {
                    expect(user).toBeTruthy();
                    expect(user.password).not.toBe(password);
                    done();
                }).catch((error) => done(error));
            });

    });

    it("should return validation errors if request is invalid", (done) => {
        request(app)
            .post("/users")
            .send({email: "test", password: "test"})
            .expect(400)
            .end(done);
    });

    it("should not create user if email in use", (done) => {
        request(app)
            .post("/users")
            .send({email: users[0].email, password: "test12"})
            .expect(400)
            .end(done)
    });
});

describe("POST /users/login", () => {
   it("should login user and return auth token", (done) => {
       request(app)
           .post("/users/login")
           .send({email: users[0].email, password: users[0].password})
           .expect(200)
           .expect((response) => {
               expect(response.headers["x-auth"]).toBeTruthy();
           })
           .end((error, response) => {
               if(error) {
                   return done(error);
               }

               User.findById(users[0]._id).then((user) => {
                   expect(user.tokens[1]).toMatchObject({
                       access: "auth",
                       token: response.headers["x-auth"]
                   });
                   done();
               }).catch((error) => done(error));
           });
   });

   it("should reject invalid login", (done) => {
       request(app)
           .post("/users/login")
           .send({email: users[0].email, password: users[0].password + "1"})
           .expect(400)
           .expect((response) => {
               expect(response.headers["x-auth"]).toBeFalsy();
           })
           .end((error, response) => {
               if(error) {
                return done(error);
               }

               User.findById(users[0]._id).then((user) => {
                   expect(user.tokens.length).toBe(1);
                   done();
               }).catch((error) => done(error));
           });
   });
});

describe("DELETE /users/me/token", () => {
    it("should remove token on logout", (done) => {
        request(app)
            .delete("/users/me/token")
            .set("x-auth", users[0].tokens[0].token)
            .expect(200)
            .end((error, response) => {
                if(error) {
                    return done();
                }

                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch((error) => done(error));
            });
    });

    it('should reject on invalid token', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token.slice(0, -1))
            .expect(401)
            .end(done);
    });
});