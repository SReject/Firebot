"use strict";

const customRoleManager = require("../../../roles/custom-roles-manager");
const mixerChat = require("../../../common/mixer-chat");

const model = {
    definition: {
        id: "firebot:role-management",
        name: "Custom Role Management",
        active: true,
        trigger: "!role",
        description: "Allows management of viewer's custom roles from chat.",
        autoDeleteTrigger: true,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        restrictionData: {
            restrictions: [
                {
                    id: "sys-cmd-mods-only-perms",
                    type: "firebot:permissions",
                    mode: "roles",
                    roleIds: [
                        "ChannelEditor",
                        "Owner"
                    ]
                }
            ]
        },
        subCommands: [
            {
                arg: "add",
                usage: "add @viewer roleName",
                description: "Adds a custom role to a viewer.",
                minArgs: 3
            },
            {
                arg: "remove",
                usage: "remove @viewer roleName",
                description: "Removes a custom role from a viewer.",
                minArgs: 3
            },
            {
                arg: "list",
                usage: "list [@viewer]",
                description: "List all custom roles, or just roles a viewer has."
            }
        ]
    },
    /**
     * When the command is triggered
     */
    onTriggerEvent: async event => {

        let { commandSender, args, triggeredArg } = event.userCommand;

        if (args.length < 1) {
            mixerChat.smartSend("Incorrect command usage!", commandSender);
            return;
        }

        switch (triggeredArg) {
        case "add": {
            let roleName = args.slice(2);
            let role = customRoleManager.getRoleByName(roleName);
            if (role == null) {
                mixerChat.smartSend("Can't find a role by that name.", commandSender);
            } else {
                let username = args[1].replace("@", "");
                customRoleManager.addViewerToRole(role.id, username);
                mixerChat.smartSend(`Added role ${role.name} to ${username}`, commandSender);
            }
            break;
        }
        case "remove": {
            let roleName = args.slice(2);
            let role = customRoleManager.getRoleByName(roleName);
            if (role == null) {
                mixerChat.smartSend("Can't find a role by that name.", commandSender);
            } else {
                let username = args[1].replace("@", "");
                customRoleManager.removeViewerFromRole(role.id, username);
                mixerChat.smartSend(`Removed role ${role.name} from ${username}`, commandSender);
            }
            break;
        }
        case "list": {
            if (args.length > 1) {
                let username = args[1].replace("@", "");
                let roleNames = customRoleManager.getAllCustomRolesForViewer(username).map(r => r.name);
                if (roleNames.length < 1) {
                    mixerChat.smartSend(`${username} has no custom roles assigned.`, commandSender);
                } else {
                    mixerChat.smartSend(`${username}'s custom roles: ${roleNames.join(", ")}`, commandSender);
                }

            } else {
                let roleNames = customRoleManager.getCustomRoles().map(r => r.name);
                if (roleNames.length < 1) {
                    mixerChat.smartSend(`There are no custom roles available.`, commandSender);
                } else {
                    mixerChat.smartSend(`Available custom roles: ${roleNames.join(", ")}`, commandSender);
                }
            }
            break;
        }
        default:
            mixerChat.smartSend("Incorrect command usage!", commandSender);
        }
    }
};

module.exports = model;
