"use strict";

const { EffectTrigger } = require("../../../../effects/models/effectModels");
const { OutputDataType } = require("../../../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase", "streamloots:redemption"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsImageUrl",
        description: "The image url for the StreamLoots Chest/Card",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let imageUrl = trigger.metadata.eventData && trigger.metadata.eventData.imageUrl;

        return imageUrl || "";
    }
};

module.exports = model;
