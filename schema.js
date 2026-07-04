const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),

        description: Joi.string().required(),

        location: Joi.string().required(),

        country: Joi.string().required(),

        price: Joi.number().required().min(0),

        category: Joi.string().valid(
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
        ).required(),

        // Not required: the edit form doesn't submit these yet, and this
        // schema is shared between create and update validation. Making
        // them required here would break editing existing listings.
        maxGuests: Joi.number().min(1),

        amenities: Joi.array().items(Joi.string()).single(),

        houseRules: Joi.array().items(Joi.string()).single(),

        image: Joi.object({
            url: Joi.string().allow("", null)
        }).default({})
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),

        comment: Joi.string().required(),
    }).required()
});

module.exports.replySchema = Joi.object({
    reply: Joi.object({
        text: Joi.string().required().min(1).max(500)
    }).required()
});