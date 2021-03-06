"use strict";
(function() {
    //This manages command data
    const profileManager = require("../../backend/common/profile-manager.js");
    const moment = require("moment");

    angular
        .module("firebotApp")
        .factory("commandsService", function(
            logger,
            connectionService,
            listenerService,
            backendCommunicator
        ) {
            let service = {};

            let getCommandsDb = () =>
                profileManager.getJsonDbInProfile("/chat/commands");

            let getCommandGroupsDb = () =>
                profileManager.getJsonDbInProfile("/chat/command-groups");

            // in memory commands storage
            let commandsCache = {
                systemCommands: [],
                customCommands: []
            };

            let commandGroups = [];

            // Refresh commands cache
            service.refreshCommands = function() {
                let commandsDb = getCommandsDb();

                let cmdData;
                try {
                    cmdData = commandsDb.getData("/");
                } catch (err) {
                    logger.warn("error getting command data", err);
                    return;
                }

                if (cmdData.customCommands) {
                    logger.debug("loading custom commands: " + cmdData.customCommands);
                    commandsCache.customCommands = Object.values(cmdData.customCommands);
                }

                commandsCache.systemCommands = listenerService.fireEventSync(
                    "getAllSystemCommandDefinitions"
                );

                // Refresh the command cache.
                ipcRenderer.send("refreshCommandCache");

                //load cmd groups
                let groupsDb = getCommandGroupsDb();
                try {
                    commandGroups = groupsDb.getData("/groups");
                } catch (error) {
                    if (error.name === 'DatabaseError') {
                        logger.error("Failed to load command groups", error);
                    }
                    return;
                }
            };

            backendCommunicator.on("custom-commands-updated", () => {
                service.refreshCommands();
            });

            service.getSystemCommands = () => commandsCache.systemCommands;

            service.getCustomCommands = () => commandsCache.customCommands;

            service.saveCustomCommand = function(command, user = null) {
                logger.debug("saving command: " + command.trigger);
                if (command.id == null || command.id === "") {
                    // generate id for new command
                    const uuidv1 = require("uuid/v1");
                    command.id = uuidv1();

                    command.createdBy = user
                        ? user
                        : connectionService.accounts.streamer.username;
                    command.createdAt = moment().format();
                } else {
                    command.lastEditBy = user
                        ? user
                        : connectionService.accounts.streamer.username;
                    command.lastEditAt = moment().format();
                }

                if (command.count == null) {
                    command.count = 0;
                }

                let commandDb = getCommandsDb();

                // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
                // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
                // while removing internal angular properties. We then convert this string back to an object with
                // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
                let cleanedCommand = JSON.parse(angular.toJson(command));

                try {
                    commandDb.push("/customCommands/" + command.id, cleanedCommand);
                } catch (err) {} //eslint-disable-line no-empty
            };

            service.saveSystemCommandOverride = function(command) {
                listenerService.fireEvent(
                    "saveSystemCommandOverride",
                    JSON.parse(angular.toJson(command))
                );

                let index = commandsCache.systemCommands.findIndex(
                    c => c.id === command.id
                );

                commandsCache.systemCommands[index] = command;
            };

            service.triggerExists = function(trigger, id = null) {
                if (trigger == null) return false;

                trigger = trigger != null ? trigger.toLowerCase() : "";

                let foundDuplicateCustomCmdTrigger = commandsCache.customCommands.some(
                    command =>
                        command.id !== id && command.trigger && command.trigger.toLowerCase() === trigger
                );

                let foundDuplicateSystemCmdTrigger = commandsCache.systemCommands.some(
                    command => command.active && command.trigger && command.trigger.toLowerCase() === trigger
                );

                return foundDuplicateCustomCmdTrigger || foundDuplicateSystemCmdTrigger;
            };

            // Deletes a command.
            service.deleteCustomCommand = function(command) {
                let commandDb = getCommandsDb();

                if (command == null || command.id == null || command.id === "") return;

                try {
                    commandDb.delete("/customCommands/" + command.id);
                } catch (err) {
                    logger.warn("error when deleting command", err);
                } //eslint-disable-line no-empty
            };

            function saveCommandGroups() {
                getCommandGroupsDb.push("/groups", commandGroups, true);
            }

            service.addCommandGroup = function(groupName) {
                if (commandGroups.includes(groupName) ||
                    groupName == null ||
                    groupName === "" ||
                    groupName.toLowerCase() === "all") {
                    return;
                }

                commandGroups.push(groupName);

                saveCommandGroups();
            };

            service.removeCommandGroup = function(groupName) {
                if (!commandGroups.includes(groupName)) {
                    return;
                }

                commandGroups = commandGroups.filter(g => g !== groupName);

                saveCommandGroups();
            };

            listenerService.registerListener(
                {
                    type: listenerService.ListenerType.SYS_CMDS_UPDATED
                },
                () => {
                    service.refreshCommands();
                }
            );

            ipcRenderer.on("commandCountUpdate", function(event, data) {
                let command = service
                    .getCustomCommands()
                    .find(c => c.id === data.commandId);
                if (command != null) {
                    command.count = data.count;
                    service.saveCustomCommand(command);
                }
            });

            listenerService.registerListener(
                {
                    type: listenerService.ListenerType.SAVE_CUSTOM_COMMAND
                },
                (data) => {
                    service.saveCustomCommand(data.command, data.user);

                    let currentIndex = commandsCache.customCommands.findIndex(c => c.trigger === data.command.trigger);

                    if (currentIndex === -1) {
                        commandsCache.customCommands.push(data.command);
                    } else {
                        commandsCache.customCommands[currentIndex] = data.command;
                    }

                    // Refresh the backend command cache.
                    ipcRenderer.send("refreshCommandCache");
                }
            );

            listenerService.registerListener(
                {
                    type: listenerService.ListenerType.REMOVE_CUSTOM_COMMAND
                },
                (data) => {

                    let command = commandsCache.customCommands.find(c => c.trigger === data.trigger);

                    service.deleteCustomCommand(command);

                    commandsCache.customCommands = commandsCache.customCommands.filter(c => c.id !== command.id);

                    // Refresh the backend command cache.
                    ipcRenderer.send("refreshCommandCache");
                }
            );


            return service;
        });
}());
