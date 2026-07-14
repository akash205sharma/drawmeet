const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =====================
// Register
// =====================

router.post("/register", async (req, res) => {
    try {

        const { username, email, password } = req.body;

        const existing = await User.findOne({
            $or: [
                { email },
                { username },
            ],
        });

        if (existing) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hash,
        });

        const token = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isGuest: user.isGuest,
            },
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server error",
        });
    }
});


// =====================
// Login
// =====================

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({
            email,
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const match = await bcrypt.compare(
            password,
            user.password
        );

        if (!match) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isGuest: user.isGuest,
            },
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server error",
        });
    }
});


// =====================
// Guest Login
// =====================

router.post("/guest", async (req, res) => {
  try {
    const guestName =
      "Guest-" +
      Math.floor(1000 + Math.random() * 9000);

    const guest = await User.create({
      username: guestName,
      email: `${guestName.toLowerCase()}-${Date.now()}@guest.drawmeet`,
      password: "guest",
      isGuest: true,
      expiresAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
    });

    const token = jwt.sign(
      {
        id: guest._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.json({
      token,

      user: {
        id: guest._id,
        username: guest.username,
        email: guest.email,
        isGuest: true,
      },

    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to create guest session",
    });
  }
});

// =====================
// Current Logged-in User
// =====================

router.get("/me", authMiddleware, async (req, res) => {

    try {

        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            isGuest: user.isGuest,
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server error",
        });
    }

});

module.exports = router;