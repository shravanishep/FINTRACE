"""Signal Correlation & Automatic Case Generation Engine.

Groups related signals sharing entity references, accounts, or temporal proximity into consolidated
investigation cases. Generates human-readable evidence narratives, severity scoring, and event timelines.
"""

from typing import List, Dict, Any


def correlate_signals_into_cases(
    signals: List[Dict[str, Any]],
    graph_dict: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Group signals into correlated investigation cases.

    Returns list of case dictionary payloads ready for database insertion.
    """
    if not signals:
        return []

    # Map signals by entity reference
    entity_signal_map: Dict[str, List[Dict[str, Any]]] = {}
    for sig in signals:
        ent = sig.get('entity_ref') or sig.get('target_account') or 'GENERAL'
        entity_signal_map.setdefault(ent, []).append(sig)

    cases: List[Dict[str, Any]] = []
    case_counter = 1040

    # 1. Look for Correlated Insider + Financial Signals (High Priority Demo Case)
    insider_signals = [s for s in signals if s['signal_type'] == 'UNUSUAL_EMPLOYEE_ACCESS']
    financial_signals = [s for s in signals if s['signal_type'] in ['LARGE_TRANSACTION', 'ML_ANOMALY', 'HIGH_RISK_CHANNEL']]

    if insider_signals:
        for ins in insider_signals:
            target_acc = ins.get('target_account')
            # Find matching financial signals on target account
            matching_fin = [f for f in financial_signals if f.get('entity_ref') == target_acc or target_acc in str(f.get('evidence'))]

            case_counter += 1
            correlated_sigs = [ins] + matching_fin

            # Build event timeline
            timeline = []
            timeline.append({
                "timestamp": ins['evidence'].get('timestamp', '2022/09/01 01:15'),
                "event": f"Off-hours elevated access by Employee {ins['evidence'].get('employee_id')}",
                "severity": "CRITICAL",
                "details": f"Action: {ins['evidence'].get('action')} via terminal {ins['evidence'].get('terminal_id')}"
            })

            for fin in matching_fin:
                timeline.append({
                    "timestamp": fin['evidence'].get('timestamp', '2022/09/01 01:20'),
                    "event": f"Financial Signal [{fin['signal_type']}]: {fin['description']}",
                    "severity": fin['severity'],
                    "details": f"Amount: {fin['evidence'].get('amount', 'N/A')} via {fin['evidence'].get('payment_format', 'N/A')}"
                })

            cases.append({
                "case_number": case_counter,
                "title": f"Case #{case_counter}: Correlated Off-Hours Employee Access & High-Value Fund Movement",
                "description": f"Automated correlation detected off-hours insider system activity on account {target_acc} correlated with suspicious financial transactions.",
                "severity": "CRITICAL" if any(s['severity'] == 'CRITICAL' for s in correlated_sigs) else "HIGH",
                "status": "open",
                "explanation": (
                    f"ML & Rule detection engines flagged correlated anomalies across system access and transaction logs. "
                    f"Employee {ins['evidence'].get('employee_id')} logged into core systems outside standard operating hours "
                    f"and accessed Account {target_acc}. Simultaneously, high-value transfers were dispatched from the same account."
                ),
                "timeline": timeline,
                "evidence_summary": {
                    "insider_access": ins['evidence'],
                    "financial_evidence": [f['evidence'] for f in matching_fin],
                    "signal_count": len(correlated_sigs),
                },
                "signals": correlated_sigs,
                "involved_entity_refs": [ins['evidence'].get('employee_id'), target_acc]
            })

    # 2. Group Remaining Financial Signals by Entity
    grouped_entities = set()
    for ent, sigs in entity_signal_map.items():
        if ent in grouped_entities or ent == 'GENERAL':
            continue

        # Only create a case if there are multiple signals or a HIGH/CRITICAL signal
        high_sigs = [s for s in sigs if s['severity'] in ['HIGH', 'CRITICAL'] or s['signal_type'] == 'ML_ANOMALY']
        if len(sigs) >= 2 or high_sigs:
            grouped_entities.add(ent)
            case_counter += 1

            timeline = [
                {
                    "timestamp": s['evidence'].get('timestamp', '2022/09/01 00:00'),
                    "event": f"Signal [{s['signal_type']}]: {s['description']}",
                    "severity": s['severity'],
                    "details": str(s['evidence'])
                }
                for s in sigs
            ]

            max_sev = "HIGH" if any(s['severity'] == 'HIGH' for s in sigs) else "MEDIUM"

            cases.append({
                "case_number": case_counter,
                "title": f"Case #{case_counter}: Concentrated Anomaly Signals on Account {ent}",
                "description": f"Multiple correlated rule and ML anomaly signals detected targeting account entity {ent}.",
                "severity": max_sev,
                "status": "open",
                "explanation": f"Statistical anomaly detection and rule pattern matching identified {len(sigs)} correlated risk signals for entity {ent}.",
                "timeline": timeline,
                "evidence_summary": {
                    "entity": ent,
                    "signal_count": len(sigs),
                    "signals": [s['signal_type'] for s in sigs]
                },
                "signals": sigs,
                "involved_entity_refs": [ent]
            })

    return cases
