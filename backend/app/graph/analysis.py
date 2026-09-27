"""Entity Relationship & NetworkX Graph Analysis Engine.

Builds multi-relational financial and insider entity graphs (Employee, Account, Customer, Transaction, AccessLog).
Computes graph metrics and structures data for frontend interactive graph visualization.
"""

import networkx as nx
import pandas as pd
from typing import Dict, Any, List, Tuple


def build_entity_graph(
    df_txns: pd.DataFrame,
    df_accts: pd.DataFrame,
    df_access_logs: pd.DataFrame,
    max_nodes: int = 100
) -> Tuple[nx.DiGraph, Dict[str, Any]]:
    """Build directed entity graph using NetworkX.

    Returns:
        (networkx_graph, serializable_graph_dict)
    """
    G = nx.DiGraph()

    # Track created nodes to avoid duplicates
    node_set = set()

    def add_node(node_id: str, node_type: str, label: str, props: Dict[str, Any] = None):
        if node_id not in node_set and len(node_set) < max_nodes:
            node_set.add(node_id)
            G.add_node(node_id, entity_type=node_type, label=label, properties=props or {})

    # 1. Add Transaction & Account nodes and SENT_TO edges
    for idx, row in df_txns.head(max_nodes // 2).iterrows():
        src_acc = str(row['Account'])
        dst_acc = str(row['Account.1'])
        amt = float(row['amount_paid_clean'])
        fmt = str(row['Payment Format'])

        # Add Source & Dest Accounts
        add_node(src_acc, "ACCOUNT", f"Acc: {src_acc[-6:]}", {"full_id": src_acc, "bank": int(row['From Bank'])})
        add_node(dst_acc, "ACCOUNT", f"Acc: {dst_acc[-6:]}", {"full_id": dst_acc, "bank": int(row['To Bank'])})

        # Add SENT_TO edge between accounts
        if src_acc in node_set and dst_acc in node_set:
            if G.has_edge(src_acc, dst_acc):
                G[src_acc][dst_acc]['weight'] += 1.0
                G[src_acc][dst_acc]['total_amount'] += amt
            else:
                G.add_edge(
                    src_acc,
                    dst_acc,
                    relationship_type="SENT_TO",
                    weight=1.0,
                    total_amount=amt,
                    payment_format=fmt
                )

    # 2. Add Account -> Customer OWNS relationship from Accounts master
    if not df_accts.empty:
        for idx, row in df_accts.head(200).iterrows():
            acc_num = str(row['Account Number'])
            ent_id = str(row['Entity ID'])
            ent_name = str(row['Entity Name'])

            if acc_num in node_set:
                cust_node_id = f"CUST_{ent_id}"
                add_node(cust_node_id, "CUSTOMER", ent_name, {"entity_id": ent_id})
                if cust_node_id in node_set:
                    G.add_edge(cust_node_id, acc_num, relationship_type="OWNS", weight=1.0)

    # 3. Add Employee -> Account ACCESSED relationship from Access Logs
    if not df_access_logs.empty:
        for idx, row in df_access_logs.iterrows():
            emp_id = str(row['employee_id'])
            acc_id = str(row['account_id'])
            action = str(row['action'])

            # Ensure Employee node is added
            emp_node_id = f"EMP_{emp_id}"
            add_node(emp_node_id, "EMPLOYEE", f"Employee {emp_id}", {"role": "IT System Admin" if emp_id == "E104" else "User"})

            # If target account exists in graph, add ACCESSED edge
            if acc_id in node_set and emp_node_id in node_set:
                G.add_edge(
                    emp_node_id,
                    acc_id,
                    relationship_type="ACCESSED",
                    weight=2.0 if row.get('is_off_hours') else 1.0,
                    action=action,
                    is_off_hours=bool(row.get('is_off_hours', False))
                )

    # Format serializable dict for API / Frontend
    nodes_data = []
    for n, data in G.nodes(data=True):
        nodes_data.append({
            "id": n,
            "entity_type": data.get("entity_type", "ACCOUNT"),
            "label": data.get("label", n),
            "properties": data.get("properties", {})
        })

    edges_data = []
    for u, v, data in G.edges(data=True):
        edges_data.append({
            "source": u,
            "target": v,
            "relationship_type": data.get("relationship_type", "CONNECTED"),
            "weight": data.get("weight", 1.0),
            "properties": {k: v for k, v in data.items() if k not in ["relationship_type", "weight"]}
        })

    serializable = {"nodes": nodes_data, "edges": edges_data}
    return G, serializable
