const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Dates a host manually blocks off (maintenance, personal use, etc.)
// without an actual guest booking behind them.
const blockedDateSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    reason: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model("BlockedDate", blockedDateSchema);