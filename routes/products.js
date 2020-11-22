var express = require('express');
var router = express.Router();
var passport = require('passport');
const Shopify = require('shopify-api-node');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

/* GET orders listing. */
router.get('/syncProducts', passport.authenticate('jwt', { session: false }), async function(req, res, next) {

	const shopify = new Shopify({	
		shopName: req.user.shop_domain,
		apiKey: req.user.private_api_key,
		password: req.user.private_app_password
	  });
  
	  (async () => {
		
		  let params = { limit: 250 };
		  do {
			const products = await shopify.product.list(params);
			let new_arr = products.map( item => {
				var temp = Object.assign({}, item);
			    	temp.product_id = temp.id
				 temp.image = temp.image && temp.image.src? temp.image.src : `${config.liveApiUrl}/image/product-default.jpg`;
				return temp;
			})
			for(var i=0; i<new_arr.length; i++){
				let elem =  new_arr[i]
				for(var j=0; j<elem.variants.length;j++ ){
				let variant = elem.variants[j];
				var temp = {};
				temp.product_id = variant.product_id;
				temp.title = variant.title;
				temp.product_title = elem.title;
				temp.variant_id = variant.id
				temp.user_id = req.user.id;
				temp.product_status = (elem.published_at == null) ? 'inactive' : 'active';
				temp.image = variant.image? variant.image:( elem.image? elem.image :`${config.liveApiUrl}/image/product-default.jpg`);
				let found = 	await db.products.findOne({where : {variant_id : temp.variant_id, user_id : req.user.id}});
				if(!found){
				var saved_product = await db.products.upsert(temp);
				saved_product = saved_product[0];
				}else{
					var saved_product = await found.update(temp);
				}
			}
			}
			// let saveProducts = await db.products.bulkCreate(new_arr, 
			// 	{
			// 		fields:["product_id", "user_id", "title", "image"] ,
			// 		updateOnDuplicate: ["user_id", "title", "image"] 
			// 	} );
				// const  products = await db.products.findAll({limit : 250});
				
			params = products.nextPageParameters;
		  } while (params !== undefined);
		  let user  =  await db.users.findOne({where : {id : req.user.id}});
		  let obj = {productSync :  true};
		  await  user.update(obj);
		  res.status(200).json({"status": "success",  message: "Sync Products Done"})
		})().catch(console.error);

});

router.get('/getProductSyncStatus', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
	const shopify = new Shopify({	
		shopName: req.user.shop_domain,
		apiKey: req.user.private_api_key,
		password: req.user.private_app_password
	  });
	  (async () => {
	  const shop_product_count = await shopify.product.count();
	  const db_product_count = await db.products.count({where: {user_id: req.user.id }});
	  if(shop_product_count){
	  res.status(200).json({"status": "success",  shop_product_count, db_product_count});
	  }else{
		res.status(403).json({"status": "fail", "message" : "Shop Products not found"})

	  }
	})().catch(console.error);
})

router.get('/list', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
	const products = await db.products.findAll({where: {user_id: req.user.id, product_status: 'active' }});
	if(products && products.length){
		res.status(200).json({"status": "success", products });
	}else{
		res.status(403).json({"status": "fail", "message" : "Products not found" });
	}		
})


router.put('/setProductSize', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
	  let ids = req.body.ids;
	  let data = req.body;
	  data.status = 1;
	const updated = await db.products.update(data, { where: { user_id: req.user.id, id: {[Op.in]: ids} } });
	if(updated){
		let product = await db.products.findAll({ where: { user_id: req.user.id} })
	res.status(200).json({"status": "success", product });
	}else{
		res.status(403).json({"status": "fail", message : "Problem with product update" });
	}	
})
module.exports = router;