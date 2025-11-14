const properties = require('./properties.json');

module.exports = function getProperty(unid) {
  return properties.find(p => p.unid === unid);
};
