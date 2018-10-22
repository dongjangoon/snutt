import log4js = require('log4js');

import NightmareService = require('@app/core/nightmare/NightmareService');
import Timetable from './model/Timetable';

let logger = log4js.getLogger();

export function renderTimetableAsPng(timetable: Timetable, width: number, height: number): Promise<Buffer> {
    let html = "<p>Timetable title: " + timetable.title + "</p>";
    return NightmareService.renderHtmlAsPng(html, width, height);
}
