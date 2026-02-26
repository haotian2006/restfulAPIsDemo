const express = require("express");

const votes = { yes: 0, no: 0 };
const votesByIp = new Map();

const namesByIp = new Map();

// forum posts storage: { ip, name, text, timestamp }
const posts = [];

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/", (req, res) => {
  const ip = req.ip;
  const prev = votesByIp.get(ip);
  const name = namesByIp.get(ip);

  const result = { yes: votes.yes, no: votes.no, name: name };
  if (prev) {
    result.voted = prev;
  }
  res.json(result);
});

router.post("/", (req, res) => {
  const vote = req.body.vote;
  const ip = req.ip;

  let name = namesByIp.get(ip);

  if (
    req.body.name &&
    typeof req.body.name === "string" &&
    req.body.name.trim()
  ) {
    name = req.body.name.trim();
    namesByIp.set(ip, name);
  }

  if (!name) {
    return res.status(400).json({ error: "name required" });
  }

  if (vote !== "yes" && vote !== "no") {
    return res.status(400).json({ error: "invalid vote" });
  }

  const previous = votesByIp.get(ip);
  if (previous) {
    if (previous === vote) {
      return res.json({ success: true });
    }
    votes[previous]--;
  }

  if (previous) {
    console.log(
      `User ${name} has changed their vote from ${previous} to ${vote} IP: ${ip}`,
    );
  } else {
    console.log(`User ${name} has voted: ${vote}. IP: ${ip}`);
  }

  votes[vote]++;
  votesByIp.set(ip, vote);
  res.json({ success: true });
});

router.post("/name", (req, res) => {
  const ip = req.ip;
  const name = req.body.name;
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "invalid name" });
  }
  namesByIp.set(ip, name.trim());
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
  const ip = req.ip;
  const text = req.body.text;
  const name = namesByIp.get(ip);

  if (!name) {
    return res.status(400).json({ error: "name required" });
  }

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "invalid text" });
  }

  posts.push({
    ip,
    name,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true });
});

module.exports = router;
