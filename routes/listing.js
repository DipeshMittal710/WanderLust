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

// Wishlist - must come before "/:id" or "wishlist" would be read as an id
router.get("/wishlist",
    isLoggedIn,
    wrapAsync(listingController.myWishlist)
);

router.post("/:id/save",
    isLoggedIn,
    wrapAsync(listingController.toggleSave)
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