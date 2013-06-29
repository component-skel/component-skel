
var fs = require('fs')
  , path = require('path')
  , wrench = require('wrench')

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
                       JSON.stringify(this.node, null, 4));
    }
    fs.writeFileSync(path.join(this.baseDir, 'component.json'),
                     JSON.stringify(this.comp, null, 4));
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
      mergeMakes(skel.fullPath, this.baseDir);
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
    var copied = [];
    skel.files.forEach(function (gfile) {
      var found = glob(gfile, {sync: true});
      found.forEach(function (name) {
        if (copied.indexOf(name) !== -1) return;
        copied.push(name);

        this.copyFile(skel, name);
      });
    });
  },
  copyFile: function (skel, name) {
    debug('copying', name);
    var full = path.join(skel.fullPath, name)
      , text = fs.readFileSync(full).toString('utf8')
      , toProcess = skel.process && skel.process.any(function (pattern) {
          return minimatch(pattern, name);
        });

    if (toProcess) {
      debug('interpolating', name);
      text = text.replace(/\{\{\{[^}]\}\}\}/g, function (key) {
        if (self.vars[key]) return self.vars[key];
        console.log('Warning: unknown key for interpolation', key);
        return '';
      });
    }
    var destPath = path.join(this.baseDir, name);
      , destDir = path.dirname(full);
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
