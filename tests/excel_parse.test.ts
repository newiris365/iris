import * as XLSX from 'xlsx';

describe('Excel Parsing Logic', () => {
  it('should parse an Excel workbook in-memory and return headers and rawData', () => {
    // 1. Create a dummy workbook in memory using XLSX
    const sampleData = [
      { student_roll: 'CS23B1024', subject: 'Mathematics', date: '2026-06-01', status: 'present', method: 'manual', time_slot: '09:00-10:00' },
      { student_roll: 'CS23B1025', subject: 'Physics', date: '2026-06-01', status: 'absent', method: 'manual', time_slot: '10:00-11:00' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    // 2. Write the workbook as a binary buffer (representing what FileReader gets)
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const arrayBuffer = new Uint8Array(excelBuffer);

    // 3. Simulating processFile Excel parsing logic
    const readWorkbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = readWorkbook.SheetNames[0];
    expect(firstSheetName).toBe('Attendance');

    const readWorksheet = readWorkbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<any[]>(readWorksheet, { header: 1, defval: '' });

    expect(rawRows.length).toBe(3); // 1 header row + 2 data rows

    const headers = (rawRows[0] || []).map(h => String(h).trim()).filter(h => h !== '');
    expect(headers).toEqual(['student_roll', 'subject', 'date', 'status', 'method', 'time_slot']);

    const dataRows = rawRows.slice(1).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((h, index) => {
        obj[h] = row[index] !== undefined ? String(row[index]).trim() : '';
      });
      return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));

    expect(dataRows.length).toBe(2);
    expect(dataRows[0].student_roll).toBe('CS23B1024');
    expect(dataRows[0].subject).toBe('Mathematics');
    expect(dataRows[0].status).toBe('present');
    expect(dataRows[1].student_roll).toBe('CS23B1025');
    expect(dataRows[1].status).toBe('absent');
  });

  it('should ignore empty rows and columns in the workbook', () => {
    const rawRowsWithEmpties = [
      ['student_roll', 'subject', 'date', 'status', ''],
      ['CS23B1026', 'Chemistry', '2026-06-02', 'present', ''],
      ['', '', '', '', ''], // empty row
      ['CS23B1027', 'Biology', '2026-06-02', 'late', '']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rawRowsWithEmpties);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const arrayBuffer = new Uint8Array(excelBuffer);

    // Read and parse
    const readWorkbook = XLSX.read(arrayBuffer, { type: 'array' });
    const readWorksheet = readWorkbook.Sheets[readWorkbook.SheetNames[0]];
    const rawRowsParsed = XLSX.utils.sheet_to_json<any[]>(readWorksheet, { header: 1, defval: '' });

    const headers = (rawRowsParsed[0] || []).map(h => String(h).trim()).filter(h => h !== '');
    expect(headers).toEqual(['student_roll', 'subject', 'date', 'status']);

    const dataRows = rawRowsParsed.slice(1).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((h, index) => {
        obj[h] = row[index] !== undefined ? String(row[index]).trim() : '';
      });
      return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));

    expect(dataRows.length).toBe(2);
    expect(dataRows[0].student_roll).toBe('CS23B1026');
    expect(dataRows[1].student_roll).toBe('CS23B1027');
  });
});
