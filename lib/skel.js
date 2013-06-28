
var fs = require('fs')
  , path = require('path')
  , exists = fs.existsSync || path.existsSync
  , userDir = '/Users/jared/'
  , skelDir = path.join(userDir, '.component/skel');

module.exports = {
  list: function () {
    var items = fs.readdirSync(skelDir);
    return items.filter(function (item) {
      return exists(path.join(skelDir, item, 'skel.json'));
    }).map(function (item) {
      return require(path.join(skelDir, item, 'skel.json'));
    });
  },
  getAll: function () {
    var obj = {};
    module.exports.list().forEach(function (item) {
      if (obj[item.name]) {
        console.log('Warning: multiple skeletons with the same name - ' + item.name);
        console.log('  Only one will be usable. Please rename.');
      }
      obj[item.name] = item;
    });
    return obj;
  }
};

