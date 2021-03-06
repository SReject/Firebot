"use strict";

const profileManager = require("../common/profile-manager.js");
const mixerInteractive = require("../common/mixer-interactive.js");
const NodeCache = require("node-cache");
const logger = require('../logwrapper');
const moment = require('moment');

// This var will save the cooldown status of all buttons.
const cooldownCache = new NodeCache({ stdTTL: 1, checkperiod: 5 });

// Cooldown Expire Checker
// This function checks to see if the saved time has expired or not.
// Will return true if expired, and false if not yet expired.
function cooldownIsExpired(buttonID) {
    // Go look into cooldownSaved for this button
    let exists = cooldownCache.get(buttonID);

    return exists == null;
}

// Cooldown Checker
// This function checks to see if a button should be cooled down or not based on current cooldown count.
// It will return true if the new cooldown is longer than what it was already.
function cooldownChecker(buttonID, cooldown, neverOverride = false) {

    let shouldCooldown = false;
    if (neverOverride) {
        shouldCooldown = cooldownIsExpired(buttonID);
    } else {
        let currentTtl = cooldownCache.getTtl(buttonID) || 0;
        let diff = moment(currentTtl).diff(moment());
        shouldCooldown = diff < cooldown * 1000;
    }

    if (shouldCooldown) {
        if (cooldown > 1) {
            cooldown -= 1;
        }
        //add cooldown
        cooldownCache.set(buttonID, true, cooldown);
    }

    return shouldCooldown;
}

function updateCooldownForControlId(buttonId, cooldown) {
    if (cooldown > 1) {
        cooldown -= 1;
    }

    logger.debug(`updating internal cd for ${buttonId} to ${cooldown}`);

    if (cooldown < 1) {
        cooldownCache.del(buttonId);
    } else {
        cooldownCache.set(buttonId, true, cooldown);
    }
}

// Group Cooldown
// Buttons should be an array of controlIDs that should be cooled down.
function groupCooldown(buttons, cooldown, firebot, neverOverride = false) {
    // Loop through and find button to cool down.
    buttons.forEach(button => {
        logger.debug("Attempting to cooldown button " + button);
        if (cooldownChecker(button, cooldown, neverOverride)) {
            let buttonJson = firebot.controls[button];
            if (buttonJson == null) {
                logger.info(`Detected null button json for button ${button}. It likely doesn't exist anymore. Skipping...`);
                return;
            }
            logger.debug(`Calling Mixer Interactive to cooldown button "${button}" for scene "${buttonJson.scene}"`);
            mixerInteractive
                .returnButton(button, buttonJson.scene)
                .then((control) => {
                    logger.info('Cooling Down (Group): ' + control.controlID + ' for ' + cooldown);
                    control.update({cooldown: cooldown * 1000});
                }, (reason) => {
                    logger.warn(`Failed to get button '${button}' from Mixer. Unable to cooldown. Reason: ${reason}`);
                });
        }
    });
}

// Cooldown Router
function cooldownRouter(mixerControls, mixerControl, firebot, control) {
    return new Promise((resolve, reject) => {

        let controlId = control.controlId;

        let expired = cooldownIsExpired(control.controlId);
        let cooldown;

        // Alright, this button is no longer on cooldown and ready to be pressed.
        if (expired === true) {
            cooldown = control.cooldown;

            let foundGroup = null;
            if (firebot.cooldownGroups) {

                let cooldownGroups = Object.values(firebot.cooldownGroups);

                foundGroup = cooldownGroups.find(cg => cg.buttons && cg.buttons.includes(controlId));
            }

            if (foundGroup) {
                logger.info(`Found cooldown group "${foundGroup.groupName}" for control "${controlId}"`);
                // This button has a cooldown group... so it's time to cool them all down.
                let groupsJson = foundGroup;

                try {
                    // This will error out if the cooldown group this button is assigned to no longer exists.
                    let buttons = groupsJson.buttons;
                    cooldown = parseInt(groupsJson.length);

                    // For each button in the cooldown group...
                    groupCooldown(buttons, cooldown, firebot);

                    // Button cooldown process complete.
                    resolve(true);
                } catch (err) {
                    logger.warn("Failed to get cooldown group data", err);
                    // This cooldown group was deleted. Fix this control.
                    /* let dbSettings = profileManager.getJsonDbInProfile("/settings");
                    let gameName = dbSettings.getData("/interactive/lastBoardId");
                    let dbControls = profileManager.getJsonDbInProfile(
                        "/controls/" + gameName
                    );
                    dbControls.delete(
                        "./firebot/controls/" + control.controlId + "/cooldownGroup"
                    );

                    // Let's check to see if this one button needs to cool down then...
                    if (!isNaN(cooldown)) {
                        cooldown = parseInt(cooldown);
                        if (cooldown > 0) {
                            let cooldownCheck = cooldownChecker(control.controlId, cooldown);
                            if (cooldownCheck === true) {
                                logger.info('Cooling Down (Single): ' + control.controlId + ' for ' + cooldown);
                                control.update({cooldown: cooldown * 1000});
                            }
                        }
                    }*/

                    // Button cooldown process complete.
                    resolve(true);
                }
            } else {
                // Button doesn't have a cooldown group, so let's just cool down this one button.

                // If cooldown is not listed or zero, then don't do anything.
                if (cooldown !== undefined && cooldown > 0) {
                    cooldown = parseInt(control.cooldown);
                    let cooldownCheck = cooldownChecker(control.controlId, cooldown);
                    if (cooldownCheck === true) {
                        logger.info(
                            "Cooling Down (Single): " + control.controlId + " for " + cooldown
                        );
                        mixerControl.update({ cooldown: cooldown * 1000 });
                    }
                }

                // Button cooldown process complete.
                resolve(true);
            }
        } else {
            // This button is still on cooldown! Don't press it again.
            logger.info(
                "Button " + control.controlId + " is still on cooldown. Ignoring press."
            );
            reject(false);
        }
    });
}

// Return Cooldowns
function returnCooldowns() {
    return cooldownCache.keys();
}

// Clear Cooldowns
function clearCooldowns() {
    cooldownCache.flushAll();
}

// Exports
exports.cooldowns = returnCooldowns;
exports.reset = clearCooldowns;
exports.router = cooldownRouter;
exports.group = groupCooldown;
exports.updateCooldownForControlId = updateCooldownForControlId;
