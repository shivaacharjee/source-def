'use babel';

import SourceDefView from './source-def-view';
import { CompositeDisposable } from 'atom';
import request from 'request'
import cheerio from 'cheerio'
import google from "google"
google.resultsPerPage = 1

export default {

  packageView: null,
  modal: null,
  subscriptions: null,

  activate(state) {



    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'source-def:fetch': () => this.fetch()
    }));
  },

  deactivate() {
    this.modal.destroy();
    this.subscriptions.dispose();
    this.sourceDefView.destroy();
  },

  serialize () {

    /* return {
       viewState: this.packageView.serialize()
     };*/
   },


  fetch() {

  

    let editor
    let self = this

    if (editor = atom.workspace.getActiveTextEditor()) {
      let query = editor.getSelectedText()
      let language = editor.getGrammar().name

      self.search(query, language).then((url) => {
        atom.notifications.addSuccess('Found google results!')
        return self.download(url)
      }).then((html) => {
        let answer = self.scrape(html)
        if (answer === '' || typeof answer == undefined) {
          atom.notifications.addWarning('No answer found :(')
        } else {

                //editor.insertText(answer)

                // Here we add the custom view to the modal panel of Atom.
                  this.packageView = new SourceDefView(answer);
                this.modal = atom.workspace.addModalPanel({
                item: this.packageView.getElement(),
                visible: false
              });
              this.modal.show();
        }
      }).catch((error) => {
        atom.notifications.addWarning(error.reason)
      })
    }
  },



  //download module
  download(url) {
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {

          resolve(body)
        } else {
          reject({
            reason: 'Unable to download page'
          })
        }
      })
    })
  },



  search(query, language) {
  return new Promise((resolve, reject) => {
    let searchString = `${query} in ${language} site:stackoverflow.com`

    google(searchString, (err, res) => {
      if (err) {
        reject({
          reason: 'A search error has occured :('
        })
      } else if (res.links.length === 0) {
        reject({
          reason: 'No results found :('
        })
      } else {
        resolve(res.links[0].href)
      }
    })
  })
},

  //scrape data from stackoverflow
  scrape(html) {
    $ = cheerio.load(html)

    //if($('div.accepted-answer').hasc)
    return $('div.accepted-answer .answercell').html()
  }


};
