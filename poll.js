const express = require("express");
const crypto = require("crypto");

const votes = { yes: 0, no: 0 };
const votesByUserId = new Map();
const namesByUserId = new Map();

// forum posts storage: { userId, name, text, timestamp }
const posts = [];

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

function generateUserId() {
  return crypto.randomBytes(16).toString("hex");
}

function getUserId(req, res) {
  let userId = req.cookies?.poll_user_id;
  if (!userId) {
    userId = generateUserId();
    res.cookie("poll_user_id", userId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: false,
    });
  }
  return userId;
}

router.get("/", (req, res) => {
  const userId = getUserId(req, res);
  const prev = votesByUserId.get(userId);
  const name = namesByUserId.get(userId);

  const result = { yes: votes.yes, no: votes.no, name: name };
  if (prev) {
    result.voted = prev;
  }
  res.json(result);
});

router.post("/", (req, res) => {
  const vote = req.body.vote;
  const userId = getUserId(req, res);

  let name = namesByUserId.get(userId);

  if (
    req.body.name &&
    typeof req.body.name === "string" &&
    req.body.name.trim()
  ) {
    name = req.body.name.trim();
    namesByUserId.set(userId, name);
  }

  if (!name) {
    return res.status(400).json({ error: "name required" });
  }

  if (vote !== "yes" && vote !== "no") {
    return res.status(400).json({ error: "invalid vote" });
  }

  const previous = votesByUserId.get(userId);
  if (previous) {
    if (previous === vote) {
      return res.json({ success: true });
    }
    votes[previous]--;
  }

  if (previous) {
    console.log(
      `User ${name} has changed their vote from ${previous} to ${vote}`,
    );
  } else {
    console.log(`User ${name} has voted: ${vote}.`);
  }

  votes[vote]++;
  votesByUserId.set(userId, vote);
  res.json({ success: true });
});

router.post("/name", (req, res) => {
  const userId = getUserId(req, res);
  const name = req.body.name;
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "invalid name" });
  }
  namesByUserId.set(userId, name.trim());
  res.json({ success: true });
});

router.get("/form-posts", (req, res) => {
  const sanitized = posts.map((p) => ({
    name: p.name,
    text: p.text,
    timestamp: p.timestamp,
  }));
  res.json(sanitized);
});

router.post("/form-posts", (req, res) => {
  const userId = getUserId(req, res);
  const text = req.body.text;
  const name = namesByUserId.get(userId);

  if (!name) {
    return res.status(400).json({ error: "name required" });
  }

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "invalid text" });
  }

  posts.push({
    userId,
    name,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true });
});

module.exports = router;
