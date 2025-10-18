const express = require("express");
const adminRouter = express.Router();
const jwt = require("jsonwebtoken");
const userModel = require("../models/User");
const complainModel = require("../models/Complains")
const notiModel = require("../models/Notifications")

// ================================ GET ROUTES =============================

// ✅ Test route
adminRouter.get("/", (req, res) => {
  res.send("hello from admin file");
});

adminRouter.get("/logout", async (req, res) => {
  try {
    res.clearCookie("adminToken");
    return res.json({ success: true, message: "Logged Out Successfully!" })
  } catch (error) {
    console.log(error.message);
    return res.json({
      success: false,
      message: "Something went wrong on server side",
    });
  }
})

// ✅ Get all complaints (already existed)
adminRouter.get("/allComplains", async (req, res) => {
  try {
    // Get only users with at least one complaint
    let usersWithComplains = await userModel.find({ complains: { $exists: true, $ne: [] } })
      .populate({
        path: "complains",
        options: { sort: { createdAt: -1 } } // newest complaints first
      });

    return res.json({ success: true, usersWithComplains });
  } catch (error) {
    console.log(error.message);
    return res.json({
      success: false,
      message: "Something went wrong on server side",
    });
  }
});

// ✅ Mark a complaint as read
adminRouter.put("/markRead/:complainId", async (req, res) => {
  try {
    const { complainId } = req.params;

    const updatedComplain = await complainModel.findByIdAndUpdate(
      complainId,
      { isRead: true },
      { new: true }
    );

    if (!updatedComplain) {
      return res.json({ success: false, message: "Complain not found" });
    }

    return res.json({ success: true, message: "Complain marked as read", updatedComplain });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Failed to mark as read" });
  }
});

// ✅ Get all new users (unverified)
adminRouter.get("/newUsers", async (req, res) => {
  try {
    const users = await userModel.find({ isVerified: false });
    return res.json({ success: true, users });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Server error" });
  }
});

// ✅ Get all verified residents
adminRouter.get("/verifiedResidents", async (req, res) => {
  try {
    const residents = await userModel.find({ isVerified: true });
    return res.json({ success: true, residents });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Failed to fetch residents" });
  }
});

// ✅ Get a single resident by ID
adminRouter.get("/resident/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resident = await userModel.findById(id);
    if (!resident) {
      return res.json({ success: false, message: "Resident not found" });
    }
    return res.json({ success: true, resident });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Failed to fetch resident" });
  }
});


// 🗑️ Delete a resident
adminRouter.delete("/deleteResident/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await userModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.json({ success: false, message: "Resident not found" });
    }

    return res.json({ success: true, message: "Resident deleted successfully" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Failed to delete resident" });
  }
});


// ================================ POST ROUTES =============================

// ✅ Admin Login
adminRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.admin_email;
    const adminPass = process.env.admin_pass;

    if (email !== adminEmail || password !== adminPass) {
      return res.json({ success: false, message: "Incorrect email or password" });
    }

    const token = jwt.sign({ email: adminEmail }, process.env.JWT_SECRET_ADMIN, {
      expiresIn: "7d", // optional
    });

    // optional — if you still want to set the cookie for browsers that support it
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // ✅ return the token in the response too
    return res.json({
      success: true,
      message: "Admin Login Successful",
      token,
    });

  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Server error" });
  }
});


// new notification

adminRouter.post("/newNotification", async (req, res) => {
  try {
    const { notification } = req.body;
    if (!notification) return res.json({ success: false, message: "Notification text missing" });

    await notiModel.create({ notification });
    return res.json({ success: true, message: "Message Sent Successfully!" })
  } catch (error) {
    console.log(error.message);
    return res.json({
      success: false,
      message: "Something went wrong on server side",
    });
  }
});


// ================================ PUT ROUTES =============================

// ✅ Approve user
adminRouter.put("/approveUser/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "User approved successfully" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Failed to approve user" });
  }
});

// ✅ Update resident's security deposit and rent received
adminRouter.put("/resident/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { securityDeposit, rentRecieved } = req.body;

    if (!securityDeposit || !Array.isArray(rentRecieved)) {
      return res.json({
        success: false,
        message: "Security deposit and rent received months are required",
      });
    }

    const updatedResident = await userModel.findByIdAndUpdate(
      id,
      {
        securityDeposit,
        rentRecieved,
      },
      { new: true }
    );

    if (!updatedResident) {
      return res.json({ success: false, message: "Resident not found" });
    }

    return res.json({
      success: true,
      message: "Resident data updated successfully",
      updatedResident,
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Failed to update resident" });
  }
});


// ================================ DELETE ROUTES =============================

// ✅ Deny user (delete user from DB)
adminRouter.delete("/denyUser/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await userModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "User denied and deleted" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Failed to deny user" });
  }
});

module.exports = adminRouter;
