
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
], (Controller, JSONModel, MessageToast, MessageBox) => {
    "use strict";


    var oScanResultText;

    return Controller.extend("com.intel.otcip.dockingscreen.controller.Main", {
        onInit: function () {
            
            //  Initialize header data and initialize header data
               var oData = {};
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "F4JSONModel");
           
            var oHeaderData = {
                RMA: "",
                WarehouseNo: "",
                submitEnabled: false,
                // editMode: false,
                selectedSection: "",
                // save: false,
                // yesNo: [
                //     { key: "YES", text: "Yes" },
                //     { key: "NO", text: "No" }
                // ],

            };
            var oHeaderModel = new JSONModel(oHeaderData);

            this.getOwnerComponent().setModel(oHeaderModel, "GlobalDockedModel"); //Global model to hold RMA header data
            this.GlobaldDockedModel = this.getOwnerComponent().getModel("GlobalDockedModel");

            oScanResultText = this.byId("scanManualRmaNo"); // RMA input field

        },
/**
 * Method to capture RMA input change
 * @param {*} oEvent 
 */

        onRMALiveChange: function (oEvent) {
            this.GlobaldDockedModel.setProperty("/RMA", oEvent.getParameter("value"));
            this.setSubmitButtonEnabled();
        },

        onRMAVHSelected: function (oEvent) {
            var oObjectSelected = oEvent.getParameter("selectedItem").getBindingContext("F4JSONModel").getObject();
            this.GlobaldDockedModel.setProperty("/RMA", oObjectSelected.RMA_NO);
            this.setSubmitButtonEnabled();
        },
        /**
         * Method to capture warehouse no. input change
         * @param {*} oEvent 
         */
        
        
        onWarehouseChange: function (oEvent) {
              var oModel = this.getOwnerComponent().getModel();
              this.GlobaldDockedModel.setProperty("/RMA",""),
            this.GlobaldDockedModel.setProperty("/WarehouseNo", oEvent.getSource().getSelectedKey());

            sap.ui.core.BusyIndicator.show(0);
            var oPayload = {
                "RMA_NO": this.GlobaldDockedModel.getProperty("/RMA"),
                "WAREHOUSE": this.GlobaldDockedModel.getProperty("/WarehouseNo"),
                "WarehouseNo": this.GlobaldDockedModel.getProperty("/WarehouseNo"),

            }

            oModel.callFunction("/FetchRmaValue",
                {
                    method: "POST",
                    urlParameters: oPayload,
                    // Callback function for success
                    
                    success: function (oData) {
                        this.getView().getModel("F4JSONModel").setProperty("/RMA_NO", oData.results);
                     sap.ui.core.BusyIndicator.hide();
                    }.bind(this),

                    // callback function for error
                     
                    error: function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                        try {
                            var errorResponse = JSON.parse(oError.responseText);
                            var errorMessage = errorResponse.error.message.value;

                            MessageBox.error(errorMessage);
                        } catch (e) {
                            MessageBox.error(oError.responseText);
                        } 

                    }.bind(this)
                });
            this.setSubmitButtonEnabled();
        },

        /**
         * Method to check validation of RMA and warehouse no.
         */
        

        setSubmitButtonEnabled: function () {
            this.GlobaldDockedModel.refresh();
            if (this.GlobaldDockedModel.getProperty("/RMA") && this.GlobaldDockedModel.getProperty("/WarehouseNo")) {
                this.GlobaldDockedModel.setProperty("/submitEnabled", true);
            } else {
                this.GlobaldDockedModel.setProperty("/submitEnabled", false);
            }
            this.GlobaldDockedModel.refresh();
        },
        
        /**
         * Method for F4 help for RMA no.
         * @param {*} oEvent 
         */
        

        onRmaValueHelp(oEvent) {

            var that = this;
            if (!this._oMenuFragment) {
                this._oMenuFragment = sap.ui.xmlfragment(this.getView().createId("idDisplayDialog"), "com.intel.otcip.dockingscreen.view.fragments.F4RMA", this);
                this._oMenuFragment.addStyleClass("sapUiSizeCompact");
                this.getView().addDependent(this._oMenuFragment);
            }
            this._oMenuFragment.open();

        },

        /**
         * Method for Submit button to get header and already docked data from backend
         */

        onSubmitPress: function () {

            var oModel = this.getOwnerComponent().getModel();
            var oPayload = {
                "RMA_NO": this.GlobaldDockedModel.getProperty("/RMA"),
                "WAREHOUSE": this.GlobaldDockedModel.getProperty("/WarehouseNo"),
                "RmaNo": this.GlobaldDockedModel.getProperty("/RMA"),
                "WarehouseNo": this.GlobaldDockedModel.getProperty("/WarehouseNo"),

            }
            sap.ui.core.BusyIndicator.show(0);
            oModel.callFunction("/GetRmaDetails",
                {
                    method: "POST",
                    urlParameters: oPayload,
                    // Callback function for success
                    
                    success: function (oData, response) {
                        sap.ui.core.BusyIndicator.hide();
                        this.GlobaldDockedModel.setProperty("/AlreadyDockedDetails", {});
                        this.GlobaldDockedModel.setProperty("/AlreadyDockedDetails", oData.results);
                        this.GlobaldDockedModel.refresh();
                        
                        //  Validation of result 

                        if(oData.results[0].Message.includes("Invalid")){
                            MessageBox.error(oData.results[0].Message);
                            return;
                        }

                        var headerDetail = {

                            "WarehouseNo": oData.results[0].WarehouseNoHdr,
                            "RMA": oData.results[0].RmaNoHdr,
                            "CustomerName": oData.results[0].CustomerHdr,
                            "OrderDate": oData.results[0].OrderDateHdr,
                            "RetReason": oData.results[0].ReturnReasonHdr,
                            "RetLoc": oData.results[0].ExpRetLocationHdr,
                            "ServiceType": oData.results[0].ServiceTypeHdr,
                            "CarrierStatus": oData.results[0].CarrierHdrFlag,
                            "Carrier": oData.results[0].CarrierHdr,

                        }

                        this.GlobaldDockedModel.setProperty("/DockedHeaderDetails", headerDetail);

                        this.GlobaldDockedModel.refresh();
                        sap.ui.core.BusyIndicator.hide();
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("Docking", {});
                      
                    }.bind(this),

                    
                    // callback function for error
                     
                    
                    error: function (oError) {
                        try {
                            var errorResponse = JSON.parse(oError.responseText);
                            var errorMessage = errorResponse.error.message.value;

                            MessageBox.error(errorMessage);
                        } catch (e) {
                            MessageBox.error(oError.responseText);
                        } finally {

                        }

                    }.bind(this)
                });

        },


        //Method on success of barcode scan
        onScanSuccess: function (oEvent) {
           
            if (oEvent.getParameter("cancelled")) {
                this.setSubmitButtonEnabled();
                MessageToast.show("Scan cancelled", { duration: 1000 });
            } else {
                if (oEvent.getParameter("text")) {
                    /**
                     * Set the scanned text to the input field value
                     */
                    oScanResultText.setValue(oEvent.getParameter("text"));
                    this.setSubmitButtonEnabled();
                } else {
                    oScanResultText.setValue('');
                    this.setSubmitButtonEnabled();
                }
            }
        },

        /**
         * Enable the submit button if the input value is added manually in barcode scan
         * @param {*} oEvent 
         */
        

        onScanLiveupdate: function (oEvent) {

            var sValue = oEvent.getParameter("value");
            
            if (sValue) {
                this.setSubmitButtonEnabled();
            } else {
                this.setSubmitButtonEnabled();
            }
        },

        /**
         * Method on error of barcode scan
         * @param {*} oEvent 
         */
        
        onScanError: function (oEvent) {
            MessageToast.show("Scan failed: " + oEvent, { duration: 1000 });
        },

        /**
         *  Clears the warehouse and RMA input fields and disables the submit button.
         */
        
        onPressClear: function () {
            this.byId("warehouseComboBox").setValue("");
            this.byId("rmaInputId").setValue("");
            this.getView().getModel("UIGlobalModel").setProperty("/enableSubmitButton", false);
        },
    })
});