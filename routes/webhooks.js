var express = require('express');
var router = express.Router();
var moment = require('moment');
var passport = require('passport');
const Shopify = require('shopify-api-node');
const fs = require('fs');
var moment = require('moment');
const request = require('request-promise');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = require('../models');

router.get('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	const shopify = new Shopify({	
		shopName: req.user.shop_domain,
		apiKey: req.user.private_api_key,
		password: req.user.private_app_password
	});
	shopify.webhook.list().then((webhooks) => {
		if(webhooks.length > 0) {
			res.status(200).json({"status": "success", "message": "webhooks are available", "webhooks": webhooks });
		} else {
			res.status(200).json({"status": "failure", "message": "webhooks not found!!"});
		}
	}).catch(function(error) {
		res.status(200).json({"status": "failure", "message": "webhooks not found!!"});
	});
});

router.post('/createProduct', async function(req, res, next) {
	// fs.writeFile('createProduct.txt', JSON.stringify(req.body), async (err) => {
	//     // throws an error, you could also catch it here
	//     if (err) throw err;
	// success case, the file was saved
 //    });
	var shop_domain = req.headers['x-shopify-shop-domain'];
    let user = await db.users.findOne({where : {shop_domain  : shop_domain}});
	var temp = {};
	var deleteVarients = await db.products.destroy({where: {product_id: req.body.id, user_id: user.id }});
	for(var i =0; i<req.body.variants.length;i++){
		let variant = req.body.variants[i];
		temp.product_id = req.body.id;
		if( req.body.image){
	       if(req.body.image.src){
			temp.image	=  req.body.image.src;
		   }else{
			temp.image	= `${config.liveApiUrl}/image/product-default.jpg`;
		   }
		}else{
			temp.image	= `${config.liveApiUrl}/image/product-default.jpg`
		}
		temp.product_title = req.body.title;
		temp.title = variant.title;
		temp.user_id = user.id;
		temp.variant_id =variant.id;
		temp.product_status = (req.body.published_at == null) ? 'inactive' : 'active';
		// temp.image = req.body.image;
		let found = 	await db.products.findOne({where : {variant_id : temp.variant_id, user_id : user.id}});
		if(!found){
			var saved_product = await db.products.upsert(temp);
	    	console.log('response saved!!');
		} else {
			var saved_product = await found.update(temp);
			console.log('response saved!!');
		}
	}
	res.status(200).json({"message": "OK"});
});

router.post('/updateProduct', async function(req, res, next) {
	// fs.writeFile('updateProduct.txt', JSON.stringify(req.body), async (err) => {
	//     // throws an error, you could also catch it here
	//     if (err) throw err;
	// success case, the file was saved
	// });
	var shop_domain = req.headers['x-shopify-shop-domain'];
	let user = await db.users.findOne({where : {shop_domain  : shop_domain}});
	var temp = {};
	var deleteVarients = await db.products.destroy({where: {product_id: req.body.id, user_id: user.id }});
	for(var i =0; i<req.body.variants.length;i++){
		let variant = req.body.variants[i];
		temp.product_id = req.body.id;
		if( req.body.image){
	       if(req.body.image.src){
			temp.image	=  req.body.image.src;
		   }else{
			temp.image	= `${config.liveApiUrl}/image/product-default.jpg`;
		   }
		}else{
			temp.image	= `${config.liveApiUrl}/image/product-default.jpg`
		}
		temp.product_title = req.body.title;
		temp.title = variant.title;
		temp.user_id = user.id;
		temp.variant_id =variant.id;
		temp.product_status = (req.body.published_at == null) ? 'inactive' : 'active';
		// temp.image = req.body.image;
		let found = 	await db.products.findOne({where : {variant_id : temp.variant_id, user_id : user.id}});
		if(!found){
			var saved_product = await db.products.upsert(temp);
	    	console.log('response updates!!');
		} else {
			var saved_product = await found.update(temp);
			console.log('response updated!!');
		}
	}
	res.status(200).json({"message": "OK"});
});


router.post('/deleteProduct', async function(req, res, next) {
	// fs.writeFile('deleteProduct.txt', JSON.stringify(req.body), async (err) => {
	//     // throws an error, you could also catch it here
	// 	if (err) throw err;
	// });
	var shop_domain = req.headers['x-shopify-shop-domain'];	
	let user = await db.users.findOne({where : {shop_domain  : shop_domain}});
    let removed = await db.products.destroy({where : {product_id : req.body.id, user_id : user.id}});
   	if(removed){
    	console.log('product removed!!');
   	} else {
    	console.log('problem in removing product!!');
   	}
	res.status(200).json({"message": "OK"});
});

router.post('/createOrder', async function(req, res, next) {
	// fs.writeFile('createOrder.txt', JSON.stringify(req.body), (err) => {
	//     // throws an error, you could also catch it here
	// 	if (err) throw err;
	// 	// success case, the file was saved
	//     console.log('response saved!!');
	// });
	(async ()=>{
	var shop_domain = req.headers['x-shopify-shop-domain'];
	var orderData = req.body;
	var deliveryDate = null;
	var deliveryTime = null;
	if(orderData.note != null) {
		var orderNote = orderData.note;
		var deliveryArr = orderNote.split(",");
		if(deliveryArr.length > 0) {
			var deliveryDateArr = deliveryArr[0].split(":");
			var deliveryTimeArr = deliveryArr[1].split(":");
			if(deliveryDateArr.length > 0) {
				deliveryDate = deliveryDateArr[1];
			}
			if(deliveryTimeArr.length > 0) {
				deliveryTime = deliveryTimeArr[1]+":"+deliveryTimeArr[2]+":"+deliveryTimeArr[2];
			}
		}	
	}
	var shippingLineTitle = (orderData.shipping_lines.length) > 0 ? orderData.shipping_lines[0].title : "";
	var userDetail = await db.users.findOne({where : {shop_domain  : shop_domain}});
	var deliverySettings = await db.delivery_settings.findOne({where: {user_id: userDetail.id}});
	var packageSettings = await db.package_settings.findOne({where: {user_id: userDetail.id}});
	var packageList = await db.packages.findAll({where: {user_id: userDetail.id }, order: [['volume', 'DESC']]});
	var deliverySettingsName = "";
	if(deliverySettings && deliverySettings.name != null) {
		deliverySettingsName = deliverySettings.name;
	}
	let packages = []; 
	if(shippingLineTitle.toLowerCase() == deliverySettingsName.toLowerCase()) {
		var orderTemp = {};
		var productTemp = {};
		orderTemp.shopify_order_id = orderData.id;
		orderTemp.name = orderData.name;
		orderTemp.user_id = userDetail.id;
		orderTemp.fulfillment_status = orderData.fulfillment_status;
		orderTemp.customer_name = orderData.customer ? orderData.customer.first_name + ' ' + orderData.customer.last_name : '';
		orderTemp.customer_address = orderData.customer && orderData.customer.default_address ? orderData.customer.default_address.address1 : '';
		orderTemp.order_no =  orderData.order_number;
		orderTemp.total_volume = 0;
		orderTemp.customer_phone =  orderData.customer ?  orderData.customer.phone : '';
		let coordinates =  {latitude : orderData.shipping_address.latitude, longitude : orderData.shipping_address.longitude }
		orderTemp.customer_coordinates = coordinates;
		orderTemp.price = parseInt(orderData.total_price);
		orderTemp.financial_status = orderData.financial_status
		orderTemp.packages = "";
		orderTemp.shipping_address = orderData.shipping_address;
		orderTemp.order_status = (orderData.cancelled_at == null) ? 'open' : 'cancelled';

		if(deliveryDate != null) {
			orderTemp.delivery_date = moment(deliveryDate, "DD-MM-YYYY").format("YYYY-MM-DD");
		}
		if(deliveryTime != null) {
			orderTemp.delivery_time = moment(deliveryTime, "HH:mm:ss").format("HH:mm:ss");
		}
		if(packageSettings){
			if(packageSettings.package ==2){
				packages = getPackagesBasedOnPrice(orderData, packageList);
				orderTemp.packages = packages;
			} 
		}
		
		for(var j=0; j<orderData.line_items.length; j++){
			let eachItem = orderData.line_items[j];
			var dbProduct = await db.products.findOne({where: {user_id: userDetail.id, product_id: eachItem.product_id }});
			if(dbProduct && dbProduct.dimensions != null){
				orderTemp.total_volume = parseInt(orderTemp.total_volume) + (eachItem.quantity * parseInt(dbProduct.dimensions));
			} else {
				if(packageList && packageList.length > 0) {
					orderTemp.total_volume = parseInt(orderTemp.total_volume) + (eachItem.quantity * parseInt(packageList[0].volume));
				}
			}
		}	
		if(packageSettings){
         	if(packageSettings.package ==3){
				packages = getPackagesBasedOnSize(orderTemp.total_volume, packageList);
                orderTemp.packages = packages;
			}
		}
		orderData.total_volume = orderTemp.total_volume;
		orderData.packages = orderTemp.packages;

		var orderFound = await db.orders.findOne({where : {shopify_order_id: orderData.id, user_id: userDetail.id }});
		var saved_order = null;
		var saved_product = null;
		if(orderFound) {
			saved_order = await orderFound.update(orderTemp);
		} else {
			saved_order = await db.orders.create(orderTemp);
		}
		for(var j=0; j<orderData.line_items.length; j++){
			var productTemp = {};
			let eachItem = orderData.line_items[j];
			productTemp.order_id = saved_order.id;
			productTemp.shopify_order_id = orderData.id;
			productTemp.shopify_product_id = eachItem.product_id;
			productTemp.variant_id = eachItem.variant_id;
			productTemp.quantity = eachItem.quantity;
			productTemp.product_name = eachItem.title;
			var productFound = await db.order_products.findOne({where: { order_id: saved_order.id, shopify_product_id: eachItem.product_id}});
			if(productFound) {
				saved_product = await productFound.update(productTemp);
			} else {
				saved_product = await db.order_products.create(productTemp);
			}
		}
    	// CreateOrderPidgeApi(orderData,packageList, userDetail, deliveryDate, deliveryTime);

	}
	res.status(200).json({"message": "OK"});
})().catch(console.error);
});

// router.get('/getoder/:id', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
//    let found = await db.orders.findOne({where : {id : req.params.id}});
//    if(found){
// 	   res.send(found)
//    }else{
// 	res.send("Not found")
//    }
// });

function getPackagesBasedOnPrice(orderData, packageList) {
	let packages = [];
	if (orderData.line_items.length && packageList.length) {
		let total_price = orderData.total_price;
		// orderData.line_items.reduce(function (tot, arr) {
		// 	return tot + parseInt(arr.price);
		// }, 0);
		packageList = packageList.sort((a, b) => parseInt(a.package_range) - parseInt(b.package_range));
		do {
			let package = packageList.find(e => total_price <= e.package_range);
			if (!package) {
				package = packageList[packageList.length - 1];
			}
			total_price -= package.package_range;
			let index = packages.findIndex(item => item.name == package.name);
			if (index > -1) {
				packages[index].quantity = packages[index].quantity + 1;
			} else {
				packages.push({ quantity: 1, name: package.name })
			}
		} while (total_price > 0)
       return packages;
	} else {
		return packages;
	}
}

function getPackagesBasedOnSize(volume, packageList) {
	let packages = [];
	if (packageList.length) {
		packageList = packageList.sort((a, b) => parseInt(a.volume) - parseInt(b.volume));
		// let total_volume = orderData.line_items.reduce(function (tot, arr) {
		// 	let found = products.find(e=> e.product_id==arr.product_id);
		// 	if(found){
		// 		return tot + (arr.quantity * (parseInt(found.dimensions)|| 0) );
		// 	}else{
        //       return tot;
		// 	}	
		// }, 0);
		// volume= total_volume;
		// if(!total_volume){
		// 	packages.push({ quantity: 1, name: packageList[packageList.length - 1].name });
		// 	return packages;
		// }
		do {
			let package = packageList.find(e => volume <= e.volume);
			if (!package) {
				package = packageList[packageList.length - 1];
			}
			volume -= package.volume;
			let index = packages.findIndex(item => item.name == package.name);
			if (index > -1) {
				packages[index].quantity = packages[index].quantity + 1;
			} else {
				packages.push({ quantity: 1, name: package.name })
			}
		} while (volume > 0)

       return packages
	} else {
		return packages;
	}
}

const mobile_slice=(value)=>{
	let mobile = '';
	if(value.charAt(0) == '+' || value.charAt(0)=='0'){
		mobile = value.replace(/[^a-zA-Z0-9+]/g, "").substr(3);
	}
	else {
		mobile = value.replace(/[^a-zA-Z0-9]/g, "");
	}
	return mobile
}

async function CreateOrderPidgeApi(orderData, packageList, userDetail, deliveryDate, deliveryTime){
	var fromPhone = "0000000000";
	(async ()=>{
	  var fromNameg = userDetail.shop_domain;
		var location = {};
		const shopify = new Shopify({	
			shopName: userDetail.shop_domain,
			apiKey: userDetail.private_api_key,
			password: userDetail.private_app_password
		});
	 if(userDetail.primary_location_id != null) {
		location = await shopify.location.get(userDetail.primary_location_id);	
	}
	deliveryDate =moment(deliveryDate, "DD-MM-YYYY").format("MM-DD-YYYY");
	location.name = fromNameg;
	 let fromAddressG = location;
	 if(fromAddressG.phone) {
		fromPhone = fromAddressG.phone;
	}
    let fromAddress = await createAddressForOrder(fromAddressG);
	let toAddress = await createAddressForOrder(orderData.shipping_address);
	var orderItems = [];
	for(var i=0; i<orderData.packages.length; i++){
		let item = orderData.packages[i];
		let package = packageList.find(e=> e.name ==item.name);
	var dimensionP = {
		"width": package.width,
		"height": package.height
		};
		var ordItm = {
			"dimension": dimensionP,
			"handling_instructions": "Please take care",
			"category": 7,
			"value_of_item": item.quantity,
			"label": item.name,
			"volume": package.volume
		};
		orderItems.push(ordItm);
	}
	let obj ={
		store_id : parseInt(userDetail.store_id),
		vendor_order_id : orderData.id,
		originator_details:{
			first_name:orderData.billing_address.first_name,
			last_name:orderData.billing_address.last_name,
			mobile:mobile_slice(orderData.billing_address.phone|| '9999256875')
		},
		sender_details:{
			name:fromAddressG.name,
			mobile:mobile_slice(fromPhone)
		},
		receiver_details:{
			name:orderData.shipping_address.first_name,
			mobile:mobile_slice(orderData.shipping_address.phone || '9999256875')
		},
		pickup_time: new Date(deliveryDate + ' ' + deliveryTime),
		drop_time: new Date(deliveryDate + ' ' + deliveryTime),
		"from_address": fromAddress,
		"to_address": toAddress,
		"all_packages": {
			"not_sending_illegal_items": true,
			"packages": orderItems
		}
	}
	request.post('https://uat-api.pidge.in/v1.0/shopify/order',{json:obj },(err,result)=>{
		if(err){ return;}
		else{ 	
			request.put('https://uat-api.pidge.in/v1.0/shopify/order/'+ orderData.id+ '/confirm',(err,response)=>{
			if(err){ return;}
			else{  return;}
		})}
	})
})().catch(console.error);
}





async function UpdateOrderPidgeApi(orderData,  userDetail){
	var fromPhone = "0000000000";
	(async ()=>{
	  var fromNameg = userDetail.shop_domain;
		var location = {};
		const shopify = new Shopify({	
			shopName: userDetail.shop_domain,
			apiKey: userDetail.private_api_key,
			password: userDetail.private_app_password
		});
	 if(userDetail.primary_location_id != null) {
		location = await shopify.location.get(userDetail.primary_location_id);	
	}
	 let fromAddressG = location;
	 if(fromAddressG.phone) {
		fromPhone = fromAddressG.phone;
	}
    let fromAddress = createAddressForOrder(fromAddressG);
	let toAddress = createAddressForOrder(orderData.shipping_address);

	request.put('https://uat-api.pidge.in/v1.0/shopify/order/'+orderData.shopify_order_id,{json: {
		"from_address": fromAddress,
		"to_address": toAddress,
	}},(err,result)=>{
		if(err){ console.log(err)}
		else{  console.log(result);}
	})
})().catch(console.error);
}
const getLatNLong = async (addressStr) => {
	return new Promise(function (fulfill, reject) {
		var returnval = {};
        var encodedAddress = encodeURI(addressStr);
		var addressUrl = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDnuP8NFB0fj7x9cMcseHFH2YcVI6nzg7o&address="+encodedAddress;
		request.get(addressUrl)
		.then((geoResponse) => {
			geoResponse = JSON.parse(geoResponse);
			if(geoResponse.status == "OK") {
				returnval.lat = geoResponse.results[0].geometry.location.lat;
				returnval.lng = geoResponse.results[0].geometry.location.lng;
				console.log(returnval);
				fulfill(returnval);
			} else {
				fulfill(returnval);
			}
			
		})
		.catch(e => {
			fulfill(returnval);
		});
    });
}
const createAddressForOrder =async (fromAddress) => {
	this.fromAddress = fromAddress;
	var self = this;
	return new Promise(async function (fulfill, reject) {
		/******************Billing Address**********************/
		//var firstName = fromAddress.first_name;
		//var lastName = fromAddress.last_name;
		/*console.log("*****Billing Address**");
		console.log(fromAddress);
		console.log("*****Billing Address**");*/
		var addressLine1 = self.fromAddress.address1;
		var addressLine2 = self.fromAddress.address2;
		var addressLine3 = '';
		if('address2' in self.fromAddress) {
			var addressLine3 = self.fromAddress.address3 || '';
		}
		var state = self.fromAddress.province_code;
		var pincode = self.fromAddress.zip;
		var city = self.fromAddress.city;
		var country = self.fromAddress.country_code;
		// var latitude = fromAddress.latitude||1;
		// var longitude = fromAddress.longitude||1;
		var addressString = addressLine1;
		if(addressLine2) {
			addressString = addressString + ", " + addressLine2;
		} else {
			addressLine2 = "N/A";
		}
		if(addressLine3) {
			addressString = addressString + ", " + addressLine3;
		}  else {
			addressLine3 = "N/A";
		}
		
		addressString = addressString + ", " + city + ", " + state + " " + pincode + ", " + country;
		let addr =  await getLatNLong(addressString);
		var fromAddress = {
			"address_line1": addressLine1,
			"address_line2": addressLine2,
			"landmark": addressLine3,
			"instructions_to_reach": "ANY",
			"google_maps_address": addressString,
			"exact_location": {
			  "latitude": addr.lat,
			  "longitude": addr.lng
			},
			"state": state,
			"pincode": 	isNaN(parseInt(pincode))?404 : parseInt(pincode) 
		};
		fulfill(fromAddress) ;
		/******************Billing Address**********************/
	});
}
router.post('/updateOrder', async function(req, res, next) {
	(async ()=>{
	var shop_domain = req.headers['x-shopify-shop-domain'];
	var orderData = req.body;
	var deliveryDate = null;
	var deliveryTime = null;
	if(orderData.note != null) {
		var orderNote = orderData.note;
		var deliveryArr = orderNote.split(",");
		if(deliveryArr.length > 0) {
			var deliveryDateArr = deliveryArr[0].split(":");
			var deliveryTimeArr = deliveryArr[1].split(":");
			if(deliveryDateArr.length > 0) {
				deliveryDate = deliveryDateArr[1];
			}
			if(deliveryTimeArr.length > 0) {
				deliveryTime = deliveryTimeArr[1]+":"+deliveryTimeArr[2]+":"+deliveryTimeArr[2];
			}
		}	
	}
	var shippingLineTitle = (orderData.shipping_lines.length) > 0 ? orderData.shipping_lines[0].title : "";
	var userDetail = await db.users.findOne({where : {shop_domain  : shop_domain}});
	var deliverySettings = await db.delivery_settings.findOne({where: {user_id: userDetail.id}});
	var packageSettings = await db.package_settings.findOne({where: {user_id: userDetail.id}});
	var packageList = await db.packages.findAll({where: {user_id: userDetail.id }, order: [['volume', 'DESC']]});
	var deliverySettingsName = "";
	if(deliverySettings && deliverySettings.name != null) {
		deliverySettingsName = deliverySettings.name;
	}
	let packages = []; 
	if(shippingLineTitle.toLowerCase() == deliverySettingsName.toLowerCase()) {
		var orderTemp = {};
		var productTemp = {};
		orderTemp.shopify_order_id = orderData.id;
		orderTemp.name = orderData.name;
		orderTemp.user_id = userDetail.id;
		orderTemp.fulfillment_status = orderData.fulfillment_status;
		orderTemp.customer_name = orderData.customer ? orderData.customer.first_name + ' ' + orderData.customer.last_name : '';
		orderTemp.customer_address = orderData.customer && orderData.customer.default_address ? orderData.customer.default_address.address1 : '';
		orderTemp.order_no =  orderData.order_number;
		orderTemp.total_volume = 0;
		orderTemp.customer_phone =  orderData.customer ?  orderData.customer.phone : '';
		let coordinates =  {latitude : orderData.shipping_address.latitude, longitude : orderData.shipping_address.longitude }
		orderTemp.customer_coordinates = coordinates;
		orderTemp.price = parseInt(orderData.total_price);
		orderTemp.financial_status = orderData.financial_status
		orderTemp.packages = "";
		orderTemp.shipping_address = orderData.shipping_address;
		orderTemp.order_status = (orderData.cancelled_at == null) ? 'open' : 'cancelled';
		if(deliveryDate != null) {
			orderTemp.delivery_date = moment(deliveryDate, "DD-MM-YYYY").format("YYYY-MM-DD");
		}
		if(deliveryTime != null) {
			orderTemp.delivery_time = moment(deliveryTime, "HH:mm:ss").format("HH:mm:ss");
		}
		if(packageSettings){
			if(packageSettings.package ==2){
				packages = getPackagesBasedOnPrice(orderData, packageList);
				orderTemp.packages = packages;
			} 
		}
		
		for(var j=0; j<orderData.line_items.length; j++){
			let eachItem = orderData.line_items[j];
			var dbProduct = await db.products.findOne({where: {user_id: userDetail.id, product_id: eachItem.product_id }});
			if(dbProduct && dbProduct.dimensions != null){
				orderTemp.total_volume = parseInt(orderTemp.total_volume) + (eachItem.quantity * parseInt(dbProduct.dimensions));
			} else {
				if(packageList && packageList.length > 0) {
					orderTemp.total_volume = parseInt(orderTemp.total_volume) + (eachItem.quantity * parseInt(packageList[0].volume));
				}
			}
		}

		if(packageSettings){
         	if(packageSettings.package ==3){
				packages = getPackagesBasedOnSize(orderTemp.total_volume, packageList);
                orderTemp.packages = packages;
			}
		}
		orderData.total_volume = orderTemp.total_volume;
		orderData.packages = orderTemp.packages;

		var orderFound = await db.orders.findOne({where : {shopify_order_id: orderData.id, user_id: userDetail.id }});
		var saved_order = null;
		var saved_product = null;
		if(orderFound) {
			saved_order = await orderFound.update(orderTemp);
		} else {
			saved_order = await db.orders.create(orderTemp);
		}
		for(var j=0; j<orderData.line_items.length; j++){
			var productTemp = {};
			let eachItem = orderData.line_items[j];
			productTemp.order_id = saved_order.id;
			productTemp.shopify_order_id = orderData.id;
			productTemp.shopify_product_id = eachItem.product_id;
			productTemp.variant_id = eachItem.variant_id;
			productTemp.quantity = eachItem.quantity;
			productTemp.product_name = eachItem.title;
			var productFound = await db.order_products.findOne({where: { order_id: saved_order.id, shopify_product_id: eachItem.product_id}});
			if(productFound) {
				saved_product = await productFound.update(productTemp);
			} else {
				saved_product = await db.order_products.create(productTemp);
			}
		}
    	// UpdateOrderPidgeApi(orderData,  userDetail);

	}
	res.status(200).json({"message": "OK"});
})().catch(console.error);

});


async function CancelOrderPidgeApi(orderData){
	(async ()=>{
		request.put('https://uat-api.pidge.in/v1.0/shopify/order/'+ orderData.id+'/cancel',(err,result)=>{
			if(err){ return;}
			else{  return;}
		})
	})().catch(console.error);
	}
	
	
	router.post('/cancelOrder', async function(req, res, next) {
		// fs.writeFile('deleteProduct.txt', JSON.stringify(req.body), async (err) => {
		//     // throws an error, you could also catch it here
		// 	if (err) throw err;
		// });
		var shop_domain = req.headers['x-shopify-shop-domain'];
		var orderData = req.body;
		var userDetail = await db.users.findOne({where : {shop_domain  : shop_domain}});
		var orderTemp = {};
		orderTemp.order_status = (orderData.cancelled_at == null) ? 'open' : 'cancelled';
		// CancelOrderPidgeApi(req.body);
		var orderFound = await db.orders.findOne({where : {shopify_order_id: orderData.id, user_id: userDetail.id }});
		var saved_order = null;
		if(orderFound) {
			saved_order = await orderFound.update(orderTemp);
		}
		res.status(200).json({"message": "OK"});
	});
	
module.exports = router;
