const jwt = require('jsonwebtoken')


const GenerarJwt=(uid,username)=>{

    return  new Promise((resolve,reject) =>{

        const payload = {uid,username}

        jwt.sign(payload,process.env.SECRETE_JWT_SEED,{
            expiresIn:"24h"
        },(error,token) =>{
            if(error){
                console.log(error)
                reject('no se puedo general el token')
            }

            resolve(token)
        })

    })

}

module.exports ={GenerarJwt}