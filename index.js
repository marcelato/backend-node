const express = require("express");
const app = require("express")();
const http = require("http");
const cors = require("cors");
const server = http.createServer(app);
require("dotenv").config();
var path = require('path')
const AdminRoute = require("./Routes/Admin.route");
const UserRoute = require("./Routes/User.route");
const CartRoute = require("./Routes/Cart.route");
const bodyParser = require('body-parser');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.static('public'));
app.use(express.json());
app.use(cors())
app.use(bodyParser.json());

app.use("/api/admin", AdminRoute.router);
app.use("/api/user", UserRoute.router);
app.use("/api/cart", CartRoute.router);
app.use('/public', express.static(path.join(__dirname, 'public')));

server.listen(app.listen(process.env.PORT || 5000, () => {
    console.log("SERVER IS RUNNING");
}))
  