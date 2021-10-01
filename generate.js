const fs = require('fs');
const path = require('path');
const kebabCase = require("kebab-case");

const baseURL = './node_modules/quasar/src/components';
const dir = fs.readdirSync(baseURL);
const files = [];
const snippets = {};
const outputJSON = {};
// let count = 0;
for (const d of dir) {
  const p = path.join(baseURL, d);
  const jsons = fs.readdirSync(p).map(f => path.join(p, f)).filter(f => path.extname(f) === '.json');
  if (!jsons.length) {continue;};
  // if (count++ === 42) {
  //   console.log(p);
  //   files.push(...jsons);
  // }
  files.push(...jsons);
  // count++;
  // if (count > 1) {break;};
}
const extendsType = (key) => {
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
  if (name === 'use-btn') {
    return snippets['QBtn'];
  } else if (name === 'use-checkbox') {
    return snippets['QCheckbox'];
  } else if (name === 'use-datetime') {
    return snippets['QDate'];
  } else if (name === 'use-fab') {
    return snippets['QFab'];
  }
  snippets[name] = {
    props: {},
    events: {},
    slots: {},
    methods: {}
  };
  return snippets[name];  
};

const convertObj = (p) => {
  const snippet = getSnippet(p);
  const props = snippet.props;
  const events = snippet.events;
  const slots = snippet.slots;
  const methods = snippet.methods;
  const bf = fs.readFileSync(p);
  const json = JSON.parse(bf.toString());
  if (json.props) {
    for (const [key, value] of Object.entries(json.props)) {
      if (value.type === 'String') {
        props[key] = value.default || '';
      } else if (value.type === 'Boolean') {
        props[key] = false;
      } else if (value.type === 'Number') {
        props[key] = 0;
      } else if (value.type === 'Array') {
        props[key] = [];
      } else if (value.extends) {
        props[key] = value.default || extendsType(key);
      } else if (typeof value.type === 'object') {
        const isString = Array.isArray(value.type) ? value.type.includes('String') : false;
        props[key] = isString ? '' : null;
      } else {
        props[key] = null;
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
files.forEach(file => {
  convertObj(file);
});

// console.log(snippets);

const convertBody = (key, value) => {
  const bs = [];
  const tag = kebabCase(key).slice(1);
  bs.push(`<${tag}`);
  const existsProps = Object.keys(value.props).length;
  const existsSlots = Object.keys(value.slots).length;
  const existsEvents = Object.keys(value.events).length;
  const existsMethods = Object.keys(value.methods).length;
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
convertJSON();
// console.log(outputJSON);
const saveJSON = () => {
  const url = './snippets/quasar-default.json';
  fs.writeFileSync(url, JSON.stringify(outputJSON, null, 2));
};
saveJSON();

