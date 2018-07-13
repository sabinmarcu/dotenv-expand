'use strict'

var dotenvExpand = function (config, options ) {
  options = Object.assign({
    envFirst: true,
  }, options);
  var interpolate = function (env) {
    var matches = env.match(/\$([a-zA-Z0-9_]+)|\${([a-zA-Z0-9_]+)(?::?-([a-zA-Z0-9-_\${}]+))?}/g) || []

    matches.forEach(function (match) {
      var key, defaultValue;

      [key, defaultValue] = ((index) => index >= 0 ? [match.substr(0, index), match.substr(index + 1)] : [match, null])(match.indexOf('-'));

      key = match.replace(/\$|{|}|:/g, '');
      defaultValue = defaultValue && defaultValue.substr(0, defaultValue.length - 1)

      var variable;
      if (options.envFirst) {
        // process.env is preferred to dotenv config
        variable = process.env[key] || config.parsed[key] || '';
      } else {
        // dotenv config is preferred to process.env
        variable = config.parsed[key] || process.env[key] || '';
      }

      // Resolve recursive interpolations
      variable = interpolate(variable);
      defaultValue = defaultValue && interpolate(defaultValue);

      env = env.replace(match, variable || defaultValue || '')
    })

    return env
  }

  for (var configKey in config.parsed) {
    var value;
    if (options.envFirst) {
      // process.env is preferred to dotenv config
      value = process.env[configKey] || config.parsed[configKey];
    } else {
      // dotenv config is preferred to process.env
      value = config.parsed[configKey] || process.env[configKey];
    }

    if (config.parsed[configKey].substring(0, 2) === '\\$') {
      config.parsed[configKey] = value.substring(1)
    } else if (config.parsed[configKey].indexOf('\\$') > 0) {
      config.parsed[configKey] = value.replace(/\\\$/g, '$')
    } else {
      config.parsed[configKey] = interpolate(value)
    }
  }

  for (var processKey in config.parsed) {
    process.env[processKey] = config.parsed[processKey]
  }

  return config
}

module.exports = dotenvExpand
