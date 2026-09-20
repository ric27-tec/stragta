# Contact integrations

The live contact page calls one adapter: `assets/js/contact.js`.

## Current Google Apps Script adapter

`google-apps-script/contact-form.gs` is the server-side receiver. It validates two honeypot fields, rejects unrealistically fast and malformed submissions, suppresses duplicates, applies an hourly ceiling, sends accepted enquiries by email, records them in a Sheet, and removes rows older than 180 days.

Set these Apps Script properties before deployment:

- `STRAGTA_CONTACT_SHEET_ID`: required destination spreadsheet ID.
- `STRAGTA_CONTACT_EMAIL`: optional recipient; defaults to `stragta0@gmail.com`.
- `STRAGTA_CONTACT_SHEET_NAME`: optional worksheet name; defaults to `SFORM`.

After deployment, set `CONTACT_ENDPOINT` in `assets/js/contact.js` to the new web-app URL.

## Future Odoo adapter

Keep the public fields and first-layer privacy text on `/contact/` and `/es/contacto/`. Replace the endpoint and submission code inside `assets/js/contact.js` with the Odoo CRM form or lead-creation adapter. Review the privacy policy, recipients, retention, lawful basis, and international-transfer text before publishing the Odoo integration.
