const {response, query} = require('express')
const { pool } = require('../../database/connection')
const cloudinary = require('cloudinary').v2;

const CreateProduct = async (req, res = response) => {
    const { code, name, brand, supplier_reference, description, price, fecha, quantity,type,ID } = req.body;

    try {
        if(type =="insert"){
                // Check if images are provided
                if (!req.files || req.files.length === 0) {
                    return res.status(400).json({ ok: false, msg: 'Las imágenes son obligatorias' });
                }

                // Data to insert into `Products`
                const productData = {
                    Code: code,
                    Name: name,
                    Brand: brand,
                    Supplier_reference: supplier_reference,
                    Description: description,
                    Price: price,
                    Fecha: fecha,
                    Quantity: quantity
                };

                // Insert product data and retrieve its ID
                const productInsertResult = await pool.query('INSERT INTO Products SET ?', productData);
                const productId = productInsertResult.insertId;

                // Process each image for uploading and saving to the database
                const imageUrls = [];
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    const isMain = req.body.isMain[i]; // Indicates if this image is the main one

                    try {
                        // Upload image to Cloudinary
                        const uploadResult = await cloudinary.uploader.upload(file.path, {
                            folder: 'events',
                            use_filename: true,
                            unique_filename: false,
                            overwrite: true,
                        });

                        console.log('Imagen subida exitosamente:', uploadResult.secure_url);

                        // Prepare data for img_product table
                        const imageData = {
                            isMain,
                            id_product: productId,
                            img: uploadResult.secure_url,
                        };

                        // Insert image data into `img_product` table
                        await pool.query('INSERT INTO img_product SET ?', imageData);
                        imageUrls.push(uploadResult.secure_url);

                    } catch (error) {
                        console.error('Error al subir la imagen:', error);
                        return res.status(500).json({
                            ok: false,
                            msg: 'Error al subir una de las imágenes',
                        });
                    }
                }

                // Send success response with product and image data
                return res.status(201).json({
                    ok: true,
                    msg: 'Producto creado correctamente',
                    product: {
                        ...productData,
                        id: productId,
                        images: imageUrls,
                    },
         });
        }else if(type =="update"){
            if (!req.files || req.files.length === 0) {
                const productData = {
                    Code: code,
                    Name: name,
                    Brand: brand,
                    Supplier_reference: supplier_reference,
                    Description: description,
                    Price: price,
                    Fecha: fecha,
                    Quantity: quantity,
                };

                const result = await pool.query(
                    "UPDATE Products SET ? WHERE ID = ?",
                    [productData, ID]
                );
            
                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        ok: false,
                        msg: `No se encontró un producto con el ID ${ID}`,
                    });
                }

                if(Array.isArray(req.body.url)){
                    for (let i = 0; i < req.body.url.length; i++) {
                        const file = req.body.url[i];
                        const isMain = req.body.isMain[i]; // Indica si esta imagen es la principal
    
                        try {
                            // Actualiza la fila si existe
                            const result = await pool.query(
                                "UPDATE img_product SET isMain = ? WHERE id_product = ? AND img = ?",
                                [isMain, ID, file]
                            );
                    
                    
                            if (result.affectedRows === 0) {
                                return res.status(404).json({
                                    ok: false,
                                    msg: `No se encontró una imagen con el nombre ${file}`,
                                });
                            }
                        } catch (error) {
                            console.error('Error al actualizar la imagen:', error);
                            return res.status(500).json({
                                ok: false,
                                msg: `Error al actualizar la imagen ${file}`,
                            });
                        }
                    }
                }else{
                    try {

                        const productData = {
                            Code: code,
                            Name: name,
                            Brand: brand,
                            Supplier_reference: supplier_reference,
                            Description: description,
                            Price: price,
                            Fecha: fecha,
                            Quantity: quantity,
                        };
        
                        const result = await pool.query(
                            "UPDATE Products SET ? WHERE ID = ?",
                            [productData, ID]
                        );

                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                ok: false,
                                msg: `No se encontró un producto con el ID ${ID}`,
                            });
                        }
    
                        const deleImg = await pool.query(
                            "DELETE FROM img_product WHERE id_product = ?",[ID]
                        );
                        if (deleImg.affectedRows === 0) {
                            return res.status(404).json({
                                ok: false,
                                msg: `No se encontró una imagen con el nombre ${file}`,
                            });
                        }

                        const file = req.body.url;
                        const isMain = req.body.isMain[0];
            
                        const newImage = {
                            img: file,
                            isMain: isMain,
                            id_product: ID
                        };
                        await pool.query("INSERT INTO img_product SET ?", [newImage]);
                        
                    } catch (error) {
                        return res.status(401).json({
                            ok:false
                        })
                        
                    }

                }

            }else{

                const productData = {
                    Code: code,
                    Name: name,
                    Brand: brand,
                    Supplier_reference: supplier_reference,
                    Description: description,
                    Price: price,
                    Fecha: fecha,
                    Quantity: quantity,
                };

                const result = await pool.query(
                    "UPDATE Products SET ? WHERE ID = ?",
                    [productData, ID]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        ok: false,
                        msg: `No se encontró un producto con el ID ${ID}`,
                    });
                }

                const imageUrls = [];

                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    const isMain = req.body.isMain[i]; // Indicates if this image is the main one

                    console.log(isMain)
                    try {   
                        // Upload image to Cloudinary
                        const uploadResult = await cloudinary.uploader.upload(file.path, {
                            folder: 'events',
                            use_filename: true,
                            unique_filename: false,
                            overwrite: true,
                        });

                        console.log('Imagen subida exitosamente:', uploadResult.secure_url);

                        // Prepare data for img_product table
                        const imageData = {
                            isMain,
                            id_product: ID,
                            img: uploadResult.secure_url,
                        };

                        // Insert image data into `img_product` table
                        await pool.query('INSERT INTO img_product SET ?', imageData);
                        imageUrls.push(uploadResult.secure_url);

                    } catch (error) {
                        console.error('Error al subir la imagen:', error);
                        return res.status(500).json({
                            ok: false,
                            msg: 'Error al subir una de las imágenes',
                        });
                    }
                }

                const rowsImg = await pool.query("SELECT * FROM `img_product` WHERE `id_product` = ?", [ID]);

                for (let i = 0; i < rowsImg.length; i++) {
                    const file = rowsImg[i]; // Cada fila completa del resultado
                    const isMain = req.body.isMain[i]; // Obtén el valor correspondiente de isMain
                
                    try {

                        const result = await pool.query(
                            "UPDATE img_product SET isMain = ? WHERE id_product = ? AND img = ?",
                            [isMain, ID, file.img] // Asegúrate de pasar file.img (la columna de la imagen)
                        );
                
                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                ok: false,
                                msg: `No se encontró una imagen con el nombre ${file.img}`,
                            });
                        }
                    } catch (error) {
                        console.error("Error al actualizar la imagen:", error);
                        return res.status(500).json({
                            ok: false,
                            msg: `Error al actualizar la imagen ${file.img}`,
                        });
                    }
                }
                 
            }
   
            return res.status(201).json({
                ok:true
            })
            
        }else{
            
            return res.status(401).json({
                ok:false
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor',
        });
    }
};


const DeleteProduct = async (req, res = response) => {  

    const {ID,user_id,record_id} = req.body

    let data ={
        isDelete:1
    }

    try {


    const product= await pool.query("SELECT * FROM `Products` WHERE ID = ?", [record_id]);

  
    if (product.length === 0) {
        return res.status(404).json({
            ok: false,
        });
    }

   

    // Verificar si el usuario existe
    const user = await pool.query("SELECT * FROM `usuarios` WHERE ID = ?", [user_id]);

    if (user.length === 0) {
        return res.status(404).json({
            ok: false,
        });
    }

    

    await pool.query('UPDATE Products SET ? WHERE ID = ?', [data, ID], async(err, result) => {
        if (err) {
            console.error('Error al actualizar el evento:', err);
            return res.status(401).json({
                ok: false,
                msg: 'Error al actualizar el evento',
            });
        } else {
            let date ={
                user_id,
                action:"DELETE",
                table_name:"Product",
                record_id,
                description:"Producto eliminado del inventario"
            }
            await pool.query('INSERT INTO history set ?', date, (err, result) => {
                if (err) {
                    console.error('Error al actualizar el evento:', err);
                    return res.status(401).json({
                        ok: false,
                        msg: 'Error al actualizar el evento',
                    });
                } else {
                    return res.status(200).json({
                        ok: true,
                        msg: 'Evento actualizado correctamente',
                    });
                }
            });
               
        }
    });
        
    } catch (error) {
        return res.status(401).json({
            ok:false
        })
    }

}


const GetProduct =async(req, res = response) =>{

    try {

        const query =  await  pool.query("SELECT  Products.ID, Products.Code, Products.Name,Products.Brand, Products.Supplier_reference,Products.Description,Products.Price,Products.Fecha, Products.Quantity, img_product.img  FROM  Products  INNER JOIN  img_product   ON  img_product.id_product = Products.ID WHERE  img_product.isMain = 'true' AND isDelete=0 ORDER BY ID ASC;")

        return res.status(201).json({
            query:query,
            ok:true
        })

    } catch (error) {
        return res.status(401).json({
            ok:false
        })
    }
}

const GetProductDelete =async(req, res = response) =>{

    try {

        const query =  await  pool.query("SELECT  history.action, usuarios.username, history.description, Products.ID, Products.Code, Products.Name,Products.Brand, Products.Supplier_reference,Products.Description,Products.Price,Products.Fecha, Products.Quantity, img_product.img FROM Products INNER JOIN img_product ON Products.ID = img_product.id_product INNER join history on history.record_id = Products.ID INNER JOIN usuarios on usuarios.ID = history.user_id WHERE img_product.isMain = 'true' AND isDelete=1;")

        return res.status(201).json({
            query:query,
            ok:true
        })

    } catch (error) {
        return res.status(401).json({
            ok:false
        })
    }
}

const GetProductDetail =async(req, res = response) =>{

    const {id} =req.params

    try {

        const [product] = await pool.query(
            `SELECT 
              Products.ID, 
              Products.Code, 
              Products.Name, 
              Products.Brand, 
              Products.Supplier_reference, 
              Products.Description, 
              Products.Price, 
              Products.Fecha, 
              Products.Quantity, 
              img_product.img 
            FROM Products 
            INNER JOIN img_product 
            ON Products.ID = img_product.id_product 
            WHERE img_product.isMain = 'true' AND Products.ID = ? AND isDelete=0 `,
            [id]
          );
          
          if (!product) {
            return res.status(404).json({
              ok: false,
              message: "Producto no encontrado.",
            });
          }

          const images = await pool.query(
            `SELECT img 
            FROM img_product 
            WHERE id_product = ?`,
            [id]
          );
        
        
          return res.status(200).json({
            ok: true,
            data: {
              ID: product.ID,
              Code: product.Code,
              Name: product.Name,
              Brand: product.Brand,
              SupplierReference: product.Supplier_reference,
              Description: product.Description,
              Price: product.Price,
              Date: product.Fecha,
              Quantity: product.Quantity,
              img: product.img,
              images: images.map((image) => image.img),
            },
            message: "Producto encontrado exitosamente.",
          });
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            ok:false
        })
    }
}

module.exports ={
    CreateProduct,
    GetProduct,
    GetProductDetail,
    DeleteProduct,
    GetProductDelete
}