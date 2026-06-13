const Listing = require('../models/listing');
const axios = require("axios");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});


    res.render('listings/index.ejs', {
        listings: allListings
    });
};

module.exports.filterByCategory = async (req, res) => {
    const { category } = req.params;

    const listings = await Listing.find({
        category: category
    });

    res.render("listings/index.ejs", {
        listings
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

    let url = req.file.path;
    let filename = req.file.filename;

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

    const newListing = new Listing(req.body.listing);

    newListing.geometry = {
        type: "Point",
        coordinates: coordinates
    };

    newListing.image = {
        url,
        filename
    };

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

    let originalImageUrl = listing.image.url;

    originalImageUrl = originalImageUrl.replace(
        '/upload',
        '/upload/w_300'
    );

    res.render("listings/edit.ejs", {
        listing,
        originalImageUrl
    });
};

module.exports.updateListing = async (req, res) => {

    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true }
    );

    if (typeof req.file !== "undefined") {

        let url = req.file.path;
        let filename = req.file.filename;

        listing.image = {
            url,
            filename
        };

        await listing.save();
    }

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
    });

    res.render("listings/index.ejs", {
        listings
    });
};