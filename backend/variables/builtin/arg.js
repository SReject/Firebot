"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

const { ExpressionArgumentsError } = require("../expression-errors");

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "arg",
        usage: "arg[num, num2]",
        description: "Grabs the argument at the given index. If you provide two indexes, all arguments ",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (trigger, index, upperIndex) => {
        let args = trigger.metadata.userCommand.args || [];

        if (String(index).toLowerCase() === "all") {
            return args.join(" ");
        }

        if (index != null) {
            index = parseInt(index);
        }

        if (index != null && index > 0) {
            index = index - 1;
        } else {
            index = 0;
        }

        if (upperIndex == null) {
            return args[index] || "";
        }

        if (upperIndex === "last") {
            upperIndex = args.length - 1;
        }

        if (upperIndex != null) {
            upperIndex = parseInt(upperIndex);
        }

        if (upperIndex > args.length - 1) {
            return null;
        }
        upperIndex = upperIndex - 1;


        return args.slice(index, upperIndex).join(" ");
    },
    argsCheck: (index, upperIndex) => {
        // both args can be null
        if (index == null && upperIndex == null) return true;

        // index needs to either be "all" or a number
        if (String(index).toLowerCase() !== "all" && isNaN(index)) {
            throw new ExpressionArgumentsError("First argument needs to be either 'all' or a number.", 0);
        }

        // upperIndex needs to either be null, "last", or a number
        if (upperIndex != null && String(upperIndex).toLowerCase() !== "last" && isNaN(upperIndex)) {
            throw new ExpressionArgumentsError("Second argument needs to be either 'last' or a number.", 1);
        }

        return true;
    }
};

module.exports = model;
