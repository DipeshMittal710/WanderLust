const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware");
const bookingController = require("../controllers/booking.js");

router.get("/my-bookings", isLoggedIn, wrapAsync(bookingController.myBookings));

router.post("/:id/book", isLoggedIn, wrapAsync(bookingController.createBooking));

module.exports = router;