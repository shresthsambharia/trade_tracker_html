const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("./User");   // Make sure User.js is in same folder

const app = express();
app.use(cors());
app.use(express.json());

/* ========================= */
/* DATABASE CONNECTION */
/* ========================= */

mongoose.connect("mongodb://127.0.0.1:27017/tradeapp")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

const SECRET = "TRADE_SECRET_KEY";

/* ========================= */
/* AUTH MIDDLEWARE */
/* ========================= */

function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send("No token provided");

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);

    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).send("Unauthorized");
  }
}

/* ========================= */
/* REGISTER */
/* ========================= */

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & Password required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hash,
      portfolio: {
        balance: 100000,
        holdings: []
      }
    });

    res.json({ message: "✅ Registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ========================= */
/* LOGIN */
/* ========================= */

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
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
      portfolio: user.portfolio
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ========================= */
/* LOAD PORTFOLIO */
/* ========================= */

app.get("/load", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user.portfolio);
  } catch (err) {
    res.status(500).json({ message: "Failed to load portfolio" });
  }
});

/* ========================= */
/* SAVE PORTFOLIO */
/* ========================= */

app.post("/save", auth, async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.userId },
      { $set: { portfolio: req.body } }
    );

    res.json({ message: "Portfolio saved ✅" });

  } catch (err) {
    res.status(500).json({ message: "Failed to save portfolio" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server Running on http://localhost:3000");
});
