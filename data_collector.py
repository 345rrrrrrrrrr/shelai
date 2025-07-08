#!/usr/bin/env python3
"""
AI-Generated Data Collector
Connects to JSONPlaceholder API, gathers data, and stores it in a file
"""

import requests
import json
import os
from datetime import datetime

def install_requirements():
    """Ensure required packages are installed"""
    print("Installing required packages...")
    os.system("pip install requests")

def connect_to_api():
    """Connect to JSONPlaceholder API and gather data"""
    print("Connecting to JSONPlaceholder API...")
    
    # Base URL for the API
    base_url = "https://jsonplaceholder.typicode.com"
    
    # Gather data from multiple endpoints
    data = {}
    
    try:
        # Get posts
        print("Fetching posts...")
        posts_response = requests.get(f"{base_url}/posts")
        data['posts'] = posts_response.json()
        
        # Get users
        print("Fetching users...")
        users_response = requests.get(f"{base_url}/users")
        data['users'] = users_response.json()
        
        # Get comments
        print("Fetching comments...")
        comments_response = requests.get(f"{base_url}/comments")
        data['comments'] = comments_response.json()
        
        # Get todos
        print("Fetching todos...")
        todos_response = requests.get(f"{base_url}/todos")
        data['todos'] = todos_response.json()
        
        # Add metadata
        data['metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'total_posts': len(data['posts']),
            'total_users': len(data['users']),
            'total_comments': len(data['comments']),
            'total_todos': len(data['todos']),
            'api_source': 'JSONPlaceholder'
        }
        
        print(f"Successfully gathered {len(data)} data categories")
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to API: {e}")
        return None

def store_data(data, filename="collected_data.json"):
    """Store the gathered data in a JSON file"""
    if data is None:
        print("No data to store")
        return False
        
    try:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"Data successfully stored in {filename}")
        
        # Create a summary file
        summary_filename = "data_summary.txt"
        with open(summary_filename, 'w') as f:
            f.write("DATA COLLECTION SUMMARY\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Timestamp: {data['metadata']['timestamp']}\n")
            f.write(f"API Source: {data['metadata']['api_source']}\n")
            f.write(f"Total Posts: {data['metadata']['total_posts']}\n")
            f.write(f"Total Users: {data['metadata']['total_users']}\n")
            f.write(f"Total Comments: {data['metadata']['total_comments']}\n")
            f.write(f"Total Todos: {data['metadata']['total_todos']}\n")
            f.write(f"\nData stored in: {filename}\n")
            f.write(f"File size: {os.path.getsize(filename)} bytes\n")
        
        print(f"Summary created in {summary_filename}")
        return True
        
    except Exception as e:
        print(f"Error storing data: {e}")
        return False

def main():
    """Main function to orchestrate the data collection process"""
    print("AI Data Collector Starting...")
    print("=" * 50)
    
    # Step 1: Install requirements
    install_requirements()
    
    # Step 2: Connect to API and gather data
    data = connect_to_api()
    
    # Step 3: Store the data
    if store_data(data):
        print("\n" + "=" * 50)
        print("Data collection completed successfully!")
        print("Files created:")
        print("- collected_data.json (full dataset)")
        print("- data_summary.txt (summary report)")
    else:
        print("Data collection failed!")

if __name__ == "__main__":
    main()