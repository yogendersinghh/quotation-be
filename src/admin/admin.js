const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSMongoose = require('@adminjs/mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Model = require('../models/Model');

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const adminJs = new AdminJS({
  resources: [
    {
      resource: User,
      options: {
        properties: {
          password: {
            isVisible: {
              list: false,
              edit: true,
              filter: false,
              show: false,
            },
          },
        },
      },
    },
    {
      resource: Product,
      options: {
        properties: {
          features: {
            type: 'mixed',
          },
        },
      },
    },
    {
      resource: Category,
    },
    {
      resource: Model,
      options: {
        properties: {
          specifications: {
            type: 'mixed',
          },
        },
      },
    },
  ],
  rootPath: '/admin',
});

const router = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  {
    authenticate: async (email, password) => {
      const user = await User.findOne({ email });
      if (user && user.role === 'admin' && await user.comparePassword(password)) {
        return user;
      }
      return false;
    },
    cookieName: 'adminjs',
    cookiePassword: process.env.JWT_SECRET,
  },
  null,
  {
    store: new (require('express-session').MemoryStore)(),
    resave: true,
    saveUninitialized: true,
    secret: process.env.JWT_SECRET,
    cookie: {
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
    },
    name: 'adminjs',
  }
);

module.exports = { adminJs, router }; 