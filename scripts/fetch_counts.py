#!/usr/bin/env python3
"""Print current follower counts for all tracked handles (verification helper)."""

from scrape import scrape_instagram_followers, scrape_twitter_followers
from accounts import ACCOUNTS


def main():
    print("Live follower counts\n" + "=" * 40)
    for account in ACCOUNTS:
        party = account["party"]
        tw = scrape_twitter_followers(account["twitter"])
        ig = scrape_instagram_followers(account["instagram"])
        print(f"\n{party}")
        print(f"  X @{account['twitter']}: {tw:,}")
        print(f"  IG @{account['instagram']}: {ig:,}")


if __name__ == "__main__":
    main()
