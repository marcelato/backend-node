const router =require('express').Router()
const { InsertCartProduct, getOrderCart, getOrderCartDetail, PostOrderCartDetailUpdate } = require('../controller/admin/Cart');
const { ValidarCampos } = require('../middleweres/middleweres');
const { check } = require('express-validator');

router.post("/CartProduct",[
    check("Username","es obligatorio").not().isEmpty(),
    check("Lastname","es obligatorio").not().isEmpty(),
    check("ID_card","es obligatorio").not().isEmpty(),
    check("Phone","es obligatorio").not().isEmpty(),
    check("Email","es obligatorio").not().isEmpty(),
    ValidarCampos
],InsertCartProduct);

router.get("/OrderCart",getOrderCart);

router.get("/OrderCartDeatil/:id",getOrderCartDetail);

router.post("/OrderCartDeatilupdate",PostOrderCartDetailUpdate);

module.exports={router}