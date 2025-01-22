import requests
import sys
from datetime import datetime, timedelta, date

from dotenv import load_dotenv
import os

load_dotenv()

# GitHub API details
API_URL = "https://api.github.com/graphql"
TOKEN = os.getenv("GITHUB_TOKEN")  # Replace with your GitHub personal access token
USERNAME = "masonjohnhawver42"  # Replace with your GitHub username

# Query to fetch contribution calendar
QUERY = f"""
query {{
  user(login: "{USERNAME}") {{
    contributionsCollection {{
      contributionCalendar {{
        weeks {{
          contributionDays {{
            date
            contributionCount
          }}
        }}
      }}
    }}
  }}
}}
"""

def fetch_contribution_data():
    """Fetch contribution data from GitHub GraphQL API."""
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = requests.post(API_URL, json={"query": QUERY}, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Query failed: {response.status_code}, {response.text}")
    data = response.json()
    return data["data"]["user"]["contributionsCollection"]["contributionCalendar"]

def generate_html(weeks):
    """Generate an HTML grid for the contribution calendar."""
    n = 1
    today = datetime.now()
    print(today)
    start_date = today - timedelta(days=today.weekday())
    start_date = start_date - timedelta(weeks=52 * n - 1)
    date_to_contributions = {}

    # Map dates to contributions
    for week in weeks:
        for day in week["contributionDays"]:
            date_to_contributions[day["date"]] = day["contributionCount"]

    # Determine the color intensity
    max_contributions = max(date_to_contributions.values(), default=1)

    def get_color(contributions):
        intensity = int(255 * contributions / max_contributions)
        return f"rgba(0, {intensity}, 0, 255)" if contributions > 0 else "rgba(255, 255, 255, 0.15)"  # Gradient from black to green

    # HTML Structure
    html = ["<html>", "<head>", "<style>"]
    html.append("""
    .scroll-container {
        width: 100%;             /* Set the width to 100% of its parent container */
        overflow-x: auto;      /* Hide any overflow on the x-axis */
        white-space: nowrap;     /* Prevent the contents from wrapping */
        position: relative;      /* Relative positioning for control */
        direction: rtl;          /* Reverse the direction of the content */
    }
    .scroll-content {
        direction: rtl;                /* Align to the farthest right */
        margin-bottom: 18px;          /* Add some space at the bottom */
    }
    .grid { display: grid; grid-template-rows: repeat(7, auto); gap: 5px; }
    .day-label { font-weight: bold; }
    .cell { aspect-ratio: 1 / 1; width: 20px; text-align: center; border-radius: 1px; position: relative; }
    .cell.future { background: rgba(0, 0, 0, 0); }
    .cell.today {}
    .cell:hover { border: 2px solid #007bff; }
    .day-row { display: flex; gap: 5px; direction: ltr; }
    .cell.clicked { background: #f0f0f0; border: 2px solid white; }
    </style>
    <script>
    function showInfo(event, day, contributions) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.remove('clicked'));  // Remove 'clicked' class from all cells

        event.target.classList.add('clicked');  // Add the 'clicked' class to the clicked cell
        const info = document.getElementById('info');
        info.innerHTML = `Date: ${day}<br>Contributions: ${contributions}`;
    }
    </script>
    """)
    html.append("</head><body>")
    html.append('<div class="scroll-container">')
    html.append('<div class="grid scroll-content">')

    # Day labels
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    days_of_week = {i: name for i, name in enumerate(day_names, 0)}

    # Add a row for each day of the week
    for i in range(7):  # 0 = Monday, ..., 6 = Sunday
        html.append(f'<div class="day-row">')
        current_date = start_date + timedelta(days=i)

        for _ in range(52 * n):  # Iterate over the last 52 weeks
            day_str = current_date.strftime("%Y-%m-%d")
            contributions = date_to_contributions.get(day_str, 0)
            color = get_color(contributions)
            future_class = "future" if current_date > today else ""
            today_class = "today" if current_date.date() == today.date() else ""
            style = f"background: {color};" if current_date <= today else ""
            html.append(f"""
                <div class="cell {future_class} {today_class}" style="{style}" onclick="showInfo(event, '{day_str}', {contributions})">
                </div>
            """)
            current_date += timedelta(weeks=1)

        html.append("</div>")  # End of row

    html.append("</div></div>")
    html.append('<div id="info" style="margin-top: 0px;"></div>')  # Show clicked cell info here
    html.append("</body></html>")
    return "\n".join(html)

def save_html(html, filename):
    """Save the generated HTML to a file."""
    with open(filename, "w") as file:
        file.write(html)
    print(f"HTML saved to {filename}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python script.py <output_file_path>")
        return

    output_file = sys.argv[1]
    print("Fetching GitHub contribution data...")
    calendar_data = fetch_contribution_data()
    weeks = calendar_data["weeks"]

    print("Generating HTML contribution grid...")
    html = generate_html(weeks)

    save_html(html, output_file)

if __name__ == "__main__":
    main()