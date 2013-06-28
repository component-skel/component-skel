
var fs = require('fs')
  , path = require('path')
  , debug = require('debug')('component:skel')
  , exists = fs.existsSync || path.existsSync
  , defaultSkelDir = path.join(process.env['HOME'], '.component/skel');

function Installer(comp, baseDir, skelDir) {
  this.comp = comp;
  this.skelDir = skelDir || defaultSkelDir;
  this.baseDir = baseDir || process.cwd();
  this.skels = {};
  this.installed = [];
  this.vars = {};
  this.loadSkels();
  this.prepareVars();
}

function fatal(message) {
  console.log(message);
  process.exit(1);
}

Installer.prototype = {
  prepareVars: function () {
    this.vars.fullName = this.comp.name;
    var parts = this.comp.name.split('/');
    this.vars = {
      fullName: this.comp.name,
      name: parts[1],
      namespace: parts[0],
      title: parts[1][0].toUpperCase() + parts[1].slice(1)
    };
  },
  loadSkels: function () {
    var items = fs.readdirSync(this.skelDir)
      , self = this;
    items.filter(function (item) {
      return exists(path.join(self.skelDir, item, 'skel.json'));
    }).forEach(function (item) {
      var fullPath = path.join(self.skelDir, item, 'skel.json')
        , config = require(fullPath);
      config.fullPath = fullPath;
      config.dirname = item;
      if (self.skels[config.name]) {
        console.log('Warning: multiple skeletons with the same name - ' + item.name);
        console.log('  Only one will be usable. Please rename.');
      }
      self.skels[config.name] = config;
    });
  },
  install: function (skels) {
    skels.forEach(this.installOne.bind(this));
  },
  installOne: function (name) {
    if (this.installed[name]) {
      debug('Already installed ' + name + ' skipping.');
      return;
    }
    if (!this.skels[name]) {
      fatal('Skeleton "' + name + '" not found. Exiting.');
    }
    var skel = this.skels[name];
    skel.extends && skel.extends.forEach(this.installOne.bind(this));
    // process makefile
    // add files, processing 
};

module.exports = Installer;
