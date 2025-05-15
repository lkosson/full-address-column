var ThreadPaneColumns;
try
{
  ({ ThreadPaneColumns } = ChromeUtils.importESModule("chrome://messenger/content/thread-pane-columns.mjs"));
}
catch (err)
{
  ({ ThreadPaneColumns } = ChromeUtils.importESModule("chrome://messenger/content/ThreadPaneColumns.mjs"));
}

const ids = [];

const fn__deduplicate = arr => [...new Set(arr)]

const fn__string_to_addresses = mail_string => mail_string.replaceAll(/".*?"/g, '').split(',')
const fn__normalize_address = mail => mail.replace(/^.*?</, '').replace(/>.*$/, '').trim()

const fn__address_to_domain = x => x.replace(/^.*@/, '')

const extract_unique_normalized_addresses = addresses_string => fn__deduplicate(fn__string_to_addresses(addresses_string).map(x => fn__normalize_address(x)))
const extract_unique_domains = addresses_string => extract_unique_normalized_addresses(addresses_string).map(x => fn__address_to_domain(x))

var customColumns = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    context.callOnClose(this);
    return {
      customColumns: {
        async add(id, name, field) {
          ids.push(id);

          const initiallyHidden = field.search(/domain/i) !== -1;

          const callbacks = {
            sender: function (message) {
              return extract_unique_normalized_addresses(message.author)[0]
            },

            sender_domain: function (message) {
              return fn__address_to_domain(extract_unique_normalized_addresses(message.author)[0]);
            },

            recipients: function (message) {
              return extract_unique_normalized_addresses(message.recipients).join(', ')
            },

            recipients_domains: function (message) {
              return extract_unique_domains(message.recipients).join(', ')
            },
          }

          ThreadPaneColumns.addCustomColumn(id, {
            name: name,
            hidden: initiallyHidden,
            icon: false,
            resizable: true,
            sortable: true,
            textCallback: callbacks[field],
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
    for (const id of ids) {
      ThreadPaneColumns.removeCustomColumn(id);
    }
  }
};
