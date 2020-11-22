var express = require('express');
var router = express.Router();
var passport = require('passport');
const jsonexport = require('jsonexport');
const Shopify = require('shopify-api-node');
// const { Parser, transforms: { unwind } } = require('json2csv');
const db = require('../models');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Kolkata');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const winston = require('winston')
const applogger = winston.createLogger({
	level: 'info',
	transports: [
	  new winston.transports.Console(),
	  new winston.transports.File({ filename: 'combined.log' })
	]
  });
/* GET orders listing. */
router.get('/syncOrders', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
	const shopify = new Shopify({	
		shopName: req.user.shop_domain,
		apiKey: req.user.private_api_key,
		password: req.user.private_app_password
	  });
  
	  (async () => {
		  let params = { limit: 250 };
		  do {
			const orders = await shopify.order.list(params);
			for(var i=0; i<orders.length; i++){
				var temp = {};
				temp.order_unique_id = orders[i].id;
				temp.name = orders[i].name;
				temp.user_id = req.user.id;
				temp.fulfillment_status = orders[i].fulfillment_status;
				temp.customer_name = orders[i].customer? orders[i].customer.first_name + ' ' + orders[i].customer.last_name : '';
				temp.customer_address = orders[i].customer && orders[i].customer.default_address ?orders[i].customer.default_address.address1 : '';
				temp.order_no =  orders[i].order_number;
				temp.order_status = orders[i].status ? orders[i].status : 'open';
				let found = 	await db.orders.findOne({where : {order_unique_id : orders[i].id, user_id : req.user.id}});
				if(!found){
				var saved_order = await db.orders.upsert(temp);
				saved_order = saved_order[0];
				}else{
					var saved_order = await found.update(temp);
				}
				for(var j=0; j<orders[i].line_items.length; j++){
					var prod = {};
					prod.order_productid = orders[i].line_items[j].id;
					prod.product_name = orders[i].line_items[j].title;
					prod.order_id = saved_order.id;
					let product_found = await db.order_products.findOne({where : {order_productid : orders[i].line_items[j].id, order_id: prod.order_id}});
					if(!product_found){
						var saved_product = await db.order_products.upsert(prod);
						}else{
							var saved_product = await product_found.update(prod);
						}
				}
			}

			// const  products = await db.products.findAll({limit : 250});
				
			params = orders.nextPageParameters;
		  } while (params !== undefined);
		  let user  = await db.users.findOne({where : {id : req.user.id}});
		  let obj = {orderSync :  true};
		   await  user.update(obj);
		  res.status(200).json({"status": "success",  message: "Sync Orders Done"})

		})().catch(console.error);
});

router.get('/getOrderSyncStatus', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
	const shopify = new Shopify({	
		shopName: req.user.shop_domain,
		apiKey: req.user.private_api_key,
		password: req.user.private_app_password
	  });
	  (async () => {
	  const shop_order_count = await shopify.order.count();
	  const db_order_count = await db.orders.count();
	  if(shop_order_count){
	  res.status(200).json({"status": "success",  shop_order_count, db_order_count})
	  }else{
		res.status(403).json({"status": "fail", "message" : "Shop Orders not found"})

	  }
	})().catch(console.error);
})

router.get('/list', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
	req.query.start = req.query.start || '';
	req.query.end = req.query.end || '';
	let startDate = new Date(req.query.start);
	let endDate = new Date(req.query.end + ' 06:29 pm');
	const orders = await db.orders.findAll({ where: { user_id: req.user.id, order_status: 'open',  created_at: {
        [Op.between]: [startDate, endDate]
    } }, include:['products']}).catch((error) => {
         	console.log(error)
         });
	if(orders && orders.length > 0){
		// orders.forEach((element,i) => {
		// 	if(typeof element.packages =='string'){
		// 		orders[i].packages = JSON.parse(element.packages);
		// 	}
		// });
		res.status(200).json({"status": "success", orders });
	} else {
		res.status(403).json({"status": "fail", "message" : "Orders not found" });
	}
});

// router.get('/orderFulfillCallback/:id', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
// 	const shopify = new Shopify({	
// 		shopName: req.user.shop_domain,
// 		apiKey: req.user.private_api_key,
// 		password: req.user.private_app_password
// 	  });
// 	let shop =  await  shopify.shop.get();
// 	let order  = await db.orders.findOne({where : {user_id: req.user.id, id: req.params.id}});
// 	if(order){
// 		try{
// 	 let updated =  await order.update({fulfillment_status : "fulfilled"});
// 	 let shop_order = await shopify.order.get(parseInt(order.shopify_order_id));
// 	 console.log(shop_order);
// 	 let fulfillment = await  shopify.fulfillment.create(shop_order.id,{
// 		"location_id" : shop.primary_location_id, 
// 		"tracking_number":  null,
// 		"line_items" :  shop_order.line_items
// 	});
// 	console.log(fulfillment);
//     }
// 	 catch(e) {
// 		res.status(403).json({ "status": "failure", "message": e });
// 	};
// 	//  

// 	}
// })


router.post('/conventJsonToCSV', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
	let data =  req.body;
	let new_arr = [];
	if(data && data.length) {
		const shopify = new Shopify({	
			shopName: req.user.shop_domain,
			apiKey: req.user.private_api_key,
			password: req.user.private_app_password
		});
		var shopLocation = null;
		if(req.user.primary_location_id != null) {
			shopLocation = await shopify.location.get(req.user.primary_location_id);	
		}
		
		for(var i=0;i<data.length;i++){
			let obj = {};
			obj['Pickup Name'] = (shopLocation != null) ? shopLocation.name : '';
			obj['Pickup Number'] = (shopLocation != null) ? shopLocation.phone : '';
			obj['Pickup Address'] = (shopLocation != null) ? shopLocation.address1 + ' ' + shopLocation.address2 + ' ' + shopLocation.city + ' ' + shopLocation.zip : ''; 
			obj['Pickup Address Coordinates'] = ''; 
			obj['Reference ID']  =  data[i].name;
			obj['Receiver Name'] = (data[i].shipping_address !=null) ? data[i].shipping_address.name : '';
			obj['Receiver Number'] = (data[i].shipping_address !=null) ? data[i].shipping_address.phone : '';
			obj['Receiver Address'] = (data[i].shipping_address !=null) ?  data[i].shipping_address.address1 + ' ' + data[i].shipping_address.address2 + ' ' + data[i].shipping_address.city + ' ' +data[i].shipping_address.zip : '';
			obj['Receiver Address Coordinates'] = (data[i].shipping_address !=null) ? data[i].shipping_address.latitude + ' ' + data[i].shipping_address.longitude : '';
			// obj['Receiver Name'] = data[i].customer_name;
			// obj['Receiver Number']  = data[i].customer_phone;
			// obj['Receiver Address']  = data[i].customer_address;
			// obj['Receiver Address Coordinates'] = data[i].customer_coordinates ? data[i].customer_coordinates.latitude + ', ' +  data[i].customer_coordinates.longitude : '';
			// applogger.info('CSV 2 console',i);
			data[i].packages = data[i].packages || [];
			var arrClass = data[i].packages;
			delete data[i].packages
			arrClass.forEach(function(ele,index){
				var keyName = ele.name;
				obj[keyName]= ele.quantity;
			});
			// applogger.info('CSV 3 console',i);
			
			obj['Cash to be Collected']  = data[i].financial_status && data[i].financial_status=='pending' ? data[i].price : 0;
			obj['Order Total']  = data[i].price;
			obj['Total Volume']  = data[i].total_volume;
			obj['Delivery Date']  = moment(data[i].delivery_date,'YYYY-MM-DD').format('DD/MM/YYYY');
			obj['Delivery Time']  = moment(data[i].delivery_date + ' ' + data[i].delivery_time, "YYYY-MM-DD HH:mm:ss").format('hh:mm a');
			new_arr.push(obj);
			// applogger.info('CSV 4 console',i);

		}
		jsonexport(new_arr,function(err, csv){
			if(err) {
			return	res.status(403).json({"status": "fail", "message" : err.message });
			};
			if(csv){
			res.status(200).json({"status": "success",csv });
			}else{
				res.status(403).json({"status": "fail", "message" : "Problem with converting to csv" });
			}
		});
	} else {
	  res.status(403).json({"status": "fail", "message" : "Please send the data to convert" });
	}
  });

// router.get('/getMyItem', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
// 	db.orders.findOne({where : {id : 12},include: 'products'} )
// 	.then((company) => {
// 	  // Get the Company with Users (employes) datas included
// 	  res.status(200).json({"status": "success",  company})
// 	  // Get the Users (employes) records only
// 	  // console.log(company.get().employes)
// 	})
// 	.catch((err) => {
// 	  console.log("Error while find company : ", err)
// 	});
// });

module.exports = router;
