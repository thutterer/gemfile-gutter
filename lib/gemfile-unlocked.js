'use babel';

import { CompositeDisposable } from 'atom';

import config from './config';
import GemGutter from './util/GemGutter';

export default {

  config,

  disposables: null,
  gutters: null,

  activate(state) {
    this.gutters = new Map();
    this.disposables = new CompositeDisposable();
    this.disposables.add(atom.commands.add('atom-workspace', {
      'gemfile-unlocked:toggle': () => this.toggle()
    }));

    var self = this;
    this.disposables.add(atom.workspace.onDidOpen(function(event) {
      if (atom.workspace.isTextEditor(event.item) && event.uri.endsWith('Gemfile')) { // TODO: make this whitelist of filenames configurable
        self.addGemGutter(event.item);
      }
    }));
  },

  deactivate() {
    this.disposables.dispose();
    this.gutters.clear();
  },

  toggle() {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) return;
    this.gutter(editor).toggleVisibility();
  },

  addGemGutter(editor) {
    if (!editor) return;
    this.gutter(editor).setVisibility(true);
  },

  gutter(editor) {
    // get a gutter from the cache or create a new one and add it to the cache.
    let gutter = this.gutters.get(editor);
    if (!gutter) {
      gutter = new GemGutter(editor);
      this.disposables.add(gutter);
      this.gutters.set(editor, gutter);
    }
    return gutter;
  }
};
