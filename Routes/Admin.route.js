const { CreateProduct, GetProduct, GetProductDetail, DeleteProduct, GetProductDelete } = require('../controller/admin/Products')
const router =require('express').Router()
var path = require('path')
const multer = require("multer");
const { ValidarCampos } = require('../middleweres/middleweres');
const { check } = require('express-validator');


var storage = multer.diskStorage({
  destination: function (req, file, callback) {
      callback(null, './public')
  },
  filename: function (req, file, callback) {
      callback(null, file.fieldname + Date.now() + path.extname(file.originalname))
  }
})

var uploads = multer({ storage: storage })

router.post("/inserProducts", uploads.array("image"),[
    check("type","es obligatorio").not().isEmpty(),
    check("code","es obligatorio").not().isEmpty(),
    check("name","es obligatorio").not().isEmpty(),
    check("brand","es obligatorio").not().isEmpty(),
    check("supplier_reference","es obligatorio").not().isEmpty(),
    check("description", "es obligatorio").not().isEmpty(),
    check("price", "es obligatorio").not().isEmpty(),
    check("fecha", "es obligatorio").not().isEmpty(), 
    check("quantity", "es obligatorio").not().isEmpty(),   
    ValidarCampos
], CreateProduct);

router.post("/deleteproduct",[
    check("ID","es obligatorio").not().isEmpty(),
    check("user_id","es obligatorio").not().isEmpty(),
    check("record_id","es obligatorio").not().isEmpty(),
    ValidarCampos
],  DeleteProduct);

router.get("/GetProduct",GetProduct)

router.get("/GetProductHistory",GetProductDelete)

router.get("/GetProductDetail/:id",GetProductDetail)

module.exports={router}