var express = require('express');
var router = express.Router();
var passport = require('passport');

const db = require('../models');

router.get('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.zone_settings.findOne({ where: { user_id: req.user.id }}).then(function(zoneSetting) {
		if(zoneSetting) {
			res.status(200).json({ "status": "success", zone: zoneSetting });	
		} else {
			res.status(200).json({ "status": "failure", "message": "Zone Setting not found!!"});	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Zone Setting not found!!"});	
	});
});

router.post('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.zone_settings.create({ user_id: req.user.id, max_order_value: req.body.max_order_value, fixed_rate: req.body.fixed_rate, status: req.body.status }).then(function(zone) {
		res.json({"status": "success", "message": "Zone Setting created successfully", zone: zone});
	}).catch(function(zoneError) {
		res.json({"status": "failure", "message": "Error occured!!"});
	});
});

router.put('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.zone_settings.findOne({ where: {user_id: req.user.id }}).then(function(zoneSetting) {
		if(zoneSetting) {
			zoneSetting.update({ max_order_value: req.body.max_order_value, fixed_rate: req.body.fixed_rate, status: req.body.status }).then(function(zoneResult) {
				res.json({"status": "success", "message": "Zone Setting updated successfully", zone: zoneResult });
			}).catch(function(zoneError) {
				res.json({"status": "failure", "message": "Error occured!!" });
			});
		} else {
			res.status(200).json({ "status": "failure", "message": "Zone Setting not found!!" });	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Zone Setting not found!!" });
	});	
});

module.exports = router;