import httpx
from core.config import settings
import asyncio

class VirusTotalService:
    def __init__(self):
        self.api_key = settings.VIRUSTOTAL_API_KEY
        self.base_url = "https://www.virustotal.com/api/v3"
        
    async def check(self, ioc_value: str, ioc_type: str) -> dict:
        if not self.api_key:
            return {"error": "API key not configured", "skipped": True}
            
        endpoint_map = {
            "hash": f"/files/{ioc_value}",
            "ip": f"/ip_addresses/{ioc_value}",
            "domain": f"/domains/{ioc_value}",
            "url": f"/urls/{ioc_value}"
        }
        
        endpoint = endpoint_map.get(ioc_type)
        if not endpoint:
            # We don't support VT for this type (or handled differently)
            return {"error": f"Unsupported IOC type for VirusTotal: {ioc_type}", "skipped": True}
        
        url = f"{self.base_url}{endpoint}"
        headers = {"x-apikey": self.api_key}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 404:
                    return {"error": "not found"}
                if response.status_code == 429:
                    return {"error": "rate limited"}
                response.raise_for_status()
                data = response.json()
                
                stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                return {
                    "malicious": stats.get("malicious", 0),
                    "suspicious": stats.get("suspicious", 0),
                    "harmless": stats.get("harmless", 0),
                    "undetected": stats.get("undetected", 0),
                    "raw": stats
                }
            except httpx.HTTPError as e:
                return {"error": str(e)}

class AbuseIPDBService:
    def __init__(self):
        self.api_key = settings.ABUSEIPDB_API_KEY
        self.base_url = "https://api.abuseipdb.com/api/v2/check"
        
    async def check(self, ip: str) -> dict:
        if not self.api_key:
            return {"error": "API key not configured", "skipped": True}
            
        headers = {
            "Accept": "application/json",
            "Key": self.api_key
        }
        params = {"ipAddress": ip, "maxAgeInDays": 90}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(self.base_url, headers=headers, params=params)
                if response.status_code == 404:
                    return {"error": "not found"}
                response.raise_for_status()
                data = response.json().get("data", {})
                return {
                    "abuseConfidenceScore": data.get("abuseConfidenceScore", 0),
                    "countryCode": data.get("countryCode", ""),
                    "isp": data.get("isp", ""),
                    "totalReports": data.get("totalReports", 0),
                    "raw": data
                }
            except httpx.HTTPError as e:
                return {"error": str(e)}

class IPInfoService:
    def __init__(self):
        self.api_key = settings.IPINFO_TOKEN
        
    async def check(self, ip: str) -> dict:
        if not self.api_key:
            return {"error": "API key not configured", "skipped": True}
            
        url = f"https://ipinfo.io/{ip}/json"
        params = {"token": self.api_key}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, params=params)
                if response.status_code == 404:
                    return {"error": "not found"}
                response.raise_for_status()
                data = response.json()
                return {
                    "country": data.get("country", ""),
                    "org": data.get("org", ""),
                    "city": data.get("city", ""),
                    "hostname": data.get("hostname", ""),
                    "raw": data
                }
            except httpx.HTTPError as e:
                return {"error": str(e)}
