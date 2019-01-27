require('@app/core/config/mongo');
require('@app/core/config/redis');
require('@app/api/config/redis');
import express = require('@app/api/config/express');
import supertest = require('supertest');
export = supertest(express);
