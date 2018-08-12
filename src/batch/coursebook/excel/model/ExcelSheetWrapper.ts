import xlsx = require('xlsx');

export default class ExcelSheetWrapper {
    private sheet: xlsx.WorkSheet;
    constructor (sheet: xlsx.WorkSheet) {
      this.sheet = sheet;
    }
  
    getRowSize(): number {
      return xlsx.utils.decode_range(this.sheet['!ref']).e.r + 1;
    }
  
    getCell(r: number, c: number): string {
      let obj:xlsx.CellObject = this.sheet[xlsx.utils.encode_cell({r: r, c: c})];
      return <string>obj.v;
    }
}
