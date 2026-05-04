def calculate_risk_score(enrichments: list[dict]) -> tuple[float, str]:
    if not enrichments:
        return 0.0, "clean"
        
    score = 0.0
    
    for enr in enrichments:
        source = enr.get("source")
        if source == "virustotal":
            # VirusTotal malicious votes: each vote adds (100 / total_votes) * malicious_votes, weight 0.5
            total = enr.get("total_votes", 0)
            malicious = enr.get("malicious_votes", 0)
            if total > 0 and malicious > 0:
                vt_score = (100.0 / total) * malicious
                score += vt_score * 0.5
                
        elif source == "abuseipdb":
            # AbuseIPDB confidence score: direct 0-100, weight 0.35
            abuse_score = enr.get("abuse_confidence_score", 0)
            score += float(abuse_score) * 0.35
            
        elif source == "ipinfo":
            # Known malicious country/ASN list: +10 if matched, weight 0.15 (For now just assigning 0 weight as country checking requires a malicious country list)
            # We'll do a simple mock implementation here
            country = enr.get("country", "")
            malicious_countries = ["RU", "CN", "KP", "IR"] # Example mock list
            if country in malicious_countries:
                score += 10.0 * 0.15
                
    # Cap at 100.0
    score = min(score, 100.0)
    
    # Risk level mapping
    if score >= 80:
        level = "critical"
    elif score >= 60:
        level = "high"
    elif score >= 40:
        level = "medium"
    elif score >= 20:
        level = "low"
    else:
        level = "clean"
        
    return score, level
