const Conversation = require('../models/conversation');
const Listing = require('../models/listing');

module.exports.startOrShowConversation = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    if (!listing.owner) {
        req.flash("error", "This listing's host is no longer available.");
        return res.redirect(`/listings/${id}`);
    }

    if (listing.owner._id.equals(req.user._id)) {
        req.flash("error", "You can't message yourself about your own listing.");
        return res.redirect("/messages");
    }

    const conversation = await Conversation.findOne({
        listing: id,
        guest: req.user._id,
        host: listing.owner._id
    }).populate("messages.sender");

    res.render("messages/show.ejs", {
        conversation,
        listing,
        otherUser: listing.owner,
        replyAction: conversation ? `/messages/${conversation._id}` : `/listings/${id}/message`
    });
};

module.exports.sendMessageFromListing = async (req, res) => {
    const { id } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
        req.flash("error", "Message can't be empty.");
        return res.redirect(`/listings/${id}/message`);
    }

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    if (!listing.owner) {
        req.flash("error", "This listing's host is no longer available.");
        return res.redirect(`/listings/${id}`);
    }

    if (listing.owner.equals(req.user._id)) {
        req.flash("error", "You can't message yourself about your own listing.");
        return res.redirect("/messages");
    }

    let conversation = await Conversation.findOne({
        listing: id,
        guest: req.user._id,
        host: listing.owner
    });

    if (!conversation) {
        conversation = new Conversation({
            listing: id,
            guest: req.user._id,
            host: listing.owner,
            messages: []
        });
    }

    conversation.messages.push({
        sender: req.user._id,
        body: body.trim()
    });

    await conversation.save();

    req.flash("success", "Message sent!");
    res.redirect(`/messages/${conversation._id}`);
};

module.exports.myInbox = async (req, res) => {
    const conversations = await Conversation.find({
        $or: [{ guest: req.user._id }, { host: req.user._id }]
    })
        .populate("listing")
        .populate("guest")
        .populate("host")
        .sort({ updatedAt: -1 });

    res.render("messages/inbox.ejs", {
        conversations,
        currentUserId: req.user._id.toString()
    });
};

const findConversationForParticipant = async (req) => {
    const conversation = await Conversation.findById(req.params.id)
        .populate("messages.sender")
        .populate("listing")
        .populate("guest")
        .populate("host");

    if (!conversation || !conversation.guest || !conversation.host) {
        return { conversation: null, isParticipant: false };
    }

    const isParticipant =
        conversation.guest._id.equals(req.user._id) ||
        conversation.host._id.equals(req.user._id);

    return { conversation, isParticipant };
};

module.exports.showConversation = async (req, res) => {
    const { conversation, isParticipant } = await findConversationForParticipant(req);

    if (!conversation) {
        req.flash("error", "Conversation not found.");
        return res.redirect("/messages");
    }

    if (!isParticipant) {
        req.flash("error", "That's not your conversation.");
        return res.redirect("/messages");
    }

    const otherUser = conversation.guest._id.equals(req.user._id)
        ? conversation.host
        : conversation.guest;

    res.render("messages/show.ejs", {
        conversation,
        listing: conversation.listing,
        otherUser,
        replyAction: `/messages/${conversation._id}`
    });
};

module.exports.replyToConversation = async (req, res) => {
    const { body } = req.body;

    if (!body || !body.trim()) {
        req.flash("error", "Message can't be empty.");
        return res.redirect(`/messages/${req.params.id}`);
    }

    const { conversation, isParticipant } = await findConversationForParticipant(req);

    if (!conversation || !isParticipant) {
        req.flash("error", "Conversation not found.");
        return res.redirect("/messages");
    }

    conversation.messages.push({
        sender: req.user._id,
        body: body.trim()
    });

    await conversation.save();

    res.redirect(`/messages/${conversation._id}`);
};