sap.ui.define([
    "sap/ui/core/mvc/Controller",
    	'sap/ui/core/Fragment',
        "sap/m/MessageBox",
], (Controller, Fragment, MessageBox) => {
    "use strict";

    return Controller.extend("com.intel.otcip.dockingscreen.controller.Docking", {
      onInit: function() {

        sap.ui.getCore().loadLibrary("sap.ui.core");
        jQuery.sap.includeStyleSheet("../css/docking.css");          
        //Data for the docking table and initialize data
        this.GlobaldDockedModel=this.getOwnerComponent().getModel("GlobalDockedModel"); 

        var oTableData = {
            rows: [
           
                {
                RMA_NO:  this.GlobaldDockedModel.getProperty("/RMA"),
                WAREHOUSE:  this.GlobaldDockedModel.getProperty("/WarehouseNo"),
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
                Status: ""
                }
            
            ]
        };

        var oTableModel = new sap.ui.model.json.JSONModel(oTableData);
        this.getView().setModel(oTableModel, "tableModel");

        setTimeout(() => {
            var oDP = this.byId("editValueDateIdDP");
            if (oDP) {
                oDP.setMaxDate(new Date());
            }
        }, 1000);

        
        },
        
        // Method to add row on docking panel

        onAddRowPress: function() {
        var oTableModel = this.getView().getModel("tableModel");
        var oData = oTableModel.getData();

        var oNewRow = {
                    "RMA_NO":  this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RMA"),
                    "WAREHOUSE":  this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/WarehouseNo"),
                    "RmaNoHdr": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RMA"),
                    "WarehouseNo": this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/WarehouseNo"),
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

        // Add the new row to the existing rows
        oData.rows.push(oNewRow);

        // Refresh the model to update the table binding
        oTableModel.refresh(true);
},

// On save button press and call backend

onSavePress: function() {

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
            aInvalidRows.push(i + 1); // Row number (1-based index)
        }
    }

    if (bValid) {
        this.GlobaldDockedModel.setProperty("/save",true);
        this.callAction4OData("SAVE");
    } else {
        MessageBox.error("Please fill Unit or measure and Quantity for all rows. Missing data in row(s): " + aInvalidRows.join(", "), {
            title: "Validation Error"
        });
    }
},

// On confirm button press and call backend

onConfirmPress: function(oEvent) {
// send to backend 

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
        aInvalidRows.push(i + 1); // Row number (1-based index)
    }
}

if (bValid) {
    this.GlobaldDockedModel.setProperty("/save",false);
    this.callAction4OData("CONFIRMED");
} else {
    MessageBox.error("Please fill Unit or measure and Quantity for all rows. Missing data in row(s): " + aInvalidRows.join(", "), {
        title: "Validation Error"
    });
}

},

// Save edited items in already docked

onDockedSaveConfirmPress: function() {
    var oModel = this.GlobaldDockedModel;
    // Here, you can process/save the data as needed
    oModel.setProperty("/editMode", false);

    var oTable = this.byId("idDockedTable");
    var aSelectedItems = oTable.getSelectedItems();
    var aSelectedData = [];

    if (aSelectedItems.length === 0) {
        sap.m.MessageBox.warning("Please select at least one row to save and confirm.");
        return;
    }

    // Loop through selected items and extract their binding context data
    aSelectedItems.forEach(function (oItem) {
        var oContext = oItem.getBindingContext("GlobalDockedModel");
        var oRowData = oContext.getObject();
        aSelectedData.push(oRowData);
        this.getView().getModel("tableModel").setProperty("/rows",aSelectedData);
        this.GlobaldDockedModel.setProperty("/save",false);
        this.callAction4OData("CONFIRMED");
    });

    

},

// Method triggered when Asset is selected from the Asset Table
onSelectAsset(oEvent) {

    var status=oEvent.getParameter("listItem").getBindingContext("GlobalDockedModel").getObject().Status;

    if(status !== "SAVE" && oEvent.getParameter("selected")){
        MessageBox.error("Please select only save status record.", {
            title: "Error"
        });
        oEvent.getParameter("listItem").setSelected(false)
    }
    return
},

 // Cancel edited items in already docked

onDockedEditCancelPress: function() {
    var oModel = this.GlobaldDockedModel;
    oModel.setProperty("/editMode", false);
},

// On edit button press make save and cancel button visible and edit button invisible

onDockedEditPress: function() {

    var oModel = this.GlobaldDockedModel;
    // Set the edit mode to true to enable editing
    oModel.setProperty("/editMode", true);
},

// Method called on save, edit and confirm button press for multiple line items(i.e. Batch call)

callAction4OData: function (status) {
    var oTableModel = this.getView().getModel("tableModel");
    var aRows = oTableModel.getProperty("/rows");
    var oModel = this.getView().getModel();
    let aDeferredGroups = oModel.getDeferredGroups();
    aDeferredGroups.push("batchCallActionId");
    oModel.setDeferredGroups(aDeferredGroups);
    if (aRows.length) {
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
            this.GlobaldDockedModel.setProperty("/AlreadyDockedDetails",oData.__batchResponses[0].__changeResponses[0].data.results);
            this.GlobaldDockedModel.refresh();
            MessageBox.success("Records Successfully Updated", {
                title: "Success"
            });
        }.bind(this),
        error: function (oError) {
            if (oError.message === "HTTP request failed") {
                MessageBox.error(oError.message, {
                    title: "Error"
                });
                return;
            }
        }
    });
},

// Delete selected rows from docking panel

onDeleteRowPress: function(oEvent) {
        var oTable = this.byId("idDockingTable");
        var aSelectedItems = oTable.getSelectedItems();

        if (aSelectedItems.length > 0) {
            var oTableModel = this.getView().getModel("tableModel");
            var oData = oTableModel.getData();
            // Remove selected rows
            for (var i = aSelectedItems.length - 1; i >= 0; i--) {
                oData.rows.splice(oData.rows.indexOf(aSelectedItems[i].getBindingContext("tableModel").getObject()), 1);
            }
            // Refresh the model to update the table binding
            oTableModel.refresh(true);
           
        } else {
            sap.m.MessageToast.show("Please select a row to delete.");
        }
    },

//Toggle between Docking and Already Docked sections
onSectionChange: function(oEvent) {
   
    var oSection = oEvent.getParameter("section");
    var oModel = this.GlobaldDockedModel;
    oModel.setProperty("/selectedSection", oSection.getId());
},

// On export button press download an excel

onExportPress: function () {

    var oModel= this.getOwnerComponent().getModel();
    var oPayload={
        "RMA_NO":  this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RMA"),
        "WAREHOUSE":  this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/WarehouseNo"),
        "RmaNo":  this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/RMA"),
        "WarehouseNo":  this.GlobaldDockedModel.getProperty("/DockedHeaderDetails/WarehouseNo"),
      
    }

    oModel.callFunction("/exportDockDetails", // function import name
        {
            method: "POST",
            urlParameters: oPayload,
            // callback function for success
            success: function (oData, response) {
          

                MessageBox.success(oData.results[0].Message,{
                    title:"Success"
                });
               
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


	
})});