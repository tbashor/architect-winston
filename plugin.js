'use strict';

module.exports = function(options, imports, register) {
  var log = imports.debug('plugins:logger');
  log('start');

  var path = require('path');
  var winston = require('winston');
  var Logger = winston.Logger;
  var Console = winston.transports.Console;
  var File = winston.transports.File;
  var DailyRotateFile = winston.transports.DailyRotateFile;
  var transports = {};
  var loggers = {};

  winston.handleExceptions(new (File)({
    colorize: true,
    json: true,
    filename: path.join(__dirname, 'logs', 'exceptions.log')
  }));

  transports.console = function(options){
    options.colorize = setOption(options.colorize, true);
    options.prettyPrint = setOption(options.prettyPrint, true);
    return new (Console)(options);
  };

  transports.file = function(options){
    var defaultFileName = path.join(
      __dirname, '../../', 'logs', options.name + '.log' || 'app.log');
    options.filename = setOption(options.filename, defaultFileName);
    log('write to file', options.filename);
    options.colorize = setOption(options.colorize, true);
    return new (File)(options);
  };

  transports.daily = function(options){
    var defaultFileName = path.join(
      __dirname, '../../', 'logs', options.name || 'app.log');
    options.filename = setOption(options.filename, defaultFileName);
    options.datePattern = setOption(options.datePattern, '.yyyy-MM-dd.log');
    return new (DailyRotateFile)(options);
  };

  function convertTransports(requestedTransports){
    log('convert transports');
    var validTransports = [];
    if (requestedTransports){
      // Translate transport names into actual transports
      requestedTransports.forEach(function(transport){
        if(transports[transport.type]){
          validTransports.push(transports[transport.type](transport));
        }
      });
    }
    return ensureTransport(validTransports);
  }

  function ensureTransport(transports){
    log('ensure transport');
    if (transports.length === 0){
      return [transports.console()];
    } else {
      return transports;
    }
  }

  function generateLogger(options){
    log('generate logger');
    options.transports = convertTransports(options.transports);
    var customLevels = {
      levels: {
        trace: 0,
        input: 1,
        verbose: 2,
        prompt: 3,
        debug: 4,
        info: 5,
        data: 6,
        help: 7,
        warn: 8,
        error: 9
      },
      colors: {
        trace: 'magenta',
        input: 'grey',
        verbose: 'cyan',
        prompt: 'grey',
        debug: 'blue',
        info: 'green',
        data: 'grey',
        help: 'cyan',
        warn: 'yellow',
        error: 'red'
      }
    };
    options.levels = customLevels.levels;

    //winston.addColors(customLevels.colors);
    return new (Logger)(
      options
    );
  }


  /**
   * Creates a new logger or returns a previously created one with the same
   * name.
   * @param options
   * @returns {*}
   *
   * var logger = imports.logger.create({name: 'app', transports: [
   *   {type: 'file', name: 'info', level: 'info'}]});
   */
  function createLogger(options){
    log('create logger');
    var name = options.name;
    var newLogger;

    // Check if they want a named logger
    if (name) {
      if (loggers[name]) {// If a logger with that name already exists, use it.
        log('get logger');
        return loggers[name];
      } else {// Or create a new one
        newLogger = generateLogger(options);
        loggers[name] = newLogger;
        return newLogger;
      }
    } else {// Create unnamed logger
      return generateLogger(options);
    }
  }

  //function getLogger(name, options){
  //  if (loggers[name]){// Use the existing logger
  //    return loggers[name];
  //  } else { // Create a named logger
  //    options.name = name;
  //    if (options.transports){
  //      return createLogger(options);
  //    } else {
  //      options.transports = [
  //        transports.console()
  //      ];
  //      return createLogger(options);
  //    }
  //  }
  //}

  var api = {
    logger: {
      create: createLogger
    }
  };

  log('register');
  register(null, api);
};

function setOption(configured, defaultValue){
  if (configured === undefined) {
    return defaultValue;
  } else {
    return configured;
  }
}
