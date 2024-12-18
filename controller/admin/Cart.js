const {response, query} = require('express')
const { pool } = require('../../database/connection')
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const { Resend } =require("resend")

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const InsertCartProduct =async(req, res = response) =>{

    const  {Username,
            Lastname,
            ID_card,
            Phone,
            Email,
            total_amount,
            address,
            city,
            state,
            postalCode,
            cartItems,
            number,
            exp_month,
            exp_year,
            cvc,
            card_holder
            } = req.body

    let data ={
        Username,
        Lastname,
        ID_card,
        Phone,
        Email,
        address,
        city,
        state,
        postalCode,
    }

    try {
        let success = true;
        let completedQueries = 0;
        const totalQueries = cartItems.length;

        const dataCard =  {
            "number":`${number}` ,
            "exp_month":exp_month, 
            "exp_year": exp_year,  // Código de seguridad (como string de 3 o 4 dígitos)
            "cvc": cvc,
            "card_holder":card_holder
        }

        const responsejSON = await fetch(` https://api.wompi.co/v1/merchants/pub_prod_tmNOdaI3pG0gF032fGKVjuHUIEORMKR6`, {
            method: "GET",
            headers: { 'Content-type': 'application/json',
            'Authorization': `Bearer pub_prod_tmNOdaI3pG0gF032fGKVjuHUIEORMKR6` },
        });
    
        if (responsejSON.status === 401) {
        return res.status(401).json({ ok: false });
        }
    
        const dataJson= await responsejSON.json();
    
        if(!dataJson){
            return res.status(401).json({
                ok:false
            })
        }
        
        const response = await fetch(`https://api.wompi.co/v1/tokens/cards`, {
            method: "POST",
            headers: { 'Content-type': 'application/json',
            'Authorization': `Bearer pub_prod_tmNOdaI3pG0gF032fGKVjuHUIEORMKR6` },
            body:JSON.stringify(dataCard)
        });
    
        if (response.status === 401) {
            return res.status(401).json({ ok: false });
        }
           
        const productToken= await response.json();
    
        if(!productToken){
            return res.status(401).json({
                ok:false
            })
        }

        const acceptance_token = dataJson.data.presigned_acceptance.acceptance_token
        const ProductoToken = productToken.data.id

        let total = total_amount; // example value
        let amount_in_cents = total * 100; // add two zeros

        const cadenaConcatenada = `${ProductoToken}${amount_in_cents}COPprod_integrity_C58oWfgmGVQc8tj5KBiuOFTAEfndoVQ0`;
        const hash = crypto.createHash('sha256');
        hash.update(cadenaConcatenada);
        const hashHex = hash.digest('hex');

        const dataTransTions ={
            "public-key": "pub_prod_tmNOdaI3pG0gF032fGKVjuHUIEORMKR6",
            "amount_in_cents":amount_in_cents,
            "currency": "COP",
            "customer_email": Email,
            "signature":  hashHex,
            "redirect_url": "https://www.google.com" ,
            "reference":ProductoToken,
            "acceptance_token": acceptance_token,
                "payment_method": {
                    "type": "CARD",
                    "installments": 1, // Número de cuotas
                    "token":ProductoToken,
                    "payment_description":"tu pedido esta"
                }
        }
        const responseTranstion = await fetch(` https://api.wompi.co/v1/transactions`, {
        method: "POST",
        headers: { 'Content-type': 'application/json',
        'Authorization': `Bearer pub_prod_tmNOdaI3pG0gF032fGKVjuHUIEORMKR6` },
        body:JSON.stringify(dataTransTions)
    });

    if (responseTranstion.status === 422) {
        const messege= await responseTranstion.json();
        console.log(messege.error)
        return res.status(401).json({
             ok: false,
             msg:messege.error.messages });
    }

    const Trasntion= await responseTranstion.json();
   
    await delay(10000);

    const getTranstion = await fetch(` https://api.wompi.co/v1/transactions/${Trasntion.data.id}`, {
        method: "GET",
        headers: { 'Content-type': 'application/json',
        'Authorization': `Bearer pub_prod_tmNOdaI3pG0gF032fGKVjuHUIEORMKR6` },
    });

    const getValidTransation= await getTranstion.json();

    if(getValidTransation.data.status =="DECLINED"){

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
                    total_amount,
                    id_prod_card:getValidTransation.data.id
                }
                await pool.query('INSERT INTO orders set ?', order, async(err, customer) => {
                    if(err){
                        console.log(err)
                        return res.status(401).json({
                             ok:false,
                             msg:"error al insertar datos"
                        })
                     }else{
                        
                        const queryResultOrderById = await pool.query(
                            "SELECT MAX(ID) as max FROM orders"
                          );
                       
                        const orderbyided = queryResultOrderById[0].max;
                
                            cartItems.forEach( async(itemCart) => {
                                let orderItems ={
                                    order_id:orderbyided,
                                    product_id:itemCart.ID,
                                    quantity:itemCart.quantity,
                                    unit_price:itemCart.Price
                                }

                                await pool.query(
                                    'UPDATE Products SET Quantity = Quantity - ? WHERE ID = ?',
                                    [itemCart.quantity, itemCart.ID]
                                );
                                
                                pool.query("INSERT INTO order_items SET ?", orderItems, (insertError) => {
                                    if (insertError) {
                                        return res.status(401).json({
                                            ok:false,
                                            msg:"error al insertar datos"
                                        }) 
                                    }
                                    checkCompletion()
                                });
                            })
                     }
                })
             }
        })

       async function checkCompletion () {
            completedQueries++;
            if (completedQueries === totalQueries) {
                const queryResultOrderById = await pool.query(
                    "SELECT MAX(ID) as max FROM orders"
                );

                const orderbyid = queryResultOrderById[0].max;

                const resend = new Resend('re_Pkq5acSn_4gHATWbUCXBvxz5nfijJBypJ');


                const htmlContent = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Tu pedido fue entregado</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      background-color: #f9f9f9;
                      margin: 0;
                      padding: 0;
                    }
                    .container {
                      max-width: 600px;
                      margin: 20px auto;
                      background: #ffffff;
                      padding: 20px;
                      border: 1px solid #e0e0e0;
                      border-radius: 8px;
                    }
                    .title {
                      font-size: 24px;
                      font-weight: bold;
                      text-align: center;
                      margin-bottom: 20px;
                    }
                    .content {
                      font-size: 16px;
                      line-height: 1.5;
                      color: #333333;
                    }
                    .content strong {
                      font-weight: bold;
                    }
                    .footer {
                      margin-top: 20px;
                      font-size: 14px;
                      text-align: center;
                      color: #666666;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="title">¡Fue hecha una compra por la pagina web!</div>
                    <div class="content">
                      <p><strong>Número de pedido</strong><br>#8B9CCE67-${orderbyid}</p>
                    </div>
                    <div class="footer">
                      <p>Wolc cerraduras digitales</p>
                    </div>
                  </div>
                </body>
                </html>
                `;
        
                (async function () {
                    const { data, error } = await resend.emails.send({
                        from: 'Acme <onboarding@resend.dev>',
                        to: ['cerradurasdigitaleswolc@gmail.com'],
                        subject: 'hello world',
                        html: htmlContent,
                    });
                  
                    if (error) {
                      return console.log('Error al enviar el correo:', error);
                    }
                  
                    console.log('Correo enviado:', data);
                })();
                
                // Enviar la respuesta cuando todas las consultas terminen
                return res.status(success ? 200 : 500).json({
                    ok: success,
                    data: {
                        Email,
                        cartItems,
                        date:getValidTransation.data.created_at,
                        invonice:`8B9CCE67-${orderbyid}`,
                        total_amount
                    }
                });
            }
        }
    }else if(getValidTransation =="APPROVED"){

        const queryResult = await pool.query(
            "SELECT MAX(ID) as max FROM Customer"
          );
       
        const result = queryResult[0].max;
        const customerbyId = result
        
        await pool.query('INSERT INTO Customer set ?', data, async(err, customer) => {
            if(err){
                return res.status(401).json({
                     ok:false,
                     msg:"error al insertar datos"
                })
             }else{
              
                let order ={
                    customer_id:customerbyId,
                    total_amount,
                    id_prod_card:getValidTransation.data.id
                }
                await pool.query('INSERT INTO orders set ?', order, async(err, customer) => {
                    if(err){
                        console.log(err)
                        return res.status(401).json({
                             ok:false,
                             msg:"error al insertar datos"
                        })
                     }else{
                        const queryResultOrderById = await pool.query(
                            "SELECT MAX(ID) as max FROM orders");
                             const orderbyid = queryResultOrderById[0].max;
                            cartItems.forEach(itemCart => {
                                let orderItems ={
                                    order_id:orderbyid,
                                    product_id:itemCart.ID,
                                    quantity:itemCart.quantity,
                                    unit_price:itemCart.Price
                                }
                                pool.query("INSERT INTO order_items SET ?", orderItems, (insertError) => {
                                    if (insertError) {
                                        return res.status(401).json({
                                            ok:false,
                                            msg:"error al insertar datos"
                                        }) 
                                    }
                                    checkCompletion()
                            });
                        })
                     }
                })
             }
        })


        function checkCompletion() {
            completedQueries++;
            if (completedQueries === totalQueries) {
                return res.status(success ? 200 : 500).json({ ok: success });
            }
        }
    }
    
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            ok:false
        })
    }
}

const getOrderCart =  async(req, res = response) =>{

    try {

        const query =await pool.query("SELECT orders.ID, order_date,total_amount ,Customer.Username,Customer.Lastname FROM orders  INNER JOIN Customer on Customer.ID =  orders.customer_id ORDER by orders.ID DESC;")
        
        return res.status(201).json({
            ok:true,
            query
        })

    } catch (error) {

        return res.status(401).json({
            ok:false
        })
    
    }
}

const getOrderCartDetail=  async(req, res = response) =>{

    const {id} = req.params

    try {

        const index = id.lastIndexOf("-"); // Encuentra la posición del último guion
        const result = id.substring(index + 1); 
        const [customer] =await pool.query("SELECT  orders.status,  orders.ID,  orders.id_prod_card,Customer.address, Customer.Phone,Customer.Email,Customer.city,Customer.state,Customer.postalCode, order_date,total_amount ,Customer.Username,Customer.Lastname FROM orders  INNER JOIN Customer on Customer.ID =  orders.customer_id WHERE orders.ID = ?;",[result])

        const order =await pool.query('SELECT img_product.img, Products.Code,Products.Name,Products.Brand,Products.Supplier_reference,Products.Description,  order_items.quantity,order_items.unit_price  FROM order_items  INNER JOIN Products on Products.ID = order_items.product_id INNER JOIN orders on orders.ID = order_items.order_id INNER JOIN img_product on img_product.id_product = Products.ID  WHERE orders.ID =? and img_product.isMain="true"',[result])

        const getTranstion = await fetch(` https://api.wompi.co/v1/transactions/${customer.id_prod_card}`, {
            method: "GET",
            headers: { 'Content-type': 'application/json',
            'Authorization': `Bearer pub_prod_tmNOdaI3pG0gF032fGKVjuHUIEORMKR6` },
        });

        const getValidTransation= await getTranstion.json();

        const dataResp ={
            customer,
            order,
            transition:getValidTransation.data
        }

        return res.status(201).json({
            ok:true,
            dataResp
        })

    } catch (error) {
        console.log(error)
        return res.status(401).json({
            ok:false
        })
    }
}

const PostOrderCartDetailUpdate=  async(req, res = response) =>{

    const  {status,productId} = req.body
    
    try {

        let data = {
            status: status
        };

        console.log(status)

        pool.query(
            "UPDATE orders SET ? WHERE ID = ?", 
            [data, productId], 
            (updateError) => {
                if (updateError) {
                    return res.status(401).json({
                        ok: false,
                        msg: "Error al actualizar los datos"
                    });
                }
                return res.status(200).json({
                    ok: true,
                    msg: "Datos actualizados correctamente"
                });
            }
        );

    } catch (error) {
        return res.status(401).json({
            ok:false
        })
    }
}

module.exports ={
    InsertCartProduct,
    getOrderCart,
    getOrderCartDetail,
    PostOrderCartDetailUpdate
}