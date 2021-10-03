const fs = require('fs');
const path = require('path');
const kebabCase = require("kebab-case");

const baseURL = './node_modules/quasar/src';
const componentsURL = path.join(baseURL, 'components')
const componentsNames = fs.readdirSync(componentsURL);
const files = [];
const snippets = {};
const outputJSON = {};
const extendsURL = path.join(baseURL, 'api.extends.json')
const extendsJson = JSON.parse(fs.readFileSync(extendsURL).toString());

const convertFile = (fileName) => {
  const jsons = fs.readdirSync(fileName)
    .map(f => path.join(fileName, f))
    .filter(f => path.extname(f) === '.json' && f.includes('Q'));
  
  if (!jsons.length) { return; };
  files.push(...jsons);
}

const convertFiles = () => {
  for (const name of componentsNames) {
    convertFile(path.join(componentsURL, name))
  }
}

const setUnknownType = (key) => {
  const types = [
    { name: 'dense', value: false },
    { name: 'rounded', value: false },
    { name: 'square', value: false },
    { name: 'dark', value: false },
    { name: 'ripple', value: false },
    { name: 'disable', value: false },
    { name: 'readonly', value: false },
    { name: 'flat', value: false },
    { name: 'bordered', value: false },
    { name: 'autoplay', value: false },
    { name: 'padding', value: false },
    { name: 'label-html', value: false },
    { name: 'name-html', value: false },
    { name: 'text-html', value: false },
    { name: 'stamp-html', value: false },
    { name: 'color', value: '' },
    { name: 'text-color', value: '' },
    { name: 'separator-color', value: '' },
    { name: 'icon', value: '' },
    { name: 'dropdown-icon', value: '' },
    { name: 'icon-right', value: '' },
    { name: 'toggle-text-color', value: '' },
    { name: 'tabindex', value: 0 },
    { name: 'height', value: '' },
    { name: 'width', value: '' },
    { name: 'control-color', value: '' },
    { name: 'control-text-color', value: '' },
    { name: 'prev-icon', value: '' },
    { name: 'next-icon', value: '' },
    { name: 'navigation-icon', value: '' },
    { name: 'navigation-active-icon', value: '' },
    { name: 'icon-remove', value: '' },
    { name: 'icon-selected', value: '' },
    { name: 'label', value: '' },
    { name: 'center-color', value: '' },
    { name: 'track-color', value: '' }
  ];
  const type = types.find(t => t.name === key );
  return type ? type.value : null;
};

const getSnippet = (p) => {
  const name = path.parse(p).name;
  snippets[name] = {
    props: {},
    events: {},
    slots: {},
    methods: {}
  };

  return snippets[name];  
};

const getMixins = (json) => {
  if (!json.mixins) return
  json.mixins.forEach(mixin => {
    const mixinsURL = path.join(baseURL, mixin +'.json')    
    const mixinsJSON = JSON.parse(fs.readFileSync(mixinsURL).toString())    
    if (mixinsJSON.props) {
      for (const [key, value] of Object.entries(mixinsJSON.props)) {
        json.props[key] = value
      }
    }
    if (mixinsJSON.events) {
      for (const [key, value] of Object.entries(mixinsJSON.events)) {
        json.events[key] = value
      }
    }
    if (mixinsJSON.slots) {
      for (const [key, value] of Object.entries(mixinsJSON.slots)) {
        json.slots[key] = value
      }
    }
    if (mixinsJSON.methods) {
      for (const [key, value] of Object.entries(mixinsJSON.methods)) {
        json.methods[key] = value
      }
    }
  })
}

const setPropDefault = (value, init) => {
  let defaultValue = init
  if (value.default) {
    defaultValue = value.default
  } else if (value.examples) {
    if (value.examples.length) {
      defaultValue = value.examples[0]
    }
  } else if (value.values) {
    defaultValue = value.values[0]
  } 
  return defaultValue
}

const convertObj = (p) => {
  const snippet = getSnippet(p);
  const props = snippet.props;
  const events = snippet.events;
  const slots = snippet.slots;
  const methods = snippet.methods;
  const bf = fs.readFileSync(p);
  const json = JSON.parse(bf.toString());
  if (!json.props) json.props = {}
  if (!json.events) json.events = {}
  if (!json.slots) json.slots = {}
  if (!json.methods) json.methods = {}
  getMixins(json)
  if (json.props) {
    for (const [key, value] of Object.entries(json.props)) {
      if (value.extends) {
        const extendProp = extendsJson.props[key];
        if (extendProp) {
          if (extendProp.type) {
            value.type = extendProp.type;
          }
          if (extendProp.default) {
            value.default = extendProp.default;
          }
          if (extendProp.examples) {
            value.examples = extendProp.examples;
          }
        }
      }
      if (value.type === 'String') {
        props[key] = '';
        props[key] = setPropDefault(value, '')
      } else if (value.type === 'Boolean') {
        props[key] = false;
      } else if (value.type === 'Number') {
        // props[key] = 0;
        props[key] = setPropDefault(value, 0);
      } else if (value.type === 'Array') {
        // props[key] = []
        props[key] = setPropDefault(value, []);
      } else if (typeof value.type === 'object') {
        const isString = Array.isArray(value.type) ? value.type.includes('String') : false;
        // props[key] = isString ? '' : null;
        props[key] = isString ? setPropDefault(value, '') : null;
      } else {
        props[key] = setUnknownType(key);
      }
    }
  }
  if (json.events) {
    for (const [key, value] of Object.entries(json.events)) {
      events[key] = null;
    }
  }
  if (json.slots) {
    for (const [key, value] of Object.entries(json.slots)) {
      slots[key] = null;
    }
  }
  if (json.methods) {
    for (const [key, value] of Object.entries(json.methods)) {
      methods[key] = null;
    }
  }
};

const convertObjs = () => {

  files.forEach(file => {
    convertObj(file);
  });
}

const convertBody = (key, value) => {
  const bs = [];
  const tag = kebabCase(key).slice(1);
  bs.push(`<${tag}`);
  const existsProps = Object.keys(value.props).length;
  const existsSlots = Object.keys(value.slots).length;
  const existsEvents = Object.keys(value.events).length;
  // const existsMethods = Object.keys(value.methods).length;
  if (existsProps) {
    for (const [k, v] of Object.entries(value.props)) {
      const prop = typeof v === 'string'
        ? `\t${k}=\"${v}\"`
        : Array.isArray(v)
          ? `\t:${k}=\"[]"`
          : `\t:${k}=\"${v}\"`;
      bs.push(prop);
    }
  }
  if (existsEvents) {
    for (const [k, v] of Object.entries(value.events)) {
      bs.push(`\t@${k}=\"${v}\"`);
    }
  }
  if (existsSlots) {
    bs.push(`>`);
    if (existsSlots > 1) {
      let count = 1;
      for (const [k, v] of Object.entries(value.slots)) {
        bs.push(`\t<template #${k}>`);
        bs.push(`\t\t\${${count++}:content}`);
        bs.push(`\t</template>`);
      }
    } else {
      bs.push('\t${1:content}');
    }
    bs.push(`</${tag}>`);
  }
  else { 
    bs.push('/>');
  }
  return bs;
};

const convertJSON = () => {
  for (const [key, value] of Object.entries(snippets)) {
    outputJSON[key] = {
      prefix: key.toLowerCase() + '-default',
      body: convertBody(key, value),
      description: ''
    };
  }
};

convertFiles()
// convertFile(path.join(componentsURL, 'badge'))

convertObjs();
convertJSON();
const saveJSON = () => {
  const url = './snippets/quasar-default.json';
  fs.writeFileSync(url, JSON.stringify(outputJSON, null, 2));
};
saveJSON();

