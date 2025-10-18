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
    option.textContent = cat;  // Using textContent as required
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

// --- Simulated server data ---
let serverQuotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "An investment in knowledge pays the best interest.", category: "Education" },
];

// --- Simulate server fetch ---
function fetchQuotesFromServer() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(serverQuotes)));
    }, 1000);
  });
}

// --- Simulate server post ---
function postQuotesToServer(newQuotes) {
  return new Promise((resolve) => {
    setTimeout(() => {
      serverQuotes = JSON.parse(JSON.stringify(newQuotes));
      resolve({ status: "success" });
    }, 1000);
  });
}

// --- UI elements for sync notification ---
const syncNotification = document.getElementById("syncNotification");
const syncMessage = document.getElementById("syncMessage");
const syncNowBtn = document.getElementById("syncNowBtn");

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

    if (!areQuotesEqual(quotes, serverData)) {
      quotes = serverData;
      saveQuotes();
      populateCategories();
      showRandomQuote();

      syncMessage.textContent = "Data was updated from the server.";
      syncNotification.style.display = "block";
    } else {
      syncNotification.style.display = "none";
    }
  } catch (error) {
    console.error("Sync failed:", error);
    syncMessage.textContent = "Failed to sync with server.";
    syncNotification.style.display = "block";
  }
}

// --- Sync Now button handler ---
syncNowBtn.addEventListener("click", () => {
  syncQuotes();
  syncNotification.style.display = "none";
});

// --- Event listeners ---
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// --- Initialization ---
populateCategories();
showRandomQuote();
syncQuotes();
setInterval(syncQuotes, 30000); // Sync every 30 seconds
