'use babel';

import GemfileUnlockedView from './gemfile-unlocked-view';
import { CompositeDisposable } from 'atom';

export default {

  gemfileUnlockedView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.gemfileUnlockedView = new GemfileUnlockedView(state.gemfileUnlockedViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.gemfileUnlockedView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'gemfile-unlocked:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gemfileUnlockedView.destroy();
  },

  serialize() {
    return {
      gemfileUnlockedViewState: this.gemfileUnlockedView.serialize()
    };
  },

  toggle() {
    console.log('GemfileUnlocked was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
