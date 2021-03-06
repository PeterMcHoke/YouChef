const apiKey = '73363f58e09943caa2e10ba4f99bba93';
const recipeByIngSearchURL = 'https://api.spoonacular.com/recipes/findByIngredients';
const bulkRecipeSearchURL = 'https://api.spoonacular.com/recipes/informationBulk';
const STORE = [];

/* global $ */

// Adding a new ingredient to the DOM
function addNewIngredient(ingredientName) {
  STORE.push({ name: ingredientName, id: cuid() });
  $('#ingredientInput').val('');
}

function showPantry() {
  $('button.searchButton').removeClass('hidden');
  $('#currentIngredientList').addClass('addBorder');
  $('.listHeader').removeClass('hidden');
}

function hidePantry() {
  $('button.searchButton').addClass('hidden');
  $('#currentIngredientList').removeClass('addBorder');
  $('.listHeader').addClass('hidden');
}

function emptyMenuList() {
  $('#results-list').empty();
}

function hideMenu() {
  $('#results').hide();
}

function showMenu() {
  $('#results').show();
}

function renderIngredients() {
  $('#currentIngredientList').empty();
  $('#currentIngredientList').append(STORE.map(ingredientHTML).join('\n'));
  showPantry();
  $('#searchError').empty();
}

function inputHandler() {
  $('#ingredientForm').on('keydown', '#ingredientInput', (e) => {
    const TAB_CODE = 9;
    const ENTER_CODE = 13;
    const { keyCode } = e;

    if (keyCode == TAB_CODE || keyCode == ENTER_CODE) {
      e.preventDefault();
      const newIngredient = $('#ingredientInput').val().trim();
      if (!newIngredient) {
      // handling an empty input
        return;
      }
      addNewIngredient(newIngredient);
      renderIngredients();
    }
  });
}
function initiateLoader() {
  $('.loader').removeClass('hidden');
}

function hideLoader() {
  $('.loader').addClass('hidden');
}

function handleError(error) {
  hideLoader();
  emptyMenuList();
  hideMenu();
  $('#searchError').html(`<h3> No luck! </h3><sub>Are you sure all of the ingredients are spelled correctly?</sub>`);
}

function pantrySubmitHandler() {
  $('.searchButton').on('click', (e) => {
    e.preventDefault();
    fetchRecipes()
      .then(fetchRecipeInfo)
      .then(displayResults)
      .catch(handleError);
  });
}

// Encoding the query parameters
function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
  return queryItems.join('&');
}

// Display the recipe results and populate the modal with info from responseJSON
// This is the only large function in this code base.
// It is long because it dynamically creates HTML and accounts for edge cases.
function displayResults(responseJson) {
  showMenu();
  $('#results-list').empty();
  $('#searchError').empty();
  for (let i = 0; i < responseJson.length; i++) {
    // change ingredients to ingredient if responseJson[i].missedIngredientCount === 1
    let ingredientPlural = 'ingredients';
    if (responseJson[i].missedIngredientCount === 1) {
      ingredientPlural = 'ingredient';
    }
    let missingIngredientText = `<p class='missing-ingredients'> You're only missing<span class='green'> ${responseJson[i].missedIngredientCount}</span> ${ingredientPlural}</p>`;
    if (responseJson[i].missedIngredientCount === 0) {
      missingIngredientText = '<p class=\'missing-ingredients\'><span class="green">You have all of the ingredients!</span></p>';
    }

    $('#results-list').append(
      `<li class='recipe-result' data-item-id='${responseJson[i].id}'>
          <div class='recipe-image modal-trigger' style="background:linear-gradient(rgba(0, 0, 0, 0),rgba(0, 0, 0, 0.0),rgba(0, 0, 0, 0.4),rgba(0, 0, 0, 0.9)),url(${responseJson[i].infoData.image});background-size: contain;background-position: center center;">
            <div class="readyInMin"><i class="fa fa-clock-o" aria-hidden="true"></i><p class="minutesText">${responseJson[i].infoData.readyInMinutes}min</p></div>
            <h3 class="recipe-name">${responseJson[i].title}</h3>
            ${missingIngredientText};
          </div>
      </li>`,
    );
  }

  // hide the loading animation and display the results section
  hideLoader();
  $('#results').removeClass('hidden');

  // Handling when to open the modal with the recipe information
  function openModalHandler() {
    $('#results-list').on('click', '.recipe-result', (e) => {
      $('body').css('overflow', 'hidden');

      e.preventDefault();
      const recipeId = $(e.currentTarget).data('item-id');
      // Finding the recipe that matches the ID of the recipe just clicked
      const recipeObj = responseJson.find((obj) => obj.id === recipeId);
      $('.modal .recipeImage').html(`<img src="${recipeObj.infoData.image}" alt=${recipeObj.title}>`);
      $('.modal .recipeTitle').html(`<h3>${recipeObj.title}</h3>`);
      $('.modal .recipeTime').html(`<i class="fa fa-clock-o" aria-hidden="true"></i><p class="minutesText">${recipeObj.infoData.readyInMinutes}min</p>`);

      // Making sure the ul is empty so that we can fill it with used ingredients
      $('.modal .usedIngredients').empty();
      // Making the list of ingredients
      for (let i = 0; i < recipeObj.infoData.extendedIngredients.length; i++) {
        const ingredientName = recipeObj.infoData.extendedIngredients[i].name;
        let { amount } = recipeObj.infoData.extendedIngredients[i];
        if (amount % 1 !== 0) {
          amount = amount.toFixed(2);
        }
        const unit = recipeObj.infoData.extendedIngredients[i].measures.us.unitShort;
        $('.modal .usedIngredients').append(`<li class="usedIngredient"><strong>${amount} ${unit}</strong><span class='ingredientName'> ${ingredientName}</span></li>`);
      }

      $('.modal .recipeSteps').empty();
      // Making the recipe instructions
      if (recipeObj.infoData.analyzedInstructions[0]) {
        for (let i = 0; i < recipeObj.infoData.analyzedInstructions[0].steps.length; i++) {
          const { step } = recipeObj.infoData.analyzedInstructions[0].steps[i];
          const { number } = recipeObj.infoData.analyzedInstructions[0].steps[i];
          $('.modal .recipeSteps').append(`<li class="recipeInstruction"><strong>${number}.</strong> ${step}</li>`);
        }
      } else {
        $('.modal .recipeSteps').append(`<a href="${recipeObj.infoData.sourceUrl}" target="_blank"><button>Go to ${recipeObj.infoData.sourceName}</button></a>`);
      }
      $('.modal').addClass('modal--show');
    });
  }
  openModalHandler();
// the end of displayResults
}

// Creating a string of IDs so we can make a fetch for extended recipe info
function generateIDString(responseJSON) {
  const recipeIDs = responseJSON.map((item) => item.id);
  const recipeIdString = recipeIDs.join(',');
  return recipeIdString;
}

// Creating a string of our ingredients for the initial search by ingredients fetch
function generateIngString() {
  const ingredientNameArray = STORE.map((item) => item.name);
  const ingredientString = ingredientNameArray.join(',');
  return ingredientString;
}

function fetchJSON(url) {
  return fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.status);
    });
}

// Global variable of the parameters for the recipeByIngredient

// Searching for recipes with the ingredients from the user's "fridge"
function fetchRecipes() {
  initiateLoader();
  const params = {
    apiKey,
    ingredients: generateIngString(),
    ranking: 2,
    ignorePantry: true,
    number: 40,
  };
  const queryString = formatQueryParams(params);
  const url = `${recipeByIngSearchURL}?${queryString}`;
  return fetchJSON(url);
}

// Automatically fetching the extra info for each recipe
function fetchRecipeInfo(responseJSON) {
  const combine = (infoData) => responseJSON.map((r, idx) => ({ ...r, infoData: infoData[idx] }));

  const params = {
    apiKey,
    ids: generateIDString(responseJSON),
  };

  const qStr = formatQueryParams(params);
  const url = `${bulkRecipeSearchURL}?${qStr}`;
  return fetchJSON(url).then(combine);
}

// Creating the list items in the "fridge"
function ingredientHTML(ingredient) {
  return `<li class='listItem' data-item-id='${ingredient.id}'>${ingredient.name}<i class="fa fa-times" aria-hidden="true"></i>
</li>`;
}

function getItemIdFromElement(item) {
  const id = $(item).closest('li').attr('data-item-id');
  return id;
}

function handleNoItems() {
  if (STORE.length === 0) {
    hidePantry();
  }
}

function deleteIngredientHandler() {
  $('#currentIngredientList').on('click', '.fa-times', (e) => {
    const itemId = getItemIdFromElement(e.currentTarget);
    const itemIndex = STORE.findIndex((item) => item.id === itemId);
    STORE.splice(itemIndex, 1);
    renderIngredients();
    handleNoItems();
  });
}

// Modal Functions
function modalHandler() {
  const modal = $('.modal');
  const close = $('.modal__close'); // we loops this to catch the different closers

  // Close the modal
  function closeModal() {
    $('body').css('overflow', '');
    modal.removeClass('modal--show');
  }

  // Open Modal is in displayResults()

  // Close the modal with any element with class 'modal__close'
  for (let i = 0; i < close.length; i++) {
    close[i].onclick = function () {
      closeModal();
    };
  }

  // Click outside of the modal and close it
  $('.modal').on('click', (e) => {
    if (e.currentTarget !== $('.modal__container')) {
      closeModal();
    }
  });

  $(window).on('keydown', (e) => {
    if (e.keyCode === 27 && modal.hasClass('modal--show')) {
      closeModal();
    }
  });
}

function onLoad() {
  inputHandler();
  deleteIngredientHandler();
  pantrySubmitHandler();
  hideLoader();
  modalHandler();
}

$(onLoad);
