const Listing = require('../models/listing');
const Review = require('../models/reviews');

module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash('success', 'Successfully made a new review!');
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
    let {id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted the review!');
    res.redirect(`/listings/${id}`);
};

module.exports.replyToReview = async (req, res) => {
    let { id, reviewId } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash('error', 'Listing not found.');
        return res.redirect('/listings');
    }

    // Only the listing's owner can reply to reviews on it - not just
    // anyone logged in, and not even the review's own author.
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash('error', 'Only the host can reply to reviews on this listing.');
        return res.redirect(`/listings/${id}`);
    }

    const review = await Review.findById(reviewId);

    if (!review) {
        req.flash('error', 'Review not found.');
        return res.redirect(`/listings/${id}`);
    }

    review.hostReply = {
        text: req.body.reply.text,
        repliedAt: new Date()
    };

    await review.save();

    req.flash('success', 'Reply posted!');
    res.redirect(`/listings/${id}`);
};