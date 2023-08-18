require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");

const fs = require("fs");
const { google } = require("googleapis");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();
app.use(
  cors({
    origin: "https://jarviot-challenge-full-stack-frontend-omega.vercel.app"
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

app.get("/api/auth/login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    // access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/drive"
    ]
  });
  res.redirect(url);
});

app.get("/api/auth/redirect", async (req, res, next) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  await oauth2Client.setCredentials(tokens);
  res.cookie("googleAuthTokens", JSON.stringify(tokens));
  res.redirect("https://jarviot-challenge-full-stack-frontend-omega.vercel.app/report");
});

app.use((req, res, next) => {
  const { googleAuthTokens } = req.cookies;
  if (googleAuthTokens) {
    oauth2Client.setCredentials(JSON.parse(googleAuthTokens));
    next();
  } else {
    res.redirect("/api/auth/login");
  }
});

app.get("/api/users", usersRouter);

app.get("/api/drive/files", async (req, res) => {
  const drive = google.drive({
    version: "v2",
    auth: oauth2Client
  });
  const files = await drive.files.list();
  res.send(files.data.items);
});

module.exports = app;
