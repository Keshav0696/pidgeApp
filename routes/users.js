var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
var passport = require('passport');
var request = require('request');
const Shopify = require('shopify-api-node');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const nodemailer = require("nodemailer");
var sesTransport = require('nodemailer-ses-transport');
var transporter = nodemailer.createTransport(sesTransport({
  accessKeyId: config.smtp.access_key,
  secretAccessKey: config.smtp.access_secret,
  rateLimit: 5
}));

// var transporter = nodemailer.createTransport({
//     host: config.smtp.host,
//     port: config.smtp.port,
//     secure: config.smtp.secure, 
//     auth: {
//       user: config.smtp.user,
//       pass: config.smtp.pass,
//     }
// });

var TokenGenerator = require( 'token-generator' )({
    salt: config.tokengensalt,
    timestampMap: config.tokengentimestampmap,
});

const db = require('../models');

/* GET users listing. */
router.get('/', function(req, res, next) {
	db.users.findAll({ limit: 10 }).then(function(users) {
        res.json({ users: users });
    });
});

router.get('/', function(req, res, next) {
	db.users.findOne({ where: { id: req.params.id }}).then(function(user) {
		res.json({user: user});
	})
});

router.post('/register', function(req, res, next) {
	db.users.findOne({where: {shop_domain: req.body.shopDomain }}).then(function(user) {
		if(user) {
			res.status(200).json({"status": "failure", "message": "Domain already Registered!!"});
		} else {
			const shopify = new Shopify({
			  shopName: req.body.shopDomain,
			  apiKey: req.body.privateAppKey,
			  password: req.body.privateAppPassword
			});			
			shopify.shop.get({ limit: 5 }).then((shop) => {
				// console.log(shop)
				var token = TokenGenerator.generate();
				// CheckAppInstall(shop, req.body, token);
				transporter.sendMail({
					from: `${config.smtp.from_name} <${config.smtp.from_email}>`,
				    to: req.body.email,
				    subject: "Welcome Pidge!!",
				    // text: "Hello world",
				    html: "<b>Hello Merchant,</b><br>Welcome to the pidge. <br>Please set your password using below link. <br><a href='"+ config.liveUrl +"/reset-password/"+token+"'>Set Password</a>",
				}, function(error, info){
					if(error){
					  res.json({"status": "failure", "message": "Error occured during mail"});
					} else {
					  	db.users.create({ email: req.body.email, status : 1, store_id: shop.id, shop_name: shop.name, shop_url: shop.domain, shop_currency: shop.currency, primary_location_id: shop.primary_location_id, shop_domain: req.body.shopDomain, private_api_key: req.body.privateAppKey, private_app_password: req.body.privateAppPassword, password: 'amit@1234', generated_token: token }).then(function(user) {
							shopify.webhook.list().then((webhooks) => {
								if(webhooks.length > 0) {
									webhooks.forEach((eachWebhook, i) => {
										shopify.webhook.delete(eachWebhook.id).then(function() {
											console.log("webhook removed", eachWebhook.id);
										});
									});
								}
								// Added webhook for order create
								shopify.webhook.create({
								    "topic": "orders/create",
								    "address": config.liveApiUrl+"/webhooks/createOrder",
								    "format": "json"
							  	}).then((orderCreate) =>{
							  		console.log("Webhook order create")
							  	});
							  	// Added webhook for order updated
							  	shopify.webhook.create({
								    "topic": "orders/updated",
								    "address": config.liveApiUrl+"/webhooks/updateOrder",
								    "format": "json"
							  	}).then((orderUpdated) =>{
							  		console.log("Webhook order updated")
                                });
								shopify.webhook.create({
								    "topic": "orders/cancelled",
								    "address": config.liveApiUrl+"/webhooks/cancelOrder",
								    "format": "json"
							  	}).then((orderCancelled) =>{
							  		console.log("Webhook order cancelled")
							  	});
							  	// Added webhook for product create
							  	shopify.webhook.create({
								    "topic": "products/create",
								    "address": config.liveApiUrl+"/webhooks/createProduct",
								    "format": "json"
							  	}).then((productCreate) =>{
							  		console.log("Webhook product create")
							  	});
							  	// Added webhook for product update
							  	shopify.webhook.create({
								    "topic": "products/update",
								    "address": config.liveApiUrl+"/webhooks/updateProduct",
								    "format": "json"
							  	}).then((productUpdate) =>{
							  		console.log("Webhook product updated")
							  	});
							  	// Added webhook for product delete
								shopify.webhook.create({
								    "topic": "products/delete",
								    "address": config.liveApiUrl+"/webhooks/deleteProduct",
								    "format": "json"
							  	}).then((productDelete) =>{
							  		console.log("Webhook product delete")
							  	});
								  shopify.scriptTag.list().then((scripttags) => {
									scripttags.forEach((eachScriptTag) => {
										if(eachScriptTag) {
											shopify.scriptTag.delete(eachScriptTag.it).then(() => {
												console.log(eachScriptTag.id, "Deleted scriptTags");
											})
										}
									})
								}).catch((error) => {
									console.log("Error during delete of scriptTag");
								});
								// Add script tags
								shopify.scriptTag.create({
									"event": "onload",
							    	"src": "https://code.jquery.com/jquery-2.2.4.min.js"
								}).then((createdScript) => {
									console.log(createdScript);
								}).catch((error) => {
									console.log(error);
								});
								shopify.scriptTag.create({
									"event": "onload",
							    	"src": "https://code.jquery.com/ui/1.12.0/jquery-ui.js"
								}).then((createdScript) => {
									console.log(createdScript);
								}).catch((error) => {
									console.log(error);
								});
								shopify.scriptTag.create({
									"event": "onload",
							    	"src": config.liveApiUrl+"/abondendcartapp.js"
								}).then((createdScript) => {
									console.log("Successfully created script");
								}).catch((error) => {
									console.log("Error occured in adding script tag");
								});
							});
							res.json({"status": "success", "message": "Registered successfully and mail sent with set password link", user: user});
						}).catch(function(userError) {
							res.json({"status": "failure", "message": "Error occured!!"});
						});
					}
				});
			}).catch((err) => {
				// console.log(err.response.body.errors)
				res.json({"status": "failure", "message": "Private app credentials are not correct", err: err.response.body.errors})
			});
		}
	}).catch(function(error) {
		res.status(200).json({"status": "failure", "message": "Error occured!!"});
	});	
});


// async function CheckAppInstall(store, data, token){
// 	request.get(`https://uat-api.pidge.in/v1.0/shopify/shopify-client?store_id=${store.id}`, function(err,response){
// 		if(err){ 			
// 			return ;
// 		}
// 		else{
// 			response = JSON.parse(response.body);
// 			if(response.data && response.data.count > 0){
// 			return;
// 			} else{
// 				var add_client_url = "https://uat-api.pidge.in/v1.0/shopify/shopify-client";
// 				request.post(
// 				  add_client_url,
// 				  {
// 					json: {
// 						store_id: store.id,
// 						store_url: store.domain,
// 						customer_name: store.name,
// 						status:0,
// 						access_token: token
// 					}
// 				  },
// 				  (error, postResponse, body) => {
// 					if (error) { console.log("Here in if error of success");
// 					return;
// 					} else  if(postResponse){
// 					return;
// 					}
// 				  }
// 				)
// 			}
// 		}
// 	})
//    }



router.post('/login', async function(req, res, next) {
  const { email, password } = req.body;
  if (email && password) {
	var user = await db.users.findOne({ where: { email: req.body.email }});
    if (!user) {
      res.status(401).json({ status: "failure", message: 'No such user found', user });
    } else {
   		if (user.password === password) {
		
	      var payload = { id: user.id };
	      var token = jwt.sign(payload, 'thisisjwtsecret', {expiresIn: 86400 * 30});
		  user.dataValues.token = token;
	      res.status(200).json({ status: "success", user: user });
	    } else {
	      res.status(401).json({ status: "failure", message: 'Password is incorrect' });
	    } 	
    }
  }
});


router.get('/getDashBoardCounts/:id',  passport.authenticate('jwt', { session: false }),async function(req, res, next) { 
	      if(req.params.id){
			var product_count = await db.products.count({ where: { user_id: req.params.id }});
			var order_count = await db.orders.count({ where: { user_id: req.params.id}});
			res.status(200).json({ status: "success", product_count , order_count});
		  }else{
			return res.json({"status": "failure", "message": "Please Send User Id"});  
		  }
})
router.post('/forgot-password', function(req, res, next) {
	db.users.findOne({ where: { email: req.body.email }}).then(function(user) {
		if(user) {
			var token = TokenGenerator.generate();
			transporter.sendMail({
			    from:  `${config.smtp.from_name} <${config.smtp.from_email}>`,
			    to: req.body.email,
			    subject: "Reset Password!!",
			    text: "Please reset your password",
			    html: "<b>Hello,</b> <br>Please reset your password using below link. <br><a href='"+ config.liveUrl +"/reset-password/"+token+"'>Reset Password</a>",
			}, function(error, info){
				// console.log(error, info)
				if(error){
				  return res.json({"status": "failure", "message": "Error occured during mail"});
				} else {
					user.update({
				        generated_token: token
				    }).then(function(result) {
				    	return res.json({"status": "success", "message": "We have sent an email with a link where you can reset your password."});
				    });
				}
			});
		} else {
			return res.json({"status": "failure", "message": "User not found!!"});
		}
	}).catch(function(error) {
		res.json({"status": "failure", "message": "User not found!!" });
	});
});

router.post('/reset-password', function(req, res, next) {
	db.users.findOne({ where: { generated_token: req.body.generatedToken }}).then(function(user) {
		if(user) {
			user.update({
				password: req.body.newPassword
			}).then(function(result) {
				res.json({"status": "success", "message": "Password reset successfully"})
			});
		} else {
			res.json({"status": "failure", "message": "User not found!!" });	
		}
	}).catch(function(error) {
		res.json({"status": "failure", "message": "User not found!!" });
	});
});

router.get('/profile', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	res.json({"status": "failure", "message": "profile find!", "user": req.user });
});

router.get('/scriptTags', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	const shopify = new Shopify({	
		shopName: req.user.shop_domain,
		apiKey: req.user.private_api_key,
		password: req.user.private_app_password
	});
	shopify.scriptTag.list().then((scripttags) => {
		scripttags.forEach((eachScriptTag) => {
			if(eachScriptTag) {
				shopify.scriptTag.delete(eachScriptTag.it).then(() => {
					console.log(eachScriptTag.id, "Deleted scriptTags");
				})
			}
		})
	}).catch((error) => {

	});
	shopify.scriptTag.create({
		"event": "onload",
    	"src": "https://code.jquery.com/jquery-2.2.4.min.js"
	}).then((createdScript) => {
		console.log(createdScript);
	}).catch((error) => {
		console.log(error);
	});
	shopify.scriptTag.create({
		"event": "onload",
    	"src": "https://code.jquery.com/ui/1.12.0/jquery-ui.js"
	}).then((createdScript) => {
		console.log(createdScript);
	}).catch((error) => {
		console.log(error);
	});

	shopify.scriptTag.create({
		"event": "onload",
    	"src": config.liveApiUrl+"/abondendcartapp.js"
	}).then((createdScript) => {
		res.json({"status": "success", "message": "Successfully created script"});
	}).catch((error) => {
		res.json({"status": "failure", "message": "Error occured in adding script tag"});
	});
});

const getHostname = (url) => {
  // use URL constructor and return hostname
  return new URL(url).hostname;
  // return new URL(url).host;
}

module.exports = router;
