from typing import Dict, Any, List
from app.database.models import Event, ChecklistItem, ConflictRecord

class ExportService:
    @staticmethod
    def generate_export_payload(
        event: Event,
        items: List[ChecklistItem],
        missing_fields: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]],
        readiness: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate structured JSON data for event dossier and printable view."""
        mandatory = [i for i in items if i.requirement_type == "mandatory"]
        conditional = [i for i in items if i.requirement_type == "conditional"]
        optional = [i for i in items if i.requirement_type == "optional"]

        return {
            "project_name": "CampusFlow - Campus Event Planning Assistant",
            "export_timestamp": event.updated_at.strftime("%Y-%m-%d %H:%M:%S UTC") if event.updated_at else "",
            "event_summary": {
                "name": event.name,
                "event_type": event.event_type,
                "category": event.category,
                "organizing_department": event.organizing_department,
                "organizer_name": event.organizer_name,
                "contact_email": event.contact_email,
                "contact_phone": event.contact_phone,
                "date": event.event_date,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "venue": event.preferred_venue,
                "expected_attendance": event.expected_attendance,
                "estimated_budget": event.estimated_budget,
                "funding_source": event.funding_source
            },
            "readiness": readiness,
            "checklist": {
                "mandatory": [
                    {
                        "title": i.title,
                        "description": i.description,
                        "status": i.status,
                        "authority": i.authority,
                        "deadline": i.deadline_if_documented,
                        "source": f"{i.source} ({i.source_version})" if i.source else "Institutional Policy"
                    }
                    for i in mandatory
                ],
                "conditional": [
                    {
                        "title": i.title,
                        "description": i.description,
                        "status": i.status,
                        "trigger": i.trigger,
                        "authority": i.authority,
                        "deadline": i.deadline_if_documented,
                        "source": f"{i.source} ({i.source_version})" if i.source else "Institutional Policy"
                    }
                    for i in conditional
                ],
                "optional": [
                    {
                        "title": i.title,
                        "description": i.description,
                        "status": i.status,
                        "authority": i.authority,
                        "source": f"{i.source} ({i.source_version})" if i.source else "Institutional Policy"
                    }
                    for i in optional
                ]
            },
            "missing_information": missing_fields,
            "conflicts": conflicts
        }
