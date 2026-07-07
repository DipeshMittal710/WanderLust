const User = require('../models/user.js');
const Listing = require('../models/listing.js');

module.exports.renderSignup = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async(req, res) => {
    try {
        let {username, email, password} = req.body;
    const newUser = new User({username, email});
    const registeredUser = await User.register(newUser, password);     
    console.log(registeredUser);
    req.login(registeredUser, err => {        
        if(err) {
            return next(err);
        }   
        req.flash("success", "Welcome to Wanderlust!");
    res.redirect('/listings');
    });
    
    } catch(e) {
        req.flash("error", e.message);
        res.redirect('/signup');
    }
};

module.exports.renderLogin = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async(req, res) => {
    req.flash("success", "Welcome back to Wanderlust, you are logged in!");
    let redirectUrl = res.locals.redirectUrl || '/listings';
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
    req.logout((err) => {
        if(err) {
            return next(err);
        }
        req.flash("success", "You have logged out!");
        res.redirect('/listings');
    });
};

module.exports.showProfile = async (req, res) => {
    const { id } = req.params;

    const host = await User.findById(id);

    if (!host) {
        req.flash("error", "That user could not be found.");
        return res.redirect("/listings");
    }

    const hostListings = await Listing.find({ owner: id }).populate("reviews");

    const isSelf = !!(req.user && req.user._id.equals(id));

    res.render("users/show.ejs", {
        host,
        hostListings,
        isSelf
    });
};

module.exports.renderEditProfile = async (req, res) => {
    const { id } = req.params;

    if (!req.user._id.equals(id)) {
        req.flash("error", "You can only edit your own profile.");
        return res.redirect(`/users/${id}`);
    }

    const host = await User.findById(id);

    if (!host) {
        req.flash("error", "That user could not be found.");
        return res.redirect("/listings");
    }

    res.render("users/edit.ejs", { host });
};

module.exports.updateProfile = async (req, res) => {
    const { id } = req.params;

    if (!req.user._id.equals(id)) {
        req.flash("error", "You can only edit your own profile.");
        return res.redirect(`/users/${id}`);
    }

    await User.findByIdAndUpdate(id, { bio: (req.body.bio || "").trim() });

    req.flash("success", "Profile updated!");
    res.redirect(`/users/${id}`);
};