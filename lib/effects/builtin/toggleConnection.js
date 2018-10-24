"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");

const {
    EffectDefinition,
    EffectDependency,
    EffectTrigger
} = require("../models/effectModels");

/**
 * The Toggle Connection effect
 */
const toggleConnection = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:toggleconnection",
        name: "Toggle Connection",
        description: "Toggles connection to specified services.",
        tags: ["Built in"],
        dependencies: [],
        triggers: [EffectTrigger.ALL]
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
  <div class="alert alert-info">
    This effect will toggle Firebot's connection to Mixer services. Most often used with hotkeys!
    </div>

    <eos-container header="Connections To Toggle">
    <label class="control-fb control--checkbox"> Interactive
        <input type="checkbox" ng-checked="serviceIsChecked('interactive')" ng-click="toggleService('interactive')">
        <div class="control__indicator"></div>
    </label>
    <label class="control-fb control--checkbox"> Chat
        <input type="checkbox" ng-checked="serviceIsChecked('chat')" ng-click="toggleService('chat')">
        <div class="control__indicator"></div>
    </label>
    <label class="control-fb control--checkbox"> Constellation
        <input type="checkbox" ng-checked="serviceIsChecked('constellation')" ng-click="toggleService('constellation')">
        <div class="control__indicator"></div>
    </label>
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, listenerService) => {
        if ($scope.effect.services == null) {
            $scope.effect.services = [];
        }

        $scope.serviceIsChecked = service =>
            $scope.effect.services.includes(service);

        $scope.toggleService = service => {
            if ($scope.serviceIsChecked(service)) {
                $scope.effect.services = $scope.effect.services.filter(
                    s => s !== service
                );
            } else {
                $scope.effect.services.push(service);
            }
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            // What should this do when triggered.
            let effect = event.effect;
            renderWindow.webContents.send("toggleServicesRequest", effect.services);
            resolve(true);
        });
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "toggleconnection",
            onOverlayEvent: event => {
                console.log("yay toggle connection");
                //need to implement this
            }
        }
    }
};

module.exports = toggleConnection;