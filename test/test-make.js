
var expect = require('chai').expect
  , fs = require('fs')
  , path = require('path')
  , make = require('../lib/make')
  , yaml = require('js-yaml');

// , splitFixtures = require('split-fixtures');

function loadFixture(fname) {
  var text = fs.readFileSync(path.join(__dirname, fname))
    .toString('utf8').split('\n===\n');
  return text.map(function (chunk, i) {
    var parts = chunk.split('\n---\n')
      , rules = yaml.safeLoad(parts[1], {
          filename: fname + '::' + i,
          strict: true
        });
    for (var key in rules) {
      rules[key] = rules[key].split('\n');
    }
    return [parts[0], rules];
  });
}

var fixtures = {
  split: loadFixture('split-fixtures.yaml')
};

describe('splitMakes', function () {
  fixtures.split.forEach(function (item, i) {
    it('should split fixture ' + i + ' correctly', function () {
      expect(make.split(item[0]).rules).to.eql(item[1]);
    });
  });
});
