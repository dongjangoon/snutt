import assert = require('assert');
import supertest = require('supertest');
import TagListService = require('@app/core/taglist/TagListService');

export = function(request: supertest.SuperTest<supertest.Test>) {
  it ('Insert tag lists', async function() {
    await TagListService.merge({year: 2015, semester: 1, tags: {
        classification: ['교양'],
        department: ["컴퓨터공학부"],
        academic_year: ["1학년"],
        credit: [ "1학점", "2학점" ],
        instructor: [ "장병탁" ],
        category: ["인간과 사회"],
        etc: []
    }});
  });

  it ('Find by semester', async function() {
    let tagList = await TagListService.getBySemester(2015, 1);
    assert.equal(tagList.tags.classification[0], '교양');
    assert.equal(tagList.tags.instructor[0], '장병탁');
    assert.equal(typeof tagList.updated_at, "number");
  });

  it ('Update tag lists', async function() {
    await TagListService.merge({year: 2015, semester: 1, tags: {
        classification: ['교양'],
        department: ["컴퓨터공학부"],
        academic_year: ["1학년"],
        credit: [ "1학점", "2학점" ],
        instructor: [ "문병로" ],
        category: ["인간과 사회"],
        etc: []
    }});
    let updated = await TagListService.getBySemester(2015, 1);
    assert.equal(updated.tags.instructor[0], '문병로');
  });
}

