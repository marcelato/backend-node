const {response, query} = require('express')
const { pool } = require('../../database/connection')
const cloudinary = require('cloudinary').v2;

const InsertCartProduct =async(req, res = response) =>{

    const  {Username,Lastname,ID_card,Phone,Email,total_amount} = req.body

    let data ={
        Username,
        Lastname,
        ID_card,
        Phone,
        Email
    }


    try {

        await pool.query('INSERT INTO Customer set ?', data, async(err, customer) => {
            if(err){
                return res.status(401).json({
                     ok:false,
                     msg:"error al insertar datos"
                })
             }else{

                const queryResult = await pool.query(
                    "SELECT MAX(ID) as max FROM Customer"
                  );
                const result = queryResult[0].max;
                const customerbyId = result

                let order ={
                    customer_id:customerbyId,
                    total_amount
                }

                await pool.query('INSERT INTO orders set ?', order, async(err, customer) => {
                    if(err){
                        console.log(err)
                        return res.status(401).json({
                             ok:false,
                             msg:"error al insertar datos"
                        })
                     }else{
                           return res.status(201).json({
                            ok:true
                           })
                     }
                })
             }
        })
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            ok:false
        })
    }
}

module.exports ={
    InsertCartProduct
}