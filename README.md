# 🚀 BigQuery Release Hub & Sharing Tool

A sleek, modern, real-time web application built with **Python Flask** and **Vanilla CSS & JavaScript** that tracks, filters, and shares the latest release updates for Google Cloud BigQuery.

🔗 **GitHub Repository**: [https://github.com/smohammedparvesh/antigravity-event-talks-app](https://github.com/smohammedparvesh/antigravity-event-talks-app)

---

## ✨ Features

- 🛰️ **Real-Time Atom Feed Parser**: Fetches the official Google Cloud BigQuery RSS/Atom feed directly.
- ⚡ **Update Segregator**: Splices individual days (which might contain multiple release details) into separate cards categorized as **Features**, **Changes**, **Issues**, **Announcements**, or **Breaking Changes**.
- 📊 **Dynamic Statistics Dashboard**: Computes live counts for all incoming updates. Clicking on any stat block automatically filters the feed.
- 🔍 **Fuzzy Live Search**: Dynamically searches release bodies, tags, and dates on-the-fly.
- 🧪 **5-Minute Cache Protection**: Caches results in memory to improve load performance and avoid hitting Google Cloud feed endpoints excessively, with a "Sync Feed" button to bypass cache.
- 🎨 **Space-Dark Glassmorphic UI**: High-end aesthetic using ambient glows, blur backdrops, fine borders, responsive design, custom scrollbars, and skeleton shimmers for loading states.
- 🐦 **Interactive Twitter/X Composer**:
  - Select any release card to load it directly into the share composer.
  - Automatically sanitizes HTML elements, truncates text to fit within Twitter's 280-character limit, and formats it with emojis and official links.
  - Interactive hashtag toggles (`#BigQuery`, `#GoogleCloud`, `#DataEngineering`) that insert/remove themselves dynamically.
  - Character counter warnings (amber at 250, red/disabled submit button past 280).
  - Quick buttons for copy-to-clipboard and posting directly to Twitter via X Web Share Intent.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.x, Flask (development WSGI server), XML parsing via `xml.etree.ElementTree`.
- **Frontend**: Plain HTML5, Vanilla CSS3 (custom HSL variables, backdrop filters), ES6 JavaScript (AJAX API integration, live search/filtering).
- **Icons**: Lucide Icons CDN.
- **Typography**: Plus Jakarta Sans (Google Fonts).

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Python 3.8+ installed on your machine.

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/smohammedparvesh/antigravity-event-talks-app.git
   cd antigravity-event-talks-app
   ```

2. **Set up Dependencies**:
   It is recommended to use a virtual environment:
   ```bash
   # Create a virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   # Install Flask
   pip install -r requirements.txt
   ```

3. **Run the Application**:
   ```bash
   python app.py
   ```

4. **Access in Web Browser**:
   Open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

---

## 📂 Project Structure

```text
antigravity-event-talks-app/
│
├── app.py                  # Flask backend service (feed fetch, parser, in-memory cache)
├── requirements.txt        # Backend dependencies (Flask)
├── .gitignore              # Ignores bytecode, venv, local environment, and IDE configs
├── README.md               # Repository documentation (this file)
│
├── templates/
│   └── index.html          # Structure for stats, search filters, feeds, and composer
│
└── static/
    ├── css/
    │   └── style.css       # Custom glassmorphic styling, animations, responsive design
    └── js/
        └── app.js          # Main client-side state machine, search, composer controllers
```

---

## 🔒 License

This project is open-source and available under the [MIT License](LICENSE).
