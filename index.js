// fetch("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?number=5&ranking=1&ignorePantry=false&ingredients=chicken%252C%20rice%252C%20oregano%252C%20tortillas%252C%20beans", {
// 	"method": "GET",
// 	"headers": {
// 		"x-rapidapi-host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
// 		"x-rapidapi-key": "c205900701msh88567b5902f4797p1fa7e5jsn95c56c056c11"
// 	}
// })
// .then(response => {
// 	console.log(response);
// })
// .catch(err => {
// 	console.log(err);
// });

const apiKey = "73363f58e09943caa2e10ba4f99bba93";
const recipeByIngSearchURL = "https://api.spoonacular.com/recipes/findByIngredients";
const basicRecipeSearchURL = 'https://api.spoonacular.com/recipes/search';
const bulkRecipeSearchURL = 'https://api.spoonacular.com/recipes/informationBulk';
const STORE = [];

//API Functions//

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

// <li class='recipe-result'>
//   <div class='recipe-image' style="background:linear-gradient(rgba(0, 0, 0, 0),rgba(0, 0, 0, 0.0),rgba(0, 0, 0, 0.2),rgba(0, 0, 0, 0.7)),url(${responseJson[i].image});background-size: contain;background-position: center center;"><a href="${responseJson[i].infoData.sourceUrl}" target="_blank"><h3 class="recipe-name">${responseJson[i].title}</h3></a></div>
//   <div class="recipeDescription">
//     <p class='missing-ingredients'>You're only missing <span class='red'>${responseJson[i].missedIngredientCount}</span> ingredients</p>
//     <hr>
//     <p class="description-below">Ready in <span class='green'>${responseJson[i].infoData.readyInMinutes}</span> minutes</p>
//   </div>
// </li>

function displayResults(responseJson) {
  console.log(responseJson);
	$('#results-list').empty();

	for (let i = 0; i < responseJson.length; i++){

//change ingredients to ingredient if responseJson[i].missedIngredientCount === 1
    $('#results-list').append(
      `<li class='recipe-result'>
        <a href="${responseJson[i].infoData.sourceUrl}" target="_blank">
          <div class='recipe-image' style="background:linear-gradient(rgba(0, 0, 0, 0),rgba(0, 0, 0, 0.0),rgba(0, 0, 0, 0.4),rgba(0, 0, 0, 0.9)),url(${responseJson[i].image});background-size: contain;background-position: center center;">
            <div class="readyInMin"><i class="fa fa-clock-o" aria-hidden="true"></i><p class="minutesText">${responseJson[i].infoData.readyInMinutes}min</p></div>
            <h3 class="recipe-name">${responseJson[i].title}</h3>
            <p class='missing-ingredients'>You're only missing <span class='green'> ${responseJson[i].missedIngredientCount}</span> ingredients</p>
          </div>
        </a>
      </li>`
    )};
  //display the results section
  hideLoader();
  $('#results').removeClass('hidden');
}

function generateIDString(responseJSON) {
    const recipeIDs = responseJSON.map(function(item) {
        return item['id'];
    });
    const recipeIdString = recipeIDs.join(',');
	console.log("This is the string of IDs: " + recipeIdString);
	return recipeIdString;
};

function generateIngString(){
	 const ingredientNameArray = STORE.map(function(item) {
   return item['name'];
});
	 const ingredientString = ingredientNameArray.join(',');
	 console.log("This is the ingredient string: " + ingredientString);
	 return ingredientString;
}

function fetchJSON(url) {
  return fetch(url)
	.then(response => {
		if (response.ok) {
			return response.json();
		}
		throw new Error(response.statusText);
	});
}

function fetchRecipes() {
  initiateLoader();
  console.log('fetchRecipes is being called');
	const params = {
		apiKey: apiKey,
		ingredients: generateIngString(),
		ranking: 2,
		ignorePantry: true,
		number: 24,
    // intolerances: "Dairy",
    // instructionsRequired: true
	}
	const queryString = formatQueryParams(params);
	const url = recipeByIngSearchURL + '?' + queryString;
	console.log("This is the url: " + url);

  console.log("This is the JSON from the bottom of fetchRecipes" + fetchJSON(url));
  return fetchJSON(url);
};

/*
Promise.all([fetch('a'), fetch('b')]).then(
  data => {
    // data is [result of fetch a, result of fetch b]
  }
)
*/


function fetchRecipeInfo(responseJSON) {
    console.log('fetchRecipeInfo is being called');
  const combine = infoData => responseJSON.map((r, idx) => ({...r, infoData: infoData[idx]}));

  const params = {
		apiKey: apiKey,
        ids: generateIDString(responseJSON),
	}

	const qStr = formatQueryParams(params);
	const url = bulkRecipeSearchURL + '?' + qStr;
  console.log("This the the bulk url: \n" + url);

  return fetchJSON(url).then(combine);
}


//Adding a new ingredient to the DOM
function addNewIngredient(ingredientName) {
	STORE.push({name: ingredientName, id: cuid()});
	$('#ingredientInput').val('');
}

function ingredientHTML(ingredient) {
	return `<li class='listItem' data-item-id='${ingredient.id}'>${ingredient.name}<i class="fa fa-times" aria-hidden="true"></i>
</li>`;
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

function renderIngredients() {
	$('#currentIngredientList').empty();
	$('#currentIngredientList').append(
		STORE.map(ingredientHTML).join('\n')
	);
	console.log(STORE);
	showPantry();
}

function getItemIdFromElement(item){
  const id = $(item).closest('li').attr("data-item-id");
  return id;
};


function deleteIngredientHandler() {
	$('#currentIngredientList').on('click','.fa-times', e => {
		const itemId = getItemIdFromElement(e.currentTarget);
		const itemIndex = STORE.findIndex(item => item.id === itemId);
		STORE.splice(itemIndex,1);
		renderIngredients();
		handleNoItems();
	})
}

function handleNoItems() {
	if (STORE.length === 0) {
		hidePantry();
	}
}

function inputHandler() {
	$('#ingredientForm').on('keydown','#ingredientInput', e => {

	const TAB_CODE = 9;
	const ENTER_CODE = 13;
	const keyCode = e.keyCode;

	if (keyCode == TAB_CODE || keyCode == ENTER_CODE) {
		e.preventDefault()
		const newIngredient = $('#ingredientInput').val();
		addNewIngredient(newIngredient);
		renderIngredients();
		}
	});
}

const numberOfJsonResponses = 0;

function printJson(responseJSON) {
  numberOfJsonResponses += 1;
  console.log("This is the JSON response #" + numberOfJsonResponses + "\n" + responseJSON);
}

function initiateLoader() {
$('.loader').removeClass('hidden');
};

function hideLoader() {
  $('.loader').addClass('hidden');
};

function pantrySubmitHandler() {
	$('.searchButton').on('click', e => {
		e.preventDefault();
		fetchRecipes().then(
      fetchRecipeInfo
    ).then(
      displayResults
    ).catch(err => {
      alert(`Something went wrong: ${err.message}`);
    });
	})
};

function onLoad() {
	inputHandler();
	deleteIngredientHandler();
	pantrySubmitHandler();
  hideLoader();
}

$(onLoad);
