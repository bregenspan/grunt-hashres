/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
 * Licensed under the MIT license.
 */

'use strict';

var fs    = require('fs'),
    path  = require('path'),
    utils = require('./hashresUtils');

exports.hashAndSub = function(grunt, options) {

  var src              = options.src,
      dest             = options.dest,
      encoding         = options.encoding,
      fileNameFormat   = options.fileNameFormat,
      matchFormat      = options.matchFormat,
      replaceFormat    = options.replaceFormat,
      renameFiles      = options.renameFiles,
      nameToHashedName = {},
      nameFormatter    = null,
      matchFormatter   = null,
      replaceFormatter = null;

  grunt.log.debug('files: ' + options.files);
  grunt.log.debug('Using encoding ' + encoding);
  grunt.log.debug('Using fileNameFormat ' + fileNameFormat);
  grunt.log.debug(renameFiles ? 'Renaming files' : 'Not renaming files');

  nameFormatter = utils.compileFormat(fileNameFormat);
  if (matchFormat) {
      matchFormatter = utils.compileFormat(matchFormat);
  }
  if (replaceFormat) {
      replaceFormatter = utils.compileFormat(replaceFormat);
  }
  if (options.files) {
    options.files.forEach(function(f) {
      f.src.forEach(function(src) {
        var md5                 = utils.md5(src).slice(0, 8),
            fileName            = path.basename(src),
            lastIndex           = fileName.lastIndexOf('.'),
            formatContext       = {
              hash: md5,
              name: fileName.slice(0, lastIndex),
              ext : fileName.slice(lastIndex + 1, fileName.length) },
            renamed             = nameFormatter(formatContext),
            match               = fileName,
            replace             = renamed;

        // Use custom format for find and replace strings if set
        if (matchFormatter) {
            match = matchFormatter(formatContext);
        }
        if (replaceFormatter) {
            replace = replaceFormatter(formatContext);
        }
        
        // Mapping the original name with hashed one for later use.
        nameToHashedName[match] = replace;

        // Renaming the file
        if (renameFiles) {
          fs.renameSync(src, path.resolve(path.dirname(src), renamed));
        }
        grunt.log.write(src + ' ').ok(renamed);
      });

      // Substituting references to the given files with the hashed ones.
      grunt.file.expand(f.dest).forEach(function(f) {
        var destContents = fs.readFileSync(f, encoding);
        for (var name in nameToHashedName) {
          grunt.log.debug('Substituting ' + name + ' by ' + nameToHashedName[name]);
          destContents = destContents.replace(new RegExp(name, "g"), nameToHashedName[name]);
        }
        grunt.log.debug('Saving the updated contents of the outination file');
        fs.writeFileSync(f, destContents, encoding);
      });
    });
  }
};
