"use strict";

const channelAccess = require("../../../common/channel-access");
const moment = require("moment");
const Chat = require("../../../common/mixer-chat");
const util = require("../../../utility");

/**
 * The Uptime command
 */
const uptime = {
    definition: {
        id: "firebot:mixerage",
        name: "Mixer Age",
        active: true,
        trigger: "!mixerage",
        description: "Displays how long the user has been on Mixer.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        }
    },
    /**
   * When the command is triggered
   */
    onTriggerEvent: event => {
        return new Promise(async (resolve, reject) => {
            let commandSender = event.userCommand.commandSender;

            let userDetails = await channelAccess.getMixerAccountDetailsByUsername(
                commandSender
            );

            if (userDetails === null) {
                Chat.smartSend(`${commandSender} not found.`);
            } else {
                let joinedMixerDateMoment = moment(userDetails.createdAt),
                    nowMoment = moment();

                let joinedMixerString = util.getDateDiffString(
                    joinedMixerDateMoment,
                    nowMoment
                );

                Chat.smartSend(
                    `${commandSender} joined Mixer ${joinedMixerString} ago on ${joinedMixerDateMoment.format(
                        "DD MMMM YYYY HH:mm"
                    )} UTC`
                );
            }
        });
    }
};

module.exports = uptime;
