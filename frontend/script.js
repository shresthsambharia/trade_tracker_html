const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("./User");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/tradeapp")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

const SECRET = "TRADE_SECRET_KEY";

/* ================= AUTH ================= */
function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send("No token");

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);

    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).send("Unauthorized");
  }
}

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email: email.toLowerCase(),
      password: hash
    });

    res.json({ message: "Registered successfully ✅" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      username: user.username,
      portfolio: user.portfolio
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOAD ================= */
app.get("/load", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json({
    username: user.username,
    balance: user.portfolio.balance,
    holdings: user.portfolio.holdings
  });
});

/* ================= SAVE ================= */
app.post("/save", auth, async (req, res) => {
  await User.updateOne(
    { _id: req.userId },
    { $set: { portfolio: req.body } }
  );

  res.json({ message: "Saved ✅" });
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
