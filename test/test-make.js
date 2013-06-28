
var expect = require('chai').expect
  , fs = require('fs')
  , path = require('path')
  , make = require('../lib/make')
  , yaml = require('js-yaml');

// , splitFixtures = require('split-fixtures');

function processSplit(fname, parts) {
  var rules = yaml.safeLoad(parts[1], {
    filename: fname,
    strict: true
  });
  for (var key in rules) {
    rules[key] = rules[key].split('\n');
  }
  return [parts[0], rules];
}

function loadFixtures(fname, process) {
  var text = fs.readFileSync(path.join(__dirname, fname))
    .toString('utf8').split('\n===\n');
  return text.map(function (chunk, i) {
    var parts = chunk.split('\n---\n')
    return process ? process(fname + '::' + i, parts) : parts;
  });
}

var fixtures = {
  split: loadFixtures('split-fixtures.yaml', processSplit),
  merge: loadFixtures('merge-fixtures.yaml')
};

describe('splitMakes', function () {
  fixtures.split.forEach(function (item, i) {
    it('should split fixture ' + i + ' correctly', function () {
      expect(make.split(item[0]).rules).to.eql(item[1]);
    });
  });
});

describe('merge', function () {
  fixtures.merge.forEach(function (item, i) {
    it('should merge fixture ' + i + ' correctly', function () {
      expect(make.merge(item[0], item[1]).trim()).to.equal(item[2].trim());
    });
  });
});
