var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");
const { ThreadPaneColumns } = ChromeUtils.importESModule("chrome://messenger/content/thread-pane-columns.mjs");

const ids = [];

var customColumns = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    context.callOnClose(this);
    return {
      customColumns: {
        async add(id, name, field) {
          ids.push(id);

          function getRecipient(message) {
            return message.recipients.split(',').reduce((acc, curr) => (acc == "" ? "" : acc + ", ") + (curr.includes(">") ? [...curr.matchAll(/[^<]+(?=>)/g)].join(', ') : curr), "");
          }

          function getSender(message) {
            return message.author.replace(/.*</, "").replace(/>.*/, "");
          }

          function getEmpty(message) {
            return "";
          }

          var callback = field == "recipient" ? getRecipient : field == "sender" ? getSender : getEmpty;

          ThreadPaneColumns.addCustomColumn(id, {
            name: name,
            hidden: false,
            icon: false,
            resizable: true,
            sortable: true,
            textCallback: callback
          });
        },

        async remove(id) {
          ThreadPaneColumns.removeCustomColumn(id);
          ids.remove(id);
        }
      },
    };
  }

  close() {
    for (const id of ids)
    {
      ThreadPaneColumns.removeCustomColumn(id);
    }
  }
};
