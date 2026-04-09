#!/usr/bin/env python3
"""
Calculate Bayesian normalized ratings for Traffic Schools and write back to Notion.

Formula: (n * r + C * m) / (n + C)
  n = review count (from highest-count source)
  r = raw rating from that source
  C = 50 (prior weight — how many "phantom" reviews at the mean)
  m = 4.0 (prior mean — assumed average rating)

This pulls low-review-count schools toward the mean, preventing a school
with 2 reviews at 5.0 from outranking one with 10,000 reviews at 4.7.

Usage:
  python3 scripts/normalize-ratings.py           # calculate and write
  python3 scripts/normalize-ratings.py --dry-run  # calculate only, don't write
"""

import os
import sys
import json
import urllib.request
import urllib.error

NOTION_TOKEN = os.environ.get("NOTION_TOKEN")
DATABASE_ID = os.environ.get("NOTION_SCHOOLS_DB", "63e0b4a1-6382-4c40-8db4-8a9a921d99fc")
NOTION_VERSION = "2022-06-28"
C = 50    # prior weight
M = 4.0   # prior mean

DRY_RUN = "--dry-run" in sys.argv

if not NOTION_TOKEN:
    print("Error: NOTION_TOKEN not set in environment")
    sys.exit(1)


import time

def notion_request(method, path, body=None, retries=3):
    url = f"https://api.notion.com/v1{path}"
    data = json.dumps(body).encode() if body else None
    for attempt in range(retries):
        req = urllib.request.Request(
            url,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {NOTION_TOKEN}",
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            if e.code == 429 or e.code >= 500:
                wait = (attempt + 1) * 2
                print(f"  Retrying in {wait}s (HTTP {e.code})...")
                time.sleep(wait)
                continue
            print(f"  Notion API error {e.code}: {error_body[:200]}")
            return None
        except (ConnectionResetError, urllib.error.URLError) as e:
            wait = (attempt + 1) * 3
            print(f"  Connection error, retrying in {wait}s: {e}")
            time.sleep(wait)
            continue
    return None


def get_number(props, field):
    p = props.get(field)
    if p and p.get("type") == "number" and p.get("number") is not None:
        return p["number"]
    return None


def get_text(props, field):
    p = props.get(field)
    if not p:
        return ""
    if p.get("type") == "title":
        return p["title"][0]["plain_text"] if p.get("title") else ""
    if p.get("type") == "rich_text":
        return p["rich_text"][0]["plain_text"] if p.get("rich_text") else ""
    return ""


def bayesian(n, r):
    """Bayesian normalized rating: (n*r + C*m) / (n + C)"""
    return round((n * r + C * M) / (n + C), 2)


def pick_best_source(props):
    """Pick the rating source with the highest review count."""
    sources = [
        ("Trustpilot", get_number(props, "Rating"), get_number(props, "Review Count")),
        ("Google", get_number(props, "Google Rating"), get_number(props, "Google Review Count")),
        ("App Store", get_number(props, "App Store Rating"), get_number(props, "App Store Review Count")),
        ("Play Store", get_number(props, "Play Store Rating"), get_number(props, "Play Store Review Count")),
    ]

    best = None
    for name, rating, count in sources:
        if rating is not None and count is not None and count > 0:
            if best is None or count > best[2]:
                best = (name, rating, count)

    return best  # (source_name, rating, count) or None


def main():
    if DRY_RUN:
        print("=== DRY RUN — no writes ===\n")

    print(f"Config: C={C} (prior weight), m={M} (prior mean)\n")
    print(f"{'School':<35} {'Source':<12} {'Rating':>6} {'Count':>8} {'Normalized':>10}")
    print("-" * 75)

    cursor = None
    total = 0
    updated = 0
    skipped = 0

    while True:
        body = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor

        resp = notion_request("POST", f"/databases/{DATABASE_ID}/query", body)
        if not resp:
            print("Failed to query database")
            break

        for page in resp.get("results", []):
            total += 1
            props = page["properties"]
            name = get_text(props, "School Name")

            best = pick_best_source(props)
            if not best:
                print(f"{name:<35} {'—':<12} {'—':>6} {'—':>8} {'SKIPPED':>10}")
                skipped += 1
                continue

            source_name, rating, count = best
            normalized = bayesian(count, rating)

            print(f"{name:<35} {source_name:<12} {rating:>6.1f} {count:>8,} {normalized:>10.2f}")

            # Skip if already has the same normalized rating
            existing_norm = get_number(props, "Normalized Rating")
            if existing_norm == normalized:
                continue

            if not DRY_RUN:
                time.sleep(0.4)  # Respect Notion rate limits
                patch_resp = notion_request("PATCH", f"/pages/{page['id']}", {
                    "properties": {
                        "Normalized Rating": {"number": normalized}
                    }
                })
                if patch_resp:
                    updated += 1
                else:
                    print(f"  ^ WRITE FAILED")

        if not resp.get("has_more"):
            break
        cursor = resp.get("next_cursor")

    print("-" * 75)
    print(f"Total: {total} | Updated: {updated} | Skipped: {skipped}")
    if DRY_RUN:
        print("(Dry run — no changes written)")


if __name__ == "__main__":
    main()
