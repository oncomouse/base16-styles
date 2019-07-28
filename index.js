const Mustache = require('mustache');
const yaml = require('js-yaml');
const git = require('simple-git');
const glob = require('fast-glob');
const fetch = require('isomorphic-fetch');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync('./schemes')) {
  fs.mkdirSync('./schemes');
}
if (!fs.existsSync('./output')) {
  fs.mkdirSync('./output');
}
fetch('https://raw.githubusercontent.com/chriskempson/base16-schemes-source/master/list.yaml')
  .then(res => res.text())
  .then(yaml.load)
  .then(json => {
    Object.keys(json).forEach(key => {
      if (key === 'unclaimed') { return; }
      if (fs.existsSync('./schemes/' + key)) {
        git('./schemes/' + key).pull();
      } else {
        git().clone(json[key], './schemes/' + key);
      }
    });
    return glob.sync('./schemes/*/*.yaml');
  })
  .then(schemes => {
    var templates = {};
    glob.sync('../base16-styles/templates/*.mustache')
      .map(x => path.basename(x, '.mustache'))
      .map(kind => {
        if (!fs.existsSync('./output/' + kind)) {
          fs.mkdirSync('./output/' + kind);
        }
        templates[kind] = fs.readFileSync(`./templates/${kind}.mustache`).toString();
      });
    schemes.map(file => {
      var fileName = path.basename(file, '.yaml');
      console.log(`Creating ${fileName} templates.`);
      try {
        var view = yaml.load(fs.readFileSync(file).toString());
      } catch (e) {
        return;
      }
      // Object.keys(view).map(key => {
      //   if (key.indexOf('base') >= 0) {
      //     view[`${key}-hex`] = view[key];
      //   } else if (key === 'scheme') {
      //     view['scheme-name'] = view['scheme'];
      //   } else if (key === 'author') {
      //     view['scheme-author'] = view['author'];
      //   }
      // })
      Object.keys(templates).map(kind => {
        fs.writeFileSync(`./output/${kind}/base16-${fileName}.${kind.split('-')[0]}`, Mustache.render(
          templates[kind],
          view
        ));
      })
    })
  })
