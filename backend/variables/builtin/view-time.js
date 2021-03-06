"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const viewerDB = require('../../database/userDatabase');

const model = {
    definition: {
        handle: "viewTime",
        usage: "viewTime[username]",
        description: "Displays the view time (in hours) of a given viewer (leave blank to use current viewer)",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger, username) => {
        if (username == null) {
            username = trigger.metadata.username;
        }
        let viewer = await viewerDB.getUserByUsername(trigger.metadata.username);
        if (!viewer) {
            return 0;
        }
        return viewer.minutesInChannel < 60 ? 0 : parseInt(viewer.minutesInChannel / 60);
    }
};

module.exports = model;
