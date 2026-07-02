// const Booking = require("../models/booking");
// const Listing = require("../models/listing");

// module.exports.createBooking = async (req, res) => {
//     const listing = await Listing.findById(req.params.id);

//     if (!listing) {
//         req.flash("error", "Listing not found.");
//         return res.redirect("/listings");
//     }

//     const { checkIn: checkInRaw, checkOut: checkOutRaw, guests } = req.body;

//     if (!checkInRaw || !checkOutRaw) {
//         req.flash("error", "Please select both check-in and check-out dates.");
//         return res.redirect(`/listings/${req.params.id}`);
//     }

//     const checkIn = new Date(checkInRaw);
//     const checkOut = new Date(checkOutRaw);

//     if (isNaN(checkIn) || isNaN(checkOut)) {
//         req.flash("error", "Please enter valid dates.");
//         return res.redirect(`/listings/${req.params.id}`);
//     }

//     if (checkIn >= checkOut) {
//         req.flash("error", "Check-out date must be after check-in date.");
//         return res.redirect(`/listings/${req.params.id}`);
//     }

//     const existingBooking = await Booking.findOne({
//         listing: req.params.id,
//         checkIn: { $lt: checkOut },
//         checkOut: { $gt: checkIn }
//     });

//     if (existingBooking) {
//         req.flash("error", "These dates are already booked!");
//         return res.redirect(`/listings/${req.params.id}`);
//     }

//     const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
//     const totalPrice = days * listing.price;

//     const booking = new Booking({
//         listing: listing._id,
//         user: req.user._id,
//         checkIn,
//         checkOut,
//         guests: guests || 1,
//         totalPrice
//     });

//     await booking.save();

//     req.flash("success", `Booking confirmed! ${days} night${days > 1 ? "s" : ""} — total ₹${totalPrice}.`);
//     res.redirect(`/listings/${listing._id}`);
// };