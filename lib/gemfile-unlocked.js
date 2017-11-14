'use babel';

import { CompositeDisposable } from 'atom';

import GemGutter from './util/GemGutter';

export default {

  disposables: null,
  gutters: null,

  activate(state) {
    this.gutters = new Map();
    this.disposables = new CompositeDisposable();
    this.disposables.add(atom.commands.add('atom-workspace', {
      'gemfile-unlocked:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.disposables.dispose();
    this.gutters.clear();
  },

  toggle() {
    const editor = atom.workspace.getActiveTextEditor();

    if (!editor) {
      return;
    }

    // get a gutter from the cache or create a new one and add it to the cache.
    let gutter = this.gutters.get(editor);
    if (!gutter) {
      gutter = new GemGutter(editor);
      this.disposables.add(gutter);
      this.gutters.set(editor, gutter);
    }

    // toggle visiblity of the active gutter
    gutter.toggleVisibility()
      // .catch((e) => {
      //   logger.error(e);
      // });

  }

};
