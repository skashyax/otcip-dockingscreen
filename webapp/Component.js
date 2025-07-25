sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/intel/otcip/dockingscreen/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.intel.otcip.dockingscreen.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            sap.ui.core.routing.HashChanger.getInstance().replaceHash("");
        }
    });
});