#!/usr/bin/env python3
"""
CatTracker ASC 发布脚本
- 创建/更新 12 个语言 locale 的元数据
- 上传截图到每个 locale
- 关联 Build 12
- 设置隐私政策 URL
- 订阅组 localization
- 设置定价为免费
"""

import jwt
import time
import requests
import json
import os
import hashlib
import sys

# ── 配置 ──────────────────────────────────────────────
KEY_ID = "L57984QZY8"
ISSUER_ID = "69a6de7e-fe42-47e3-e053-5b8c7c11a4d1"
KEY_PATH = "/Users/martin/.appstoreconnect/private_keys/AuthKey_L57984QZY8.p8"

ASC_APP_ID = "6761513507"
VERSION_ID = "4b7148bb-e0d6-4d58-a027-a5176fee447f"
SUBSCRIPTION_GROUP_ID = "22011101"
PRIVACY_POLICY_URL = "https://maaker-ai.github.io/CatTracker/privacy-policy.html"
SCREENSHOTS_BASE = "/Users/martin/OpenSource/CatTracker/app-store/screenshots"

# Locale 映射：manifest key → Apple locale code
LOCALE_MAP = {
    "en": "en-US",
    "zh-Hans": "zh-Hans",
    "zh-Hant": "zh-Hant",
    "ja": "ja",
    "ko": "ko",
    "de": "de-DE",
    "fr": "fr-FR",
    "es": "es-ES",
    "ru": "ru",
    "it": "it",
    "ar": "ar-SA",
    "id": "id",
}

# 支持的所有 Apple locale codes（按顺序）
ALL_APPLE_LOCALES = list(LOCALE_MAP.values())

# ── JWT ──────────────────────────────────────────────
def make_token():
    with open(KEY_PATH) as f:
        private_key = f.read()
    now = int(time.time())
    token = jwt.encode(
        {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
        private_key,
        algorithm="ES256",
        headers={"kid": KEY_ID},
    )
    return token

def get_headers():
    return {
        "Authorization": f"Bearer {make_token()}",
        "Content-Type": "application/json",
    }

BASE_URL = "https://api.appstoreconnect.apple.com"

def api_get(path, params=None):
    r = requests.get(f"{BASE_URL}{path}", headers=get_headers(), params=params)
    if r.status_code not in (200, 201):
        print(f"  GET {path} -> {r.status_code}: {r.text[:300]}")
    return r

def api_post(path, body):
    r = requests.post(f"{BASE_URL}{path}", headers=get_headers(), json=body)
    if r.status_code not in (200, 201):
        print(f"  POST {path} -> {r.status_code}: {r.text[:500]}")
    return r

def api_patch(path, body):
    r = requests.patch(f"{BASE_URL}{path}", headers=get_headers(), json=body)
    if r.status_code not in (200, 201):
        print(f"  PATCH {path} -> {r.status_code}: {r.text[:500]}")
    return r

def api_delete(path):
    r = requests.delete(f"{BASE_URL}{path}", headers=get_headers())
    return r

# ── 加载 ASO 元数据 ───────────────────────────────────
def load_aso_metadata():
    with open("/Users/martin/OpenSource/CatTracker/aso-metadata.json") as f:
        return json.load(f)

# ── Step 1: 获取或创建 appStoreVersionLocalizations ──
def get_or_create_locale(apple_locale, aso_data):
    """获取或创建指定 locale 的 appStoreVersionLocalization"""
    # 先获取现有 localizations
    r = api_get(f"/v1/appStoreVersions/{VERSION_ID}/appStoreVersionLocalizations")
    existing = {}
    for item in r.json().get("data", []):
        existing[item["attributes"]["locale"]] = item["id"]

    # 找到对应的 ASO 数据
    manifest_key = None
    for k, v in LOCALE_MAP.items():
        if v == apple_locale:
            manifest_key = k
            break

    if apple_locale == "en-US":
        title = aso_data["title"]
        subtitle = aso_data["subtitle"]
        description = aso_data["description"]
        keywords = aso_data["keywords"]
        promo_text = aso_data["promotional_text"]
        whats_new = aso_data["whats_new"]
    else:
        loc_data = aso_data["localizations"].get(manifest_key, {})
        title = loc_data.get("title", aso_data["title"])
        subtitle = loc_data.get("subtitle", aso_data["subtitle"])
        description = loc_data.get("description", aso_data["description"])
        keywords = loc_data.get("keywords", aso_data["keywords"])
        promo_text = loc_data.get("promotional_text", aso_data["promotional_text"])
        whats_new = aso_data.get("whats_new", "• Bug fixes and performance improvements")

    # PATCH 时不能包含 locale 字段，CREATE 时需要
    update_attrs = {
        "description": description,
        "keywords": keywords,
        "promotionalText": promo_text,
        "whatsNew": whats_new,
        "supportUrl": PRIVACY_POLICY_URL,
        "marketingUrl": PRIVACY_POLICY_URL,
    }
    create_attrs = dict(update_attrs)
    create_attrs["locale"] = apple_locale

    if apple_locale in existing:
        loc_id = existing[apple_locale]
        print(f"  更新 locale {apple_locale} (id={loc_id})")
        r = api_patch(f"/v1/appStoreVersionLocalizations/{loc_id}", {
            "data": {
                "type": "appStoreVersionLocalizations",
                "id": loc_id,
                "attributes": update_attrs,
            }
        })
        if r.status_code not in (200, 201):
            print(f"  PATCH 失败: {r.text[:200]}")
        return loc_id
    else:
        print(f"  创建 locale {apple_locale}")
        r = api_post("/v1/appStoreVersionLocalizations", {
            "data": {
                "type": "appStoreVersionLocalizations",
                "attributes": create_attrs,
                "relationships": {
                    "appStoreVersion": {
                        "data": {"type": "appStoreVersions", "id": VERSION_ID}
                    }
                },
            }
        })
        if r.status_code == 201:
            return r.json()["data"]["id"]
        else:
            print(f"  创建失败: {r.text[:300]}")
            return None

# ── Step 2: 获取或创建 appInfoLocalizations (隐私政策) ──
def set_app_info_localizations(aso_data):
    print("\n[Step 2] 设置 appInfoLocalizations (title, subtitle, 隐私政策 URL)...")
    # 获取 appInfos
    r = api_get(f"/v1/apps/{ASC_APP_ID}/appInfos")
    infos = r.json().get("data", [])
    if not infos:
        print("  未找到 appInfos")
        return

    app_info_id = infos[0]["id"]
    print(f"  appInfo ID: {app_info_id}")

    # 获取现有 appInfoLocalizations
    r = api_get(f"/v1/appInfos/{app_info_id}/appInfoLocalizations")
    existing_info_locs = {}
    for item in r.json().get("data", []):
        existing_info_locs[item["attributes"]["locale"]] = item["id"]

    print(f"  现有 appInfo locales: {list(existing_info_locs.keys())}")

    for apple_locale in ALL_APPLE_LOCALES:
        # 找到对应 ASO 数据
        manifest_key = None
        for k, v in LOCALE_MAP.items():
            if v == apple_locale:
                manifest_key = k
                break

        if apple_locale == "en-US":
            title = aso_data["title"]
            subtitle = aso_data["subtitle"]
        else:
            loc_data = aso_data["localizations"].get(manifest_key, {})
            title = loc_data.get("title", aso_data["title"])
            subtitle = loc_data.get("subtitle", aso_data["subtitle"])

        info_attrs = {
            "name": title,
            "subtitle": subtitle,
            "privacyPolicyUrl": PRIVACY_POLICY_URL,
        }

        if apple_locale in existing_info_locs:
            loc_id = existing_info_locs[apple_locale]
            r = api_patch(f"/v1/appInfoLocalizations/{loc_id}", {
                "data": {
                    "type": "appInfoLocalizations",
                    "id": loc_id,
                    "attributes": info_attrs,
                }
            })
            print(f"  更新 appInfoLocalization {apple_locale}: {r.status_code}")
            if r.status_code not in (200, 201):
                print(f"    错误: {r.text[:300]}")
        else:
            info_attrs["locale"] = apple_locale
            r = api_post("/v1/appInfoLocalizations", {
                "data": {
                    "type": "appInfoLocalizations",
                    "attributes": info_attrs,
                    "relationships": {
                        "appInfo": {
                            "data": {"type": "appInfos", "id": app_info_id}
                        }
                    }
                }
            })
            print(f"  创建 appInfoLocalization {apple_locale}: {r.status_code}")
            if r.status_code not in (200, 201):
                print(f"    错误: {r.text[:300]}")

# ── Step 3: 关联 Build ────────────────────────────────
def associate_build():
    print("\n[Step 3] 关联 Build 12 到版本...")
    # 查找 Build 12
    r = api_get(f"/v1/apps/{ASC_APP_ID}/builds", {"filter[version]": "12"})
    builds = r.json().get("data", [])
    if not builds:
        print("  未找到 Build 12，尝试 preReleaseVersion...")
        r = api_get(f"/v1/builds", {
            "filter[app]": ASC_APP_ID,
            "filter[version]": "12",
            "limit": 5,
        })
        builds = r.json().get("data", [])

    if not builds:
        print("  ERROR: 未找到 Build 12")
        return False

    build_id = builds[0]["id"]
    print(f"  找到 Build ID: {build_id}, 状态: {builds[0]['attributes'].get('processingState')}")

    # 关联到版本
    r = api_patch(f"/v1/appStoreVersions/{VERSION_ID}", {
        "data": {
            "type": "appStoreVersions",
            "id": VERSION_ID,
            "relationships": {
                "build": {
                    "data": {"type": "builds", "id": build_id}
                }
            }
        }
    })
    print(f"  关联 Build: {r.status_code}")
    return r.status_code in (200, 201)

# ── Step 4: 上传截图 ──────────────────────────────────
def compute_md5(filepath):
    h = hashlib.md5()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def delete_existing_screenshots(ss_set_id):
    """删除 screenshotSet 中已有的截图"""
    r = api_get(f"/v1/appScreenshotSets/{ss_set_id}/appScreenshots")
    screenshots = r.json().get("data", [])
    for ss in screenshots:
        ss_id = ss["id"]
        r2 = api_delete(f"/v1/appScreenshots/{ss_id}")
        print(f"    删除旧截图 {ss_id}: {r2.status_code}")

def upload_screenshots_for_locale(loc_id, manifest_key, apple_locale):
    """为指定 locale 上传截图"""
    display_type = "APP_IPHONE_67"

    # 获取或创建 screenshotSet
    r = api_get(f"/v1/appStoreVersionLocalizations/{loc_id}/appScreenshotSets")
    sets = r.json().get("data", [])
    ss_set = next((s for s in sets if s["attributes"]["screenshotDisplayType"] == display_type), None)

    if ss_set:
        ss_set_id = ss_set["id"]
        print(f"    复用 screenshotSet {ss_set_id}")
        # 删除旧截图
        delete_existing_screenshots(ss_set_id)
    else:
        r = api_post("/v1/appScreenshotSets", {
            "data": {
                "type": "appScreenshotSets",
                "attributes": {"screenshotDisplayType": display_type},
                "relationships": {
                    "appStoreVersionLocalization": {
                        "data": {"type": "appStoreVersionLocalizations", "id": loc_id}
                    }
                }
            }
        })
        if r.status_code != 201:
            print(f"    创建 screenshotSet 失败: {r.text[:300]}")
            return False
        ss_set_id = r.json()["data"]["id"]
        print(f"    创建 screenshotSet {ss_set_id}")

    # 读取截图文件
    screenshot_dir = os.path.join(SCREENSHOTS_BASE, manifest_key, "iphone-67")
    if not os.path.exists(screenshot_dir):
        print(f"    截图目录不存在: {screenshot_dir}")
        return False

    files = sorted([f for f in os.listdir(screenshot_dir) if f.endswith(".png")])
    print(f"    找到 {len(files)} 张截图")

    for fname in files:
        fpath = os.path.join(screenshot_dir, fname)
        file_size = os.path.getsize(fpath)
        print(f"    上传 {fname} ({file_size} bytes)...")

        # 创建 screenshot reservation
        r = api_post("/v1/appScreenshots", {
            "data": {
                "type": "appScreenshots",
                "attributes": {
                    "fileName": fname,
                    "fileSize": file_size,
                },
                "relationships": {
                    "appScreenshotSet": {
                        "data": {"type": "appScreenshotSets", "id": ss_set_id}
                    }
                }
            }
        })
        if r.status_code != 201:
            print(f"    创建 screenshot reservation 失败: {r.text[:300]}")
            continue

        screenshot_data = r.json()["data"]
        screenshot_id = screenshot_data["id"]
        upload_ops = screenshot_data["attributes"]["uploadOperations"]
        source_checksum = screenshot_data["attributes"].get("sourceFileChecksum", "")

        # 上传各 part
        with open(fpath, "rb") as f:
            content = f.read()

        for op in upload_ops:
            offset = op["offset"]
            length = op["length"]
            chunk = content[offset : offset + length]
            req_headers = {h["name"]: h["value"] for h in op["requestHeaders"]}
            put_r = requests.put(op["url"], headers=req_headers, data=chunk)
            if put_r.status_code not in (200, 201):
                print(f"      上传 part 失败: {put_r.status_code}")

        # 计算 MD5 checksum
        md5 = compute_md5(fpath)

        # 确认上传完成
        r = api_patch(f"/v1/appScreenshots/{screenshot_id}", {
            "data": {
                "type": "appScreenshots",
                "id": screenshot_id,
                "attributes": {
                    "uploaded": True,
                    "sourceFileChecksum": md5,
                }
            }
        })
        print(f"    确认上传: {r.status_code}")

    return True

# ── Step 5: 订阅组 localization ───────────────────────
def setup_subscription_group_localizations(aso_data):
    print("\n[Step 5] 设置订阅组 localizations...")

    # 订阅组名称（各语言）
    group_names = {
        "en-US": "CatTracker Pro",
        "zh-Hans": "CatTracker Pro",
        "zh-Hant": "CatTracker Pro",
        "ja": "CatTracker Pro",
        "ko": "CatTracker Pro",
        "de-DE": "CatTracker Pro",
        "fr-FR": "CatTracker Pro",
        "es-ES": "CatTracker Pro",
        "ru": "CatTracker Pro",
        "it": "CatTracker Pro",
        "ar-SA": "CatTracker Pro",
        "id": "CatTracker Pro",
    }

    # 获取现有 localizations
    r = api_get(f"/v1/subscriptionGroups/{SUBSCRIPTION_GROUP_ID}/subscriptionGroupLocalizations")
    existing = {}
    for item in r.json().get("data", []):
        existing[item["attributes"]["locale"]] = item["id"]

    print(f"  现有订阅组 locales: {list(existing.keys())}")

    for apple_locale in ALL_APPLE_LOCALES:
        if apple_locale == "en-US":
            continue  # en-US 已存在

        name = group_names.get(apple_locale, "CatTracker Pro")

        if apple_locale in existing:
            loc_id = existing[apple_locale]
            r = api_patch(f"/v1/subscriptionGroupLocalizations/{loc_id}", {
                "data": {
                    "type": "subscriptionGroupLocalizations",
                    "id": loc_id,
                    "attributes": {"name": name}
                }
            })
            print(f"  更新订阅组 locale {apple_locale}: {r.status_code}")
        else:
            r = api_post("/v1/subscriptionGroupLocalizations", {
                "data": {
                    "type": "subscriptionGroupLocalizations",
                    "attributes": {
                        "locale": apple_locale,
                        "name": name,
                    },
                    "relationships": {
                        "subscriptionGroup": {
                            "data": {"type": "subscriptionGroups", "id": SUBSCRIPTION_GROUP_ID}
                        }
                    }
                }
            })
            print(f"  创建订阅组 locale {apple_locale}: {r.status_code}")
            if r.status_code != 201:
                print(f"    错误: {r.text[:300]}")

# ── Step 6: 设置定价为免费 ────────────────────────────
def set_free_pricing():
    print("\n[Step 6] 设置定价为免费...")
    # 先检查现有价格设置
    r = api_get(f"/v1/apps/{ASC_APP_ID}/appPriceSchedule")
    print(f"  当前价格设置: {r.status_code}")

    # 获取免费 price point（customerPrice = "0.0"）
    all_pts = []
    url = f"/v1/apps/{ASC_APP_ID}/appPricePoints?filter[territory]=USA&limit=200"
    while url:
        r = api_get(url)
        data = r.json()
        all_pts.extend(data.get("data", []))
        next_link = data.get("links", {}).get("next")
        if next_link:
            # 从绝对 URL 中提取路径
            url = next_link.replace(BASE_URL, "")
        else:
            url = None

    print(f"  获取到 {len(all_pts)} 个价格点")
    free_pt = next((pt for pt in all_pts if str(pt["attributes"].get("customerPrice", "")) == "0.0"), None)

    if not free_pt:
        print("  未找到免费价格点")
        return False

    price_point_id = free_pt["id"]
    print(f"  免费价格点 ID: {price_point_id}")

    r = api_post("/v1/appPriceSchedules", {
        "data": {
            "type": "appPriceSchedules",
            "relationships": {
                "app": {"data": {"type": "apps", "id": ASC_APP_ID}},
                "baseTerritory": {"data": {"type": "territories", "id": "USA"}},
                "manualPrices": {
                    "data": [{"type": "appPrices", "id": "${price1}"}]
                }
            }
        },
        "included": [{
            "type": "appPrices",
            "id": "${price1}",
            "attributes": {"startDate": None},
            "relationships": {
                "appPricePoint": {
                    "data": {"type": "appPricePoints", "id": price_point_id}
                }
            }
        }]
    })
    print(f"  设置免费定价: {r.status_code}")
    if r.status_code not in (200, 201):
        print(f"  响应: {r.text[:300]}")
    return r.status_code in (200, 201)

# ── Step 7: 设置 copyright + contentRightsDeclaration ─
def set_version_metadata():
    print("\n[Step 7] 设置 copyright 和分级...")
    # copyright
    r = api_patch(f"/v1/appStoreVersions/{VERSION_ID}", {
        "data": {
            "type": "appStoreVersions",
            "id": VERSION_ID,
            "attributes": {
                "copyright": "2026 maaker.ai"
            }
        }
    })
    print(f"  copyright: {r.status_code}")

    # contentRightsDeclaration
    r = api_patch(f"/v1/apps/{ASC_APP_ID}", {
        "data": {
            "type": "apps",
            "id": ASC_APP_ID,
            "attributes": {
                "contentRightsDeclaration": "DOES_NOT_USE_THIRD_PARTY_CONTENT"
            }
        }
    })
    print(f"  contentRightsDeclaration: {r.status_code}")

    # ageRatingDeclaration
    r = api_get(f"/v1/appStoreVersions/{VERSION_ID}/ageRatingDeclaration")
    if r.status_code == 200 and r.json().get("data"):
        rating_id = r.json()["data"]["id"]
        r2 = api_patch(f"/v1/ageRatingDeclarations/{rating_id}", {
            "data": {
                "type": "ageRatingDeclarations",
                "id": rating_id,
                "attributes": {
                    "alcoholTobaccoOrDrugUseOrReferences": "NONE",
                    "contests": "NONE",
                    "gambling": False,
                    "gamblingSimulated": "NONE",
                    "horrorOrFearThemes": "NONE",
                    "matureOrSuggestiveThemes": "NONE",
                    "medicalOrTreatmentInformation": "NONE",
                    "profanityOrCrudeHumor": "NONE",
                    "sexualContentGraphicAndNudity": "NONE",
                    "sexualContentOrNudity": "NONE",
                    "violenceCartoonOrFantasy": "NONE",
                    "violenceRealistic": "NONE",
                    "violenceRealisticProlonged": "NONE",
                    "ageRatingOverride": None,
                    "koreaAgeRatingOverride": None,
                    "seventeenPlus": False,
                    "unrestrictedWebAccess": False,
                }
            }
        })
        print(f"  ageRatingDeclaration: {r2.status_code}")
    else:
        print(f"  ageRatingDeclaration 获取失败: {r.status_code} {r.text[:200]}")

# ── 主流程 ────────────────────────────────────────────
def main():
    aso_data = load_aso_metadata()
    print("ASO 元数据已加载\n")

    # Step 1: 处理所有 locale 的 appStoreVersionLocalizations
    print("[Step 1] 创建/更新 appStoreVersionLocalizations...")
    locale_id_map = {}  # apple_locale -> loc_id

    for manifest_key, apple_locale in LOCALE_MAP.items():
        print(f"\n  处理 {manifest_key} -> {apple_locale}")
        loc_id = get_or_create_locale(apple_locale, aso_data)
        if loc_id:
            locale_id_map[apple_locale] = (manifest_key, loc_id)

    print(f"\n  完成，共处理 {len(locale_id_map)} 个 locale")

    # Step 2: 设置 appInfoLocalizations 隐私政策
    set_app_info_localizations(aso_data)

    # Step 3: 关联 Build
    associate_build()

    # Step 4: 上传截图
    print("\n[Step 4] 上传截图到所有 locale...")
    for apple_locale, (manifest_key, loc_id) in locale_id_map.items():
        print(f"\n  上传截图: {manifest_key} -> {apple_locale} (loc_id={loc_id})")
        upload_screenshots_for_locale(loc_id, manifest_key, apple_locale)

    # Step 5: 订阅组 localization
    setup_subscription_group_localizations(aso_data)

    # Step 6: 定价
    set_free_pricing()

    # Step 7: 版本元数据
    set_version_metadata()

    print("\n\n========== 全部完成 ==========")

if __name__ == "__main__":
    main()
