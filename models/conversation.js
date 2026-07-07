const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },

    guest: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    host: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    messages: [
        {
            sender: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            body: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);