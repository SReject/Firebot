"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

/**
 * The $target variable
 */
const commmandTarget = {
    definition: {
        handle: "target",
        description: "Acts like the $arg variable but strips out any leading '@' symbols. Useful when the argument is expected to be a username.",
        usage: "target[#]",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger, index) => {
        let args = trigger.metadata.userCommand.args || [];

        index = parseInt(index);

        if (args.length < index) {
            return null;
        }

        if (index != null && index > 0) {
            index--;
        } else {
            index = 0;
        }

        return args[index].replace("@", "");
    },
    argsCheck: (index) => {
        // index can be null
        if (index == null) return true;

        // index needs to be a number
        if (isNaN(index)) {
            throw new SyntaxError("Index needs to be a number.");
        }

        return true;
    }
};

module.exports = commmandTarget;
