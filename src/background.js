// Following code is based on example posted by John Bieling
// https://bugzilla.mozilla.org/show_bug.cgi?id=1615801

// Helper function for easy looping over message lists. See
// https://webextension-api.thunderbird.net/en/latest/how-to/messageLists.html
/*
async function* getMessages(list) {
    let page = await list;
    for (let message of page.messages) {
        yield message;
    }

    while (page.id) {
        page = await messenger.messages.continueList(page.id);
        for (let message of page.messages) {
            yield message;
        }
    }
}
*/
// Function to retrieve the value to be displayed in a custom column for a
// given message.
function getCustomColumnCellValue(columnId, message) {
    switch (columnId) {
        case "senderColumn":
            return {
                messageId: message.id,
                data: {
                    text: message.author.replace(/.*</, "").replace(/>.*/, ""),
                }
            }
        case "recipientColumn":
            return {
                messageId: message.id,
                data: {
                    text: message.recipients.reduce((acc, curr) => (acc == "" ? "" : acc + ", ") + (curr.includes(">") ? [...curr.matchAll(/[^<]+(?=>)/g)].join(', ') : curr), ""),
                }
            }
        default: throw new Error(`Unknown column: ${columnId}`);
    }
}

// Register the onCellEntriesShown listener before adding the column, to make
// sure we are not missing the initial event.
browser.mailTabs.onCellEntriesShown.addListener((columnId, entries) => {
    let cellUpdates = [];
    for (let entry of entries) {
        cellUpdates.push(getCustomColumnCellValue(columnId, entry.messageHeader));
    }
    browser.mailTabs.setCellData(columnId, cellUpdates)
})

browser.mailTabs.addColumn("senderColumn", {
    name: "Sender (@)",
    sortable: "byTextContent",
    hidden: false,
    resizable: true
})

browser.mailTabs.addColumn("recipientColumn", {
    name: "Recipient (@)",
    sortable: "byTextContent",
    hidden: false,
    resizable: true
})

// Force an update of the threadPane, after a folder has been changed. This
// is optional and helps minimizing showing empty cells on scroll, but might
// have a performance impact on large folders.
/*
browser.mailTabs.onDisplayedFolderChanged.addListener(async (tab, folder) => {
    let cellUpdatesSender = [];
    let cellUpdatesRecipient = [];
    let messages = getMessages(browser.mailTabs.getListedMessages(tab.Id));
    for await (let message of messages) {
        cellUpdatesSender.push(getCustomColumnCellValue("senderColumn", message));
        cellUpdatesRecipient.push(getCustomColumnCellValue("recipientColumn", message));
    }
    browser.mailTabs.setCellData("senderColumn", cellUpdatesSender);
    browser.mailTabs.setCellData("recipientColumn", cellUpdatesRecipient)
});
*/