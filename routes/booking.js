const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware");
const bookingController = require("../controllers/booking.js");

router.get("/my-bookings", isLoggedIn, wrapAsync(bookingController.myBookings));

router.post("/:id/book", isLoggedIn, wrapAsync(bookingController.createBooking));

router.post("/:id/bookings/:bookingId/approve", isLoggedIn, wrapAsync(bookingController.approveBooking));
router.post("/:id/bookings/:bookingId/reject", isLoggedIn, wrapAsync(bookingController.rejectBooking));

router.post("/:id/block", isLoggedIn, wrapAsync(bookingController.blockDates));
router.delete("/:id/block/:blockId", isLoggedIn, wrapAsync(bookingController.unblockDates));

module.exports = router;