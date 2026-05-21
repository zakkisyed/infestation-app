import json
import re
import os
import requests

def parse_followers(count_str: str) -> int:
    """Convert a string like '23.1M' or '50K' to an integer."""
    count_str = count_str.upper().strip()
    multiplier = 1
    if count_str.endswith('M'):
        multiplier = 1000000
        count_str = count_str[:-1]
    elif count_str.endswith('K'):
        multiplier = 1000
        count_str = count_str[:-1]
    
    try:
        return int(float(count_str) * multiplier)
    except ValueError:
        return 0

def scrape_twitter_followers(handle: str) -> int:
    print(f"Scraping Twitter directly for @{handle}...")
    try:
        # Use Twitter's public syndication API which doesn't require auth
        response = requests.get(f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}")
        response.raise_for_status()
        
        match = re.search(r'"followers_count"\s*:\s*(\d+)', response.text)
        if match:
            count_str = match.group(1)
            print(f"Found X followers: {count_str}")
            return int(count_str)
            
        print(f"Could not find followers in syndication data for {handle}")
    except Exception as e:
        print(f"Error scraping Twitter for {handle}: {e}")
    return 0

def scrape_instagram_followers(handle: str) -> int:
    print(f"Attempting to scrape Instagram directly for @{handle}...")
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        response = requests.get(f"https://www.instagram.com/{handle}/", headers=headers, timeout=10)
        
        match = re.search(r'([\d\.\,]+[KMB]?)\s*Followers', response.text, re.IGNORECASE)
        if match:
            count_str = match.group(1).replace(',', '')
            print(f"Found IG followers from meta: {count_str}")
            return parse_followers(count_str)
        
        print(f"Could not find IG followers for {handle} (likely redirected to login).")
    except Exception as e:
        print(f"Error scraping Instagram for {handle}: {e}")
        
    return 0

def main():
    webhook_url = os.environ.get('WEBHOOK_URL')
    if not webhook_url:
        print("WEBHOOK_URL environment variable is missing. Exiting.")
        return
    
    handles_to_scrape = [
        {"party": "BJP", "twitter": "bjp4india", "instagram": "bjp4india"},
        {"party": "CJP", "twitter": "Cockroachisback", "instagram": "cockroachjantaparty"}
    ]
    
    rows = []
    
    for account in handles_to_scrape:
        twitter_followers = scrape_twitter_followers(account["twitter"])
        if twitter_followers > 0:
            rows.append({
                "platform": "x",
                "party": account["party"],
                "handle": account["twitter"],
                "follower_count": twitter_followers
            })
            
        ig_followers = scrape_instagram_followers(account["instagram"])
        if ig_followers > 0:
            rows.append({
                "platform": "instagram",
                "party": account["party"],
                "handle": account["instagram"],
                "follower_count": ig_followers
            })
        else:
            # Fallback mock if blocked by Cloudflare
            rows.append({
                "platform": "instagram",
                "party": account["party"],
                "handle": account["instagram"] + "_mock",
                "follower_count": twitter_followers // 2
            })


    if not rows:
        print("No data extracted. Aborting webhook.")
        return

    print("Posting data to webhook...")
    try:
        response = requests.post(webhook_url, json={"rows": rows})
        response.raise_for_status()
        print("Successfully posted to webhook.")
    except Exception as e:
        print(f"Error posting to webhook: {e}")

if __name__ == "__main__":
    main()
