const {response} = require('express')
const jwt = require('jsonwebtoken')


const ValidJWT =(request,response=response,next) =>{

    const token = request.header('x-token')

    if(!jwt){
        request.status(401).json({
            msg:"no hay token"
        })
    }

    try {
        const {uid,name} = jwt.verify(token,process.env.SECRETE_JWT_SEED)

        request.username=name,
        request.uid=uid

    } catch (error) {
        
        return response.status(401).json({
            ok:false,
            msg:"token no valido"
        })
    }

}

module.exports ={ValidJWT}


