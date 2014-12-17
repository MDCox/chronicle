/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  grunt.config('jsonlint', {
    config: {
      src: [
        '.bowerrc',
        '.jshintrc',
        '.jscsrc'
      ]
    },
    app: {
      src: [
        '{,app/**/,grunttasks/**/,server/**/,tests/**/}*.json',
        'config/*.{json,example}',
        '!app/bower_components/**'
      ]
    }
  });
};
