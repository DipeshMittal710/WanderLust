const Booking = require("../models/booking");
const Listing = require("../models/listing");
const BlockedDate = require("../models/blockedDate");

module.exports.myBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ checkIn: -1 });

    res.render("bookings/index.ejs", { bookings });
};

module.exports.createBooking = async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    const { checkIn: checkInRaw, checkOut: checkOutRaw, guests } = req.body;

    if (!checkInRaw || !checkOutRaw) {
        req.flash("error", "Please select both check-in and check-out dates.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    const checkIn = new Date(checkInRaw);
    const checkOut = new Date(checkOutRaw);

    if (isNaN(checkIn) || isNaN(checkOut)) {
        req.flash("error", "Please enter valid dates.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    if (checkIn >= checkOut) {
        req.flash("error", "Check-out date must be after check-in date.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    // Pending and Confirmed bookings both hold the dates, so two guests
    // can't end up with overlapping requests for the same nights.
    // Cancelled bookings free the dates back up.
    const existingBooking = await Booking.findOne({
        listing: req.params.id,
        status: { $in: ["Pending", "Confirmed", "Completed"] },
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn }
    });

    if (existingBooking) {
        req.flash("error", "These dates are already booked!");
        return res.redirect(`/listings/${req.params.id}`);
    }

    const blockedOverlap = await BlockedDate.findOne({
        listing: req.params.id,
        startDate: { $lt: checkOut },
        endDate: { $gt: checkIn }
    });

    if (blockedOverlap) {
        req.flash("error", "The host has blocked these dates.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Same formula as the price breakdown in public/js/script.js and the
    // "show total after taxes" toggle on listing cards - subtotal + 12%
    // service fee + 18% tax, kept identical in all three places.
    const subtotal = nights * listing.price;
    const serviceFee = Math.round(subtotal * 0.12);
    const taxes = Math.round(subtotal * 0.18);
    const totalPrice = subtotal + serviceFee + taxes;

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn,
        checkOut,
        guests: guests || 1,
        totalPrice,
        status: "Pending"
    });

    await booking.save();

    req.flash(
        "success",
        `Booking request sent for ${nights} night${nights > 1 ? "s" : ""} — total \u20B9${totalPrice.toLocaleString('en-IN')}. The host still needs to confirm it.`
    );
    res.redirect(`/listings/${listing._id}`);
};

const findOwnedListingOr404 = async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        res.redirect("/listings");
        return null;
    }

    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("error", "Only the host can do that.");
        res.redirect(`/listings/${req.params.id}`);
        return null;
    }

    return listing;
};

module.exports.approveBooking = async (req, res) => {
    const listing = await findOwnedListingOr404(req, res);
    if (!listing) return;

    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/dashboard");
    }

    const update = { status: "Confirmed" };

    const { adjustedTotal, adjustmentNote } = req.body;
    const newTotal = Number(adjustedTotal);

    // Only touches the price if a valid, non-empty number was actually
    // submitted - leaving the field untouched keeps the original total.
    if (adjustedTotal !== undefined && adjustedTotal !== "" && !isNaN(newTotal) && newTotal >= 0) {
        update.totalPrice = Math.round(newTotal);
    }

    if (typeof adjustmentNote === "string") {
        update.priceAdjustmentNote = adjustmentNote.trim();
    }

    await Booking.findByIdAndUpdate(req.params.bookingId, update);

    req.flash("success", "Booking confirmed.");
    res.redirect("/dashboard");
};

module.exports.rejectBooking = async (req, res) => {
    const listing = await findOwnedListingOr404(req, res);
    if (!listing) return;

    await Booking.findByIdAndUpdate(req.params.bookingId, { status: "Cancelled" });

    req.flash("success", "Booking declined.");
    res.redirect("/dashboard");
};

module.exports.blockDates = async (req, res) => {
    const listing = await findOwnedListingOr404(req, res);
    if (!listing) return;

    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
        req.flash("error", "Pick both a start and end date to block.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end) || start >= end) {
        req.flash("error", "That date range isn't valid.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    await BlockedDate.create({
        listing: listing._id,
        startDate: start,
        endDate: end,
        reason: reason || ""
    });

    req.flash("success", "Dates blocked.");
    res.redirect(`/listings/${req.params.id}`);
};

module.exports.unblockDates = async (req, res) => {
    const listing = await findOwnedListingOr404(req, res);
    if (!listing) return;

    await BlockedDate.findOneAndDelete({
        _id: req.params.blockId,
        listing: listing._id
    });

    req.flash("success", "Blocked dates removed.");
    res.redirect(`/listings/${req.params.id}`);
};