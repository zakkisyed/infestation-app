import json
import re
import os
import time
import requests

from accounts import ACCOUNTS

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

IG_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    ),
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "X-IG-App-ID": "936619743392459",
    "X-Requested-With": "XMLHttpRequest",
}


def parse_followers(count_str: str) -> int:
    """Convert a string like '23.1M' or '50K' to an integer."""
    count_str = count_str.upper().strip().replace(",", "")
    multiplier = 1
    if count_str.endswith("M"):
        multiplier = 1_000_000
        count_str = count_str[:-1]
    elif count_str.endswith("K"):
        multiplier = 1_000
        count_str = count_str[:-1]

    try:
        return int(float(count_str) * multiplier)
    except ValueError:
        return 0


def scrape_twitter_followers(handle: str) -> int:
    """Fetch X follower count via FxTwitter-compatible API, with syndication fallback."""
    print(f"Scraping X for @{handle}...")

    # Primary: FxTwitter / VxTwitter API (reliable for public profiles)
    api_urls = [
        f"https://api.vxtwitter.com/{handle}",
        f"https://api.fxtwitter.com/{handle}",
    ]
    for url in api_urls:
        try:
            response = requests.get(url, headers=REQUEST_HEADERS, timeout=20)
            if response.status_code != 200:
                continue
            data = response.json()
            count = data.get("followers_count")
            if count is None and isinstance(data.get("user"), dict):
                count = data["user"].get("followers")
            if count is not None:
                count = int(count)
                if count > 0:
                    print(f"  Found via API: {count:,} followers")
                    return count
        except Exception as e:
            print(f"  API {url} failed: {e}")

    # Fallback: Twitter syndication timeline (rate-limited; retry once)
    syndication_url = (
        f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}"
    )
    for attempt in range(2):
        try:
            time.sleep(3 * (attempt + 1))
            response = requests.get(syndication_url, headers=REQUEST_HEADERS, timeout=20)
            if response.status_code == 429:
                print(f"  Syndication rate limited (attempt {attempt + 1})")
                continue
            response.raise_for_status()
            match = re.search(r'"followers_count"\s*:\s*(\d+)', response.text)
            if match:
                count = int(match.group(1))
                print(f"  Found via syndication: {count:,} followers")
                return count
        except Exception as e:
            print(f"  Syndication error: {e}")

    print(f"  Could not scrape X followers for @{handle}")
    return 0


def scrape_instagram_followers(handle: str) -> int:
    """Fetch exact Instagram follower count via web_profile_info API, with HTML fallbacks."""
    print(f"Scraping Instagram for @{handle}...")

    # Primary: Instagram's public web_profile_info endpoint (exact integer count)
    api_url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={handle}"
    try:
        response = requests.get(api_url, headers=IG_HEADERS, timeout=20)
        if response.status_code == 200:
            data = response.json()
            user = data.get("data", {}).get("user", {})
            count = user.get("edge_followed_by", {}).get("count")
            if count is not None:
                count = int(count)
                if count > 0:
                    print(f"  Found via web_profile_info: {count:,} followers")
                    return count
        else:
            print(f"  web_profile_info returned {response.status_code}")
    except Exception as e:
        print(f"  web_profile_info error: {e}")

    # Fallback: profile HTML (meta tags round to 4M — less accurate)
    profile_url = f"https://www.instagram.com/{handle}/"
    try:
        response = requests.get(profile_url, headers=IG_HEADERS, timeout=20)
        response.raise_for_status()
        html = response.text

        # og:description often has comma-separated exact count before "Followers"
        og_match = re.search(
            r'<meta property="og:description" content="([\d,\.]+[KMB]?)\s+Followers',
            html,
            re.IGNORECASE,
        )
        if og_match:
            count = parse_followers(og_match.group(1))
            if count > 0:
                print(f"  Found via og:description: {count:,} followers")
                return count

        patterns = [
            r'"edge_followed_by":\{"count":(\d+)\}',
            r'edge_followed_by.*?\"count\":(\d+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            if match:
                count = int(match.group(1))
                if count > 0:
                    print(f"  Found via embedded JSON: {count:,} followers")
                    return count

        print(f"  Could not parse IG followers for @{handle}")
    except Exception as e:
        print(f"  Error scraping Instagram HTML for @{handle}: {e}")

    return 0


def scrape_inflact_followers(handle: str) -> int:
    """
    Inflact Profile Analyzer is not suitable for automation.
    https://inflact.com/tools/profile-analyzer/ uses Cloudflare and client-side JS;
    server-side requests return 403. Use scrape_instagram_followers instead.
    """
    print(f"Inflact scrape skipped for @{handle} (Cloudflare-protected, not automatable)")
    return 0


def main():
    webhook_url = os.environ.get("WEBHOOK_URL")
    if not webhook_url:
        print("WEBHOOK_URL environment variable is missing. Exiting.")
        return

    rows = []
    expected = len(ACCOUNTS) * 2  # X + IG per party

    for i, account in enumerate(ACCOUNTS):
        if i > 0:
            time.sleep(2)

        twitter_handle = account["twitter"]
        ig_handle = account["instagram"]
        party = account["party"]

        twitter_followers = scrape_twitter_followers(twitter_handle)
        if twitter_followers > 0:
            rows.append(
                {
                    "platform": "x",
                    "party": party,
                    "handle": twitter_handle,
                    "follower_count": twitter_followers,
                }
            )

        time.sleep(2)
        ig_followers = scrape_instagram_followers(ig_handle)
        if ig_followers > 0:
            rows.append(
                {
                    "platform": "instagram",
                    "party": party,
                    "handle": ig_handle,
                    "follower_count": ig_followers,
                }
            )

    print(f"\nCollected {len(rows)}/{expected} platform snapshots")
    for row in rows:
        print(f"  {row['party']} {row['platform']} @{row['handle']}: {row['follower_count']:,}")

    if not rows:
        print("No data extracted. Aborting webhook.")
        return

    if len(rows) < expected:
        print("Warning: incomplete snapshot — some platforms could not be scraped.")

    print("\nPosting data to webhook...")
    try:
        response = requests.post(
            webhook_url,
            json={"rows": rows},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        response.raise_for_status()
        print("Successfully posted to webhook.")
    except Exception as e:
        print(f"Error posting to webhook: {e}")
        raise


if __name__ == "__main__":
    main()
