
var fs = require('fs')
  , path = require('path')
  , wrench = require('wrench')
  , _ = require('underscore')
  , glob = require('glob')
  , minimatch = require('minimatch')

  , make = require('./make')
  , debug = require('debug')('component:skel')
  , exists = fs.existsSync || path.existsSync
  , defaultSkelDir = path.join(process.env['HOME'], '.component/skel');

function Installer(comp, baseDir, skelDir) {
  this.comp = comp;
  this.skelDir = skelDir || defaultSkelDir;
  this.baseDir = baseDir || process.cwd();
  this.node = {};
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

function dashToTitle(dashCase, sep) {
  return dashCase.split('-').map(function (part) {
    return part[0].toUpperCase() + part.slice(1);
  }).join(sep);
}

Installer.prototype = {
  prepareVars: function () {
    this.vars.fullName = this.comp.name;
    this.vars = {
      repo: this.comp.repo,
      name: this.comp.name,
      namespace: this.comp.repo.split('/')[0],
      title: dashToTitle(this.comp.name, ' ')
    };
  },
  loadSkels: function () {
    var items = fs.readdirSync(this.skelDir)
      , self = this;
    items.filter(function (item) {
      return exists(path.join(self.skelDir, item, 'skel.json'));
    }).forEach(function (item) {
      var fullPath = path.join(self.skelDir, item)
        , config = require(path.join(fullPath, 'skel.json'));
      config.fullPath = fullPath;
      config.dirname = item;
      if (self.skels[config.name]) {
        console.log('Warning: multiple skeletons with the same name - ' + item.name);
        console.log('  Only one will be usable. Please rename.');
      }
      debug('loaded', config.name);
      self.skels[config.name] = config;
    });
  },
  install: function (skels) {
    skels.forEach(this.installOne.bind(this));
    if (Object.keys(this.node).length) {
      fs.writeFileSync(path.join(this.baseDir, 'package.json'),
                       JSON.stringify(this.node, null, 2));
    }
    fs.writeFileSync(path.join(this.baseDir, 'component.json'),
                     JSON.stringify(this.comp, null, 2));
  },
  installOne: function (name) {
    if (this.installed[name]) {
      debug('Already installed ' + name + ' skipping.');
      return;
    }
    if (!this.skels[name]) {
      fatal('Skeleton "' + name + '" not found. Exiting.');
    }
    debug('installing', name);
    var skel = this.skels[name];
    skel.extends && skel.extends.forEach(this.installOne.bind(this));
    // process makefile
    if (skel.make) {
      make.mergeFiles(skel.fullPath, this.baseDir);
    }
    // add files, processing 
    this.copyFiles(skel);

    // manage dependencies
    if (skel.node) {
      redep(this.node, skel.node, 'dependencies');
      redep(this.node, skel.node, 'devDependencies');
    }
    redep(this.comp, skel, 'dependencies');
    redep(this.comp, skel, 'development');
  },
  copyFiles: function (skel) {
    if (!skel.files) return;
    var copied = []
      , self = this;
    skel.files.forEach(function (gfile) {
      var found = glob(gfile, {sync: true, cwd: skel.fullPath});
      found.forEach(function (name) {
        if (copied.indexOf(name) !== -1) return;
        copied.push(name);

        self.copyFile(skel, name);
      });
    });
  },
  copyFile: function (skel, name) {
    debug('copying', name);
    var full = path.join(skel.fullPath, name)
      , self = this
      , text
      , toProcess = skel.process && skel.process.some(function (pattern) {
          return minimatch(name, pattern);
        });
    try {
      text = fs.readFileSync(full).toString('utf8')
    } catch (e) {
      console.log('Warning: file matched but unreadable', full, e.message);
      return;
    }

    if (toProcess) {
      debug('interpolating', name);
      text = text.replace(/\{\{\{[^}]+\}\}\}/g, function (match) {
        var key = match.slice(3, -3);
        if (self.vars[key]) return self.vars[key];
        console.log('Warning: unknown key for interpolation', key);
        return '';
      });
    }
    var destPath = path.join(this.baseDir, name)
      , destDir = path.dirname(destPath);
    debug('dest dir', destDir);
    if (!exists(destDir)) {
      wrench.mkdirSyncRecursive(destDir);
    }
    fs.writeFileSync(destPath, text);
  }
};

function redep(obj, src, name) {
  if (!src[name]) return;
  obj[name] = _.extend(obj[name] || {}, src[name]);
}

module.exports = Installer;
