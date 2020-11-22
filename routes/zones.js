var express = require('express');
var router = express.Router();
var passport = require('passport');

const db = require('../models');

/* GET zones listing. */
router.get('/', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
	var zones = await db.zones.findAll({where: { user_id: req.user.id }, limit: 10 });
	res.status(200).json({ "status": "success", zones: zones });
});

router.get('/:id', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.zones.findOne({ where: { user_id: req.user.id, id: req.params.id }}).then(function(zone) {
		if(zone) {
			res.status(200).json({ "status": "success", zone: zone });	
		} else {
			res.status(200).json({ "status": "failure", "message": "Zone not found!!"});	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Zone not found!!"});	
	});
});

router.post('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.zones.create({ user_id: req.user.id, name: req.body.name, price: req.body.price, zipcode: req.body.zipcode, status: req.body.status }).then(function(zone) {
		res.json({"status": "success", "message": "Zone created successfully", zone: zone});
	}).catch(function(zoneError) {
		res.json({"status": "failure", "message": "Error occured!!"});
	});
});

router.put('/:id', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.zones.findOne({ where: {id: req.params.id }}).then(function(zone) {
		if(zone) {
			zone.update({ name: req.body.name, price: req.body.price, zipcode: req.body.zipcode, status: req.body.status }).then(function(zoneResult) {
				res.json({"status": "success", "message": "Zone updated successfully", zone: zoneResult });
			}).catch(function(zoneError) {
				res.json({"status": "failure", "message": "Error occured!!" });
			});
		} else {
			res.status(200).json({ "status": "failure", "message": "Zone not found!!" });	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Zone not found!!" });
	});	
});

router.delete('/:id', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.zones.findOne({ where: {user_id: req.user.id, id: req.params.id }}).then(function(zone) {
		if(zone) {
			zone.destroy().then(function() {
				res.json({ "status": "success", "message": "Zone deleted successfully" });
			}).catch(function(zoneError) {
				res.json({"status": "failure", "message": "Error occured!!" });
			});
		} else {
			res.status(200).json({ "status": "failure", "message": "Zone not found!!" });	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Zone not found!!" });
	});
});

module.exports = router;