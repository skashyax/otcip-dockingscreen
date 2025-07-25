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
        var oTableData = {
            rows: [
           
                {
                RMA_NO:  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/RMA"),
                WAREHOUSE:  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/WarehouseNo"),
                RmaNoHdr: this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/RMA"),
                WarehouseNo: this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/WarehouseNo"),
                CustomerHdr: this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/CustomerName"),
                OrderDateHdr: this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/OrderDate"),
                ServiceTypeHdr: this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/ServiceType"),
                ReturnReasonHdr: this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/RetReason"),
                ExpRetLocationHdr: this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/RetLoc"),
                CarrierHdr: this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/Carrier"),
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
                    "RMA_NO":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/RMA"),
                    "WAREHOUSE":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/WarehouseNo"),
                    "RmaNoHdr": this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/RMA"),
                    "WarehouseNo": this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/WarehouseNo"),
                    "CustomerHdr": this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/CustomerName"),
                    "OrderDateHdr": this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/OrderDate"),
                    "ServiceTypeHdr": this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/ServiceType"),
                    "ReturnReasonHdr": this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/RetReason"),
                    "ExpRetLocationHdr": this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/RetLoc"),
                    "CarrierHdr": this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/Carrier"),
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
    this.callAction4OData("CONFIRMED");
} else {
    MessageBox.error("Please fill Unit or measure and Quantity for all rows. Missing data in row(s): " + aInvalidRows.join(", "), {
        title: "Validation Error"
    });
}

},

// Save edited items in already docked

onDockedEditSavePress: function() {
    var oModel = this.getOwnerComponent().getModel("GlobalDockedModel");
    // Here, you can process/save the data as needed
    oModel.setProperty("/editMode", false);

    var oTable = this.byId("idDockedTable");
    var aSelectedItems = oTable.getSelectedItems();
    var aSelectedData = [];

    if (aSelectedItems.length === 0) {
        sap.m.MessageBox.warning("Please select at least one row to save.");
        return;
    }

    // Loop through selected items and extract their binding context data
    aSelectedItems.forEach(function (oItem) {
        var oContext = oItem.getBindingContext("GlobalDockedModel");
        var oRowData = oContext.getObject();
        aSelectedData.push(oRowData);
        this.getView().getModel("tableModel").setProperty("/rows",aSelectedData)
    });

    this.callAction4OData("CONFIRMED");

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
    var oModel = this.getOwnerComponent().getModel("GlobalDockedModel");
    oModel.setProperty("/editMode", false);
},

// On edit button press make save and cancel button visible and edit button invisible

onDockedEditPress: function() {

    var oModel = this.getOwnerComponent().getModel("GlobalDockedModel");
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
            this.getOwnerComponent().getModel("GlobalDockedModel").setProperty("/AlreadyDockedDetails",oData.__batchResponses[0].__changeResponses[0].data.results);
            this.getOwnerComponent().getModel("GlobalDockedModel").refresh();
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
    var oModel = this.getOwnerComponent().getModel("GlobalDockedModel");
    oModel.setProperty("/selectedSection", oSection.getId());
},

// On export button press download an excel

onExportPress: function () {

    var oModel= this.getOwnerComponent().getModel();
    var oPayload={
        "RMA_NO":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/RMA"),
        "WAREHOUSE":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/WarehouseNo"),
        "RmaNo":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/RMA"),
        "WarehouseNo":  this.getOwnerComponent().getModel("GlobalDockedModel").getProperty("/DockedHeaderDetails/WarehouseNo"),
      
    }

    oModel.callFunction("/exportDockDetails", // function import name
        {
            method: "POST",
            urlParameters: oPayload,
            // callback function for success
            success: function (oData, response) {
               
                // Validation of result 

                const sURL = sap.ui.require.toUrl(oData.results);
                // code block to perform download
                fetch(sURL)
                .then((oResponse) => oResponse.blob())
                .then((oBlob) => {
                    const sBlobURL = URL.createObjectURL(oBlob);
                    const oLink = document.createElement('a');
                    oLink.href = sBlobURL;
                    oLink.download = sURL.split('/').pop();
                    oLink.target = '_blank';
                    document.body.appendChild(oLink);
                    oLink.click();
                    document.body.removeChild(oLink);
                });

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

// Function triggered when file is uploaded from browse

// onFileChange: function (oEvent) {
//     var oObject = oEvent.getSource().getBindingContext("tableModel").getObject();
    
//     var file = oEvent.getParameter("files")[0];
//     oObject.FileName = oEvent.getParameter("files")[0].name;
//     var fileReader = new FileReader();
//     var readFile = function onReadFile(file) {
//         return new Promise(function (resolve) {
//             fileReader.onload = function (loadEvent) {
//             resolve(loadEvent.target.result.match(/,(.*)$/)[1]);
//             };
//         fileReader.readAsDataURL(file);
//         });
//     };
//     var readContent = readFile(file);

//     readContent.then((result) => {
//         oObject.FileContent = result;
//     });
// },

// Function triggered when Upload button is clicked in BulkUpload.
        //--------------------------------------------------------------------------------
        // onPressUpload: function () {
        //     let oModel = this.getView().getModel(),
        //         oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        //      let oFileUploader = this.byId("tableModel").getContent()[2].getItems()[1];

        //     if (oFileUploader.files.length === 0) {
        //         let sMessage = oBundle.getText("fileMissingError");
        //         MessageBox.error(sMessage, {
        //             dependentOn: this.getView()
        //         });
        //         this.getView().setBusy(false);
        //         return;
        //     }
 
        //     //Uploaded file type and name
        //     var fileType = oFileUploader.oFileUpload.files[0].type;
        //     var fileName = oFileUploader.oFileUpload.files[0].name;
 
        //     //if file type is .xlsx
        //     if (fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
 
        //         oModel.callFunction("/ActionForUpload", // function import name
        //             {
        //                 method: "POST",
        //                 urlParameters: {
                      
        //                     "Filename": fileName,
        //                     "Attachment": fileContent,
        //                     "Mimetype": fileType,
 
        //                 },
 
        //                 // callback function for success
        //                 success: function (oData, response) {
        //                     var responseData = JSON.parse(response.headers['sap-message']);
        //                     var responseType = responseData.severity;
        //                     var responseMsg = responseData.message;
        //                     //var sMessage = oBundle.getText(responseType);
 
        //                     if (responseType = 'error' ) {
        //                         MessageBox.error(responseMsg);
        //                     } else {
        //                         MessageBox.success(responseMsg);
        //                     }
        //                 }.bind(this),
 
        //                 // callback function for error
        //                 error: function (oError) {
        //                     try {
        //                         var errorResponse = JSON.parse(oError.responseText);
        //                         var errorMessage = errorResponse.error.message.value;
 
        //                         MessageBox.error(errorMessage);
        //                     } catch (e) {
        //                         MessageBox.error(oError.responseText); //"An error occurred while processing the error message."
        //                     } finally {
        //                         this.getView().setBusy(false);
        //                     }
 
        //                 }.bind(this)
        //             });
        //     }
        //     this.byId("tableModel").close();
        // },
	
})});