/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var q = require('q');

var postgres = require('../db/postgres');
var elasticsearch = require('../db/elasticsearch');
var log = require('../logger')('server.models.visits');
var visit = require('./visit');

var _verbose = function() {
  var logline = [].join.call(arguments, ', ');
  log.verbose(logline);
};

var visits = {
  _onFulfilled: function _onFulfilled(msg, callback, results) {
    _verbose(msg);
    callback(null, results);
  },
  _onRejected: function _onRejected(msg, callback, err) {
    log.warn(msg);
    callback(err);
  },
  _transform: function _transform(results) {
    if (!results || !results.length) { return; }
    var transformed = [];
    results.forEach(function(result) {
      transformed.push(visit._transform(result));
    });
    return transformed;
  },
  getPaginated: function(userId, visitId, count, cb) {
    var name = 'models.visits.getPaginated';
    _verbose(name + ' invoked', userId, visitId, count);
    var query = 'SELECT visits.id as visit_id, visits.user_id as user_id, visits.visited_at, * ' +
                'FROM visits LEFT JOIN user_pages ON visits.user_page_id = user_pages.id ' +
                'WHERE visits.user_id = $1 ' +
                'AND visits.visited_at < (SELECT visited_at FROM visits WHERE id = $2) ' +
                'ORDER BY visits.visited_at DESC LIMIT $3';
    var params = [userId, visitId, count];
    postgres.query(query, params)
      .then(function(results) {
        // return a promise that resolves to the transformed results
        return q(visits._transform(results));
      })
      .done(visits._onFulfilled.bind(visits, name + ' succeeded', cb),
            visits._onRejected.bind(visits, name + ' failed', cb));
  },
  get: function(userId, count, cb) {
    var name = 'models.visits.get';
    _verbose(name + ' invoked', userId, count);
    var query = 'SELECT visits.id as visit_id, visits.user_id as user_id, visits.visited_at, * ' +
                'FROM visits LEFT JOIN user_pages ON visits.user_page_id = user_pages.id ' +
                'WHERE visits.user_id = $1 ORDER BY visits.visited_at DESC LIMIT $2';
    var params = [userId, count];
    postgres.query(query, params)
      .then(function(results) {
        // return a promise that resolves to the transformed results
        return q(visits._transform(results));
      })
      .done(visits._onFulfilled.bind(visits, name + ' succeeded', cb),
            visits._onRejected.bind(visits, name + ' failed', cb));
  },
  search: function(userId, searchTerm, count, cb) {
    var name = 'models.visits.search';
    _verbose(name + ' invoked', userId, count);
    var esQuery = {
      index: 'chronicle',
      type: 'user_pages',
      size: count,
      body: {
        query: {
          filtered: {
            query: {
              multiMatch: {
                query: searchTerm,
                fuzziness: 'AUTO',
                operator: 'and',
                fields: [
                  'title',
                  'extracted_data.title',
                  'extracted_data.content',
                  'extracted_data.lead',
                  'extracted_data.description',
                  'extracted_data.url',
                  'extracted_data.provider_display',
                  'extracted_data.provider_name',
                  // TODO: use nested objects if we need more structured searches
                  'extracted_data.authors.name'
                ]
              }
            }
          }
        },
        filter: { term: { user_id: userId } }
      }
    };
    log.verbose('searching elasticsearch for the search term ' + searchTerm);
    elasticsearch.query('search', esQuery)
      .done(function(resp) {
        log.verbose('response from elasticsearch: ' + JSON.stringify(resp));
        var output = {};
        output.resultCount = resp.hits.total;
        output.results = resp.hits;
        _verbose(name + ' succeeded');
        cb(null, output);
      }, visits._onRejected.bind(visits, name + ' failed', cb));
  }
};

module.exports = visits;
