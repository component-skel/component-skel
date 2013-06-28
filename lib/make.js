
var fs = require('fs')
  , path = require('path');

var makeTargets = /^[\w%.\/-_]+:( |$)/;

function splitMake(source) {
  var lines = source.split(/\n/g)
    , sections = []
    , rules = {}
    , phony = []
    , last;
  lines.forEach(function (line) {
    var parts;
    if (line.slice(0, 8) === '.PHONY: ') {
      phony = line.slice(8).split(' ');
      return;
    }
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
  return {rules: rules, sections: sections, phony: phony};
}

function mergeMakes(fromPath, toPath) {
  var sourceText = fs.readFileSync(path.join(fromPath, 'Makefile')).toString('utf8')
    , destText = fs.readFileSync(path.join(toPath, 'Makefile')).toString('utf8')
    , source = splitMake(sourceText)
    , dest = splitMake(destText);

  for (var name in source.rules) {
    if (dest.rules[name]) {
      dest.sections.splice(dest.sections.indexOf(dest.rules[name]), 1);
    }
  }
}

module.exports = {
  merge: mergeMakes,
  split: splitMake
};

