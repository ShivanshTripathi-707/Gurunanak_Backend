require("dotenv").config()
const express = require("express");
const app = express()
const cookieParser = require("cookie-parser");
const cors = require("cors");
const ConnectDB = require("./config/DB")

// middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
    origin : ["http://localhost:5173", "http://localhost:5174", "https://gurunanakadmin.netlify.app", "https://gurunanakpg.netlify.app"],
    credentials: true
}))
ConnectDB()

// api endpoints
app.get("/", (req, res) => {
    res.send("Hello from app file")
})
app.use("/api/user", require("./routes/Main"))
app.use("/api/admin", require("./routes/Admin"))

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`server started on the port ${port}`);
})