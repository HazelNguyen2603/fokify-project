import View from './view.js';
import previewView from './previewView.js';
import icons from 'url:../../img/icons.svg'; // Parcel 2
class ResultView extends View {
  _parentElement = document.querySelector('.results');
  _errorMessage = 'No recipe found for your query! Please try again ;)';
  _message = '';

  _generateMarkup() {
    // console.log(this._data.map(result => previewView.render(result, false)).join(''));
    return this._data.map(result => previewView.render(result, false)).join('');
  }
  _btnSort = document.querySelector('.nav__btn--sort');
  addHandlerSort(handler) {
    this._btnSort.addEventListener('click', handler);
  }
}
export default new ResultView();
