
var fs = require('fs')
  , path = require('path');

var makeTargets = /^[\w%.\/-_]+:( |$)/;

function splitMake(source) {
  var lines = source.split(/\n/g)
    , sections = []
    , rules = {}
    , phony = []
    , last = [];
  sections.push(last);
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

function unique(array) {
  return array.filter(function (item, i) {
    return array.indexOf(item) == i;
  });
}

function mergeMakeFiles(fromPath, toPath) {
  var sourceText = fs.readFileSync(path.join(fromPath, 'Makefile')).toString('utf8')
    , destText = fs.readFileSync(path.join(toPath, 'Makefile')).toString('utf8')
    , finalText = mergeMakes(destText, sourceText);
  fs.writeFileSync(path.join(toPath, 'Makefile'), finalText);
}

function mergeMakes(sourceText, destText) {
  var source = splitMake(sourceText)
    , dest = splitMake(destText)
    , sections
    , phony;

  for (var name in dest.rules) {
    if (source.rules[name]) {
      source.sections.splice(source.sections.indexOf(source.rules[name]), 1);
    }
  }
  phony = unique(source.phony.concat(dest.phony));
  sections = source.sections.concat(dest.sections);
  sections.push(['.PHONY: ' + phony.join(' ')]);
  return '\n' + sections.map(function(chunk){return chunk.join('\n');})
           .join('\n').trim().replace(/\n\n\n+/g, '\n\n');
}

module.exports = {
  mergeFiles: mergeMakeFiles,
  merge: mergeMakes,
  split: splitMake
};

