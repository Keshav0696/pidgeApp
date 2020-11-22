var express = require('express');
var router = express.Router();
var passport = require('passport');

const db = require('../models');

/* GET packages listing. */
router.get('/', passport.authenticate('jwt', { session: false }), async function(req, res, next) {
	var packages = await db.packages.findAll({ where: {user_id: req.user.id }, limit: 10 });
	res.status(200).json({ "status": "success", packages: packages });
});

router.get('/:id', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.packages.findOne({ where: { user_id: req.user.id, id: req.params.id }}).then(function(package) {
		if(package) {
			res.status(200).json({ "status": "success", package: package });	
		} else {
			res.status(200).json({ "status": "failure", "message": "Package not found!!"});	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Package not found!!"});	
	});
});

router.post('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.packages.create({ user_id: req.user.id, name: req.body.name, height: req.body.height, width: req.body.width, breadth: req.body.breadth, volume: req.body.volume , package_range: req.body.packageRange}).then(function(package) {
		res.json({"status": "success", "message": "Package created successfully", package: package});
	}).catch(function(packageError) {
		console.log(packageError)
		res.json({"status": "failure", "message": "Error occured!!"});
	});
});

router.put('/:id', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.packages.findOne({ where: {user_id: req.user.id, id: req.params.id }}).then(function(package) {
		if(package) {
			package.update({ name: req.body.editname, height: req.body.editheight, width: req.body.editwidth, breadth: req.body.editbreadth, volume: req.body.editvolume , package_range: req.body.editpackagerange}).then(function(packageResult) {
				res.json({"status": "success", "message": "Package updated successfully", package: packageResult });
			}).catch(function(packageError) {
				res.json({"status": "failure", "message": "Error occured!!" });
			});
		} else {
			res.status(200).json({ "status": "failure", "message": "Package not found!!" });	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Package not found!!" });
	});	
});

router.delete('/:id', passport.authenticate('jwt', { session: false }), function(req, res, next) {
	db.packages.findOne({ where: {user_id: req.user.id, id: req.params.id }}).then(function(package) {
		if(package) {
			package.destroy().then(function() {
				res.json({ "status": "success", "message": "Package deleted successfully" });
			}).catch(function(packageError) {
				res.json({"status": "failure", "message": "Error occured!!" });
			});
		} else {
			res.status(200).json({ "status": "failure", "message": "Package not found!!" });	
		}
	}).catch(function(error) {
		res.status(200).json({ "status": "failure", "message": "Package not found!!" });
	});
});
module.exports = router;