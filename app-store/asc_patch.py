#!/usr/bin/env python3
"""
补丁脚本：
1. 修复 appStoreVersionLocalizations (description/keywords/promoText/whatsNew)
2. 修复 ageRatingDeclaration
"""
import jwt, time, requests, json

KEY_ID = "L57984QZY8"
ISSUER_ID = "69a6de7e-fe42-47e3-e053-5b8c7c11a4d1"
KEY_PATH = "/Users/martin/.appstoreconnect/private_keys/AuthKey_L57984QZY8.p8"
ASC_APP_ID = "6761513507"
VERSION_ID = "4b7148bb-e0d6-4d58-a027-a5176fee447f"
PRIVACY_POLICY_URL = "https://maaker-ai.github.io/CatTracker/privacy-policy.html"

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

BASE_URL = "https://api.appstoreconnect.apple.com"

def make_token():
    with open(KEY_PATH) as f:
        private_key = f.read()
    now = int(time.time())
    return jwt.encode(
        {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
        private_key, algorithm="ES256", headers={"kid": KEY_ID},
    )

def get_headers():
    return {"Authorization": f"Bearer {make_token()}", "Content-Type": "application/json"}

def api_get(path, params=None):
    r = requests.get(f"{BASE_URL}{path}", headers=get_headers(), params=params)
    return r

def api_patch(path, body):
    r = requests.patch(f"{BASE_URL}{path}", headers=get_headers(), json=body)
    if r.status_code not in (200, 201):
        print(f"  PATCH {path} -> {r.status_code}: {r.text[:300]}")
    return r

def main():
    with open("/Users/martin/OpenSource/CatTracker/aso-metadata.json") as f:
        aso = json.load(f)

    # Step 1: Fix appStoreVersionLocalizations
    print("[Fix Step 1] 更新 appStoreVersionLocalizations description/keywords...")
    r = api_get(f"/v1/appStoreVersions/{VERSION_ID}/appStoreVersionLocalizations")
    existing = {}
    for item in r.json().get("data", []):
        existing[item["attributes"]["locale"]] = item["id"]

    print(f"  现有 locale: {list(existing.keys())}")

    for manifest_key, apple_locale in LOCALE_MAP.items():
        if apple_locale not in existing:
            print(f"  SKIP: {apple_locale} 不存在")
            continue

        if apple_locale == "en-US":
            description = aso["description"]
            keywords = aso["keywords"]
            promo_text = aso["promotional_text"]
            whats_new = aso["whats_new"]
        else:
            loc_data = aso["localizations"].get(manifest_key, {})
            description = loc_data.get("description", aso["description"])
            keywords = loc_data.get("keywords", aso["keywords"])
            promo_text = loc_data.get("promotional_text", aso["promotional_text"])
            whats_new = aso.get("whats_new", "• Bug fixes and performance improvements")

        loc_id = existing[apple_locale]
        r = api_patch(f"/v1/appStoreVersionLocalizations/{loc_id}", {
            "data": {
                "type": "appStoreVersionLocalizations",
                "id": loc_id,
                "attributes": {
                    "description": description,
                    "keywords": keywords,
                    "promotionalText": promo_text,
                    "whatsNew": whats_new,
                    "supportUrl": PRIVACY_POLICY_URL,
                    "marketingUrl": PRIVACY_POLICY_URL,
                }
            }
        })
        print(f"  {apple_locale}: {r.status_code}")

    # Step 2: ageRatingDeclaration via appInfo
    print("\n[Fix Step 2] 设置 ageRatingDeclaration...")
    # 正确路径是通过 appInfo 的关联
    r = api_get(f"/v1/apps/{ASC_APP_ID}/appInfos")
    infos = r.json().get("data", [])
    if infos:
        app_info_id = infos[0]["id"]
        # ageRatingDeclaration 挂在 appInfo 上
        r = api_get(f"/v1/appInfos/{app_info_id}/ageRatingDeclaration")
        print(f"  via appInfo: {r.status_code}")
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
            print(f"  ageRatingDeclaration {rating_id}: {r2.status_code}")
            if r2.status_code not in (200, 201):
                print(f"  错误: {r2.text[:300]}")
        else:
            print(f"  无法获取 ageRatingDeclaration: {r.text[:300]}")

    print("\n====== 补丁完成 ======")

if __name__ == "__main__":
    main()
