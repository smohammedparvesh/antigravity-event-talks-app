import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
import time
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Simple in-memory cache
cache = {
    'data': None,
    'timestamp': 0
}
CACHE_DURATION_SECS = 300  # 5 minutes cache

def clean_html_tags(text):
    """Utility function to strip HTML tags for plain text snippets (e.g. for Twitter)."""
    # Replace common HTML block elements with spaces/newlines
    text = re.sub(r'</p>|<br\s*/?>', '\n', text)
    text = re.sub(r'</li>', '\n', text)
    # Strip remaining HTML tags
    clean = re.compile('<.*?>')
    cleaned_text = re.sub(clean, '', text)
    # Replace multiple spaces/newlines
    cleaned_text = re.sub(r'\n+', '\n', cleaned_text)
    cleaned_text = re.sub(r' +', ' ', cleaned_text)
    return cleaned_text.strip()

def parse_bigquery_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
    except Exception as e:
        print(f"Error fetching feed: {e}")
        raise RuntimeError(f"Failed to fetch feed from Google: {str(e)}")
        
    try:
        # Parse XML with Atom namespace
        root = ET.fromstring(xml_data)
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        entry_idx = 0
        for entry in root.findall('atom:entry', namespace):
            title = entry.find('atom:title', namespace)
            title_text = title.text.strip() if title is not None else "Unknown Date"
            
            updated = entry.find('atom:updated', namespace)
            updated_text = updated.text.strip() if updated is not None else ""
            
            link_elem = entry.find('atom:link[@rel="alternate"]', namespace)
            link = link_elem.attrib['href'] if link_elem is not None else ""
            
            content_elem = entry.find('atom:content', namespace)
            content_html = content_elem.text if content_elem is not None else ""
            
            # Google's release notes feed uses <h3>Type</h3> to delineate updates
            # Example: <h3>Feature</h3> <p>...</p> <h3>Issue</h3> <p>...</p>
            parts = re.split(r'<h3>(.*?)</h3>', content_html)
            
            entry_updates = []
            update_idx = 0
            
            if len(parts) > 1:
                # parts[0] is the text before the first <h3> (usually empty or spacing)
                for i in range(1, len(parts), 2):
                    update_type = parts[i].strip()
                    update_body_html = parts[i+1].strip() if i+1 < len(parts) else ""
                    
                    # Create a plain text description snippet for tweeting
                    plain_text = clean_html_tags(update_body_html)
                    
                    # Generate a unique ID for selection
                    update_id = f"up-{entry_idx}-{update_idx}"
                    
                    entry_updates.append({
                        'id': update_id,
                        'type': update_type,
                        'body': update_body_html,
                        'plain_text': plain_text
                    })
                    update_idx += 1
            else:
                # Fallback if no <h3> separator
                if content_html.strip():
                    plain_text = clean_html_tags(content_html)
                    entry_updates.append({
                        'id': f"up-{entry_idx}-0",
                        'type': 'Update',
                        'body': content_html,
                        'plain_text': plain_text
                    })
            
            if entry_updates:
                entries.append({
                    'date': title_text,
                    'updated': updated_text,
                    'link': link,
                    'updates': entry_updates
                })
                entry_idx += 1
                
        return entries
    except Exception as e:
        print(f"Error parsing feed: {e}")
        raise RuntimeError(f"Failed to parse release notes XML: {str(e)}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/updates')
def get_updates():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    current_time = time.time()
    
    if force_refresh or cache['data'] is None or (current_time - cache['timestamp'] > CACHE_DURATION_SECS):
        try:
            entries = parse_bigquery_release_notes()
            cache['data'] = entries
            cache['timestamp'] = current_time
            print("Successfully updated release notes cache.")
        except Exception as e:
            # If fetch fails but we have cached data, return cached data as fallback
            if cache['data'] is not None:
                return jsonify({
                    'status': 'fallback',
                    'error': str(e),
                    'data': cache['data']
                })
            return jsonify({'error': str(e)}), 500
            
    return jsonify({
        'status': 'success',
        'last_updated': datetime.fromtimestamp(cache['timestamp']).strftime('%Y-%m-%d %H:%M:%S'),
        'data': cache['data']
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
