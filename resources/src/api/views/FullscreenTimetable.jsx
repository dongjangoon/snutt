import React from 'react';

import Timetable from './timetable/Timetable.jsx';

const FullscreenTimetable = ({ timetable }) => {
    return (
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, user-scalable=no" />
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7"
                crossorigin="anonymous" />
            <link rel="stylesheet" href="" />
        </head>
        
        <body>
            <Timetable
                courses={timetable.lecture_list}
            />
        </body>
        </html>
    );
  };

export default FullscreenTimetable;
