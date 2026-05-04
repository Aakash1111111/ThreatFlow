import re

def validate_ip(ip: str) -> bool:
    try:
        parts = ip.split('.')
        return len(parts) == 4 and all(0 <= int(part) <= 255 for part in parts)
    except ValueError:
        return False

def extract_iocs(text: str) -> dict:
    if not text:
        return {"ips": [], "domains": [], "hashes": {"md5": [], "sha1": [], "sha256": []}, "urls": []}
        
    # IPS
    ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    raw_ips = re.findall(ip_pattern, text)
    valid_ips = [ip for ip in raw_ips if validate_ip(ip)]
    
    # URLS
    url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[^\s]*'
    urls = re.findall(url_pattern, text)
    
    # Domains 
    # naive pattern for min 2 parts, excluding trailing punctuation
    domain_pattern = r'\b([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b'
    raw_domains = re.findall(domain_pattern, text)
    valid_domains = []
    for d in raw_domains:
        d = d.lower()
        if not re.search(r'[a-zA-Z]', d): # exclude IP-like
            continue
        valid_domains.append(d)

    # Hashes
    # Using negative lookbehind/lookahead to prevent partial match in longer strings
    md5_pattern = r'(?<![a-fA-F0-9])[a-fA-F0-9]{32}(?![a-fA-F0-9])'
    sha1_pattern = r'(?<![a-fA-F0-9])[a-fA-F0-9]{40}(?![a-fA-F0-9])'
    sha256_pattern = r'(?<![a-fA-F0-9])[a-fA-F0-9]{64}(?![a-fA-F0-9])'
    
    md5_hashes = re.findall(md5_pattern, text)
    sha1_hashes = re.findall(sha1_pattern, text)
    sha256_hashes = re.findall(sha256_pattern, text)
    
    return {
        "ips": list(set(valid_ips)),
        "domains": list(set(valid_domains)),
        "hashes": {
            "md5": list(set([h.lower() for h in md5_hashes])),
            "sha1": list(set([h.lower() for h in sha1_hashes])),
            "sha256": list(set([h.lower() for h in sha256_hashes]))
        },
        "urls": list(set(urls))
    }
