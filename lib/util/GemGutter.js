'use babel';

import { File, Range, CompositeDisposable } from 'atom';

const GUTTER_ID = 'com.thutterer.gemfile-gutter';
const GUTTER_STYLE_ID = 'com.thutterer.gemfile-gutter.style';

export default class GemGutter {

  constructor(editor) {
    this.editor = editor;
    this.isShown = false;
    this.lineDecorations = [];
    this.disposables = new CompositeDisposable();
    this.lockFile = null;
    this.gemVersions = new Map();
  }

  create() {
    const filePath = this.editor.isEmpty() ? null : this.editor.getPath();

    this.getLockFile(filePath).then(lockFile => {
      this.lockFile = lockFile;
      this.lockFile.onDidChange(this.reload.bind(this));
      this.editor.onDidStopChanging(this.redraw.bind(this));

      this.reload();
      this.gutter().show();
    }.bind(this));
  }

  reload() {
    this.getGemVersions(this.lockFile).then(gemVersions => {
      this.gemVersions = gemVersions;
      this.redraw();
    }.bind(this));
  }

  redraw() {
    this.removeLineMarkers();
    this.drawLineMarkers();
  }

  toggleVisibility() {
    return this.setVisibility(!this.isShown);
  }

  setVisibility(visible) {
    if (visible) {
      this.create();
    } else {
      this.dispose();
    }

    this.isShown = visible;
    return this.isShown;
  }

  gutter() {
    const { editor } = this;
    const gutter = editor.gutterWithName(GUTTER_ID);
    return gutter || editor.addGutter({
      name: GUTTER_ID,
      visible: false,
      priority: 100,
    });
  }

  getLockFile(filePath) {
    lockFileName = filePath.endsWith('.lock') ? filePath : (filePath + '.lock');
    const lockFile = new File(lockFileName);

    return new Promise(function(resolve, reject) {
      lockFile.exists().then(exists => {
        if(exists) {
          return resolve(lockFile);
        }
        else {
          return reject(new Error('No Gemfile.lock found.'));
        }
      })
    });
  }

  getGemVersions(lockFile) {
    return new Promise(function(resolve, reject) {
      lockFile.read().then(content => {
        let gemVersions = new Map();
        content.split("\n").forEach((lineText) => {
          const matches = lineText.match(/(\S+)\s\((\S+)\)/)
          if (!matches) return;  // skip this line if it is no match
          gemVersions.set(matches[1], matches[2]); // e.g. 'octokit' => '4.2.0'
        });
        resolve(gemVersions);
      });
    })
  }

  drawLineMarkers() {
    this.editor.getText().split("\n").forEach((lineText, lineNumber) => {
      const gem_matches = lineText.match(/^\s*gem ['"](\S+)['"]/) || lineText.match(/^\s*(\S+)(\s\(.+\))?$/)
      // 1st regexp matches lines in a Gemfile, e.g. `gem "rails"`

      // 2nd regexp matches lines in a Gemfile.lock, e.g. `rails (~> 6)` or also versionless `rails`.
      // Also it matches false-positives like `GIT` but since these are looked up in the gemVersions() below,
      // they still appear as an empty gutter line, as long as there is no such gem.

      const end_matches = lineText.match(/^\s*end\s*$/)
      // This regexp just matches `end` of blocks to call generateEndLineElement() on it.

      if (gem_matches) {
        const gem = gem_matches[1].replace(/!$/, '');
        // Removes trailing "!" in Gemfile.lock from gems that come from somewhere else than rubygems.org

        const version = this.gemVersions.get(gem) || '';

        const range = new Range(
          [lineNumber, lineText.indexOf(gem)],
          [lineNumber, lineText.indexOf(gem) + gem.length]
        );
        const lineMarker = this.editor.markBufferRange(range);
        const node = this.generateGemLineElement(gem, version);
        const decoration = this.gutter().decorateMarker(lineMarker, {
          class: 'gem-line-marker',
          item: node,
        });
        this.lineDecorations.push(decoration);
      }
      else if (end_matches) {
        const range = new Range([lineNumber, 0], [lineNumber, 0]);
        const lineMarker = this.editor.markBufferRange(range);
        const node = this.generateEndLineElement();
        const decoration = this.gutter().decorateMarker(lineMarker, {
          class: 'end-line-marker',
          item: node,
        });
        this.lineDecorations.push(decoration);
      }
    });
  }

  generateGemLineElement(name, version) {
    const div = document.createElement('div');
    var a = document.createElement('a');
    var versionText = document.createTextNode(version);

    a.href = name.startsWith('rails-assets-') ?
      'https://rails-assets.org/#/components/' + name.substring(13) + '?version=' + version
    :
      'https://rubygems.org/gems/' + name + '/versions/' + version

    a.appendChild(versionText);
    div.appendChild(a);
    return div;
  }

  generateEndLineElement() {
    // Fills the gutter line with a backgroundColor
    // to hide all the overlapping version numbers from other lines
    // when folding blocks.
    e = document.getElementsByTagName('atom-text-editor')[0];
    backgroundColor = window.getComputedStyle(e).getPropertyValue('background-color');

    const div = document.createElement('div');
    div.style.backgroundColor = backgroundColor;
    return div;
  }

  removeLineMarkers() {
    // TODO: destroy markers instead! (see https://atom.io/docs/api/v1.23.1/Decoration)
    this.lineDecorations.forEach((decoration) => {
      decoration.destroy();
    });
  }

  dispose() {
    this.disposables.dispose();
    this.disposables = new CompositeDisposable();
    this.removeLineMarkers();
    this.gutter().destroy();
  }
}
