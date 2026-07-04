const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./reviews.js');

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String
    },
    images: [
        {
            url: String,
            filename: String
        }
    ],
    price: Number,
    location: String,
    country: String,
    maxGuests: {
        type: Number,
        min: 1,
        default: 2
    },
    amenities: [String],
    houseRules: [String],
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: false,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    category: {
        type: String,
        enum: [
            "Trending",
            "Rooms",
            "Iconic Cities",
            "Mountain",
            "Castles",
            "Arctic",
            "Camping",
            "Farms",
            "Amazing Pools",
            "Domes",
            "Boats"
        ],
        default: "Trending"
    },
});

listingSchema.post('findOneAndDelete', async listing => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } })
    }
});

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;