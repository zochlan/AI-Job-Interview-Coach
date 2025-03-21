import requests
import json

def test_api():
    """Test the API endpoints"""
    base_url = 'http://localhost:5000'
    
    # Test health check
    print("Testing health check endpoint...")
    response = requests.get(f'{base_url}/api/health')
    print(f"Health check response: {response.json()}\n")
    
    # Test response analysis
    print("Testing response analysis endpoint...")
    test_data = {
        "question": "Tell me about a challenging project you worked on.",
        "response": """When I was working at my previous company, we faced a critical deadline for a client project.
        I needed to coordinate with multiple teams to ensure timely delivery.
        I implemented a new project management system and conducted daily stand-ups to track progress.
        As a result, we delivered the project two days ahead of schedule and received excellent client feedback."""
    }
    
    response = requests.post(
        f'{base_url}/api/analyze',
        json=test_data
    )
    
    print("Analysis response:")
    print(json.dumps(response.json(), indent=2))

if __name__ == '__main__':
    print("Starting API tests...")
    try:
        test_api()
        print("\nAll tests completed successfully!")
    except Exception as e:
        print(f"\nError during testing: {str(e)}") 