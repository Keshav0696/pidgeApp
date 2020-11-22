var express = require('express');
var router = express.Router();
var passport = require('passport');

const db = require('../models');

router.get('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.package_settings.findOne({ where: { user_id: req.user.id }}).then(function(package) {
		if(package) {
			res.status(200).json({ "status": "success", package: package });	
		} else {
			res.status(200).json({ "status": "failure", "message": "Package Setting not found!!"});	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Package Setting not found!!"});	
	});
});

router.post('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.package_settings.create({ user_id: req.user.id, package: req.body.package, value: req.body.packVal, status: req.body.status }).then(function(package) {
		res.json({"status": "success", "message": "Package Setting created successfully", package: package});
	}).catch(function(packageError) {
		res.json({"status": "failure", "message": "Error occured!!"});
	});
});

router.put('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.package_settings.findOne({ where: {user_id: req.user.id }}).then(function(package) {
		if(package) {
			package.update({ package: req.body.package, value: req.body.value, status: req.body.status }).then(function(packageResult) {
				res.json({"status": "success", "message": "Package Setting updated successfully", package: packageResult });
			}).catch(function(packageError) {
				res.json({"status": "failure", "message": "Error occured!!" });
			});
		} else {
			res.status(200).json({ "status": "failure", "message": "Package Setting not found!!" });	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Package Setting not found!!" });
	});	
});

module.exports = router;