#!/bin/bash

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# TODO convert to node when things slow down
psql -c 'DROP DATABASE IF EXISTS chronicle;' -U postgres
psql -c 'REASSIGN OWNED BY chronicle TO postgres;' -U postgres
psql -c 'DROP USER IF EXISTS chronicle;' -U postgres

psql -c "CREATE USER chronicle WITH PASSWORD 'chronicle';" -U postgres
psql -c "CREATE DATABASE chronicle ENCODING 'UTF-8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8';" -U postgres
psql -c 'GRANT ALL PRIVILEGES ON DATABASE chronicle to chronicle;' -U postgres
psql -c 'ALTER SCHEMA public OWNER TO chronicle;' -U postgres
psql -c "CREATE TABLE IF NOT EXISTS users (
  fxaId CHAR(32) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  oauthToken TEXT,
  createdAt TIMESTAMPTZ(3) NOT NULL,
  updatedAt TIMESTAMPTZ(3)
);" -d chronicle -U chronicle
psql -c "CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY,
  fxaId CHAR(32) REFERENCES users,
  url TEXT NOT NULL,
  rawUrl TEXT NOT NULL,
  urlHash CHAR(40) NOT NULL,
  title TEXT NOT NULL,
  visitedAt TIMESTAMPTZ(3) NOT NULL,
  updatedAt TIMESTAMPTZ(3)
);" -d chronicle -U chronicle
psql -c "CREATE UNIQUE INDEX CONCURRENTLY fxaId_visitedAt_id
  ON visits (fxaId, visitedAt, id);" -d chronicle -U chronicle

