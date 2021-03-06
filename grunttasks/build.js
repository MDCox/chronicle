/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('build', 'Build front-end assets and copy them to `staticPath`', function (target) {
    if (!target) {
      target = 'development';
    }

    var taskArr;

    if (target === 'development') {
      taskArr = [
        'clean',
        'copy',
        'css',
        'requirejs:development',
        'template'
      ];
    } else {
      taskArr = [
        'lint',
        'clean',
        'copy',
        'css',
        'requirejs:' + target,
        'template',
        'useminPrepare',
        'rev',
        'usemin'
      ];
    }

    grunt.task.run(taskArr);
  });
};
