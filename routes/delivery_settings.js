var express = require('express');
var router = express.Router();
var passport = require('passport');
const Shopify = require('shopify-api-node');
// var moment = require('moment');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Kolkata');
const fs = require('fs');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

const db = require('../models');

router.post('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	const shopify = new Shopify({	
		shopName: req.user.shop_domain,
		apiKey: req.user.private_api_key,
		password: req.user.private_app_password
	});
	db.delivery_settings.findOne({where: {user_id: req.user.id}}).then(function(delivery_setting) {
		var slot_first_start_time = moment(req.body.slot_first_start_time, "hh:mm A").format('HH:mm:ss');
		var slot_first_end_time = moment(req.body.slot_first_end_time, "hh:mm A").format('HH:mm:ss');
		var slot_second_start_time = moment(req.body.slot_second_start_time, "hh:mm A").format('HH:mm:ss');
		var slot_second_end_time = moment(req.body.slot_second_end_time, "hh:mm A").format('HH:mm:ss');
		var slot_third_start_time = moment(req.body.slot_third_start_time, "hh:mm A").format('HH:mm:ss');
		var slot_third_end_time = moment(req.body.slot_third_end_time, "hh:mm A").format('HH:mm:ss');
		if(delivery_setting) {
			if(delivery_setting.shopify_carrier_service_id != '' || delivery_setting.shopify_carrier_service_id != null){
				shopify.carrierService.update(delivery_setting.shopify_carrier_service_id, {
				    "name": req.body.name,
				    "callback_url": config.liveApiUrl+"/api/deliverySettings/callback",
				    "service_discovery": true
				}).then(function(carrierService) {
					console.log("update carrier service on update", carrierService)
				});
			} else {
				shopify.carrierService.create({
				    "name": req.body.name,
				    "callback_url": config.liveApiUrl+"/api/deliverySettings/callback",
				    "service_discovery": true
				}).then(function(carrierService) {
					console.log("create carrier service on update", carrierService)
				})
			}
			delivery_setting.update({
				name: req.body.name,
				monday: req.body.monday,
				tuesday: req.body.tuesday,
				wednesday: req.body.wednesday,
				thursday: req.body.thursday,
				friday: req.body.friday,
				saturday: req.body.saturday,
				sunday: req.body.sunday,
				slot_first_start_time: slot_first_start_time,
				slot_first_end_time: slot_first_end_time,
				slot_first_buffer_time: req.body.slot_first_buffer_time,
				slot_first_status: req.body.slot_first_status,
				slot_second_start_time: slot_second_start_time,
				slot_second_end_time: slot_second_end_time,
				slot_second_buffer_time: req.body.slot_second_buffer_time,
				slot_second_status: req.body.slot_second_status,
				slot_third_start_time: slot_third_start_time,
				slot_third_end_time: slot_third_end_time,
				slot_third_buffer_time: req.body.slot_third_buffer_time,
				slot_third_status: req.body.slot_third_status 
			}).then(function(result) {
				res.status(200).json({"status": "success", "message": "Delivery setting updated successfully"})
			}).catch(function(error) {
				res.status(200).json({ "status": "failure", "message": "Error occured!!1" });
			});
		} else {
			
			shopify.carrierService.create({
			    "name": req.body.name,
			    "callback_url": config.liveApiUrl+"/api/deliverySettings/callback",
			    "service_discovery": false
			}).then(function(carrierService) {
				console.log(carrierService, "carrierService")
				db.delivery_settings.create({ 
					user_id: req.user.id,
					shopify_carrier_service_id: carrierService.id,
					name: req.body.name,
					monday: req.body.monday,
					tuesday: req.body.tuesday,
					wednesday: req.body.wednesday,
					thursday: req.body.thursday,
					friday: req.body.friday,
					saturday: req.body.saturday,
					sunday: req.body.sunday,
					slot_first_start_time: slot_first_start_time,
					slot_first_end_time: slot_first_end_time,
					slot_first_buffer_time: req.body.slot_first_buffer_time,
					slot_first_status: req.body.slot_first_status,
					slot_second_start_time: slot_second_start_time,
					slot_second_end_time: slot_second_end_time,
					slot_second_buffer_time: req.body.slot_second_buffer_time,
					slot_second_status: req.body.slot_second_status,
					slot_third_start_time: slot_third_start_time,
					slot_third_end_time: slot_third_end_time,
					slot_third_buffer_time: req.body.slot_third_buffer_time,
					slot_third_status: req.body.slot_third_status  
				}).then(function(result) {
					res.status(200).json({"status": "success", "message": "Delivery settings created successfully", delivery_setting: result});
				}).catch(function(error) {
					res.status(200).json({ "status": "failure", "message": "Error occured!!2" });
				});
			}).catch((err) => {
				console.log(err.response.body.errors)	
				res.json({"status": "failure", "message": err.response.body.errors});
			});
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Error occured!!3" });
	});
	
});

router.get('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.delivery_settings.findOne({ where: {user_id: req.user.id }}).then(function(deliverySetting) {
		if(deliverySetting) {
			deliverySetting.slot_first_start_time = moment(deliverySetting.slot_first_start_time, 'HH:mm:ss').format("hh:mm A");
			deliverySetting.slot_first_end_time = moment(deliverySetting.slot_first_end_time, 'HH:mm:ss').format("hh:mm A");
			deliverySetting.slot_second_start_time = moment(deliverySetting.slot_second_start_time, 'HH:mm:ss').format("hh:mm A");
			deliverySetting.slot_second_end_time = moment(deliverySetting.slot_second_end_time, 'HH:mm:ss').format("hh:mm A");
			deliverySetting.slot_third_start_time = moment(deliverySetting.slot_third_start_time, 'HH:mm:ss').format("hh:mm A");
			deliverySetting.slot_third_end_time = moment(deliverySetting.slot_third_end_time, 'HH:mm:ss').format("hh:mm A");
			res.status(200).json({ "status": "success", "delivery_settings": deliverySetting });
		} else {
			res.status(200).json({ "status": "failure", "message": "Delivery settings not found!!" });
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Delivery settings not found!!" });
	});
});

router.post('/callback', async function(req, res, next) {
	// console.log(req.headers)
	var shop_domain = req.headers['x-shopify-shop-domain'];
	var user = await db.users.findOne({where: {shop_domain: shop_domain}});
	var destinationPostCode = req.body.rate.destination.postal_code;
	var totalProductPrice = 0;
	var currentDateTime = moment();
	var todayDay = currentDateTime.format('dddd').toLowerCase();
	req.body.rate.items.forEach((eachItem, i) => {
		totalProductPrice = parseFloat(totalProductPrice) + (parseFloat(eachItem.price) * parseFloat(eachItem.quantity));
	});
	// console.log(todayDay, totalProductPrice, destinationPostCode);
	var deliverySetting = await db.delivery_settings.findOne({where: {user_id: user['id']}});
	if(deliverySetting[todayDay] == true) {
		var zones = await db.sequelize.query("SELECT * FROM `zones` WHERE user_id = "+user['id']+" AND FIND_IN_SET("+destinationPostCode+",zipcode)", { type: db.sequelize.QueryTypes.SELECT});
	  	if(zones && zones.length > 0) {
			var zonePrice = zones[0].price;
			var zoneSetting = await db.zone_settings.findOne({where: {user_id: user['id']}});
			if(zoneSetting && zoneSetting['status'] == true && ((totalProductPrice/100) >= zoneSetting['max_order_value'])) {
				res.status(200).json({"rates": [
					{
						"service_name": deliverySetting['dataValues'].name,
						"service_code": "pidgeudaan",
						"total_price": zoneSetting['fixed_rate']*100,
						"description": "Delivery in same day",
						"currency": req.body.rate.currency,
						"min_delivery_date": currentDateTime,
						"max_delivery_date": currentDateTime
					}
				]});
			} else {
				res.status(200).json({"rates": [
					{
						"service_name": deliverySetting['dataValues'].name,
						"service_code": "pidgeudaan",
						"total_price": zonePrice*100,
						"description": "Delivery in same day",
						"currency": req.body.rate.currency,
						"min_delivery_date": currentDateTime,
						"max_delivery_date": currentDateTime
					}
				]});
			}			
		} else {
			res.status(200).json({ "rates": []});
		}
	} else {
		res.status(200).json({ "rates": []});
	}
});

router.post('/shippingSlots', async function(req, res, next) {
	var shop = req.body.shop;
	var shopDetail = await db.users.findOne({where: {shop_domain: shop}});
	var deliverySetting = await db.delivery_settings.findOne({where: {user_id: shopDetail.id }});
  	var days = [];
  	var availableDates = [];
	for (var i = 0; i <= 6; i++) {
		// days.push(moment().add(i, 'days').format("dddd"));
		if(deliverySetting[moment().add(i, 'days').format('dddd').toLowerCase()] == true) {
			availableDates.push(moment().add(i, 'days').format("D-MM-YYYY"));
		}
	}
	//var availableDates = ["23-10-2020","24-10-2020","25-10-2020","26-10-2020","27-10-2020"];
	res.status(200).json({"status": "success", availableDates: availableDates });
});

router.post('/shippingSlotsTime', async function(req, res, next) {
	var selectedDate = req.body.selectedDate;
	var currentTime = moment().format('DD-MM-YYYY HH:mm:ss');
	var shop = req.body.shop;
	var shopDetail = await db.users.findOne({where: {shop_domain: shop}});
	var deliverySetting = await db.delivery_settings.findOne({where: {user_id: shopDetail.id }});
	var availableTimes = [];
	if(deliverySetting['slot_first_status']) {
		if((deliverySetting['slot_first_buffer_time'] != null) || deliverySetting['slot_first_buffer_time'] != 0) {
			var startTime = moment(selectedDate + ' ' + deliverySetting['slot_first_start_time'], "DD-MM-YYYY HH:mm:ss").subtract(deliverySetting['slot_first_buffer_time'], 'h');
			if(moment().isBefore(startTime)) {
				availableTimes.push(deliverySetting['slot_first_start_time'] + " to " + deliverySetting['slot_first_end_time']);
			}
		} else if(moment().isBefore(moment(selectedDate + ' ' + deliverySetting['slot_first_start_time'], "DD-MM-YYYY HH:mm:ss"))) {
			availableTimes.push(deliverySetting['slot_first_start_time'] + " to " + deliverySetting['slot_first_end_time']);
		}
	}
	if(deliverySetting['slot_second_status']) {
		if((deliverySetting['slot_second_buffer_time'] != null) || deliverySetting['slot_second_buffer_time'] != 0) {
			var startTime = moment(selectedDate + ' ' + deliverySetting['slot_second_start_time'], "DD-MM-YYYY HH:mm:ss").subtract(deliverySetting['slot_second_buffer_time'], 'h');
			if(moment().isBefore(startTime)) {
				availableTimes.push(deliverySetting['slot_second_start_time'] + " to " + deliverySetting['slot_second_end_time']);
			}
		} else if(moment().isBefore(moment(selectedDate + ' ' + deliverySetting['slot_second_start_time'], "DD-MM-YYYY HH:mm:ss"))) {
			availableTimes.push(deliverySetting['slot_second_start_time'] + " to " + deliverySetting['slot_second_end_time']);
		}
	}
	if(deliverySetting['slot_third_status']) {
		if((deliverySetting['slot_third_buffer_time'] != null) || deliverySetting['slot_third_buffer_time'] != 0) {
			var startTime = moment(selectedDate + ' ' + deliverySetting['slot_third_start_time'], "DD-MM-YYYY HH:mm:ss").subtract(deliverySetting['slot_third_buffer_time'], 'h');
			if(moment().isBefore(startTime)) {
				availableTimes.push(deliverySetting['slot_third_start_time'] + " to " + deliverySetting['slot_third_end_time']);
			}
		} else if(moment().isBefore(moment(selectedDate + ' ' + deliverySetting['slot_second_start_time'], "DD-MM-YYYY HH:mm:ss"))) {
			availableTimes.push(deliverySetting['slot_third_start_time'] + " to " + deliverySetting['slot_third_end_time']);
		}
	}
	// var availableTimes = ["09 AM to 12 PM", "12 PM to 04 PM", "04 PM to 06 PM"];
	res.status(200).json({"status": "success", availableTimes: availableTimes });
});

router.post('/remove', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	const shopify = new Shopify({	
		shopName: req.user.shop_domain,
		apiKey: req.user.private_api_key,
		password: req.user.private_app_password
	});
	shopify.carrierService.delete(req.body.id).then(function(carrierService) {
		res.json({"status": "success", "message": "successfully deleted!!"});
	}).catch(function(error) {
		res.json({"status": "failure", "message": "Error occured during deletion!!"});
	});
});

module.exports = router;