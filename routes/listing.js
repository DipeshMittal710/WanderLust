const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const Listing = require('../models/listing.js');
const {isLoggedIn, isOwner, validateListing} = require('../middleware.js');
const listingController = require('../controllers/listings.js');
const multer  = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({storage});


router
.route("/")
.get(wrapAsync(listingController.index))
.post(
    isLoggedIn,
    upload.array('listing[image]', 6),
    validateListing,
    wrapAsync(listingController.createListing)
)

// New Route
router.get("/new", 
    isLoggedIn, 
    listingController.renderNewForm);

// Category Filter Route
router.get(
    "/category/:category",
    wrapAsync(listingController.filterByCategory)
);

router.get(
    "/search",
    wrapAsync(listingController.searchListings)
);

router
.route("/:id")
.get(wrapAsync(listingController.showListing)
)
.put(
    isLoggedIn,
    isOwner,
    upload.array('listing[image]', 6),
    validateListing,
    wrapAsync(listingController.updateListing)
)
.delete(isLoggedIn,
    isOwner, 
    wrapAsync(listingController.destroyListing)
);

//Edit Route
router.get("/:id/edit",
    isLoggedIn,
    isOwner, 
    wrapAsync(listingController.renderEditForm)
);


module.exports = router;