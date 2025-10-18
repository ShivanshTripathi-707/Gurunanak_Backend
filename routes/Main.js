const express = require("express");
const mainRouter = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/User");
const complainModel = require("../models/Complains");
const enqModel = require("../models/Enquiry");
const notiModel = require("../models/Notifications");

// ====================================== GET ROUTES =================================
mainRouter.get("/", (req, res) => {
  res.send("hello from routes file");
});

// ✅ Get user profile (protected)
mainRouter.get("/profile", isLoggedIN, async (req, res) => {
  try {
    let loggedInUser = await userModel.findById(req.user.id);
    return res.json({ success: true, loggedInUser });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Something went wrong", success: false });
  }
});

// ✅ Authenticated check
// ✅ Authenticated check
mainRouter.get("/authenticated", isLoggedIN, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("email isVerified name");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        verified: user.isVerified,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Something went wrong", success: false });
  }
});


// ✅ Logout route
mainRouter.get("/logout", isLoggedIN, async (req, res) => {
  try {
    res.clearCookie("userToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.json({ success: true, message: "Logged Out Successfully!" });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Something went wrong", success: false });
  }
});

// ✅ Get all notifications
mainRouter.get("/allNotification", isLoggedIN, async (req, res) => {
  try {
    let allNotification = await notiModel.find();
    return res.json({ success: true, allNotification });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Something went wrong", success: false });
  }
});

// ===================================== POST ROUTES =====================================

// ✅ Signup route
mainRouter.post("/signUp", async (req, res) => {
  try {
    const { name, email, password, dateOfJoin, contact, alternateNumber, roomNumber, location, profileImage } = req.body;

    if (!name || !email || !password || !dateOfJoin || !contact || !location) {
      return res.json({ message: "Please fill all required fields", success: false });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ message: "Email already registered", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
      dateOfJoin,
      contact,
      alternateNumber,
      roomNumber,
      location,
      profileImage: profileImage || "",
      isVerified: false,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    return res.json({
      message: "Signup request submitted successfully. Please wait for admin verification.",
      success: true,
      token, 
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Something went wrong", success: false });
  }
});

// ✅ Login route
mainRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ message: "Please fill all required fields", success: false });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ message: "Invalid email or password", success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ message: "Invalid email or password", success: false });
    }

    if (!user.isVerified) {
      return res.json({ message: "Your account is not verified by admin", success: false });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Login successful",
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Something went wrong", success: false });
  }
});

// ✅ Submit complain
mainRouter.post("/complain", isLoggedIN, async (req, res) => {
  try {
    const { complain } = req.body;
    if (!complain) return res.json({ success: false, message: "Complain is required" });

    const newComplain = await complainModel.create({ complains: complain });

    const user = await userModel.findById(req.user.id);
    if (!user) return res.json({ success: false, message: "User not found" });

    user.complains.push(newComplain._id);
    await user.save();

    return res.json({ success: true, message: "Complain submitted successfully", newComplain });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Something went wrong", success: false });
  }
});

// ✅ Submit enquiry
mainRouter.post("/enquiry", async (req, res) => {
  try {
    const { name, email, contact, course, location, roomType } = req.body;

    if (!name || !email || !contact || !course) {
      return res.json({ success: false, message: "Please fill all required fields" });
    }

    await enqModel.create({
      name,
      email,
      contact,
      course,
      location: location || "",
      roomType: roomType || "double",
      status: "pending",
    });

    return res.json({
      success: true,
      message: "Enquiry submitted successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Something went wrong" });
  }
});

// ====================================== MIDDLEWARE =================================
function isLoggedIN(req, res, next) {
  try {
    const token = req.cookies.userToken;
    if (!token) {
      return res.json({ success: false, message: "Not authenticated" });
    }
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data;
    next();
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Something went wrong", success: false });
  }
}

module.exports = mainRouter;
