
var fs = require('fs')
  , path = require('path');

var makeTargets = /^[\w%.\/-_]+:( |$)/;

function splitMake(source) {
  var lines = source.split(/\n/g)
    , sections = []
    , rules = {}
    , last;
  lines.forEach(function (line) {
    var parts;
    if (line.trim().length == 0 || line[0] === '\t') {
      last.push(line);
    } else {
      last = [line];
      sections.push(last);
      if (makeTargets.test(line)) {
        parts = line.split(':');
        rules[parts[0]] = last;
      }
    }
  });
  return {rules: rules, sections: sections};
}

function mergeMakes(fromPath, toPath) {
  var source = fs.readFileSync(path.join(fromPath, 'Makefile')).toString('utf8')
    , dest = fs.readFileSync(path.join(toPath, 'Makefile')).toString('utf8');
}

module.exports = {
  merge: mergeMakes,
  split: splitMake
};

