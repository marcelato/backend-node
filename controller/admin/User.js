const {response, query} = require('express')
const { GenerarJwt } = require('../../helper/JWT');
const bcryptjs = require('bcryptjs');
const { pool } = require('../../database/connection');

const LoginUser = async (req, res = response) => {
    const { username, password } = req.body;

    try {
        // Verificar si el usuario existe
        const rows = await pool.query("SELECT * FROM `usuarios` WHERE username = ?", [username]);

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: "Usuario o contraseña incorrectos"
            });
        }

        const user = rows[0]; // Obtenemos el usuario encontrado

        // Validar la contraseña
        const validPassword = bcryptjs.compareSync(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                ok: false,
                msg: "Usuario o contraseña incorrectos"
            });
        }

        // Generar el token JWT
        const token = await GenerarJwt(user.id, user.username);

        // Responder con éxito
        return res.status(200).json({
            ok: true,
            name: user.username,
            ID: user.ID,
            token
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: "Error al iniciar sesión"
        });
    }
};

const CreateUsuario = async (req, res = response) => {
    const { username, password } = req.body;
    
    try {
        // Consultar el usuario en la base de datos
        
        const rows = await pool.query("SELECT * FROM `usuarios` WHERE username = ?", [username]);

        if (rows.length > 0) {
            // Si el usuario existe
            return res.status(200).json({
                ok: true,
                msg: "El usuario ya existe en la base de datos"
            });
        }

        const salt = bcryptjs.genSaltSync();
        const hashedPassword = bcryptjs.hashSync(password, salt);

        let data ={
            username:username,
            password:hashedPassword
        }

        await pool.query('INSERT INTO usuarios set ?', data, async(err, customer) => {
            if(err){
                return res.status(401).json({
                     ok:false,
                     msg:"error al insertar datos"
                })
             }else{
                    // Obtener el ID del usuario recién creado
                    const queryResult = await pool.query(
                        "SELECT MAX(ID) as max FROM usuarios"
                      );
                    const result = queryResult[0].max;
                    const userId = result

                    // Generar el token JWT
                    const token = await GenerarJwt(userId, username);

                    // Responder con éxito
                    return res.status(201).json({
                        ok: true,
                        name: username,
                        token
                    });
             }
        })

    } catch (error) {
      
        return res.status(500).json({
            ok: false,
            msg: "Error al registrar"
        });
    }
};

module.exports = {
    CreateUsuario,
    LoginUser
};