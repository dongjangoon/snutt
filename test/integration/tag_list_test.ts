import assert = require('assert');
import TagListService = require('@app/core/taglist/TagListService');

export = function(app, db, request) {
  it ('Insert tag lists', async function() {
    await TagListService.merge({year: 2015, semester: 1, tags: {
        classification: ['교양'],
        department: ["컴퓨터공학부"],
        academic_year: ["1학년"],
        credit: [ "1학점", "2학점" ],
        instructor: [ "장병탁" ],
        category: ["인간과 사회"]
    }});
  });

  it ('Find by semester', async function() {
    let tagList = await TagListService.getBySemester(2015, 1);
    assert.equal(tagList.tags.classification[0], '교양');
    assert.equal(tagList.tags.instructor[0], '장병탁');
  });

  it ('Update tag lists', async function() {
    await TagListService.merge({year: 2015, semester: 1, tags: {
        classification: ['교양'],
        department: ["컴퓨터공학부"],
        academic_year: ["1학년"],
        credit: [ "1학점", "2학점" ],
        instructor: [ "문병로" ],
        category: ["인간과 사회"]
    }});
    let updated = await TagListService.getBySemester(2015, 1);
    assert.equal(updated.tags.instructor[0], '문병로');
  });
}

