import ipaddress
from collections import defaultdict
from models.ioc import IOC

def find_patterns(iocs: list[IOC]) -> list[dict]:
    patterns = []
    if not iocs:
        return patterns

    # Group IPs by /24 subnet
    ip_iocs = [ioc for ioc in iocs if ioc.ioc_type == "ip"]
    subnets = defaultdict(list)
    
    for ioc in ip_iocs:
        try:
            # We assume IPv4 for this logic
            ip_obj = ipaddress.IPv4Address(ioc.value)
            network = ipaddress.IPv4Network(f"{ioc.value}/24", strict=False)
            subnets[str(network)].append(ioc)
        except Exception:
            continue
            
    for subnet_str, group in subnets.items():
        if len(group) > 1:
            affected_iocs = [{"id": str(i.id), "value": i.value} for i in group]
            patterns.append({
                "type": "subnet_cluster",
                "description": f"Multiple IPs found in the same /24 subnet ({subnet_str})",
                "affected_iocs": affected_iocs,
                "severity": "medium"
            })
            
    # Group by TLD / domain registrars (naive: same base domain)
    domain_iocs = [ioc for ioc in iocs if ioc.ioc_type == "domain"]
    base_domains = defaultdict(list)
    
    for ioc in domain_iocs:
        parts = ioc.value.split(".")
        if len(parts) >= 2:
            base_domain = ".".join(parts[-2:])
            base_domains[base_domain].append(ioc)
            
    for base, group in base_domains.items():
        if len(group) > 1:
            affected_iocs = [{"id": str(i.id), "value": i.value} for i in group]
            patterns.append({
                "type": "domain_cluster",
                "description": f"Multiple subdomains found for the same base domain ({base})",
                "affected_iocs": affected_iocs,
                "severity": "low"
            })
            
    # Identify multiple enrichment sources reporting malicious
    for ioc in iocs:
        if len(ioc.enrichments) > 1:
            patterns.append({
                "type": "highly_corroborated",
                "description": f"IOC {ioc.value} has intelligence from multiple sources",
                "affected_iocs": [{"id": str(ioc.id), "value": ioc.value}],
                "severity": "high" if ioc.risk_level in ["critical", "high"] else "info"
            })

    return patterns
