// import construct from 'core-js/fn/reflect/construct';
// import { async } from 'regenerator-runtime';
import { API_URL, RES_PER_PAGE, KEY } from './config.js';
import recipeView from './views/recipeView.js';
// import { getJSON,sendJSON } from './helper.js';
import { AJAX } from './helper.js';
import { async } from 'regenerator-runtime';

export const state = {
  recipe: {},
  search: {
    query: '',
    result: [],
    page: 1,
    resultPerPage: RES_PER_PAGE,
  },
  bookmarks: [],
};

const createRecipeObject = function (data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTimes: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }), //operator short-circuits
  };
};

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}/${id}?key=${KEY}`);
    state.recipe = createRecipeObject(data);

    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;
  } catch (err) {
    console.error(`${err} 🎇`);
    throw err;
  }
};

export const loadSearchResult = async function (query) {
  try {
    state.search.query = query;

    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);
    // console.log(data);

    state.search.result = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });

    state.search.page = 1;
  } catch (err) {
    console.error(`${err} 🎇`);
    throw err;
  }
};

export const sortResults = async function (resultArr) {
  try {
    resultArr = state.search.result;
    const results = await Promise.all(
      resultArr.map(async function (result) {
        try {
          // console.log(result);
          const id = result.id;
          const data = await AJAX(`${API_URL}/${id}?key=${KEY}`);
          // console.log(data);
          state.recipe = createRecipeObject(data);
          const cookingTimes = state.recipe.cookingTimes;
          result.time = cookingTimes;
          return result;
        } catch (err) {
          console.log(err);
        }
      })
    );

    results.sort(function (a, b) {
      return a.time - b.time;
    });
    state.search.result = results.map(rec => {
      console.log(rec.image);
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image,
        ...(rec.key && { key: rec.key }),
      };
    });

    state.search.page = 1;
    console.log(results);
  } catch (err) {
    console.error(`${err} 🎇`);
    throw err;
  }
};

export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultPerPage; //0;
  const end = page * state.search.resultPerPage; //9;

  return state.search.result.slice(start, end);
};

export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
    //newQt=oldQt*newServings / oldServings
  });

  state.recipe.servings = newServings;
};

const persistBoomarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};
export const addBookmark = function (recipe) {
  //Add bookmark
  state.bookmarks.push(recipe);
  // console.log(state.bookmarks);

  //Mark current recipe as bookmark
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  persistBoomarks();
};

export const deleteBookmark = function (id) {
  //Delete bookmark
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);

  //Mark current recipe as NOT bookmark
  if (id === state.recipe.id) state.recipe.bookmarked = false;

  persistBoomarks();
};

const init = function () {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
};

init();
// console.log(state.bookmarks);
const clearBookmarks = function () {
  localStorage.clear('bookmarks');
};
// clearBookmarks();

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim());
        // const ingArr = ing[1].replaceAll(' ', '').split(',');
        if (ingArr.length !== 3)
          throw new Error(
            'Wrong ingredient format! Please use the correct format :)'
          );
        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? +quantity : null, unit, description };
      });
    // console.log(ingredients);
    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };
    // console.log(recipe);
    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};
