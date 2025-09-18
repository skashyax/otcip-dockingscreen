sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet"
], (Controller, JSONModel, MessageBox, MessageToast,Spreadsheet) => {
    "use strict";
    var oBundle;
    return Controller.extend("com.intel.otcip.dockingscreen.controller.Docking", {
        onInit: function () {
            
            var oData = {};
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "F4JSONModel");
            oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            // Route validation
             
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Docking").attachMatched(this._onRouteMatched, this);

            var sPreviousHash = sap.ui.core.routing.History.getInstance().getPreviousHash();

            if (sPreviousHash && sPreviousHash.indexOf("Main") !== -1) {
                this._onRouteMatched();
            } else {
                
                //  Invalid navigation, redirect to NotFound or Main
                //  this._onRouteMatched();
                oRouter.navTo("NotFound");
            }
        },

        onAfterRendering: function () {
            var oDP = this.byId("editValueDateIdDP");
            if (oDP) {
                oDP.setMaxDate(new Date());
            }
        },
        
        _onRouteMatched: function () {

            //  Data for the docking table and initialize data

            this.GlobaldDockedModel = this.getOwnerComponent().getModel("GlobalDockedModel");

            var oTableData = {

                editMode: false,
               
                save: false,
                yesNo: [
                    { key: "YES", text: "Yes" },
                    { key: "NO", text: "No" }
                ],
                rows: [

                    {
                        RMA_NO: this.GlobaldDockedModel.getProperty("/RMA"),
                        WAREHOUSE: this.GlobaldDockedModel.getProperty("/WarehouseNo"),
                        RmaNoHdr: this.GlobaldDockedModel.getProperty("/RMA"),
                        WarehouseNo: this.GlobaldDockedModel.getProperty("/WarehouseNo"),
                        CustomerHdr: this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/CustomerName"),
                        OrderDateHdr: this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/OrderDate"),
                        ServiceTypeHdr: this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/ServiceType"),
                        ReturnReasonHdr: this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RetReason"),
                        ExpRetLocationHdr: this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RetLoc"),
                        CarrierHdr: this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/Carrier"),
                        Uom: "",
                        Quantity: "",
                        DamageInd: "",
                        ResnForDamage: "",
                        BinLocation: "",
                        WayBillNum: "",
                        Attachment: "",
                        Text1: "",
                        Text2: "",
                        Status: "",
                        Dockingseq:""
                    }

                ]
            };

            var oTableModel = new JSONModel(oTableData);
            this.getView().setModel(oTableModel, "tableModel");
            this.TableModel=this.getView().getModel("tableModel")

            this.fetchDropdown("DAMAGE_REASON");
            this.fetchDropdown("UOM");
            this.fetchDropdown("CARRIER_NO");

        },

        fetchDropdown: function(param){

            var oModel = this.getOwnerComponent().getModel();

            var aFilters = [

                new sap.ui.model.Filter("SubIdentifier", sap.ui.model.FilterOperator.EQ, param)
            ];

            sap.ui.core.BusyIndicator.show(0);

               oModel.read("/DropdownValueHelp",
                {
                    filters: aFilters,
                    // urlParameters: oPayload,
                    // Callback function for success
                    
                    success: function (oData) {
                        this.getView().getModel("F4JSONModel").setProperty(`/${param}`, oData.results);
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
        },

        /**
         * Method to add row on docking panel
         */


        onAddRowPress: function () {
            var oTableModel = this.getView().getModel("tableModel");
            var oData = oTableModel.getData();

            var oNewRow = {
                "RMA_NO": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RMA"),
                "WAREHOUSE": this.GlobaldDockedModel.getProperty("/WarehouseNo"),
                "RmaNoHdr": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RMA"),
                "WarehouseNo": this.GlobaldDockedModel.getProperty("/WarehouseNo"),
                "CustomerHdr": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/CustomerName"),
                "OrderDateHdr": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/OrderDate"),
                "ServiceTypeHdr": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/ServiceType"),
                "ReturnReasonHdr": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RetReason"),
                "ExpRetLocationHdr": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RetLoc"),
                "CarrierHdr": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/Carrier"),
                "Text1": "",
                "Text2": "",
                "WayBillNum": "",
                "Quantity": "",
                "Uom": "",
                "DamageInd": "",
                "ResnForDamage": "",
                "BinLocation": "",
                "File": "",
                "Attachment": ""
            };

            
            //  Add the new row to the existing rows
            
            oData.rows.push(oNewRow);

            
            //  Refresh the model to update the table binding
             
            oTableModel.refresh(true);
        },

        /**
         * On save button press and call backend
         */
    

        onSavePress: function () {

            var oTableModel = this.getView().getModel("tableModel");
            var aRows = oTableModel.getProperty("/rows");
            var bValid = true;
            var aInvalidRows = [];

            for (var i = 0; i < aRows.length; i++) {
                var oRow = aRows[i];
                var bMissingUom = !oRow.Uom || oRow.Uom.trim() === "";
                var bMissingQty = !oRow.Quantity || oRow.Quantity.toString().trim() === "";
                var bWayBillRequired = oRow.CarrierHdr && oRow.CarrierHdr.trim() !== "";
                var bMissingWayBill = bWayBillRequired && (!oRow.WayBillNum || oRow.WayBillNum.trim() === "");

                if (bMissingUom || bMissingQty || bMissingWayBill) {
                    bValid = false;
                    aInvalidRows.push(i + 1); 
                }
            }

            if (bValid) {
                 this.TableModel.setProperty("/save", true);
                this.callAction4OData("SAVED");
            } else {
                var missingText = oBundle.getText("missingData");
                var errorText = oBundle.getText("validateError");
                MessageBox.error(missingText + aInvalidRows.join(", "), {
                    title: errorText
                });
            }
        },
        /**
         * On confirm button press and call backend
         * @param {*} oEvent 
         */

        onConfirmPress: function (oEvent) {
            // send to backend 

            // var oTableModel = this.getView().getModel("tableModel");
            var aRows =  this.TableModel.getProperty("/rows");
            var bValid = true;
            var aInvalidRows = [];

            for (var i = 0; i < aRows.length; i++) {
                var oRow = aRows[i];
                var bMissingUom = !oRow.Uom || oRow.Uom.trim() === "";
                var bMissingQty = !oRow.Quantity || oRow.Quantity.toString().trim() === "";
                var bWayBillRequired = oRow.CarrierHdr && oRow.CarrierHdr.trim() !== "";
                var bMissingWayBill = bWayBillRequired && (!oRow.WayBillNum || oRow.WayBillNum.trim() === "");

                if (bMissingUom || bMissingQty || bMissingWayBill) {
                    bValid = false;
                    aInvalidRows.push(i + 1); // Row number (1-based index)
                }
            }

            if (bValid) {
                 this.TableModel.setProperty("/save", false);
                this.callAction4OData("CONFIRMED");
            } else {
                var missingText = oBundle.getText("missingData");
                var errorText = oBundle.getText("validateError");
                MessageBox.error(missingText + aInvalidRows.join(", "), {
                    title: errorText
                });
            }

        },

        
        /**
         * Save edited items in already docked
         * @returns 
         */
        onDockedSaveConfirmPress: function () {
            // var oModel = this.GlobaldDockedModel;
            // Here, you can process/save the data as needed
             this.TableModel.setProperty("/editMode", false);

            var oTable = this.byId("idDockedTable");
            var aSelectedItems = oTable.getSelectedItems();
            var aSelectedData = [];

            if (aSelectedItems.length === 0) {
                var eSelectText = oBundle.getText("selectAnyText");
                MessageBox.warning(eSelectText);
                return;
            }
                // Check if any selected row has status other than SAVED
                var bInvalid = aSelectedItems.some(function (oItem) {
                    var oContext = oItem.getBindingContext("GlobalDockedModel");
                    var oRowData = oContext.getObject();
                    return oRowData.Status !== "SAVED";
                });

                if (bInvalid) {
                    var sSelectText = oBundle.getText("selectSaveText"); // e.g. "Please select only SAVED rows"
                    MessageBox.error(sSelectText, {
                        title: "Error"
                    });
                    return; // stop execution
                }
            // Loop through selected items and extract their binding context data
            aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("GlobalDockedModel");
                var oRowData = oContext.getObject();
                aSelectedData.push(oRowData);
                this.getView().getModel("tableModel").setProperty("/rows", aSelectedData);
                 this.TableModel.setProperty("/save", false);
            });

            this.callAction4OData("CONFIRMED");

        },

        
        /**
         * Method triggered when Asset is selected from the Asset Table
         * @param {*} oEvent 
         * @returns 
         */
        // onSelectAsset(oEvent) {

        //     var status = oEvent.getParameter("listItem").getBindingContext("GlobalDockedModel").getObject().Status;

        //     if (status !== "SAVED" && oEvent.getParameter("selected")) {
        //         var sSelectText = oBundle.getText("selectSaveText");
        //         MessageBox.error(sSelectText, {
        //             title: "Error"
        //         });
        //         oEvent.getParameter("listItem").setSelected(false)
        //     }
        //     return
        // },

        /**
         * Cancel edited items in already docked
         */
        onDockedEditCancelPress: function () {
            // var oModel = this.GlobaldDockedModel;
             this.TableModel.setProperty("/editMode", false);
        },

        
        /**
         *  On edit button press make save and cancel button visible and edit button invisible
         */
        onDockedEditPress: function () {

            // var oModel = this.GlobaldDockedModel;
            // Set the edit mode to true to enable editing
             this.TableModel.setProperty("/editMode", true);
        },
        
        
        /**
         * Method called on save, edit and confirm button press for multiple line items(i.e. Batch call)
         * @param {*} status 
         */

        callAction4OData: function (status) {
            var oTableModel = this.getView().getModel("tableModel");
            var aRows = oTableModel.getProperty("/rows");
            var oModel = this.getView().getModel();
            let aDeferredGroups = oModel.getDeferredGroups();
            aDeferredGroups.push("batchCallActionId");
            oModel.setDeferredGroups(aDeferredGroups);
            if (aRows.length) {
                sap.ui.core.BusyIndicator.show(0);
                for (let i = 0; i < aRows.length; ++i) {
                    aRows[i].Status = status;

                    oModel.callFunction("/SaveDockDetails", // function import name
                        {
                            method: "POST",
                            urlParameters: aRows[i],
                            groupId: "batchCallActionId"
                        });
                }
            }

            oModel.submitChanges({
                groupId: "batchCallActionId",
                success: function (oData) {
                    sap.ui.core.BusyIndicator.hide();
                    this.GlobaldDockedModel.setProperty("/AlreadyDockedDetails", oData.__batchResponses[0].__changeResponses[0].data.results);
                    this.GlobaldDockedModel.refresh();
                    var successText = oBundle.getText("successMsg");
                    MessageBox.success(successText, {
                        title: "Success"
                    });
                }.bind(this),
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    var HTTPfailed = oBundle.getText("HTTPfailed");
                    if (oError.message === HTTPfailed) {
                        MessageBox.error(oError.message, {
                            title: "Error"
                        });
                        return;
                    } else {
                        MessageBox.error(oError.message);
                    }
                }
            });
        },

    
        /**
         * Delete selected rows from docking panel
         * @param {*} oEvent 
         */
        onDeleteRowPress: function (oEvent) {
            var oTable = this.byId("idDockingTable"); 

            var aSelectedItems = oTable.getSelectedItems(); 
            if (aSelectedItems.length > 0) { 

            var oTableModel = this.getView().getModel("tableModel"); 
            var oData = oTableModel.getData(); // Remove selected rows 

            for (var i = aSelectedItems.length - 1; i >= 0; i--) 
            { 
            oData.rows.splice(oData.rows.indexOf(aSelectedItems[i].getBindingContext("tableModel").getObject()), 1); 
            } 
            oTableModel.refresh(true);
            } else { 
            var errorText = oBundle.getText("selectRowError"); MessageBox.error(errorText); 
            } },

         /**
         * Toggle between Docking and Already Docked sections
         */
        
        onSectionChange: function (oEvent) {

            var oSection = oEvent.getParameter("section");
            // var oModel =this.getView().getModel("tableModel");
             this.GlobaldDockedModel.setProperty("/selectedSection", oSection.getId());
        },

         /**
         * On export button press download an excel
         */
        onExportPress: function () {
            var oTable = this.byId("idDockedTable");
            var aSelectedContexts = oTable.getSelectedContexts();

            if (!aSelectedContexts.length) {
                //  No rows selected → show error and stop
                var selectRowExportError = oBundle.getText("selectRowExportError"); 
                MessageBox.error(selectRowExportError);
                return;
            }

            //  Collect selected row objects
            var aSelectedData = aSelectedContexts.map(function (oContext) {
                return oContext.getObject();
            });

            // Define Excel columns (map to your model properties)
            var aCols = [
                { label: "Way Bill No", property: "WayBillNum" },
                { label: "Quantity", property: "Quantity" },
                { label: "Unit", property: "Uom" },
                { label: "Damage", property: "DamageInd" },
                { label: "Damage Reason", property: "ResnForDamage" },
                { label: "Bin Location", property: "BinLocation" },
                { label: "Carrier", property: "CarrierHdr" },
                { label: "Docking Days", property: "DaysInDockng" },
                { label: "Docked By", property: "DockedBy" },
                { label: "Docked Time", property: "DockedTime" },
                { label: "Docked Date", property: "DockedDate" },
                { label: "Confirmed By", property: "ConfrmBy" },
                { label: "Confirmed Date", property: "CinfrmDate" },
                { label: "Status", property: "Status" }
            ];

            // Configure spreadsheet
            var oSettings = {
                workbook: { columns: aCols },
                dataSource: aSelectedData,
                fileName: "DockedDetails.xlsx",
                worker: false
            };

            var oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build()
                .then(function () {
                    var ExportSuccess = oBundle.getText("ExportSuccess");
                    MessageBox.success(ExportSuccess);
                })
                .finally(function () {
                    oSpreadsheet.destroy();
                });
        }

    })
});