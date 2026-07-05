const Listing = require('../models/listing');
const Booking = require('../models/booking');

module.exports.renderDashboard = async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id }).populate("reviews");
    const listingIds = listings.map(l => l._id);

    const bookings = await Booking.find({ listing: { $in: listingIds } })
        .populate("listing")
        .populate("user")
        .sort({ checkIn: -1 });

    const earnings = bookings
        .filter(b => b.status === "Confirmed" || b.status === "Completed")
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const pendingBookings = bookings.filter(b => b.status === "Pending");

    const totalReviews = listings.reduce(
        (sum, l) => sum + (l.reviews ? l.reviews.length : 0),
        0
    );
    const ratingSum = listings.reduce((sum, l) => {
        const listingSum = (l.reviews || []).reduce((s, r) => s + (r.rating || 0), 0);
        return sum + listingSum;
    }, 0);
    const averageRating = totalReviews ? (ratingSum / totalReviews).toFixed(2) : null;

    res.render("dashboard/index.ejs", {
        totalListings: listings.length,
        totalBookings: bookings.length,
        earnings,
        pendingBookings,
        allBookings: bookings,
        totalReviews,
        averageRating
    });
};