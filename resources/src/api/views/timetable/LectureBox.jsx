import React from 'react';

const DEFAULT_COLOR = { fg: '#1579C2', bg: '#94E6FE' };

const LectureBox = ({ length, course, classroom }) => {
    if (!course.color) { course.color = DEFAULT_COLOR; }
    const divStyle = {
      height: `${length * 20}px`,
      color: course.color.fg,
      backgroundColor: course.color.bg,
    };
    return (
      <div
        className={`course-div`}
        style={divStyle}
      >
        <div className="title-box">
          <p>{course.course_title}</p>
          <p><strong>{classroom}</strong></p>
        </div>
      </div>
     );
  };
  
export default LectureBox;
