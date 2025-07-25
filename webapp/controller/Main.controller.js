
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    	'sap/ui/core/Fragment',
        "sap/ui/core/Element",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
], (Controller, Fragment, Element, MessageToast, MessageBox) => {
    "use strict";

        
		var oScanResultText;

    return Controller.extend("com.intel.otcip.dockingscreen.controller.Main", {
      onInit: function() {

       // Initialize header data and initialize header data
        var oHeaderData = {
            RMA: "",
            WarehouseNo: "",
            submitEnabled: false,
            editMode: false,
            selectedSection:"",
            yesNo: [
                        { key: "YES", text: "Yes" },
                        { key: "NO", text: "No" }
                    ],
           
        };
         var oHeaderModel = new sap.ui.model.json.JSONModel(oHeaderData);
         this.getOwnerComponent().setModel(oHeaderModel, "GlobalDockedModel"); //Global model to hold RMA header data

        oScanResultText = this.byId("scanManualRmaNo"); // RMA input field
        
    },

    //Method to capture RMA input change

    onRMALiveChange: function(oEvent){
         this.getOwnerComponent().getModel("GlobalDockedModel").setProperty("/RMA",oEvent.getParameter("value"));
        this.setSubmitButtonEnabled();
    },
    
    //Method to capture warehouse no. input change

    onWarehouseChange: function(oEvent){

        this.setSubmitButtonEnabled();
    },

    // Method to check validation of RMA and warehouse no.

    setSubmitButtonEnabled: function(){
         this.getOwnerComponent().getModel("GlobalDockedModel").refresh();
        if ( this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/RMA") &&  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/WarehouseNo")){
             this.getOwnerComponent().getModel("GlobalDockedModel").setProperty("/submitEnabled",true);
        }else{
             this.getOwnerComponent().getModel("GlobalDockedModel").setProperty("/submitEnabled",false);
        }
         this.getOwnerComponent().getModel("GlobalDockedModel").refresh();
    },

    //Method for F4 help for RMA no.
    
    onRmaValueHelp(oEvent) {
            
        var that = this;
        if (!this._oMenuFragment) {
          this._oMenuFragment = sap.ui.xmlfragment(this.getView().createId("idDisplayDialog"), "com.intel.otcip.dockingscreen.view.fragments.F4RMA", this);
          this._oMenuFragment.addStyleClass("sapUiSizeCompact");
          this.getView().addDependent(this._oMenuFragment);
        } 
          this._oMenuFragment.open();
        
    },


    //Method for Submit button to get header and already docked data from backend

            onSubmitPress: function() {
             
                var oModel= this.getOwnerComponent().getModel();
                var oPayload={
                    "RMA_NO":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/RMA"),
                    "WAREHOUSE":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/WarehouseNo"),
                    "RmaNo":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/RMA"),
                    "WarehouseNo":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/WarehouseNo"),
                  
                }
            
                oModel.callFunction("/ActionForRmaDetails", // function import name
                    {
                        method: "POST",
                        urlParameters: oPayload,
                        // callback function for success
                        success: function (oData, response) {
                            console.log(oData)
                            this.getOwnerComponent().getModel("GlobalDockedModel").setProperty("/AlreadyDockedDetails",{});
                            this.getOwnerComponent().getModel("GlobalDockedModel").setProperty("/AlreadyDockedDetails",oData.results);

                            // Validation of result 

                            // if(oData.results[0].Message.includes("Invalid")){
                            //     MessageBox.error(oData.results[0].Message);
                            //     return;
                            // }
                            if (oData.results.length < 1) {
                                //message and return
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
    
                            this.getOwnerComponent().getModel("GlobalDockedModel").setProperty("/DockedHeaderDetails", headerDetail);
    
                            this.getOwnerComponent().getModel("GlobalDockedModel").refresh();
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
                                MessageBox.error(oError.responseText); //"An error occurred while processing the error message."
                            } finally {
    
                            }
    
                        }.bind(this)
                    });
                
                },


        //Method on success of barcode scan
        	onScanSuccess: function(oEvent) {
                  var oButton = this.byId("submitButton");
				if (oEvent.getParameter("cancelled")) {
                    this.setSubmitButtonEnabled();
					MessageToast.show("Scan cancelled", { duration:1000 });
				} else {
					if (oEvent.getParameter("text")) {
						oScanResultText.setValue(oEvent.getParameter("text"));// Set the scanned text to the input field value
                        this.setSubmitButtonEnabled();
                    } else {
						oScanResultText.setValue('');
                        this.setSubmitButtonEnabled();
					}
				}
			},

             //Enable the submit button if the input value is added manually in barcode scan

            onScanLiveupdate: function(oEvent) {
               
                var sValue = oEvent.getParameter("value");
                var oButton = this.byId("submitButton");
                if (sValue) {
                    this.setSubmitButtonEnabled();
                } else {
                    this.setSubmitButtonEnabled();
                }
            },

             //Method on error of barcode scan

			onScanError: function(oEvent) {
				MessageToast.show("Scan failed: " + oEvent, { duration:1000 });
			},
            
        // Clears the warehouse and RMA input fields and disables the submit button.
        onPressClear: function () {
            this.byId("warehouseComboBox").setValue("");
            this.byId("rmaInputId").setValue("");
            this.getView().getModel("UIGlobalModel").setProperty("/enableSubmitButton", false);
        },
    })});