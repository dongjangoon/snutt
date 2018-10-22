import React from 'react';

import LectureBox from './LectureBox.jsx';
import TableHeader from './TableHeader.jsx';
import TableBody from './TableBody.jsx';

const NUM_SLOTS = 32;
const NUM_DAY = 7;

const Timetable = ({ courses }) => {
  const lectureBoxes = new Array(NUM_DAY).fill(0).map(() => new Array(NUM_SLOTS));
  for (const course of courses) {
    for (const lecture of course.class_time_json) {
      const day = lecture.day;
      lectureBoxes[day][lecture.start * 2] = (
        <LectureBox
          course={course}
          length={lecture.len * 2}
          classroom={lecture.place}
        />
      );
    }
  }

  let hasSunday = lectureBoxes[6].filter(v => Boolean(v)).length > 0;

  return (
    <div id="container-fluid">
      <table className="table timetable">
        <TableHeader hasSunday={hasSunday} />
        <TableBody
          hasSunday={hasSunday}
          lectureBoxes={lectureBoxes}
        />
      </table>
    </div>
  );
};

export default Timetable;
