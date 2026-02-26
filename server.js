const express = require("express");
const path = require("path");

const PORT = 3000;

const pollRouter = require("./poll");
const tasksRouter = require("./tasks");

const app = express();

app.use("/poll/api", pollRouter);
app.get("/poll", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "poll.html")),
);
app.get("/poll/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "poll.html")),
);

app.get("/forum/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "forum.html")),
);
app.use("/poll", express.static(path.join(__dirname, "public")));

app.use("/tasks", tasksRouter);

app.get("/tasks-ui", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "tasks.html")),
);

app.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "docs.html"));
});

app.get("/", (req, res) =>
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
        h1 { color: #333; margin-bottom: 30px; }
        ul { list-style: none; padding: 0; }
        li { margin: 15px 0; }
        a { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: 600; transition: background 0.3s; }
        a:hover { background: #764ba2; }
      </style>
    </head>
    <body>
      <h1>REST APIs Demo</h1>
      <ul>
        <li><a href="/poll/poll.html">Poll</a></li>
        <li><a href="/poll/forum.html">Forum</a></li>
        <li><a href="/tasks-ui">Tasks</a></li>
        <li><a href="/docs">Docs</a></li>
        <li><a href="https://github.com/haotian2006/restfulAPIsDemo">GitHub</a></li>
      </ul>
    </body>
    </html>
  `),
);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
