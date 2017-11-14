'use babel';

import { File, Range, CompositeDisposable } from 'atom';

const GUTTER_ID = 'com.thutterer.gemfile-unlocked';
const GUTTER_STYLE_ID = 'com.thutterer.gemfile-unlocked.style';

export default class GemGutter {

  constructor(editor) {
    this.editor = editor;
    this.isShown = false;
    this.lineDecorations = [];
    this.disposables = new CompositeDisposable();
    this.lockFile = null;
    this.gemVersions = new Map();

    this.updateGutterWidth(100); // TODO: make this a config?
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

    this.lockFile = new File(filePath + '.lock');

    this.lockFile.exists().then((exists) => {
      if(!exists) {
        console.log('No Gemfile.lock found.');
        return Promise.reject(new Error('No Gemfile.lock found.'));
      }

      if (visible) {
        // we are showing the gutter

        this.gemVersions.clear();
        this.lockFile.read().then((content) => {
          content.split("\n").forEach((lineText) => {
            const matches = lineText.match(/(\S+)\s\((\S+)\)/)
            if (!matches) return;  // skip this line if it is no match
            this.gemVersions.set(matches[1], matches[2]); // e.g. 'octokit' => '4.2.0'
          });

          this.gutter().show();
          this.updateLineMarkers(filePath);

        });

      } else {
        this.removeLineMarkers();
        this.gutter().hide();
        this.gutter().destroy();
      }

      this.isShown = visible;
      return Promise.resolve(this.isShown);
    });
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
      const matches = lineText.match(/^\s*gem ['"](\S+)['"]/)
      if (!matches) return; // skip this line if it has no "gem 'xy'" in it
      const gem = matches[1];

      const version = this.gemVersions.get(gem);

      // adding one marker to the first line
      const lineRange = new Range([lineNumber, 0], [lineNumber, 0]);
      const lineMarker = this.editor.markBufferRange(lineRange);

      const node = this.generateLineElement(gem, version);

      const decoration = this.gutter().decorateMarker(lineMarker, {
        class: 'gem-line-marker',
        item: node,
      });

      this.lineDecorations.push(decoration);
    });
  }


  generateLineElement(name, version) {
    const div = document.createElement('div');
    var a = document.createElement('a');
    var versionText = document.createTextNode(version);
    a.href = 'https://rubygems.org/gems/' + name + '/versions/' + version;
    a.appendChild(versionText);
    div.appendChild(a);
    return div;
  }

  removeLineMarkers() {
    this.disposables.dispose();
    this.disposables = new CompositeDisposable();
    this.lineDecorations.forEach((decoration) => {
      decoration.destroy();
    });
  }

  updateGutterWidth(newWidth) {
    this.width = newWidth;
    // atom.config.set('git-blame.columnWidth', newWidth);

    let tag = document.getElementById(GUTTER_STYLE_ID);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = GUTTER_STYLE_ID;
      tag.type = 'text/css';
      document.head.appendChild(tag);
    }

    const styles = `
      atom-text-editor .gutter[gutter-name="${GUTTER_ID}"] {
        width: ${newWidth}px;
      }
    `;
    tag.textContent = styles;
  }

  dispose() {
    this.gutter().destroy();
  }
}
