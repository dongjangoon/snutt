import xlsx = require('xlsx');
import ExcelSheetWrapper from './model/ExcelSheetWrapper';

export function getFirstSheetFromBuffer(buffer: Buffer): ExcelSheetWrapper {
    let workbook = xlsx.read(buffer, {type:"buffer"});
    let sheet = workbook.Sheets[workbook.SheetNames[0]];
    return new ExcelSheetWrapper(sheet);
}
