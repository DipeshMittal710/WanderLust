const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        default: "",
        maxlength: 500
    },
    savedListings: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Listing'
        }
    ]
}, { timestamps: true });

userSchema.plugin(passportLocalMongoose.default || passportLocalMongoose);
module.exports = mongoose.model('User', userSchema);