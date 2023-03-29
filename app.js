const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000:/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1
app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  let userQuery = `SELECT
     * 
    FROM 
        user
    WHERE 
        username = "${username}";`;
  let dbUser = await db.get(userQuery);

  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    let createUser = `
        INSERT INTO
        user (username, name, password, gender, location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        )`;
    let dbResponse = await db.run(createUser);
    response.status(200);
    response.send("User created successfully");
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `
    SELECT 
        *
    FROM
        user
    WHERE 
        username = "${username}";`;
  const dbQuery = await db.get(userQuery);
  //const isPasswordMatched = await bcrypt.compare(dbQuery.password, password);

  if (dbQuery === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbQuery.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `
    SELECT 
        *
    FROM
        user 
    WHERE 
        username = "${username}";`;
  const dbQuery = await db.get(userQuery);
  const isPassCorrect = await bcrypt.compare(oldPassword, dbQuery.password);
  if (isPassCorrect === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newPass = await bcrypt.hash(newPassword, 10);
      const insertNewPass = `
            UPDATE 
                user
            SET 
                password = "${newPass}"`;
      await db.run(insertNewPass);
      response.send("Password updated");
    }
  }
});
module.exports = app;
