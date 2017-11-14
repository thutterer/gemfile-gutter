'use babel';

import { Range, CompositeDisposable } from 'atom';

const GUTTER_ID = 'com.thutterer.gemfile-unlocked';

export default class GemGutter {

  constructor(editor) {
    this.editor = editor;
    this.isShown = false;
    this.lineDecorations = [];
    this.disposables = new CompositeDisposable();
  }

  /**
   * Top level API for toggling gutter visiblity + annotating the currently
   * open file, if any.
   */
  toggleVisibility() {
    return this.setVisibility(!this.isShown);
  }


  /**
   * Set the visibility of the gutter. Bootstraps a new gutter if need be.
   *
   * @returns {Promise<boolean>}
   */
  setVisibility(visible) {
    // if we're trying to set the visiblity to the value it already has
    // just resolve and do nothing.
    if (this.isShown === visible) {
      return Promise.resolve(visible);
    }

    // grab filePath from editor
    const { editor } = this;
    const filePath = editor.isEmpty() ? null : editor.getPath();
    if (!filePath) {
      return Promise.reject(new Error('No filePath could be determined for editor.'));
    }

    if (visible) {
      // we are showing the gutter
      this.gutter().show();
      this.updateLineMarkers(filePath);
    } else {
      this.removeLineMarkers();
      this.gutter().hide();
      this.gutter().destroy();
    }

    this.isShown = visible;
    return Promise.resolve(this.isShown);
  }

  /**
   * Lazily generate a Gutter instance for the current editor, the first time
   * we need it. Any other accesses will grab the same gutter reference until
   * the Gutter is explicitly disposed.
   */
  gutter() {
    const { editor } = this;
    const gutter = editor.gutterWithName(GUTTER_ID);
    return gutter || editor.addGutter({
      name: GUTTER_ID,
      visible: false,
      priority: 100,
    });
  }


  updateLineMarkers(filePath) {
    this.editor.getText().split("\n").forEach((lineText, lineNumber) => {
      const lineProps = lineText; // tmp

      // adding one marker to the first line
      const lineRange = new Range([lineNumber, 0], [lineNumber, 0]);
      const lineMarker = this.editor.markBufferRange(lineRange);

      const node = this.generateLineElement(lineProps);
      const decoration = this.gutter().decorateMarker(lineMarker, {
        class: 'gem-line-marker',
        item: node,
      });

      this.lineDecorations.push(decoration);
    });
  }

  generateLineElement(lineProps) {
    const div = document.createElement('div');
    var newContent = document.createTextNode(lineProps);
    div.appendChild(newContent);

    const tip = atom.tooltips.add(div, {
      title: 'hello tooltip!', //lineProps.summary,
      placement: 'right',
    });
    this.disposables.add(tip);

    return div;
  }

  removeLineMarkers() {
    this.disposables.dispose();
    this.disposables = new CompositeDisposable();
    this.lineDecorations.forEach((decoration) => {
      decoration.destroy();
    });
  }

  dispose() {
    this.gutter().destroy();
  }
}
