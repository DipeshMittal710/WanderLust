const express = require("express");
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require("../middleware");

const Booking = require("../models/booking");
const Listing = require("../models/listing");

router.post("/:id/book", isLoggedIn, async (req, res) => {

    const listing = await Listing.findById(req.params.id);

    const checkIn = new Date(req.body.checkIn);
    const checkOut = new Date(req.body.checkOut);

    // Date Validation
    if (checkIn >= checkOut) {
        req.flash(
            "error",
            "Check-out date must be after check-in date."
        );

        return res.redirect(`/listings/${req.params.id}`);
    }

    // Double Booking Check
    const existingBooking = await Booking.findOne({
        listing: req.params.id,

        checkIn: {
            $lt: checkOut
        },

        checkOut: {
            $gt: checkIn
        }
    });

    if (existingBooking) {
        req.flash(
            "error",
            "These dates are already booked!"
        );

        return res.redirect(
            `/listings/${req.params.id}`
        );
    }

    const days = Math.ceil(
        (checkOut - checkIn) /
        (1000 * 60 * 60 * 24)
    );

    const totalPrice = days * listing.price;

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn,
        checkOut,
        guests: req.body.guests,
        totalPrice
    });

    await booking.save();

    req.flash(
        "success",
        "Booking confirmed!"
    );

    res.redirect(`/listings/${listing._id}`);
});

module.exports = router;