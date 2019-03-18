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
      'gemfile-gutter:toggle': () => this.toggle()
    }));

    atom.workspace.getTextEditors().forEach(editor => {
      this.autoOpen(editor);
    });

    var self = this;
    this.disposables.add(atom.workspace.onDidOpen(event => {
      self.autoOpen(event.item);
    }));
  },

  deactivate() {
    this.disposables.dispose();
    this.gutters.clear();
  },

  autoOpen(editor) {
    if (atom.workspace.isTextEditor(editor)
    && this.isGemfile(editor.getPath())
    && atom.config.get('gemfile-gutter.showAutomatically')) {
      this.gutter(editor).setVisibility(true);
    }
  },

  toggle() {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) return;
    this.gutter(editor).toggleVisibility();
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
  },

  isGemfile(uri) {
    if(!uri) return false; // 'untitled' editors have no path set yet
    var isGemfile = false;
    atom.config.get('gemfile-gutter.gemfileNames').forEach((filename) => {
      if (uri.endsWith(filename.trim())) isGemfile = true;
      if (uri.endsWith(filename.trim() + '.lock')) isGemfile = true;
    });
    return isGemfile;
  }
};
