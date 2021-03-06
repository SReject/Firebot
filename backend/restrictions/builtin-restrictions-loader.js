"use strict";

const restrictionsManager = require("./restriction-manager");

exports.loadRestrictions = function() {
    const permissions = require("./builtin/permissions");
    const channelProgression = require("./builtin/channelProgression");
    const channelCurrency = require("./builtin/channelCurrency");
    const activeChatUsers = require("./builtin/activeChatUsers");
    const customVariable = require('./builtin/customVariable');
    const viewTime = require('./builtin/viewTimeRestriction');
    const mixplayInteractions = require('./builtin/mixplayInteractions');
    const chatMessages = require('./builtin/chatMessages');

    restrictionsManager.registerRestriction(permissions);
    restrictionsManager.registerRestriction(channelProgression);
    restrictionsManager.registerRestriction(channelCurrency);
    restrictionsManager.registerRestriction(activeChatUsers);
    restrictionsManager.registerRestriction(customVariable);
    restrictionsManager.registerRestriction(viewTime);
    restrictionsManager.registerRestriction(mixplayInteractions);
    restrictionsManager.registerRestriction(chatMessages);
};