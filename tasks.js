const express = require("express");
const router = express.Router();

const finishedTasks = new Map();
const userUploads = new Map();
const users = new Map();

const TASKS = Object.freeze({
  CREATED_UPLOAD: "created an upload",
  LISTED_UPLOADS: "listed all uploads",
  VIEWED_UPLOAD: "viewed a specific upload",
  PATCHED_UPLOAD: "patched an upload's content",
  REMOVED_UPLOAD: "deleted an upload",
  SEARCHED_TASKS: "queried tasks",
  RETRIEVED_TASKS: "retrieved completed tasks",
});

const TOTAL = Object.keys(TASKS).length;

function generateId() {
  let id;
  do {
    id = Math.floor(Math.random() * 900) + 100;
  } while (users.has(id.toString()));
  return id.toString();
}

function passTask(userId, task) {
  const finished = finishedTasks.get(userId);
  finished.add(task);
}

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/register", (req, res) => {
  const name = req.body.name;

  if (!name) {
    return res.status(400).json({ error: "missing name" });
  }

  if (Array.from(users.values()).includes(name)) {
    return res.status(400).json({ error: "name already taken" });
  }

  const id = generateId();
  users.set(id, name);
  userUploads.set(id, []);
  finishedTasks.set(id, new Set());
  res.status(201).json({ id, name });
});

router.use((req, res, next) => {
  if (req.path === "/status") {
    return next();
  }
  const uid = req.header("x-user-id");
  if (!uid || !users.has(uid)) {
    return res.status(401).json({ error: "invalid or missing user id" });
  }
  req.userId = uid;
  req.userName = users.get(uid);
  next();
});

router.post(`/uploads`, (req, res) => {
  const title = req.body.title;
  const content = req.body.content;

  if (!title || !content) {
    return res.status(400).json({ error: "missing title or content" });
  }

  const uploads = userUploads.get(req.userId);
  const id = uploads.length + 1;
  uploads.push({ id, title, content });
  passTask(req.userId, TASKS.CREATED_UPLOAD);
  res.status(201).json({ id, title });
});

router.get("/uploads", (req, res) => {
  const uploads = userUploads.get(req.userId);
  passTask(req.userId, TASKS.LISTED_UPLOADS);
  res.json(uploads);
});

router.get("/uploads/:id", (req, res) => {
  const uploads = userUploads.get(req.userId);
  const upload = uploads[parseInt(req.params.id) - 1];
  if (!upload) {
    return res.status(404).json({ error: "upload not found" });
  }
  passTask(req.userId, TASKS.VIEWED_UPLOAD);
  res.json(upload);
});

router.patch("/uploads/:id", (req, res) => {
  const uploads = userUploads.get(req.userId);
  const upload = uploads[parseInt(req.params.id) - 1];
  if (!upload) {
    return res.status(404).json({ error: "upload not found" });
  }
  const content = req.body.content;
  if (!content) {
    return res.status(400).json({ error: "missing content" });
  }
  uploads[parseInt(req.params.id) - 1] = {
    id: upload.id,
    title: upload.title,
    content,
  };
  passTask(req.userId, TASKS.PATCHED_UPLOAD);
  res.json({ success: true });
});

router.delete("/uploads/:id", (req, res) => {
  const uploads = userUploads.get(req.userId);
  const index = parseInt(req.params.id) - 1;
  if (index < 0 || index >= uploads.length) {
    return res.status(404).json({ error: "upload not found" });
  }
  uploads[index] = null;
  passTask(req.userId, TASKS.REMOVED_UPLOAD);
  res.json({ success: true });
});

router.get("/completed", (req, res) => {
  const finished = finishedTasks.get(req.userId) || new Set();
  const all = Object.values(TASKS);
  const nonFinished = all.filter((t) => !finished.has(t));
  const include = req.query.include;

  if (include) {
    passTask(req.userId, TASKS.SEARCHED_TASKS);
    const finishedMatches = Array.from(finished).filter((task) =>
      task.includes(include),
    );
    const nonFinishedMatches = nonFinished.filter((task) =>
      task.includes(include),
    );
    return res.json({
      include,
      tasks: finishedMatches,
      total: TOTAL,
      all: all.join(", "),
      nonFinished: nonFinishedMatches,
    });
  }

  passTask(req.userId, TASKS.RETRIEVED_TASKS);
  res.json({
    tasks: Array.from(finished),
    total: TOTAL,
    all: all.join(", "),
    nonFinished,
  });
});

router.get("/status", (req, res) => {
  const status = {};
  for (const [id, name] of users.entries()) {
    const finished = finishedTasks.get(id) || new Set();
    status[name] = { finished: finished.size, total: TOTAL };
  }
  res.json({ status });
});

module.exports = router;
