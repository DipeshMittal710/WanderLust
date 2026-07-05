const Listing = require('../models/listing');
const User = require('../models/user');
const Booking = require('../models/booking');
const BlockedDate = require('../models/blockedDate');
const axios = require("axios");

module.exports.index = async (req, res) => {
    const {
        category,
        q,
        minPrice,
        maxPrice,
        guests,
        minRating,
        amenities,
        country,
        city
    } = req.query;

    const filter = {};

    if (category && category !== "All") {
        filter.category = category;
    }

    if (q) {
        filter.$or = [
            { title: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } },
            { country: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } }
        ];
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (guests) {
        filter.maxGuests = { $gte: Number(guests) };
    }

    if (country) {
        filter.country = { $regex: country, $options: "i" };
    }

    if (city) {
        filter.location = { $regex: city, $options: "i" };
    }

    let amenityList = [];
    if (amenities) {
        amenityList = Array.isArray(amenities) ? amenities : [amenities];
        filter.amenities = { $all: amenityList };
    }

    let listings = await Listing.find(filter).populate("reviews").populate("owner");

    if (minRating) {
        const minRatingNum = Number(minRating);
        listings = listings.filter(listing => {
            const reviews = listing.reviews || [];
            if (!reviews.length) return false;
            const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
            return avg >= minRatingNum;
        });
    }

    let savedListingIds = [];
    if (req.user) {
        const currentUser = await User.findById(req.user._id);
        savedListingIds = (currentUser.savedListings || []).map(id => id.toString());
    }

    res.render("listings/index.ejs", {
        listings,
        activeCategory: category || "All",
        searchQuery: q || "",
        savedListingIds,
        filters: {
            minPrice: minPrice || "",
            maxPrice: maxPrice || "",
            guests: guests || "",
            minRating: minRating || "",
            amenities: amenityList,
            country: country || "",
            city: city || ""
        }
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render('listings/new.ejs');
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Cannot find that listing!");
        return res.redirect("/listings");
    }

    const activeBookings = await Booking.find({
        listing: id,
        status: { $in: ["Pending", "Confirmed", "Completed"] }
    });

    const blockedDates = await BlockedDate.find({ listing: id }).sort({ startDate: 1 });

    let isSaved = false;
    if (req.user) {
        const currentUser = await User.findById(req.user._id);
        isSaved = (currentUser.savedListings || []).some(savedId => savedId.equals(id));
    }

    res.render("listings/show.ejs", {
        listing,
        mapToken: process.env.MAP_TOKEN,
        bookedRanges: activeBookings.map(b => ({ start: b.checkIn, end: b.checkOut })),
        blockedDates,
        isSaved
    });
};

module.exports.createListing = async (req, res) => {
    // upload.array() puts files on req.files (plural), not req.file
    if (!req.files || req.files.length === 0) {
        req.flash("error", "Please upload at least one listing photo.");
        return res.redirect("/listings/new");
    }

    const images = req.files.map(file => ({
        url: file.path,
        filename: file.filename
    }));

    const geoResponse = await axios.get(
        "https://api.geoapify.com/v1/geocode/search",
        {
            params: {
                text: req.body.listing.location,
                apiKey: process.env.GEOAPIFY_API_KEY
            }
        }
    );

    if (geoResponse.data.features.length === 0) {
        req.flash("error", "Location not found!");
        return res.redirect("/listings/new");
    }

    const coordinates =
        geoResponse.data.features[0].geometry.coordinates;

    // Checkbox groups arrive as a single string when only one box is
    // checked, and as an array when multiple are checked (or none at
    // all when none are checked) - normalize to an array either way.
    let amenities = req.body.listing.amenities || [];
    if (!Array.isArray(amenities)) {
        amenities = [amenities];
    }

    let houseRules = req.body.listing.houseRules || [];
    if (!Array.isArray(houseRules)) {
        houseRules = [houseRules];
    }

    const newListing = new Listing(req.body.listing);

    newListing.geometry = {
        type: "Point",
        coordinates: coordinates
    };

    newListing.images = images;
    newListing.image = images[0]; // keep the legacy single-image field filled in too
    newListing.amenities = amenities;
    newListing.houseRules = houseRules;
    newListing.maxGuests = Number(req.body.listing.maxGuests) || 2;
    newListing.owner = req.user._id;

    await newListing.save();

    req.flash("success", "Successfully made a new listing!");
    res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }

    let originalImageUrl = listing.image && listing.image.url ? listing.image.url : "";

    if (originalImageUrl) {
        originalImageUrl = originalImageUrl.replace(
            '/upload',
            '/upload/w_300'
        );
    }

    res.render("listings/edit.ejs", {
        listing,
        originalImageUrl
    });
};

module.exports.updateListing = async (req, res) => {

    let { id } = req.params;

    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }

    let amenities = req.body.listing.amenities || [];
    if (!Array.isArray(amenities)) {
        amenities = [amenities];
    }

    let houseRules = req.body.listing.houseRules || [];
    if (!Array.isArray(houseRules)) {
        houseRules = [houseRules];
    }

    Object.assign(listing, req.body.listing);
    listing.amenities = amenities;
    listing.houseRules = houseRules;
    listing.maxGuests = Number(req.body.listing.maxGuests) || listing.maxGuests || 2;

    // Uploading new photos on edit replaces the whole set, rather than
    // appending to it - keeps the mental model simple (same as the
    // original single-photo edit behavior) instead of needing per-photo
    // add/remove controls.
    if (req.files && req.files.length > 0) {
        const images = req.files.map(file => ({
            url: file.path,
            filename: file.filename
        }));

        listing.images = images;
        listing.image = images[0];
    }

    await listing.save();

    req.flash('success', 'Successfully updated the listing!');
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {

    let { id } = req.params;

    let deletedListing = await Listing.findByIdAndDelete(id);

    console.log(deletedListing);

    req.flash('success', 'Successfully deleted the listing!');

    res.redirect("/listings");
};

module.exports.toggleSave = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    const alreadySaved = (user.savedListings || []).some(listingId => listingId.equals(id));

    if (alreadySaved) {
        user.savedListings.pull(id);
    } else {
        user.savedListings.push(id);
    }

    await user.save();

    res.json({ saved: !alreadySaved });
};

module.exports.myWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: "savedListings",
        populate: [{ path: "reviews" }, { path: "owner" }]
    });

    res.render("listings/wishlist.ejs", {
        listings: user.savedListings || []
    });
};