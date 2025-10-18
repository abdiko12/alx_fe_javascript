// --- Initialize quotes from localStorage or default quotes ---
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "An investment in knowledge pays the best interest.", category: "Education" },
];

// --- Session storage for last viewed quote ---
const lastQuote = sessionStorage.getItem('lastQuote');
if (lastQuote) {
  document.getElementById("quoteDisplay").innerHTML = lastQuote;
}

// --- Save quotes to localStorage ---
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// --- Populate category filter dropdown ---
function populateCategories() {
  const filter = document.getElementById("categoryFilter");
  const categories = [...new Set(quotes.map(q => q.category))];

  filter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filter.appendChild(option);
  });

  const savedFilter = localStorage.getItem('selectedCategory');
  if (savedFilter) {
    filter.value = savedFilter;
  }
}

// --- Show random quote from filtered list ---
function showRandomQuote() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const filteredQuotes = selectedCategory === 'all'
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  const quoteDisplay = document.getElementById("quoteDisplay");

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const { text, category } = filteredQuotes[randomIndex];
  const quoteHtml = `<strong>Quote:</strong> "${text}" <br><em>Category:</em> ${category}`;

  quoteDisplay.innerHTML = quoteHtml;
  sessionStorage.setItem('lastQuote', quoteHtml);
}

// --- Filter quotes on category change ---
function filterQuotes() {
  localStorage.setItem('selectedCategory', document.getElementById("categoryFilter").value);
  showRandomQuote();
}

// --- Add a new quote ---
async function addQuote() {
  const quoteText = document.getElementById("newQuoteText").value.trim();
  const quoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (!quoteText || !quoteCategory) {
    alert("Please fill in both the quote and category.");
    return;
  }

  quotes.push({ text: quoteText, category: quoteCategory });
  saveQuotes();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  populateCategories();
  alert("Quote added successfully!");
  showRandomQuote();

  // Update "server"
  try {
    await postQuotesToServer(quotes);
    console.log("Server updated successfully.");
  } catch (err) {
    console.warn("Failed to update server:", err);
  }
}

// --- Export quotes as JSON file ---
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "quotes.json";
  downloadLink.click();

  URL.revokeObjectURL(url);
}

// --- Import quotes from JSON file ---
function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert('Quotes imported successfully!');
        showRandomQuote();
      } else {
        alert("Invalid file format. Expected an array of quotes.");
      }
    } catch (err) {
      alert("Error parsing file.");
    }
  };

  fileReader.readAsText(event.target.files[0]);
}

// --- Fetch quotes from mock API (JSONPlaceholder) ---
async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();

    // Map data to quotes format {text, category}
    // Use title as 'text' and assign a dummy category for demo.
    const fetchedQuotes = data.slice(0, 10).map(post => ({
      text: post.title,
      category: 'Imported'
    }));

    return fetchedQuotes;
  } catch (error) {
    console.error('Fetching from server failed:', error);
    return null;
  }
}

// --- Post quotes to mock API (JSONPlaceholder) ---
async function postQuotesToServer(newQuotes) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newQuotes)
    });
    if (!response.ok) throw new Error('Network response was not ok');

    const result = await response.json();
    console.log('Posted quotes to server:', result);
    return result;
  } catch (error) {
    console.error('Posting to server failed:', error);
    return null;
  }
}

// --- Compare quotes for equality ---
function areQuotesEqual(localQ, serverQ) {
  if (localQ.length !== serverQ.length) return false;
  const sortedLocal = [...localQ].sort((a, b) => (a.text + a.category).localeCompare(b.text + b.category));
  const sortedServer = [...serverQ].sort((a, b) => (a.text + a.category).localeCompare(b.text + b.category));

  return JSON.stringify(sortedLocal) === JSON.stringify(sortedServer);
}

// --- Sync quotes from server ---
async function syncQuotes() {
  try {
    const serverData = await fetchQuotesFromServer();

    if (serverData === null) {
      console.warn("Failed to fetch data from server.");
      return;
    }

    if (!areQuotesEqual(quotes, serverData)) {
      quotes = serverData;
      saveQuotes();
      populateCategories();
      showRandomQuote();

      alert("Quotes synced with server!");
    }
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

// --- Event listeners ---
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
document.getElementById("categoryFilter").addEventListener("change", filterQuotes);
document.getElementById("importFile").addEventListener("change", importFromJsonFile);
document.getElementById("exportBtn").addEventListener("click", exportToJsonFile);
document.getElementById("addQuoteBtn").addEventListener("click", addQuote);

// --- Initialization ---
populateCategories();
showRandomQuote();
syncQuotes();
setInterval(syncQuotes, 30000); // Sync every 30 seconds
