const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getDB } = require("../config/db");

async function loginUser(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const db = getDB();
    const usersCollection = db.collection("login_details");

    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const tokenPayload = {
      userId: user._id,
      username: user.username,
      role: user.role,
      district: user.district,
      assignedPanchayats: user.assignedPanchayats || []
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        role: user.role,
        district: user.district,
        assignedPanchayats: user.assignedPanchayats || []
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error during login"
    });
  }
}

module.exports = { loginUser };