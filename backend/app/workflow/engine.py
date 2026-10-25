from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from app.models.entities import Application, StageHistory, WorkflowRoute, User, UserRole

DEFAULT_ROUTES = [
    {
        "route_code": "ROUTE_A",
        "name": "Standard Scrutiny Route",
        "description": "Intake -> Regional Scrutiny -> Authorised Bureau/Senior Decision (No EVC required)",
        "version": 1,
        "stages_config": {
            "INTAKE": {
                "name": "Application Intake & Submission",
                "allowed_actions": ["SUBMIT"],
                "allowed_roles": [UserRole.INSTITUTION],
                "next_stage": {"SUBMIT": "SCRUTINY"},
                "status_after": {"SUBMIT": "UNDER_SCRUTINY"},
                "deadline_days": 15
            },
            "SCRUTINY": {
                "name": "Regional Scrutiny",
                "allowed_actions": ["PASS_SCRUTINY", "RETURN_DEFICIENCY"],
                "allowed_roles": [UserRole.REGIONAL_OFFICER, UserRole.ADMIN],
                "next_stage": {
                    "PASS_SCRUTINY": "DECISION",
                    "RETURN_DEFICIENCY": "DEFICIENCY_REVIEW"
                },
                "status_after": {
                    "PASS_SCRUTINY": "AWAITING_DECISION",
                    "RETURN_DEFICIENCY": "DEFICIENCY_RETURNED"
                },
                "deadline_days": 10
            },
            "DEFICIENCY_REVIEW": {
                "name": "Institution Deficiency Rectification",
                "allowed_actions": ["RESUBMIT"],
                "allowed_roles": [UserRole.INSTITUTION],
                "next_stage": {"RESUBMIT": "SCRUTINY"},
                "status_after": {"RESUBMIT": "RESUBMITTED"},
                "deadline_days": 7
            },
            "DECISION": {
                "name": "Authorised Regulatory Decision",
                "allowed_actions": ["APPROVE", "CONDITIONALLY_APPROVE", "REJECT"],
                "allowed_roles": [UserRole.BUREAU_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.ADMIN],
                "next_stage": {
                    "APPROVE": "CLOSED",
                    "CONDITIONALLY_APPROVE": "AWAITING_COMPLIANCE",
                    "REJECT": "CLOSED"
                },
                "status_after": {
                    "APPROVE": "APPROVED",
                    "CONDITIONALLY_APPROVE": "CONDITIONALLY_APPROVED",
                    "REJECT": "REJECTED"
                },
                "deadline_days": 10
            },
            "AWAITING_COMPLIANCE": {
                "name": "Time-Bound Compliance Period",
                "allowed_actions": ["VERIFY_ALL_COMPLIANCE"],
                "allowed_roles": [UserRole.REGIONAL_OFFICER, UserRole.BUREAU_OFFICER, UserRole.ADMIN],
                "next_stage": {"VERIFY_ALL_COMPLIANCE": "CLOSED"},
                "status_after": {"VERIFY_ALL_COMPLIANCE": "APPROVED"},
                "deadline_days": 60
            },
            "CLOSED": {
                "name": "Lifecycle Closed",
                "allowed_actions": [],
                "allowed_roles": [],
                "next_stage": {},
                "status_after": {},
                "deadline_days": 0
            }
        }
    },
    {
        "route_code": "ROUTE_B",
        "name": "Scrutiny with Expert Visit Committee (EVC)",
        "description": "Intake -> Scrutiny -> Physical EVC Inspection -> Authorised Decision",
        "version": 1,
        "stages_config": {
            "INTAKE": {
                "name": "Application Intake & Submission",
                "allowed_actions": ["SUBMIT"],
                "allowed_roles": [UserRole.INSTITUTION],
                "next_stage": {"SUBMIT": "SCRUTINY"},
                "status_after": {"SUBMIT": "UNDER_SCRUTINY"},
                "deadline_days": 15
            },
            "SCRUTINY": {
                "name": "Regional Scrutiny",
                "allowed_actions": ["PASS_SCRUTINY", "RETURN_DEFICIENCY"],
                "allowed_roles": [UserRole.REGIONAL_OFFICER, UserRole.ADMIN],
                "next_stage": {
                    "PASS_SCRUTINY": "EVC",
                    "RETURN_DEFICIENCY": "DEFICIENCY_REVIEW"
                },
                "status_after": {
                    "PASS_SCRUTINY": "AWAITING_EVC",
                    "RETURN_DEFICIENCY": "DEFICIENCY_RETURNED"
                },
                "deadline_days": 10
            },
            "DEFICIENCY_REVIEW": {
                "name": "Institution Deficiency Rectification",
                "allowed_actions": ["RESUBMIT"],
                "allowed_roles": [UserRole.INSTITUTION],
                "next_stage": {"RESUBMIT": "SCRUTINY"},
                "status_after": {"RESUBMIT": "RESUBMITTED"},
                "deadline_days": 7
            },
            "EVC": {
                "name": "Expert Visit Committee (EVC) Inspection",
                "allowed_actions": ["COMPLETE_EVC"],
                "allowed_roles": [UserRole.REGIONAL_OFFICER, UserRole.EVC_COMMITTEE, UserRole.ADMIN],
                "next_stage": {"COMPLETE_EVC": "DECISION"},
                "status_after": {"COMPLETE_EVC": "AWAITING_DECISION"},
                "deadline_days": 14
            },
            "DECISION": {
                "name": "Authorised Regulatory Decision",
                "allowed_actions": ["APPROVE", "CONDITIONALLY_APPROVE", "REJECT"],
                "allowed_roles": [UserRole.BUREAU_OFFICER, UserRole.SENIOR_AUTHORITY, UserRole.ADMIN],
                "next_stage": {
                    "APPROVE": "CLOSED",
                    "CONDITIONALLY_APPROVE": "AWAITING_COMPLIANCE",
                    "REJECT": "CLOSED"
                },
                "status_after": {
                    "APPROVE": "APPROVED",
                    "CONDITIONALLY_APPROVE": "CONDITIONALLY_APPROVED",
                    "REJECT": "REJECTED"
                },
                "deadline_days": 10
            },
            "AWAITING_COMPLIANCE": {
                "name": "Time-Bound Compliance Period",
                "allowed_actions": ["VERIFY_ALL_COMPLIANCE"],
                "allowed_roles": [UserRole.REGIONAL_OFFICER, UserRole.BUREAU_OFFICER, UserRole.ADMIN],
                "next_stage": {"VERIFY_ALL_COMPLIANCE": "CLOSED"},
                "status_after": {"VERIFY_ALL_COMPLIANCE": "APPROVED"},
                "deadline_days": 60
            },
            "CLOSED": {
                "name": "Lifecycle Closed",
                "allowed_actions": [],
                "allowed_roles": [],
                "next_stage": {},
                "status_after": {},
                "deadline_days": 0
            }
        }
    },
    {
        "route_code": "ROUTE_C",
        "name": "EVC with SAC/SHC Hearing Route",
        "description": "Intake -> Scrutiny -> EVC -> Standing Appeal/Hearing Committee (SAC/SHC) -> Final Decision",
        "version": 1,
        "stages_config": {
            "INTAKE": {
                "name": "Application Intake & Submission",
                "allowed_actions": ["SUBMIT"],
                "allowed_roles": [UserRole.INSTITUTION],
                "next_stage": {"SUBMIT": "SCRUTINY"},
                "status_after": {"SUBMIT": "UNDER_SCRUTINY"},
                "deadline_days": 15
            },
            "SCRUTINY": {
                "name": "Regional Scrutiny",
                "allowed_actions": ["PASS_SCRUTINY", "RETURN_DEFICIENCY"],
                "allowed_roles": [UserRole.REGIONAL_OFFICER, UserRole.ADMIN],
                "next_stage": {
                    "PASS_SCRUTINY": "EVC",
                    "RETURN_DEFICIENCY": "DEFICIENCY_REVIEW"
                },
                "status_after": {
                    "PASS_SCRUTINY": "AWAITING_EVC",
                    "RETURN_DEFICIENCY": "DEFICIENCY_RETURNED"
                },
                "deadline_days": 10
            },
            "DEFICIENCY_REVIEW": {
                "name": "Institution Deficiency Rectification",
                "allowed_actions": ["RESUBMIT"],
                "allowed_roles": [UserRole.INSTITUTION],
                "next_stage": {"RESUBMIT": "SCRUTINY"},
                "status_after": {"RESUBMIT": "RESUBMITTED"},
                "deadline_days": 7
            },
            "EVC": {
                "name": "Expert Visit Committee (EVC)",
                "allowed_actions": ["COMPLETE_EVC"],
                "allowed_roles": [UserRole.REGIONAL_OFFICER, UserRole.EVC_COMMITTEE, UserRole.ADMIN],
                "next_stage": {"COMPLETE_EVC": "SAC_SHC"},
                "status_after": {"COMPLETE_EVC": "AWAITING_COMMITTEE_REVIEW"},
                "deadline_days": 14
            },
            "SAC_SHC": {
                "name": "Standing Appeal / Hearing Committee (SAC/SHC)",
                "allowed_actions": ["COMMITTEE_RECOMMEND"],
                "allowed_roles": [UserRole.EVC_COMMITTEE, UserRole.BUREAU_OFFICER, UserRole.ADMIN],
                "next_stage": {"COMMITTEE_RECOMMEND": "DECISION"},
                "status_after": {"COMMITTEE_RECOMMEND": "AWAITING_DECISION"},
                "deadline_days": 14
            },
            "DECISION": {
                "name": "Authorised Regulatory Decision",
                "allowed_actions": ["APPROVE", "CONDITIONALLY_APPROVE", "REJECT"],
                "allowed_roles": [UserRole.SENIOR_AUTHORITY, UserRole.ADMIN],
                "next_stage": {
                    "APPROVE": "CLOSED",
                    "CONDITIONALLY_APPROVE": "AWAITING_COMPLIANCE",
                    "REJECT": "CLOSED"
                },
                "status_after": {
                    "APPROVE": "APPROVED",
                    "CONDITIONALLY_APPROVE": "CONDITIONALLY_APPROVED",
                    "REJECT": "REJECTED"
                },
                "deadline_days": 10
            },
            "AWAITING_COMPLIANCE": {
                "name": "Time-Bound Compliance Period",
                "allowed_actions": ["VERIFY_ALL_COMPLIANCE"],
                "allowed_roles": [UserRole.REGIONAL_OFFICER, UserRole.BUREAU_OFFICER, UserRole.ADMIN],
                "next_stage": {"VERIFY_ALL_COMPLIANCE": "CLOSED"},
                "status_after": {"VERIFY_ALL_COMPLIANCE": "APPROVED"},
                "deadline_days": 60
            },
            "CLOSED": {
                "name": "Lifecycle Closed",
                "allowed_actions": [],
                "allowed_roles": [],
                "next_stage": {},
                "status_after": {},
                "deadline_days": 0
            }
        }
    }
]

class WorkflowEngine:
    @staticmethod
    def validate_transition(
        route: WorkflowRoute,
        application: Application,
        action: str,
        actor: User
    ) -> Dict[str, Any]:
        stages_config: Dict[str, Any] = route.stages_config
        current_stage = application.current_stage

        if current_stage not in stages_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid current stage: {current_stage} in route config"
            )

        stage_info = stages_config[current_stage]
        allowed_actions = stage_info.get("allowed_actions", [])
        if action not in allowed_actions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Action '{action}' is not permitted at stage '{current_stage}'. Permitted: {allowed_actions}"
            )

        allowed_roles = stage_info.get("allowed_roles", [])
        if actor.role not in allowed_roles and actor.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{actor.role}' cannot perform action '{action}' at stage '{current_stage}'. Allowed: {allowed_roles}"
            )

        next_stage = stage_info.get("next_stage", {}).get(action)
        new_status = stage_info.get("status_after", {}).get(action)
        deadline_days = stages_config.get(next_stage, {}).get("deadline_days", 14) if next_stage else 0

        return {
            "from_stage": current_stage,
            "to_stage": next_stage,
            "new_status": new_status,
            "deadline_days": deadline_days
        }
