const router =require('express').Router()
const { LoginUser, CreateUsuario } = require('../controller/admin/User');
const { ValidarCampos } = require('../middleweres/middleweres');
const { check } = require('express-validator');

router.post("/register",[
    check("username","es obligatorio").not().isEmpty(),
    check("password","es obligatorio").not().isEmpty(),
    ValidarCampos
],CreateUsuario);

router.post("/login",[
    check("username","es obligatorio").not().isEmpty(),
    check("password","es obligatorio").not().isEmpty(),
    ValidarCampos
], LoginUser);

module.exports={router}