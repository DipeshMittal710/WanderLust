const Listing = require('../models/listing');
const axios = require("axios");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({}).populate("reviews").populate("owner");

    res.render('listings/index.ejs', {
        listings: allListings,
        activeCategory: "All"
    });
};

module.exports.filterByCategory = async (req, res) => {
    const { category } = req.params;

    const listings = await Listing.find({
        category: category
    }).populate("reviews").populate("owner");

    res.render("listings/index.ejs", {
        listings,
        activeCategory: category
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

    res.render("listings/show.ejs", {
        listing,
        mapToken: process.env.MAP_TOKEN
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

module.exports.searchListings = async (req, res) => {

    const q = req.query.q?.trim();

    if (!q) {
        return res.redirect("/listings");
    }

    const listings = await Listing.find({
        $or: [
            { title: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } },
            { country: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } }
        ]
    }).populate("reviews").populate("owner");

    res.render("listings/index.ejs", {
        listings,
        searchQuery: q,
        activeCategory: "All"
    });
};