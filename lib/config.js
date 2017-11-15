'use babel';

export default {
  openGutterAutomatically: {
    type: 'boolean',
    default: true,
  },
  gutterWidth: {
    type: 'integer',
    default: 100,
  },
  whitelistedFilenames: {
    type: 'string',
    default: 'Gemfile, gemfile',
  },
};
