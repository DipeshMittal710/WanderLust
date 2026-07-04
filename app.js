if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const dns = require("dns");

const User = require("./models/user");

const listingsRoutes = require("./routes/listing");
const reviewsRoutes = require("./routes/reviews");
const userRoutes = require("./routes/user");
const bookingRoutes = require("./routes/booking");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dbURL = process.env.ATLASDB_URL;

main()
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect(dbURL);
}

// =================== VIEW ENGINE ===================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// =================== MIDDLEWARE ===================

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// =================== SESSION ===================

const store = MongoStore.create({
    mongoUrl: dbURL,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 60 * 60,
});

store.on("error", (err) => {
    console.log("Mongo Session Store Error:", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// =================== PASSPORT ===================

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// =================== GLOBAL LOCALS ===================

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// =================== ROUTES ===================

app.use("/listings", bookingRoutes);
app.use("/listings", listingsRoutes);
app.use("/listings/:id/reviews", reviewsRoutes);
app.use("/", userRoutes);

// Redirect root URL to listings
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// =================== 404 ===================

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// =================== ERROR HANDLER ===================

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;

    console.log(err);

    res.status(statusCode).render("error.ejs", {
        message,
    });
});

// =================== SERVER ===================

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});