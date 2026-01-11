import { sheets_v4 } from 'googleapis';

export const newSheetTemplate: sheets_v4.Schema$Spreadsheet = {
  properties: {
    title: 'WhatsApp Bot Data',
  },
  sheets: [
    {
      properties: {
        title: 'Blood Sugar',
        gridProperties: {
          frozenRowCount: 1,
        },
      },
      data: [
        {
          startRow: 0,
          startColumn: 0,
          rowData: [
            {
              values: [
                {
                  userEnteredValue: { stringValue: 'Date' },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 }, // Dark Grey
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, // White text
                      bold: true,
                      fontSize: 11,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                },
                {
                  userEnteredValue: { stringValue: 'Time' },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 }, // Dark Grey
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, // White text
                      bold: true,
                      fontSize: 11,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                },
                {
                  userEnteredValue: { stringValue: 'Type' },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    horizontalAlignment: 'CENTER',
                  },
                },
                {
                  userEnteredValue: { stringValue: 'Value (mg/dL)' },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    horizontalAlignment: 'CENTER',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      properties: {
        title: 'Blood Pressure',
        gridProperties: {
          frozenRowCount: 1,
        },
      },
      data: [
        {
          startRow: 0,
          startColumn: 0,
          rowData: [
            {
              values: [
                {
                  userEnteredValue: { stringValue: 'Date' },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 }, // Dark Grey
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, // White text
                      bold: true,
                      fontSize: 11,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                },
                {
                  userEnteredValue: { stringValue: 'Time' },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 }, // Dark Grey
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, // White text
                      bold: true,
                      fontSize: 11,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                },
                {
                  userEnteredValue: { stringValue: 'Systolic Value (mmHg)' },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    horizontalAlignment: 'CENTER',
                  },
                },
                {
                  userEnteredValue: { stringValue: 'Diastolic Value (mmHg)' },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    horizontalAlignment: 'CENTER',
                  },
                },
                {
                  userEnteredValue: { stringValue: 'Heart Rate (bpm)' },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    horizontalAlignment: 'CENTER',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      properties: {
        title: 'User Profiles',
        tabColor: { red: 0.0, green: 0.6, blue: 0.0 }, // Optional: Adds a green tab color
        gridProperties: {
          rowCount: 1,
          columnCount: 1,
        },
        hidden: true,
      },
    },
  ],
};
