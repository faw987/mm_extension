
export function extractMovieTitle(rawTitle) {
    // Remove leading digits and a period (e.g., "123. Movie Name" -> "Movie Name")
    return rawTitle.replace(/^\d+\.\s*/, "").trim();
}

// export function calcResults() {
//
//     const p0 = "sk-" + "proj-9Bhqoki1MgfS8v6JWlPbLWBx994X2o21NBj9tI7AsWFT9aLYAmxrROQk6tun43";
//     const p1 = "-tjIUQiaDMwTT3BlbkFJGlDPtRgpk05hovtANnzGKWTbOx";
//     const p2 = "94jVSpGuSwMiv2rpvuW4sVLWVgWCucNnfOPl0Or03QmcvXoA"
//
//     const pp0 = p0 + p1;
//     const pp1 = pp0 + p2;
//     return pp1;
// }


// Helper function to show notifications
export function showNotification(title, message) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon128.png", // Path to your extension's icon
        title: title,
        message: message
    });
}


// Check if input is a URL
export function isUrl(input) {
    try {
        new URL(input);
        return true;
    } catch {
        return false;
    }
}

// Fetch the title of a given URL
export async function fetchTitleFromUrl(url) {
    const response = await fetch(url);
    const text = await response.text();
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1] : "Untitled";
}

// Define search engines
const searchEngines = [
    { name: "Rotten Tomatoes", url: (query) => `https://www.rottentomatoes.com/search?search=${encodeURIComponent(query)}` },
    { name: "IMDb", url: (query) => `https://www.imdb.com/search/title/?title=${encodeURIComponent(query)}` },
    { name: "Google", url: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}` },
    { name: "Netflix", url: (query) => `https://www.netflix.com/search?q=${encodeURIComponent(query)}` },
    { name: "Wikipedia", url: (query) => `https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(query)}` },
    { name: "Amazon", url: (query) => `https://www.amazon.com/s?k=${encodeURIComponent(query)}` },
    { name: "faw98", url: (query) => `http://faw987.github.io/faw98?text=${encodeURIComponent(query)}&model=o1-mini&title=true&submit=true` },
    { name: "free", url: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}+full+movie&tbm=vid` },
    { name: "restaurant", url: (query) => `http://faw987.github.io/faw115.html?text="${encodeURIComponent(query)}"&submit=false` }
];




export function aggregateSearchResults(query) {
    chrome.storage.local.get(["searchEngineConfig", "newWindowPreference"], (data) => {
        const config = data.searchEngineConfig || {};
        const newWindowPreference = data.newWindowPreference ?? true;

        console.log(`after get newWindowPreference: ${newWindowPreference}`);
        alert(`after get newWindowPreference: ${newWindowPreference}`);

        // Filter selected search engines
        const selectedEngines = searchEngines.filter((engine) => config[engine.name] !== false);
        const urls = selectedEngines.map((engine) => engine.url(query));

        if (urls.length === 0) {
            alert("Please configure at least one search engine.");
            return;
        }

        if (newWindowPreference) {
            // Open in a new window
            alert("if-part newWindowPreference");
            chrome.windows.create({
                url: urls,
                type: "normal"
            }, () => {
                console.log("New window created with search tabs.");
            });
        } else {
            // Open in the current window
            alert("else-part newWindowPreference");
            urls.forEach((url) => {
                chrome.tabs.create({ url });
            });
        }
    });
}

// Open search results in a new window based on user-configured search engines
export function aggregateSearchResultsInNewWindow(query) {

    chrome.storage.local.get(["searchEngineConfig", "newWindowPreference"], (data) => {
        const config = data.searchEngineConfig || {};
        const newWindowPreference = data.newWindowPreference ?? true;

        console.log(`aaggregateSearchResultsInNewWindow after get newWindowPreference: ${newWindowPreference}`);

        // Filter selected search engines
        const selectedEngines = searchEngines.filter((engine) => config[engine.name] !== false);
        const urls = selectedEngines.map((engine) => engine.url(query));

        if (urls.length === 0) {
            alert("Please configure at least one search engine.");
            return;
        }

        if (newWindowPreference) {
            // Open in a new window
            console.log("if-part newWindowPreference");
            chrome.windows.create({
                url: urls,
                type: "normal"
            }, () => {
                console.log("New window created with search tabs.");
            });
        } else {
            // Open in the current window
            console.log("else-part newWindowPreference");
            urls.forEach((url) => {
                chrome.tabs.create({ url });
            });
        }
    });
}