"""Pipeline Orchestration Service.

Runs the complete end-to-end investigation processing pipeline:
Data Ingestion -> Preprocessing -> Rule Engine -> Isolation Forest ML -> NetworkX Graph -> Signal Correlation -> Case Generation -> DB Persistence.
"""

import logging
from sqlalchemy.orm import Session
from app.models.models import (
    Investigation, Signal, Case, Entity, Relationship,
    CaseSignalLink, CaseEntityLink
)
from app.services.preprocessing import load_and_preprocess_dataset
from app.detection.rules import run_rule_engine
from app.detection.ml import run_ml_anomaly_detection
from app.graph.analysis import build_entity_graph
from app.correlation.engine import correlate_signals_into_cases
from app.core.config import settings

logger = logging.getLogger("fintrace.pipeline")


def run_investigation_pipeline(
    investigation_id: str,
    db: Session,
    sample_size: int = settings.DEFAULT_SAMPLE_SIZE
) -> Investigation:
    """Execute the full FINTRACE detection, graph, and case correlation pipeline."""
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv or not inv.dataset:
        raise ValueError(f"Investigation {investigation_id} has no attached dataset.")

    dataset_path = settings.UPLOAD_DIR / inv.dataset.stored_filename

    try:
        inv.status = "preprocessing"
        db.commit()

        # Step 1: Preprocessing & Feature Engineering
        logger.info(f"[{inv.name}] Preprocessing dataset...")
        df_txns, df_accts, df_access_logs = load_and_preprocess_dataset(
            str(dataset_path),
            sample_size=sample_size
        )

        # Step 2: Rule Engine Detection
        inv.status = "analyzing"
        db.commit()
        logger.info(f"[{inv.name}] Running Rule Engine...")
        rule_signals = run_rule_engine(df_txns, df_access_logs)

        # Step 3: Isolation Forest ML Anomaly Detection
        logger.info(f"[{inv.name}] Running Isolation Forest ML...")
        ml_signals = run_ml_anomaly_detection(df_txns)

        all_signals_raw = rule_signals + ml_signals

        # Step 4: NetworkX Graph Entity Construction
        logger.info(f"[{inv.name}] Building Entity Graph...")
        G, graph_dict = build_entity_graph(df_txns, df_accts, df_access_logs)

        # Step 5: Signal Correlation & Case Generation
        logger.info(f"[{inv.name}] Correlating Signals into Cases...")
        cases_payload = correlate_signals_into_cases(all_signals_raw, graph_dict)

        # Step 6: Persist Entities, Relationships, Signals, and Cases in DB
        logger.info(f"[{inv.name}] Persisting entities and analysis results...")

        # Clear any existing pipeline outputs for clean rerun
        db.query(CaseSignalLink).filter(CaseSignalLink.case.has(investigation_id=investigation_id)).delete(synchronize_session=False)
        db.query(CaseEntityLink).filter(CaseEntityLink.case.has(investigation_id=investigation_id)).delete(synchronize_session=False)
        db.query(Case).filter(Case.investigation_id == investigation_id).delete(synchronize_session=False)
        db.query(Signal).filter(Signal.investigation_id == investigation_id).delete(synchronize_session=False)
        db.query(Relationship).filter(Relationship.investigation_id == investigation_id).delete(synchronize_session=False)
        db.query(Entity).filter(Entity.investigation_id == investigation_id).delete(synchronize_session=False)
        db.commit()

        # 6a. Persist Entities
        entity_obj_map: dict[str, Entity] = {}
        for n in graph_dict['nodes']:
            ent = Entity(
                investigation_id=investigation_id,
                entity_type=n['entity_type'],
                entity_ref=n['id'],
                label=n['label'],
                properties=n['properties']
            )
            db.add(ent)
            entity_obj_map[n['id']] = ent
        db.commit()

        # 6b. Persist Relationships
        for e in graph_dict['edges']:
            src_ent = entity_obj_map.get(e['source'])
            dst_ent = entity_obj_map.get(e['target'])
            if src_ent and dst_ent:
                rel = Relationship(
                    investigation_id=investigation_id,
                    source_entity_id=src_ent.id,
                    target_entity_id=dst_ent.id,
                    relationship_type=e['relationship_type'],
                    weight=e['weight'],
                    properties=e.get('properties')
                )
                db.add(rel)
        db.commit()

        # 6c. Persist Signals
        signal_obj_list: list[Signal] = []
        for s in all_signals_raw:
            ent_ref = s.get('entity_ref')
            linked_entity = entity_obj_map.get(ent_ref)
            sig_obj = Signal(
                investigation_id=investigation_id,
                signal_type=s['signal_type'],
                source=s['source'],
                severity=s['severity'],
                score=s.get('score'),
                entity_id=linked_entity.id if linked_entity else None,
                description=s['description'],
                evidence=s.get('evidence'),
                metadata_json={"entity_ref": ent_ref}
            )
            db.add(sig_obj)
            signal_obj_list.append(sig_obj)
        db.commit()

        # 6d. Persist Cases & Links
        for c in cases_payload:
            case_obj = Case(
                investigation_id=investigation_id,
                case_number=c['case_number'],
                title=c['title'],
                description=c['description'],
                severity=c['severity'],
                status=c['status'],
                explanation=c['explanation'],
                timeline=c['timeline'],
                evidence_summary=c['evidence_summary']
            )
            db.add(case_obj)
            db.commit()
            db.refresh(case_obj)

            # Link constituent signals
            for sig_data in c['signals']:
                matching_sig = next(
                    (s for s in signal_obj_list if s.signal_type == sig_data['signal_type'] and s.description == sig_data['description']),
                    None
                )
                if matching_sig:
                    link = CaseSignalLink(case_id=case_obj.id, signal_id=matching_sig.id)
                    db.add(link)

            # Link constituent entities
            for ent_ref in c.get('involved_entity_refs', []):
                matching_ent = entity_obj_map.get(ent_ref)
                if matching_ent:
                    link = CaseEntityLink(case_id=case_obj.id, entity_id=matching_ent.id)
                    db.add(link)
            db.commit()

        # Step 7: Update Summary Totals & Status
        inv.total_transactions = len(df_txns)
        inv.total_signals = len(all_signals_raw)
        inv.total_cases = len(cases_payload)
        inv.total_entities = len(graph_dict['nodes'])
        inv.status = "completed"
        db.commit()
        db.refresh(inv)

        logger.info(f"[{inv.name}] Pipeline completed successfully! {inv.total_signals} signals, {inv.total_cases} cases.")
        return inv

    except Exception as e:
        logger.error(f"[{inv.name}] Pipeline failed: {str(e)}", exc_info=True)
        inv.status = "error"
        db.commit()
        raise e
