// This Source Code Form is subject to the terms of the
// GNU General Public License, version 3.0.
var { AppConstants } = ChromeUtils.import("resource://gre/modules/AppConstants.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

const senderColumnHandler = {
  init(win) { this.win = win; },
  getCellText(row, col) { return this.getAddress(this.win.gDBView.getMsgHdrAt(row)); },
  getSortStringForRow(hdr) { return this.getAddress(hdr); },
  isString() { return true; },
  getCellProperties(row, col, props) {},
  getRowProperties(row, props) {},
  getImageSrc(row, col) { return null; },
  getSortLongForRow(hdr) { return 0; },
  getAddress(aHeader) { return aHeader.author.replace(/.*</, "").replace(/>.*/, ""); },
};

const recipientColumnHandler = {
  init(win) { this.win = win; },
  getCellText(row, col) { return this.getAddress(this.win.gDBView.getMsgHdrAt(row)); },
  getSortStringForRow(hdr) { return this.getAddress(hdr); },
  isString() { return true; },
  getCellProperties(row, col, props) {},
  getRowProperties(row, props) {},
  getImageSrc(row, col) { return null; },
  getSortLongForRow(hdr) { return 0; },
  formatAddress(acc, val) { return (acc == "" ? "" : acc + ", ") + (val.includes(">") ? [...val.matchAll(/[^<]+(?=>)/g)].join(', ') : val); },
  getAddress(aHeader) { return aHeader.recipients.split(',').reduce(this.formatAddress, ""); },
};

const columnOverlay = {
  init(win) {
    this.win = win;
    this.addColumns(win);
  },

  destroy() {
    this.destroyColumns();
  },

  observe(aMsgFolder, aTopic, aData) {
    try {
      senderColumnHandler.init(this.win);
      recipientColumnHandler.init(this.win);
      this.win.gDBView.addColumnHandler("senderAddressColumn", senderColumnHandler);
      this.win.gDBView.addColumnHandler("recipientAddressColumn", recipientColumnHandler);
    } catch (ex) {
      console.error(ex);
      throw new Error("Cannot add column handler");
    }
  },

  addColumn(win, columnId, columnLabel) {
    if (win.document.getElementById(columnId)) return;

    const treeCol = win.document.createXULElement("treecol");
    treeCol.setAttribute("id", columnId);
    treeCol.setAttribute("persist", "hidden ordinal sortDirection width");
    treeCol.setAttribute("flex", "2");
    treeCol.setAttribute("closemenu", "none");
    treeCol.setAttribute("label", columnLabel);
    treeCol.setAttribute("tooltiptext", "Full e-mail address");

    const threadCols = win.document.getElementById("threadCols");
    threadCols.appendChild(treeCol);

    // Restore persisted attributes.
    let attributes = Services.xulStore.getAttributeEnumerator(
      this.win.document.URL,
      columnId
    );
    for (let attribute of attributes) {
      let value = Services.xulStore.getValue(this.win.document.URL, columnId, attribute);
      // See Thunderbird bug 1607575 and bug 1612055.
      if (attribute != "ordinal" || parseInt(AppConstants.MOZ_APP_VERSION, 10) < 74) {
        treeCol.setAttribute(attribute, value);
      } else {
        treeCol.ordinal = value;
      }
    }

    Services.obs.addObserver(this, "MsgCreateDBView", false);
  },

  addColumns(win) {
    this.addColumn(win, "senderAddressColumn", "Sender (@)");
    this.addColumn(win, "recipientAddressColumn", "Recipient (@)");
  },

  destroyColumn(columnId) {
    const treeCol = this.win.document.getElementById(columnId);
    if (!treeCol) return;
    treeCol.remove();
  },

  destroyColumns() {
    this.destroyColumn("senderAddressColumn");
    this.destroyColumn("recipientAddressColumn");
    Services.obs.removeObserver(this, "MsgCreateDBView");
  },
};

var FACHeaderView = {
  init(win) {
    this.win = win;
    columnOverlay.init(win);

    // Usually the column handler is added when the window loads.
    // In our setup it's added later and we may miss the first notification.
    // So we fire one ourserves.
    if (win.gDBView && win.document.documentElement.getAttribute("windowtype") == "mail:3pane") {
      Services.obs.notifyObservers(null, "MsgCreateDBView");
    }
  },

  destroy() {
    columnOverlay.destroy();
  },
};
