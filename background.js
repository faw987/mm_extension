import {callOpenAI} from './utils/openai.js';
// import {aggregateSearchResultsInNewWindow, calcResults} from './utils/util1.js';
import {aggregateSearchResultsInNewWindow} from './utils/util1.js';
import {logInfo, logError} from './utils/logger.js';
import {extractMovieTitle} from './utils/util1.js';
import {getCurrentTime} from './utils/util1.js';

let s1 = "sk-proj-OLVANonuD0O-x50K_suvL6sJrnwCGFsDximM0VUemM44yWEH8FyjxCOZfY0SgL_8MHGvDpnJ8CT3";
let s2 = "BlbkFJZkMJ_vOeZdbqi3wGGo1ZpGB7yx1n6beziU3tgQ7tUIEEU4exAPZCKkDxCeahz9dwEntFoZ4YsA";

let movieTitles = [];
let movieActors = [];
let restaurants = [];
let testAPI = '';
let apikey = s1 + s2;

// Example JSON object

// n.b. we escape stuff to not expand at this time: :
// \$\{inputText\}
//

const configData = {
    menus: [
        { id: "movieTitle", title: "Titles", setModeTo: "movies",
            messages: [
                {role: "system", content: 'Identify all movie titles in the given text.'},
                {
                    role: "user",
                    content: `Extract movie titles from the following text:\n\$\{inputText\}. 
                    list each title on a seperate line. Do not number the results, just the title please.
                    no extraneous punctuation. no leading hyphen.
                    Do not include "The movie title in the given text is" in the output, just the title.
                    double check your work.`
                }
            ],
        },
        { id: "movieActor", title: "Actors", setModeTo: "actors",
            messages: [
                {role: "system", content: 'Identify all movie actors in the given text.'},
                {
                    role: "user",
                    content: `list all actors and actresses mentioned here: "\$\{inputText\}".
                    each actors name should be listed on a seperate line with no additional added information.
                    just the actors name of a line by itself. no hyphen, asterisk or number.`
                }
            ],
        },
        { id: "restaurants", title: "Restaurants", setModeTo: "restaurants",
            messages: [
                {role: "system", content: 'Identify all restaurants in the given text.'},
                {
                    role: "user",
                    content: `list all restaurants in this text: "\$\{inputText\}".
                    list each restaurant name on a separate line.`
                }
            ],
        }
    ]
};


function evaluateTemplate(template, context) {
    console.log("Starting template evaluation...");
    console.log("Template:", template);
    console.log("Context:", context);

    return template.replace(/\$\{([\w]+)\}/g, (_, variable) => {
        console.log(`Matched placeholder: ${variable}`);
        console.log(`Looking up value for "${variable}" in context...`);

        if (context[variable] !== undefined) {
            console.log(`Found value: ${context[variable]} for variable: ${variable}`);
            return context[variable];
        } else {
            console.warn(`No value found for variable: ${variable}. Replacing with an empty string.`);
            return ""; // Replace with empty string if variable is not found
        }
    });
}

// Iterating over the array and extracting details
configData.menus.forEach((menu) => {
    console.log(`ID: ${menu.id}`);
    console.log(`Title: ${menu.title}`);
    console.log(`setModeTo: ${menu.setModeTo}`);
    console.log("--------");

    let inputText = "Fred"

    // Context for variable substitution
    const context = { inputText };

// Iterate over the messages to evaluate "user" content
    configData.menus.forEach((menu) => {
        menu.messages.forEach((message) => {
            if (message.role === "user") {
                const evaluatedContent = evaluateTemplate(message.content, context);
                console.log(`Evaluated Content for ${menu.id}:`);
                console.log(evaluatedContent);
            }
        });
    });
});


const CURRENT_CONFIG_VERSION = 2;
const DEFAULT_CONFIG = {
    version: CURRENT_CONFIG_VERSION,
    theme: "light",
    notificationsEnabled: true,
};

// Run migration on extension update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "update") {
        console.log("Extension updated!");

        // Load existing configuration
        chrome.storage.local.get("config", (data) => {
            const oldConfig = data.config;

            if (oldConfig) {
                // Check if migration is needed
                if (oldConfig.version !== CURRENT_CONFIG_VERSION) {
                    const migratedConfig = migrateConfig(oldConfig, CURRENT_CONFIG_VERSION);
                    chrome.storage.local.set({config: migratedConfig}, () => {
                        console.log("Config migrated to version:", CURRENT_CONFIG_VERSION);
                    });
                } else {
                    console.log("Config is already up to date.");
                }
            } else {
                // No existing config, initialize defaults
                chrome.storage.local.set({config: DEFAULT_CONFIG}, () => {
                    console.log("Initialized default configuration.");
                });
            }
        });
    } else if (details.reason === "install") {
        console.log("Extension installed for the first time.");
        chrome.storage.local.set({config: DEFAULT_CONFIG});
    }
});

// Migration logic
function migrateConfig(oldConfig, newVersion) {
    console.log("Migrating config from version", oldConfig.version, "to", newVersion);

    // Start with old config and add/update fields
    const newConfig = {...oldConfig, version: newVersion};

    // Add new fields with default values
    if (!("notificationsEnabled" in newConfig)) {
        newConfig.notificationsEnabled = true;
    }

    if (!("theme" in newConfig)) {
        newConfig.theme = "light";
    }

    return newConfig;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was:`,
            oldValue ? JSON.stringify(oldValue, null, 2) : "undefined",
            `New value is:`,
            newValue ? JSON.stringify(newValue, null, 2) : "undefined"
        );
    }
});


const getApiKey = (key) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (data) => {
            if (data[key] !== undefined) {
                resolve(data[key]);
            } else {
                reject(`Key "${key}" not found.`);
            }
        });
    });
};


console.log(`1 >>>>>>>>>>>>>>>>>>>>>>> apikey: ${apikey}`);

const key = 'openaikey';
getApiKey(key)
    .then((apikey1) => {
        console.log(`>>>>>>>>>>>>> set >>>>>>>>>> apikey: ${apikey1}`);
        console.log(`>>>>>>>>>>>>>>>>>>>>>>> apikey: ${apikey1}`);
        apikey = apikey1;
        // Use apikey safely here
    })
    .catch((err) => console.error(err));


console.log(`2 >>>>>>>>>>>>>>>>>>>>>>> apikey: ${apikey}`);


// check if API is working and send notification if it is OK

findMovieTitles("The Graduate").then((titles) => {
    console.log(`>>>>>>>>>>>>>>>>>>>>>>> titles: ${titles}`)
    let testAPI = titles;
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/video-camera128128.png", // Replace with an actual icon in your extension folder
        title: "Hello, World!",
        message: `If findMovieTitles succeeds expect to see The Graduate: ${testAPI}`,
    }, () => {
        if (chrome.runtime.lastError) {
            console.error("Notification error:", chrome.runtime.lastError);
        } else {
            console.log("Notification created successfully.");
        }
    });
});

console.log(`3 >>>>>>>>>>>>>>>>>>>>>>> apikey: ${apikey}`);


// Add context menu items
chrome.runtime.onInstalled.addListener(() => {
    // chrome.contextMenus.create({
    //     id: "movieTitle",
    //     title: "Titles",
    //     contexts: ["selection"]
    // });
    //
    // chrome.contextMenus.create({
    //     id: "movieActor",
    //     title: "Actors",
    //     contexts: ["selection"]
    // });
    //
    // chrome.contextMenus.create({
    //     id: "restaurants",
    //     title: "Restaurants",
    //     contexts: ["selection"]
    // });

    // Iterating over the array and extracting details
    configData.menus.forEach((menu) => {
        console.log(`ID: ${menu.id}`);
        console.log(`Title: ${menu.title}`);
        console.log(`setModeTo: ${menu.setModeTo}`);
        console.log("--------");

        chrome.contextMenus.create({
                id: `${menu.id}`,
                title: `${menu.title}`,
                contexts: ["selection"]
            });
    });
});


chrome.storage.local.set({mode: 'uninitialized'}, () => {
    if (chrome.runtime.lastError) {
        console.error('Error setting value for key=mode:', chrome.runtime.lastError);
    } else {
        console.log('Value set successfully key=mode value=uninitialized');
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getMovies") {
        console.log("sendResponse({ movies: movieTitles - NEXT", movieTitles);
        sendResponse({movies: movieTitles});
        console.log("sendResponse({ movies: movieTitles - AFTER", movieTitles);
    } else if (message.action === "getActors") {
        console.log("sendResponse({ movies: getActors - NEXT", movieActors);
        sendResponse({actors: movieActors});
        console.log("sendResponse({ movies: getActors - AFTER", movieActors);
    } else if (message.action === "getRestaurants") {
        console.log("sendResponse({ restaurants: getRestaurants - NEXT", restaurants);
        sendResponse({restaurants: restaurants});
        console.log("sendResponse({ movies: getRestaurants - AFTER", restaurants);
    } else if (message.action === "processMovies") {
        console.log("Processing movies:", message.movies);
        // Logic for opening tabs or fetching more info will go here
        if (Array.isArray(message.movies)) {
            message.movies.forEach((movie) => {
                aggregateSearchResultsInNewWindow(extractMovieTitle(movie));
            });
        }
    }
});

let invocationContext = "toolbar"; // Default to toolbar

chrome.contextMenus.onClicked.addListener((info) => {

   // movieTitle

    if (info.menuItemId === "movieTitle" && info.selectionText) {
        invocationContext = "contextMenu"; // Update context
        const inputText = info.selectionText.trim();

        console.log("background inputText:", inputText);

        chrome.storage.local.set({mode: 'movies'}, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting value for key=mode value=movies:', chrome.runtime.lastError);
            } else {
                console.log('Value set successfully key=mode value=movies');
            }
        });

        findMovieTitles(inputText).then((titles) => {
            console.log("background titles:", titles);

            movieTitles = titles;

            if (titles.length === 1) {
                // Directly process the single movie
                const movieTitle = extractMovieTitle(titles[0]);
                aggregateSearchResultsInNewWindow(movieTitle);
            } else {

                console.log("local set next titles:", titles);

                chrome.storage.local.set({movies: titles}, () => {
                    chrome.windows.create({
                        url: "popup.html",
                        type: "popup",
                        width: 400,
                        height: 600
                    });
                });
            };
        });
    };

// movieActor
    if (info.menuItemId === "movieActor" && info.selectionText) {
        invocationContext = "contextMenu"; // Update context
        const inputText = info.selectionText.trim();

        console.log("background inputText:", inputText);

        chrome.storage.local.set({mode: 'actors'}, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting value for key=mode value=actors:', chrome.runtime.lastError);
            } else {
                console.log('Value set successfully key=mode value=actors');
            }
        });

        findMovieActors(inputText).then((actors) => {
            console.log("background actors:", actors);

            movieActors = actors;

            if (actors.length === 1) {
                // // Directly process the single movie
                // const movieTitle = extractMovieTitle(titles[0]);
                // aggregateSearchResultsInNewWindow(movieTitle);
                alert(`There are exactly one actor. no further processing at this time`);
            } else {

                console.log("local set next actors:", actors);

                chrome.storage.local.set({actors: actors}, () => {
                    chrome.windows.create({
                        url: "popup.html",
                        type: "popup",
                        width: 400,
                        height: 600
                    });
                });
            };
        });
    };

    if (info.menuItemId === "restaurants" && info.selectionText) {
        invocationContext = "contextMenu"; // Update context
        const inputText = info.selectionText.trim();

        console.log("background inputText:", inputText);

        chrome.storage.local.set({mode: 'restaurants'}, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting value for key=mode value=actors:', chrome.runtime.lastError);
            } else {
                console.log('Value set successfully key=mode value=actors');
            }
        });

        findRestaurants(inputText).then((rests) => {
            console.log("background rests:", rests);

            restaurants = rests;

            if (rests.length === 1) {
                // // Directly process the single movie
                // const movieTitle = extractMovieTitle(titles[0]);
                // aggregateSearchResultsInNewWindow(movieTitle);
                alert(`There are exactly one restaurant. no further processing at this time`);
            } else {

                console.log("local set next rests:", rests);

                chrome.storage.local.set({restaurants: rests}, () => {
                    chrome.windows.create({
                        url: "popup.html",
                        type: "popup",
                        width: 400,
                        height: 600
                    });
                });
            };
        });
    };
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "getContext") {
            sendResponse({context: invocationContext});
            // Reset context to default
            invocationContext = "toolbar";
        } else if (message.action === "getMovies") {
            console.log("background getMovies");
            chrome.storage.local.get("movies", (data) => {
                sendResponse({movies: data.movies || []});
                console.log("background data.movies:", data.movies);
            });
            return true; // Keep message channel open for async response
        } else if (message.action === "getActors") {
            console.log("background getActors");
            chrome.storage.local.get("actors", (data) => {
                sendResponse({actors: data.actors || []});
                console.log("background data.actors:", data.actors);
            });
            return true; // Keep message channel open for async response
        } else if (message.action === "resetTables") {
            console.log("background resetTables");
            chrome.storage.local.set({movies: ''}, () => {
            });
            chrome.storage.local.set({actors: ''}, () => {
            });
            movieTitles = [];
            movieActors = [];

            return true; // Keep message channel open for async response
        }
    }
);


// Helper function to find movie titles using OpenAI
async function findMovieTitles(inputText) {
    console.log(`>>>>>>>>>>>>> findMovieTitles 1 >>>>>>>>>> apikey: ${apikey}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apikey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: 'Identify all movie titles in the given text.'},
                {
                    role: "user",
                    content: `Extract movie titles from the following text:\n${inputText}. 
                    list each title on a separate line. Do not number the results, just the title please.
                    no extraneous punctuation. no leading hyphen.
                    Do not include "The movie title in the given text is" in the output, just the title.
                    double check your work.`
                }
            ],
            max_tokens: 200
        })
    });

    if (!response.ok) {
        throw new Error(`findMovieTitles OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content?.trim();
    console.log(`background resultText ${resultText}`)
    return resultText ? resultText.split("\n").map((line) => line.trim()) : [];
};


// Helper function to find movie titles using OpenAI
async function findMovieActors(inputText) {

    const earliestYear = 1900;
    const latestYear = 1960;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apikey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: 'Identify all movie actors in the given text.'},
                {
                    role: "user",
                    content: `list all actors and actresses mentioned here: "${inputText}".
                    each actors name should be listed on a separate line with no additional added information.
                    just the actors name on a line by itself. no hyphen, asterisk or number.`
                }
            ],
            max_tokens: 200
        })
    });

    if (!response.ok) {
        throw new Error(`findMovieActors OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content?.trim();
    console.log(`background resultText ${resultText}`)
    return resultText ? resultText.split("\n").map((line) => line.trim()) : [];
}


// Helper function to find movie titles using OpenAI
async function findRestaurants(inputText) {

    const earliestYear = 1900;
    const latestYear = 1960;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apikey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: 'Identify all restaurants in the given text.'},
                {
                    role: "user",
                    content: `list all restaurants in this text: "${inputText}".
                    list each restaurant name on a separate line.
                    just the restaurants name on a line by itself. no hyphen, asterisk or number.`
                }
            ],
            max_tokens: 200
        })
    });

    if (!response.ok) {
        throw new Error(`findRestaurants OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content?.trim();
    console.log(`background resultText ${resultText}`)
    return resultText ? resultText.split("\n").map((line) => line.trim()) : [];
}
